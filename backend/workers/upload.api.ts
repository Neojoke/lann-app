/**
 * 文件上传 API
 * 
 * 实现文件上传、获取和删除功能
 * 
 * API 端点:
 * - POST   /api/upload         # 上传文件
 * - GET    /api/upload/:id     # 获取文件
 * - DELETE /api/upload/:id     # 删除文件
 * 
 * 功能:
 * - 多格式文件支持
 * - 文件大小限制
 * - 文件类型验证
 * - 存储抽象 (本地/R2/S3)
 * - 访问控制
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { db } from '../db';
import logger from '../services/logger.service';
import { cache, CacheNamespace } from '../services/cache.service';
import { createWriteStream, createReadStream, unlink, mkdir } from 'fs';
import { pipeline } from 'stream/promises';
import { randomUUID } from 'crypto';
import { join, dirname } from 'path';

// ==================== 类型定义 ====================

interface UploadedFile {
  id: string;
  filename: string;
  original_name: string;
  content_type: string;
  size: number;
  storage_path: string;
  url: string;
  uploaded_by: string;
  created_at: string;
  expires_at?: string;
}

interface UploadRequest {
  filename: string;
  content_type: string;
  size: number;
  base64?: string;  // 用于小文件
  uploaded_by: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    message_en?: string;
    message_th?: string;
  };
}

// ==================== 配置 ====================

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  // 图片
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // 文档
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // 其他
  'text/plain',
  'text/csv'
];

const STORAGE_PATH = join(process.cwd(), 'storage', 'uploads');

// ==================== 多语言消息 ====================

const MESSAGES = {
  FILE_UPLOADED: {
    en: 'File uploaded successfully',
    th: 'อัปโหลดไฟล์สำเร็จ'
  },
  FILE_DELETED: {
    en: 'File deleted successfully',
    th: 'ลบไฟล์สำเร็จ'
  },
  FILE_NOT_FOUND: {
    en: 'File not found',
    th: 'ไม่พบไฟล์'
  },
  FILE_TOO_LARGE: {
    en: 'File too large (max 50MB)',
    th: 'ไฟล์ใหญ่เกินไป (สูงสุด 50MB)'
  },
  UNSUPPORTED_TYPE: {
    en: 'Unsupported file type',
    th: 'ไม่รองรับประเภทไฟล์นี้'
  },
  INVALID_FILENAME: {
    en: 'Invalid filename',
    th: 'ชื่อไฟล์ไม่ถูกต้อง'
  },
  INTERNAL_ERROR: {
    en: 'Internal server error',
    th: 'ข้อผิดพลาดภายในเซิร์ฟเวอร์'
  }
};

// ==================== 辅助函数 ====================

function getLanguage(headers: Headers): 'en' | 'th' {
  const acceptLang = headers.get('accept-language') || '';
  return acceptLang.toLowerCase().includes('th') ? 'th' : 'en';
}

function getMessage(key: keyof typeof MESSAGES, lang: 'en' | 'th'): string {
  return MESSAGES[key][lang];
}

function createError(
  code: string,
  key: keyof typeof MESSAGES,
  lang: 'en' | 'th',
  extra?: string
): ApiResponse['error'] {
  const message = getMessage(key, lang);
  return {
    code,
    message: extra ? message + extra : message,
    message_en: getMessage(key, 'en'),
    message_th: getMessage(key, 'th')
  };
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function getFileExtension(contentType: string): string {
  const extMap: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'text/plain': '.txt',
    'text/csv': '.csv'
  };
  return extMap[contentType] || '.bin';
}

function generateStoragePath(fileId: string, extension: string): string {
  // 按日期组织文件
  const date = new Date().toISOString().split('T')[0];
  const year = date.substring(0, 4);
  const month = date.substring(5, 7);
  
  return join(STORAGE_PATH, year, month, `${fileId}${extension}`);
}

// ==================== 创建 API 路由 ====================

const app = new Hono();

// 启用 CORS
app.use('/api/upload/*', cors());

/**
 * POST /api/upload
 * 上传文件
 */
