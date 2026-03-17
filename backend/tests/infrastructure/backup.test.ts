import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { exec as execPromise } from 'child_process';
import { BackupService, getBackupService, BackupConfig } from '../../services/backup.service';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock the execPromise function
vi.mock('child_process', async () => {
  const actual = await vi.importActual('child_process');
  return {
    ...actual,
    exec: vi.fn((command: string, callback: (error: any, stdout: string, stderr: string) => void) => {
      // Simulate successful command execution
      if (command.includes('pg_dump') || command.includes('mysqldump') || command.includes('sqlite3')) {
        // Simulate creating a dummy backup file
        setTimeout(() => callback(null, '', ''), 10);
      } else if (command.includes('sha256sum')) {
        setTimeout(() => callback(null, 'dummy_checksum  /dummy/path', ''), 10);
      } else if (command.includes('gzip') || command.includes('gunzip')) {
        setTimeout(() => callback(null, '', ''), 10);
      } else if (command.includes('openssl')) {
        setTimeout(() => callback(null, '', ''), 10);
      } else {
        setTimeout(() => callback(null, '', ''), 10);
      }
    })
  };
});

// Mock fs module
vi.mock('fs/promises', async () => {
  const actual = await vi.importActual('fs/promises');
  return {
    ...actual,
    writeFile: vi.fn(),
    readFile: vi.fn(),
    stat: vi.fn(() => ({
      size: 1024,
      birthtime: new Date(),
      mtime: new Date(),
      isFile: () => true,
      isDirectory: () => false
    })),
    readdir: vi.fn(() => []),
    unlink: vi.fn(),
    mkdir: vi.fn(),
    access: vi.fn()
  };
});

