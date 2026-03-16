/**
 * 日志系统服务
 * 
 * 实现结构化日志、日志级别控制、日志文件轮转
 * 
 * 功能:
 * - 结构化日志 (JSON 格式)
 * - 5 级日志级别 (TRACE, DEBUG, INFO, WARN, ERROR)
 * - 日志文件轮转 (按大小和时间)
 * - 上下文追踪 (requestId, userId)
 * - 性能监控 (响应时间记录)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== 类型定义 ====================

export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  duration_ms?: number;
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  [key: string]: any;
}

export interface LoggerConfig {
  level: LogLevel;
  service: string;
  logDir: string;
  maxSize: number;        // 单个文件最大大小 (字节)
  maxFiles: number;       // 保留的最大文件数
  consoleOutput: boolean; // 是否输出到控制台
}

// ==================== 日志级别配置 ====================

const LOG_LEVELS: Record<LogLevel, number> = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4
};

const DEFAULT_CONFIG: LoggerConfig = {
  level: 'INFO',
  service: 'lann-backend',
  logDir: path.join(__dirname, '../../logs'),
  maxSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 7,
  consoleOutput: true
};

// ==================== 日志类 ====================

export class Logger {
  private config: LoggerConfig;
  private currentFile: string;
  private currentSize: number = 0;
  private writeStream?: fs.WriteStream;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentFile = this.getLogFileName();
    this.ensureLogDir();
    this.rotateIfNeeded();
  }

  private ensureLogDir() {
    if (!fs.existsSync(this.config.logDir)) {
      fs.mkdirSync(this.config.logDir, { recursive: true });
    }
  }

  private getLogFileName(): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.config.logDir, `${this.config.service}-${date}.log`);
  }

  private rotateIfNeeded() {
    if (fs.existsSync(this.currentFile)) {
      const stats = fs.statSync(this.currentFile);
      this.currentSize = stats.size;

      if (this.currentSize >= this.config.maxSize) {
        this.rotate();
      }
    }
  }

  private rotate() {
    // 关闭当前写入流
    if (this.writeStream) {
      this.writeStream.end();
      this.writeStream = undefined;
    }

    // 轮转旧文件
    const files = fs.readdirSync(this.config.logDir)
      .filter(f => f.startsWith(`${this.config.service}-`) && f.endsWith('.log'))
      .sort()
      .reverse();

    // 删除超出数量的旧文件
    if (files.length >= this.config.maxFiles) {
      for (let i = this.config.maxFiles - 1; i < files.length; i++) {
        fs.unlinkSync(path.join(this.config.logDir, files[i]));
      }
    }

    // 重命名当前文件
    if (fs.existsSync(this.currentFile)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedName = this.currentFile.replace('.log', `-${timestamp}.log`);
      fs.renameSync(this.currentFile, rotatedName);
    }

    this.currentFile = this.getLogFileName();
    this.currentSize = 0;
  }

  private getWriteStream(): fs.WriteStream {
    if (!this.writeStream || this.writeStream.closed) {
      this.writeStream = fs.createWriteStream(this.currentFile, { flags: 'a' });
    }
    return this.writeStream;
  }

  private formatEntry(entry: LogEntry): string {
    return JSON.stringify(entry) + '\n';
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    duration_ms?: number
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.config.service,
      message,
      context
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    if (duration_ms !== undefined) {
      entry.duration_ms = duration_ms;
    }

    return entry;
  }

  private write(entry: LogEntry) {
    const formatted = this.formatEntry(entry);

    // 写入文件
    const stream = this.getWriteStream();
    stream.write(formatted);
    this.currentSize += Buffer.byteLength(formatted);

    // 检查是否需要轮转
    this.rotateIfNeeded();

    // 输出到控制台
    if (this.config.consoleOutput) {
      const color = this.getLevelColor(entry.level);
      const output = `[${entry.timestamp}] [${entry.level}] ${entry.message}`;
      
      if (entry.level === 'ERROR') {
        console.error(color(output));
      } else if (entry.level === 'WARN') {
        console.warn(color(output));
      } else {
        console.log(color(output));
      }

      if (entry.context) {
        console.log('  Context:', JSON.stringify(entry.context));
      }
      if (entry.error) {
        console.error('  Error:', entry.error.stack);
      }
    }
  }

  private getLevelColor(level: LogLevel): (str: string) => string {
    const colors: Record<LogLevel, (str: string) => string> = {
      TRACE: (s) => `\x1b[90m${s}\x1b[0m`,      // Gray
      DEBUG: (s) => `\x1b[36m${s}\x1b[0m`,      // Cyan
      INFO: (s) => `\x1b[32m${s}\x1b[0m`,       // Green
      WARN: (s) => `\x1b[33m${s}\x1b[0m`,       // Yellow
      ERROR: (s) => `\x1b[31m${s}\x1b[0m`       // Red
    };
    return colors[level];
  }

  // ==================== 公共方法 ====================

  trace(message: string, context?: LogContext) {
    if (this.shouldLog('TRACE')) {
      this.write(this.createEntry('TRACE', message, context));
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog('DEBUG')) {
      this.write(this.createEntry('DEBUG', message, context));
    }
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog('INFO')) {
      this.write(this.createEntry('INFO', message, context));
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.shouldLog('WARN')) {
      this.write(this.createEntry('WARN', message, context));
    }
  }

  error(message: string, error?: Error, context?: LogContext) {
    if (this.shouldLog('ERROR')) {
      this.write(this.createEntry('ERROR', message, context, error));
    }
  }

  /**
   * 记录 API 请求日志
   */
  request(
    method: string,
    endpoint: string,
    statusCode: number,
    duration_ms: number,
    context?: LogContext
  ) {
    const level = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';
    const message = `${method} ${endpoint} ${statusCode} (${duration_ms}ms)`;
    
    this.write(this.createEntry(
      level,
      message,
      { ...context, method, endpoint, status: statusCode },
      undefined,
      duration_ms
    ));
  }

  /**
   * 性能追踪包装器
   */
  async track<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const start = Date.now();
    this.debug(`Starting: ${operation}`, context);

    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(`Completed: ${operation}`, { ...context, duration_ms: duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`Failed: ${operation}`, error as Error, { ...context, duration_ms: duration });
      throw error;
    }
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel) {
    this.config.level = level;
    this.info(`Log level changed to ${level}`);
  }

  /**
   * 获取当前日志级别
   */
  getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * 关闭日志写入流
   */
  close() {
    if (this.writeStream) {
      this.writeStream.end();
      this.writeStream = undefined;
    }
  }
}

// ==================== 导出默认实例 ====================

export const logger = new Logger({
  service: 'lann-backend',
  level: (process.env.LOG_LEVEL as LogLevel) || 'INFO',
  consoleOutput: process.env.NODE_ENV !== 'production'
});

export default logger;