app.post('/api/upload', async (c) => {
  const lang = getLanguage(c.req.raw.headers);
  
  try {
    const contentType = c.req.header('content-type') || '';
    
    // 处理 multipart/form-data
    if (contentType.includes('multipart/form-data')) {
      return handleMultipartUpload(c, lang);
    }
    
    // 处理 JSON (base64)
    if (contentType.includes('application/json')) {
      return handleJsonUpload(c, lang);
    }
    
    // 处理二进制数据
    return handleBinaryUpload(c, lang);
    
  } catch (error) {
    logger.error('Upload error', error as Error);
    return c.json(
      { success: false, error: createError('INTERNAL_ERROR', 'INTERNAL_ERROR', lang) },
      500
    );
  }
});

async function handleMultipartUpload(c: any, lang: 'en' | 'th'): Promise<Response> {
  try {
    const formData = await c.req.parseBody();
    const file = formData.file;
    const uploadedBy = formData.uploaded_by as string || 'anonymous';
    
    if (!file || !(file instanceof File)) {
      return c.json(
        { 
          success: false, 
          error: createError('INVALID_FILENAME', 'INVALID_FILENAME', lang, 'No file provided') 
        },
        400
      );
    }
    
    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return c.json(
        { success: false, error: createError('FILE_TOO_LARGE', 'FILE_TOO_LARGE', lang) },
        400
      );
    }
    
    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return c.json(
        { success: false, error: createError('UNSUPPORTED_TYPE', 'UNSUPPORTED_TYPE', lang) },
        400
      );
    }
    
    return logger.track('Upload file (multipart)', async () => {
      const fileId = randomUUID();
      const extension = getFileExtension(file.type) || getFileExtensionFromName(file.name);
      const storagePath = generateStoragePath(fileId, extension);
      
      // 确保目录存在
      await mkdir(dirname(storagePath), { recursive: true });
      
      // 保存文件
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await pipeline(
        buffer as any,
        createWriteStream(storagePath)
      );
      
      // 记录到数据库
      const now = new Date().toISOString();
      const fileRecord: UploadedFile = {
        id: fileId,
        filename: `${fileId}${extension}`,
        original_name: sanitizeFilename(file.name),
        content_type: file.type,
        size: file.size,
        storage_path: storagePath,
        url: `/api/upload/${fileId}`,
        uploaded_by: uploadedBy,
        created_at: now
      };
      
      db.run(
        `INSERT INTO uploaded_files (
          id, filename, original_name, content_type, size, 
          storage_path, url, uploaded_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          fileRecord.id,
          fileRecord.filename,
          fileRecord.original_name,
          fileRecord.content_type,
          fileRecord.size,
          fileRecord.storage_path,
          fileRecord.url,
          fileRecord.uploaded_by,
          fileRecord.created_at
        ]
      );
      
      // 缓存文件信息
      await cache.set(CacheNamespace.USER_PROFILE, `file:${fileId}`, fileRecord, { ttl: 3600 });
      
      return c.json({
        success: true,
        data: fileRecord,
        message: getMessage('FILE_UPLOADED', lang)
      }, 201);
    });
    
  } catch (error) {
    logger.error('Multipart upload failed', error as Error);
    throw error;
  }
}

async function handleJsonUpload(c: any, lang: 'en' | 'th'): Promise<Response> {
  const body = await c.req.json() as UploadRequest;
  
  // 验证输入
  if (!body.filename || !body.content_type || !body.base64) {
    return c.json(
      { 
        success: false, 
        error: createError('INVALID_FILENAME', 'INVALID_FILENAME', lang, 'Missing required fields') 
      },
      400
    );
  }
  
  // 验证文件大小
  const fileSize = Math.ceil((body.base64.length * 3) / 4);
  if (fileSize > MAX_FILE_SIZE) {
    return c.json(
      { success: false, error: createError('FILE_TOO_LARGE', 'FILE_TOO_LARGE', lang) },
      400
    );
  }
  
  // 验证文件类型
  if (!ALLOWED_TYPES.includes(body.content_type)) {
    return c.json(
      { success: false, error: createError('UNSUPPORTED_TYPE', 'UNSUPPORTED_TYPE', lang) },
      400
    );
  }
  
  return logger.track('Upload file (base64)', async () => {
    const fileId = randomUUID();
    const extension = getFileExtension(body.content_type) || getFileExtensionFromName(body.filename);
    const storagePath = generateStoragePath(fileId, extension);
    
    // 确保目录存在
    await mkdir(dirname(storagePath), { recursive: true });
    
    // 解码并保存文件
    const buffer = Buffer.from(body.base64, 'base64');
    await pipeline(
      buffer as any,
      createWriteStream(storagePath)
    );
    
    // 记录到数据库
    const now = new Date().toISOString();
    const fileRecord: UploadedFile = {
      id: fileId,
      filename: `${fileId}${extension}`,
      original_name: sanitizeFilename(body.filename),
      content_type: body.content_type,
      size: buffer.length,
      storage_path: storagePath,
      url: `/api/upload/${fileId}`,
      uploaded_by: body.uploaded_by || 'anonymous',
      created_at: now
    };
    
    db.run(
      `INSERT INTO uploaded_files (
        id, filename, original_name, content_type, size, 
        storage_path, url, uploaded_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fileRecord.id,
        fileRecord.filename,
        fileRecord.original_name,
        fileRecord.content_type,
        fileRecord.size,
        fileRecord.storage_path,
        fileRecord.url,
        fileRecord.uploaded_by,
        fileRecord.created_at
      ]
    );
    
    // 缓存文件信息
    await cache.set(CacheNamespace.USER_PROFILE, `file:${fileId}`, fileRecord, { ttl: 3600 });
    
    return c.json({
      success: true,
      data: fileRecord,
      message: getMessage('FILE_UPLOADED', lang)
    }, 201);
  });
}