describe('BackupService', () => {
  let backupService: BackupService;
  const mockConfig: BackupConfig = {
    retentionDays: 7,
    compression: true,
    encryption: false,
    schedule: '0 2 * * *',
    storagePath: './test-backups',
    databaseUrl: 'sqlite://test.db'
  };

  beforeEach(() => {
    backupService = new BackupService(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize correctly', () => {
    expect(backupService).toBeDefined();
    expect(typeof backupService.createBackup).toBe('function');
    expect(typeof backupService.restoreBackup).toBe('function');
    expect(typeof backupService.getBackups).toBe('function');
  });

  it('should create a backup with correct properties', async () => {
    // Mock the dump command execution
    const execSpy = vi.spyOn(require('child_process'), 'exec');
    (execSpy as any).mockImplementation((command: string, callback: Function) => {
      // Simulate command execution
      setTimeout(() => callback(null, '', ''), 10);
    });

    // Mock fs.stat to return a valid file stat
    const statSpy = vi.spyOn(fs, 'stat');
    (statSpy as any).mockResolvedValue({
      size: 2048,
      birthtime: new Date(),
      mtime: new Date(),
      isFile: () => true,
      isDirectory: () => false
    });

    // Mock fs.access to simulate file exists
    const accessSpy = vi.spyOn(fs, 'access');
    (accessSpy as any).mockResolvedValue(undefined);

    // Mock calculateChecksum to return a dummy checksum
    const calculateChecksumSpy = vi.spyOn(backupService as any, 'calculateChecksum');
    (calculateChecksumSpy as any).mockResolvedValue('dummy_checksum');

    const backupInfo = await backupService.createBackup('test-backup');
    
    expect(backupInfo).toBeDefined();
    expect(backupInfo.id).toBeDefined();
    expect(backupInfo.filename).toContain('test-backup');
    expect(backupInfo.status).toBe('completed');
    expect(backupInfo.size).toBe(2048);
    expect(backupInfo.compressed).toBe(true);
  });

  it('should handle backup failure gracefully', async () => {
    // Mock the dump command to fail
    const execSpy = vi.spyOn(require('child_process'), 'exec');
    (execSpy as any).mockImplementation((command: string, callback: Function) => {
      setTimeout(() => callback(new Error('Command failed'), '', 'Error occurred'), 10);
    });

    try {
      await backupService.createBackup('failing-backup');
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should get backup by ID', async () => {
    // Create a backup first
    const execSpy = vi.spyOn(require('child_process'), 'exec');
    (execSpy as any).mockImplementation((command: string, callback: Function) => {
      setTimeout(() => callback(null, '', ''), 10);
    });

    const statSpy = vi.spyOn(fs, 'stat');
    (statSpy as any).mockResolvedValue({
      size: 1024,
      birthtime: new Date(),
      mtime: new Date(),
      isFile: () => true,
      isDirectory: () => false
    });

    const calculateChecksumSpy = vi.spyOn(backupService as any, 'calculateChecksum');
    (calculateChecksumSpy as any).mockResolvedValue('dummy_checksum');

    const backupInfo = await backupService.createBackup('get-test');
    const retrievedBackup = backupService.getBackupById(backupInfo.id);

    expect(retrievedBackup).toBeDefined();
    expect(retrievedBackup!.id).toBe(backupInfo.id);
    expect(retrievedBackup!.filename).toBe(backupInfo.filename);
  });

  it('should return undefined for non-existent backup', () => {
    const backup = backupService.getBackupById('non-existent-id');
    expect(backup).toBeUndefined();
  });

  it('should get all backups', async () => {
    const backups = backupService.getBackups();
    expect(Array.isArray(backups)).toBe(true);
    expect(backups.length).toBeGreaterThanOrEqual(0);
  });

  it('should validate backup integrity', async () => {
    // Mock the necessary methods
    const execSpy = vi.spyOn(require('child_process'), 'exec');
    (execSpy as any).mockImplementation((command: string, callback: Function) => {
      setTimeout(() => callback(null, 'dummy_checksum  /dummy/path', ''), 10);
    });

    const statSpy = vi.spyOn(fs, 'stat');
    (statSpy as any).mockResolvedValue({
      size: 1024,
      birthtime: new Date(),
      mtime: new Date(),
      isFile: () => true,
      isDirectory: () => false
    });

    const accessSpy = vi.spyOn(fs, 'access');
    (accessSpy as any).mockResolvedValue(undefined);

    const calculateChecksumSpy = vi.spyOn(backupService as any, 'calculateChecksum');
    (calculateChecksumSpy as any).mockResolvedValue('valid_checksum');

    // Create a backup
    const backupInfo = await backupService.createBackup('validation-test');

    // Mock the backup retrieval
    vi.spyOn(backupService, 'getBackupById').mockReturnValue(backupInfo);

    const validationResult = await backupService.validateBackup(backupInfo.id);
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.message).toBe('Backup integrity verified');
  });

  it('should handle validation failure', async () => {
    // Mock access to throw an error (file doesn't exist)
    const accessSpy = vi.spyOn(fs, 'access');
    (accessSpy as any).mockRejectedValue(new Error('File not found'));

    const validationResult = await backupService.validateBackup('invalid-id');
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.message).toContain('Validation failed');
  });

  it('should configure service with new settings', () => {
    const initialRetention = backupService['config'].retentionDays;
    
    backupService.configure({ retentionDays: 14 });
    
    expect(backupService['config'].retentionDays).toBe(14);
    expect(backupService['config'].retentionDays).not.toBe(initialRetention);
  });

  it('should return backup statistics', () => {
    const stats = backupService.getStats();
    
    expect(stats).toHaveProperty('totalBackups');
    expect(stats).toHaveProperty('totalSize');
    expect(stats).toHaveProperty('oldestBackup');
    expect(stats).toHaveProperty('newestBackup');
    
    expect(typeof stats.totalBackups).toBe('number');
    expect(typeof stats.totalSize).toBe('number');
  });

  it('should attempt scheduled backup', async () => {
    // Mock the createBackup method
    const createBackupSpy = vi.spyOn(backupService, 'createBackup');
    (createBackupSpy as any).mockResolvedValue({
      id: 'test-id',
      filename: 'scheduled_backup_test',
      size: 1024,
      createdAt: new Date(),
      status: 'completed',
      encrypted: false,
      compressed: false,
      checksum: 'dummy'
    });

    // This should not throw an error
    await expect(backupService.performScheduledBackup()).resolves.not.toThrow();
  });
});

describe('getBackupService singleton', () => {
  it('should return the same instance when called multiple times', () => {
    // Reset the singleton instance for testing
    const originalBackupService = require('../services/backup.service');
    delete originalBackupService.backupService;
    
    const instance1 = getBackupService();
    const instance2 = getBackupService();
    
    expect(instance1).toBe(instance2);
  });

  it('should accept config on first call', () => {
    // Reset the singleton instance for testing
    const originalBackupService = require('../services/backup.service');
    delete originalBackupService.backupService;
    
    const config: BackupConfig = {
      retentionDays: 30,
      compression: false,
      encryption: true,
      schedule: '0 3 * * *',
      storagePath: './custom-backups',
      databaseUrl: 'sqlite://custom.db'
    };
    
    const instance = getBackupService(config);
    expect(instance).toBeDefined();
  });
});