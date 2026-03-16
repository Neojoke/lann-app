import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from './logger.service';

const execPromise = promisify(exec);

interface BackupConfig {
  retentionDays: number;
  compression: boolean;
  encryption: boolean;
  schedule: string; // cron-like expression
  storagePath: string;
  databaseUrl: string;
}

interface BackupInfo {
  id: string;
  filename: string;
  size: number;
  createdAt: Date;
  status: 'pending' | 'completed' | 'failed';
  encrypted: boolean;
  compressed: boolean;
  checksum: string;
}

interface RestoreResult {
  success: boolean;
  message: string;
  restoredAt: Date;
}

class BackupService {
  private config: BackupConfig;
  private backups: BackupInfo[] = [];
  private readonly logger: Logger;
  private readonly backupDir: string;

  constructor(config: Partial<BackupConfig> = {}) {
    this.config = {
      retentionDays: 7,
      compression: true,
      encryption: false,
      schedule: '0 2 * * *', // 每天凌晨2点
      storagePath: './backups',
      databaseUrl: process.env.DATABASE_URL || '',
      ...config
    };

    this.backupDir = this.config.storagePath;
    this.logger = new Logger('BackupService');
    
    this.initializeBackupDirectory();
    this.loadExistingBackups();
  }

  /**
   * 初始化备份目录
   */
  private async initializeBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      this.logger.info(`Backup directory initialized: ${this.backupDir}`);
    } catch (error) {
      this.logger.error('Failed to initialize backup directory', error);
      throw error;
    }
  }

  /**
   * 加载现有备份
   */
  private async loadExistingBackups(): Promise<void> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(file => file.endsWith('.sql') || file.endsWith('.sql.gz') || file.endsWith('.sql.enc'));

      for (const filename of backupFiles) {
        const filePath = path.join(this.backupDir, filename);
        const stats = await fs.stat(filePath);

        const backupInfo: BackupInfo = {
          id: this.generateId(),
          filename,
          size: stats.size,
          createdAt: stats.birthtime,
          status: 'completed',
          encrypted: filename.endsWith('.enc'),
          compressed: filename.endsWith('.gz'),
          checksum: await this.calculateChecksum(filePath)
        };

        this.backups.push(backupInfo);
      }

      this.logger.info(`Loaded ${backupFiles.length} existing backups`);
    } catch (error) {
      this.logger.error('Failed to load existing backups', error);
    }
  }

  /**
   * 创建数据库备份
   */
  async createBackup(name?: string): Promise<BackupInfo> {
    const backupId = this.generateId();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFilename = name ? `${name}_${timestamp}` : `backup_${timestamp}`;
    let filename = `${baseFilename}.sql`;
    let compressed = false;
    let encrypted = false;

    const backupPath = path.join(this.backupDir, filename);
    let backupInfo: BackupInfo;

    try {
      this.logger.info(`Starting backup: ${backupId}`, { filename });

      // 执行数据库导出
      const dumpCommand = this.getDumpCommand(backupPath);
      await execPromise(dumpCommand);

      // 检查备份文件是否存在
      const stats = await fs.stat(backupPath);

      // 压缩备份文件（如果启用）
      if (this.config.compression) {
        const compressedPath = backupPath + '.gz';
        await execPromise(`gzip "${backupPath}"`);
        filename += '.gz';
        compressed = true;
        backupInfo = {
          id: backupId,
          filename,
          size: (await fs.stat(compressedPath)).size,
          createdAt: new Date(),
          status: 'completed',
          encrypted: false,
          compressed: true,
          checksum: await this.calculateChecksum(compressedPath)
        };
      } else {
        backupInfo = {
          id: backupId,
          filename,
          size: stats.size,
          createdAt: new Date(),
          status: 'completed',
          encrypted: false,
          compressed: false,
          checksum: await this.calculateChecksum(backupPath)
        };
      }

      // 加密备份文件（如果启用）
      if (this.config.encryption && !compressed) {
        const encryptedPath = backupPath + '.enc';
        await this.encryptFile(backupPath, encryptedPath);
        filename += '.enc';
        encrypted = true;
        backupInfo.filename = filename;
        backupInfo.encrypted = true;
        backupInfo.size = (await fs.stat(encryptedPath)).size;
        backupInfo.checksum = await this.calculateChecksum(encryptedPath);
      } else if (this.config.encryption && compressed) {
        const originalCompressedPath = path.join(this.backupDir, backupInfo.filename);
        const encryptedPath = originalCompressedPath + '.enc';
        await this.encryptFile(originalCompressedPath, encryptedPath);
        filename += '.enc';
        encrypted = true;
        backupInfo.filename = filename;
        backupInfo.encrypted = true;
        backupInfo.size = (await fs.stat(encryptedPath)).size;
        backupInfo.checksum = await this.calculateChecksum(encryptedPath);
      }

      this.backups.push(backupInfo);

      // 清理旧备份
      await this.cleanupOldBackups();

      this.logger.info(`Backup completed: ${backupId}`, { 
        filename: backupInfo.filename, 
        size: backupInfo.size 
      });

      return backupInfo;
    } catch (error) {
      this.logger.error(`Backup failed: ${backupId}`, error);

      // 记录失败的备份
      backupInfo = {
        id: backupId,
        filename: filename,
        size: 0,
        createdAt: new Date(),
        status: 'failed',
        encrypted: false,
        compressed: false,
        checksum: ''
      };

      this.backups.push(backupInfo);

      throw error;
    }
  }

  /**
   * 获取数据库导出命令
   */
  private getDumpCommand(backupPath: string): string {
    // 根据数据库类型生成相应的导出命令
    const dbUrl = this.config.databaseUrl;
    
    if (dbUrl.includes('postgresql')) {
      // PostgreSQL
      const dbMatch = dbUrl.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      if (dbMatch) {
        const [, user, password, host, port, dbName] = dbMatch;
        return `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${user} -d ${dbName} > "${backupPath}"`;
      }
    } else if (dbUrl.includes('mysql')) {
      // MySQL
      const dbMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      if (dbMatch) {
        const [, user, password, host, port, dbName] = dbMatch;
        return `mysqldump -h ${host} -P ${port} -u ${user} -p"${password}" ${dbName} > "${backupPath}"`;
      }
    } else if (dbUrl.includes('sqlite')) {
      // SQLite
      const dbPath = dbUrl.replace('sqlite://', '');
      return `sqlite3 "${dbPath}" ".backup '${backupPath}'"`;
    }

    // 默认使用 SQLite 方式
    const dbPath = dbUrl.replace('file:', '').replace('sqlite://', '');
    return `sqlite3 "${dbPath}" ".backup '${backupPath}'"`;
  }

  /**
   * 恢复数据库备份
   */
  async restoreBackup(backupId: string, confirm = false): Promise<RestoreResult> {
    const backup = this.backups.find(b => b.id === backupId);
    
    if (!backup) {
      throw new Error(`Backup not found: ${backupId}`);
    }

    if (!confirm) {
      return {
        success: false,
        message: 'Restore requires confirmation. Set confirm=true to proceed.',
        restoredAt: new Date()
      };
    }

    try {
      this.logger.info(`Starting restore: ${backupId}`, { filename: backup.filename });

      let sourcePath = path.join(this.backupDir, backup.filename);

      // 如果是加密的，先解密
      if (backup.encrypted) {
        const decryptedPath = sourcePath.replace('.enc', '');
        await this.decryptFile(sourcePath, decryptedPath);
        sourcePath = decryptedPath;
      }

      // 如果是压缩的，先解压
      if (backup.compressed) {
        const decompressedPath = sourcePath.replace('.gz', '');
        await execPromise(`gunzip -c "${sourcePath}" > "${decompressedPath}"`);
        sourcePath = decompressedPath;
      }

      // 执行数据库恢复
      const restoreCommand = this.getRestoreCommand(sourcePath);
      await execPromise(restoreCommand);

      this.logger.info(`Restore completed: ${backupId}`, { filename: backup.filename });

      return {
        success: true,
        message: `Database restored from backup: ${backup.filename}`,
        restoredAt: new Date()
      };
    } catch (error) {
      this.logger.error(`Restore failed: ${backupId}`, error);

      return {
        success: false,
        message: `Restore failed: ${(error as Error).message}`,
        restoredAt: new Date()
      };
    }
  }

  /**
   * 获取数据库恢复命令
   */
  private getRestoreCommand(backupPath: string): string {
    const dbUrl = this.config.databaseUrl;

    if (dbUrl.includes('postgresql')) {
      // PostgreSQL
      const dbMatch = dbUrl.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      if (dbMatch) {
        const [, user, password, host, port, dbName] = dbMatch;
        return `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${user} -d ${dbName} < "${backupPath}"`;
      }
    } else if (dbUrl.includes('mysql')) {
      // MySQL
      const dbMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      if (dbMatch) {
        const [, user, password, host, port, dbName] = dbMatch;
        return `mysql -h ${host} -P ${port} -u ${user} -p"${password}" ${dbName} < "${backupPath}"`;
      }
    } else if (dbUrl.includes('sqlite')) {
      // SQLite
      const dbPath = dbUrl.replace('sqlite://', '');
      return `sqlite3 "${dbPath}" ".restore '${backupPath}'"`;
    }

    // 默认使用 SQLite 方式
    const dbPath = dbUrl.replace('file:', '').replace('sqlite://', '');
    return `sqlite3 "${dbPath}" ".restore '${backupPath}'"`;
  }

  /**
   * 加密文件
   */
  private async encryptFile(inputPath: string, outputPath: string): Promise<void> {
    // 使用简单的加密方法（在实际应用中应该使用更强的加密）
    const password = process.env.BACKUP_ENCRYPTION_KEY || 'default-key-change-me';
    await execPromise(`openssl enc -aes-256-cbc -salt -in "${inputPath}" -out "${outputPath}" -k "${password}"`);
  }

  /**
   * 解密文件
   */
  private async decryptFile(inputPath: string, outputPath: string): Promise<void> {
    const password = process.env.BACKUP_ENCRYPTION_KEY || 'default-key-change-me';
    await execPromise(`openssl enc -d -aes-256-cbc -in "${inputPath}" -out "${outputPath}" -k "${password}"`);
  }

  /**
   * 计算文件校验和
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    try {
      const { stdout } = await execPromise(`sha256sum "${filePath}"`);
      return stdout.split(' ')[0].trim();
    } catch (error) {
      this.logger.error(`Failed to calculate checksum for ${filePath}`, error);
      return '';
    }
  }

  /**
   * 获取所有备份列表
   */
  getBackups(): BackupInfo[] {
    return [...this.backups].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * 获取备份详情
   */
  getBackupById(backupId: string): BackupInfo | undefined {
    return this.backups.find(b => b.id === backupId);
  }

  /**
   * 删除备份
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    const backupIndex = this.backups.findIndex(b => b.id === backupId);
    
    if (backupIndex === -1) {
      return false;
    }

    const backup = this.backups[backupIndex];
    const backupPath = path.join(this.backupDir, backup.filename);

    try {
      await fs.unlink(backupPath);
      this.backups.splice(backupIndex, 1);
      
      this.logger.info(`Deleted backup: ${backupId}`, { filename: backup.filename });
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete backup: ${backupId}`, error);
      return false;
    }
  }

  /**
   * 清理旧备份
   */
  private async cleanupOldBackups(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    const oldBackups = this.backups.filter(backup => backup.createdAt < cutoffDate);

    for (const backup of oldBackups) {
      await this.deleteBackup(backup.id);
    }

    this.logger.info(`Cleaned up ${oldBackups.length} old backups`);
  }

  /**
   * 验证备份完整性
   */
  async validateBackup(backupId: string): Promise<{ isValid: boolean; message: string }> {
    const backup = this.backups.find(b => b.id === backupId);
    
    if (!backup) {
      return { isValid: false, message: `Backup not found: ${backupId}` };
    }

    try {
      const backupPath = path.join(this.backupDir, backup.filename);

      // 检查文件是否存在
      await fs.access(backupPath);

      // 计算当前校验和
      const currentChecksum = await this.calculateChecksum(backupPath);

      // 比较校验和
      if (currentChecksum === backup.checksum) {
        return { isValid: true, message: 'Backup integrity verified' };
      } else {
        return { isValid: false, message: 'Backup checksum mismatch' };
      }
    } catch (error) {
      return { isValid: false, message: `Backup validation failed: ${(error as Error).message}` };
    }
  }

  /**
   * 配置备份服务
   */
  configure(config: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.info('Backup service reconfigured', { config: Object.keys(config) });
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取备份统计信息
   */
  getStats(): {
    totalBackups: number;
    totalSize: number;
    oldestBackup: Date | null;
    newestBackup: Date | null;
  } {
    if (this.backups.length === 0) {
      return {
        totalBackups: 0,
        totalSize: 0,
        oldestBackup: null,
        newestBackup: null
      };
    }

    const sortedBackups = [...this.backups].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    return {
      totalBackups: this.backups.length,
      totalSize: this.backups.reduce((sum, backup) => sum + backup.size, 0),
      oldestBackup: sortedBackups[0].createdAt,
      newestBackup: sortedBackups[sortedBackups.length - 1].createdAt
    };
  }

  /**
   * 执行定期备份
   */
  async performScheduledBackup(): Promise<void> {
    try {
      await this.createBackup('scheduled');
      this.logger.info('Scheduled backup completed');
    } catch (error) {
      this.logger.error('Scheduled backup failed', error);
    }
  }
}

// 单例模式
let backupService: BackupService;

export function getBackupService(config?: Partial<BackupConfig>): BackupService {
  if (!backupService) {
    backupService = new BackupService(config);
  }
  return backupService;
}

export { BackupService, BackupConfig, BackupInfo, RestoreResult };