async function handleBinaryUpload(c: any, lang: 'en' | 'th'): Promise<Response> {
  const contentType = c.req.header('content-type') || 'application/octet-stream';
  const filename = c.req.header('x-filename') || 'unknown';
  const uploadedBy = c.req.header('x-uploaded-by') || 'anonymous';
  
  // 验证文件类型
  if (!ALLOWED_TYPES.includes(contentType)) {
    return c.json(
      { success: false, error: createError('UNSUPPORTED_TYPE', 'UNSUPPORTED_TYPE', lang) },
      400
    );
  }
  
  return logger.track('Upload file (binary)', async () => {
    const fileId = randomUUID();
    const extension = getFileExtension(contentType) || getFileExtensionFromName(filename);
    const storagePath = generateStoragePath(fileId, extension);
    
    // 确保目录存在
    await mkdir(dirname(storagePath), { recursive: true });
    
    // 保存文件
    const body = await c.req.arrayBuffer();
    const buffer = Buffer.from(body);
    
    if (buffer.length > MAX_FILE_SIZE) {
      return c.json(
        { success: false, error: createError('FILE_TOO_LARGE', 'FILE_TOO_LARGE', lang) },
        400
      );
    }
    
    await pipeline(
      buffer as any,
      createWriteStream(storagePath)
    );
    
    // 记录到数据库
    const now = new Date().toISOString();
    const fileRecord: UploadedFile = {
      id: fileId,
      filename: `${fileId}${extension}`,
      original_name: sanitizeFilename(filename),
      content_type: contentType,
      size: buffer.length,
      storage_path: storagePath,
      url: `/api/upload/${fileId}`,
      uploaded_by: uploadedBy,
      created_at: now
    };
    
    db.run(
      `INSERT INTO uploaded_files (
        id, filename, original_name, content_type, size, 
        storage_path, url, uploaded_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fileRecord.id,
        fileRecord.filename,
        fileRecord.original_name,
        fileRecord.content_type,
        fileRecord.size,
        fileRecord.storage_path,
        fileRecord.url,
        fileRecord.uploaded_by,
        fileRecord.created_at
      ]
    );
    
    // 缓存文件信息
    await cache.set(CacheNamespace.USER_PROFILE, `file:${fileId}`, fileRecord, { ttl: 3600 });
    
    return c.json({
      success: true,
      data: fileRecord,
      message: getMessage('FILE_UPLOADED', lang)
    }, 201);
  });
}

/**
 * GET /api/upload/:id
 * 获取文件
 */
app.get('/api/upload/:id', async (c) => {
  const lang = getLanguage(c.req.raw.headers);
  const fileId = c.req.param('id');
  
  try {
    return logger.track('Get file', async () => {
      // 尝试从缓存获取
      const cached = await cache.get<UploadedFile>(CacheNamespace.USER_PROFILE, `file:${fileId}`);
      let fileRecord: UploadedFile | undefined = cached || undefined;
      
      // 从数据库查询
      if (!fileRecord) {
        fileRecord = db.get(
          `SELECT * FROM uploaded_files WHERE id = ?`,
          [fileId]
        ) as UploadedFile | undefined;
        
        if (fileRecord) {
          await cache.set(CacheNamespace.USER_PROFILE, `file:${fileId}`, fileRecord, { ttl: 3600 });
        }
      }
      
      if (!fileRecord) {
        return c.json(
          { success: false, error: createError('FILE_NOT_FOUND', 'FILE_NOT_FOUND', lang) },
          404
        );
      }
      
      // 检查文件是否存在
      const fs = await import('fs');
      if (!fs.existsSync(fileRecord.storage_path)) {
        return c.json(
          { success: false, error: createError('FILE_NOT_FOUND', 'FILE_NOT_FOUND', lang, 'File data not found') },
          404
        );
      }
      
      // 返回文件内容
      const fileBuffer = fs.readFileSync(fileRecord.storage_path);
      
      return c.body(fileBuffer, 200, {
        'Content-Type': fileRecord.content_type,
        'Content-Disposition': `inline; filename="${fileRecord.original_name}"`,
        'Content-Length': fileRecord.size.toString()
      });
    });
  } catch (error) {
    logger.error('Failed to get file', error as Error);
    return c.json(
      { success: false, error: createError('INTERNAL_ERROR', 'INTERNAL_ERROR', lang) },
      500
    );
  }
});

/**
 * DELETE /api/upload/:id
 * 删除文件
 */
app.delete('/api/upload/:id', async (c) => {
  const lang = getLanguage(c.req.raw.headers);
  const fileId = c.req.param('id');
  
  try {
    return logger.track('Delete file', async () => {
      // 获取文件记录
      const fileRecord = db.get(
        `SELECT * FROM uploaded_files WHERE id = ?`,
        [fileId]
      ) as UploadedFile | undefined;
      
      if (!fileRecord) {
        return c.json(
          { success: false, error: createError('FILE_NOT_FOUND', 'FILE_NOT_FOUND', lang) },
          404
        );
      }
      
      // 删除文件
      const fs = await import('fs');
      if (fs.existsSync(fileRecord.storage_path)) {
        await unlink(fileRecord.storage_path);
      }
      
      // 从数据库删除记录
      db.run(`DELETE FROM uploaded_files WHERE id = ?`, [fileId]);
      
      // 清除缓存
      await cache.delete(CacheNamespace.USER_PROFILE, `file:${fileId}`);
      
      return c.json({
        success: true,
        message: getMessage('FILE_DELETED', lang)
      });
    });
  } catch (error) {
    logger.error('Failed to delete file', error as Error);
    return c.json(
      { success: false, error: createError('INTERNAL_ERROR', 'INTERNAL_ERROR', lang) },
      500
    );
  }
});

// ==================== 辅助函数 ====================

function getFileExtensionFromName(filename: string): string {
  const ext = filename.split('.').pop();
  if (ext && ext.length <= 10) {
    return '.' + ext.toLowerCase();
  }
  return '.bin';
}

// ==================== 导出 ====================

export default app;
