/**
 * 数据库表结构验证测试
 * 
 * 验证 Lann 项目 10 张核心表的 schema 定义
 * 
 * 表清单:
 * 1. users - 用户表
 * 2. credit_limits - 信用额度表
 * 3. credit_applications - 信用申请表
 * 4. loan_products - 贷款产品表
 * 5. loan_applications - 贷款申请表
 * 6. loans - 贷款表
 * 7. repayment_schedules - 还款计划表
 * 8. repayments - 还款记录表
 * 9. penalties - 罚息记录表
 * 10. audit_logs - 审计日志表
 */

import { describe, it, expect, beforeAll } from 'bun:test';
import { db } from '../../../backend/db';

describe('Database Schema - Tables', () => {
  const expectedTables = [
    'users',
    'credit_limits',
    'credit_applications',
    'loan_products',
    'loan_applications',
    'loans',
    'repayment_schedules',
    'repayments',
    'penalties',
    'audit_logs',
  ];

  let existingTables: string[] = [];

  beforeAll(async () => {
    // 获取所有表名
    const result = await db.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    existingTables = result.results.map((r: any) => r.name);
  });

  describe('Table Existence', () => {
    it('should have all required tables', () => {
      const missingTables = expectedTables.filter(
        table => !existingTables.includes(table)
      );
      
      expect(missingTables).toEqual([]);
    });

    expectedTables.forEach(tableName => {
      it(`should have table: ${tableName}`, () => {
        expect(existingTables).toContain(tableName);
      });
    });
  });

  describe('users table', () => {
    it('should have required columns', async () => {
      const result = await db.execute(`PRAGMA table_info(users)`);
      const columns = result.results.map((r: any) => r.name);

      expect(columns).toContain('id');
      expect(columns).toContain('phone');
      expect(columns).toContain('nationality');
      expect(columns).toContain('date_of_birth');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    it('should have primary key', async () => {
      const result = await db.execute(`PRAGMA table_info(users)`);
      const pkColumn = result.results.find((r: any) => r.pk === 1);
      
      expect(pkColumn).toBeDefined();
      expect(pkColumn?.name).toBe('id');
    });
  });

  describe('credit_limits table', () => {
    it('should have required columns', async () => {
      const result = await db.execute(`PRAGMA table_info(credit_limits)`);
      const columns = result.results.map((r: any) => r.name);

      expect(columns).toContain('id');
      expect(columns).toContain('user_id');
      expect(columns).toContain('total_limit');
      expect(columns).toContain('available_limit');
      expect(columns).toContain('used_limit');
      expect(columns).toContain('credit_score');
      expect(columns).toContain('credit_grade');
      expect(columns).toContain('status');
      expect(columns).toContain('granted_at');
      expect(columns).toContain('expires_at');
    });

    it('should have user_id foreign key reference', async () => {
      const result = await db.execute(`PRAGMA foreign_key_list(credit_limits)`);
      const fkList = result.results;
      
      const userFk = fkList.find((fk: any) => fk.table === 'users');
      expect(userFk).toBeDefined();
    });
  });

  describe('loan_products table', () => {
    it('should have required columns', async () => {
      const result = await db.execute(`PRAGMA table_info(loan_products)`);
      const columns = result.results.map((r: any) => r.name);

      expect(columns).toContain('id');
      expect(columns).toContain('name_en');
      expect(columns).toContain('name_th');
      expect(columns).toContain('type');
      expect(columns).toContain('min_amount');
      expect(columns).toContain('max_amount');
      expect(columns).toContain('interest_rate');
      expect(columns).toContain('status');
    });
  });

  describe('loans table', () => {
    it('should have required columns', async () => {
      const result = await db.execute(`PRAGMA table_info(loans)`);
      const columns = result.results.map((r: any) => r.name);

      expect(columns).toContain('id');
      expect(columns).toContain('user_id');
      expect(columns).toContain('product_id');
      expect(columns).toContain('principal');
      expect(columns).toContain('interest_rate');
      expect(columns).toContain('term_days');
      expect(columns).toContain('total_repayment');
      expect(columns).toContain('remaining_amount');
      expect(columns).toContain('status');
      expect(columns).toContain('disbursed_at');
      expect(columns).toContain('due_date');
    });

    it('should have composite indexes', async () => {
      const result = await db.execute(`PRAGMA index_list(loans)`);
      const indexes = result.results.map((r: any) => r.name);

      expect(indexes.some(idx => idx.includes('user_id'))).toBe(true);
      expect(indexes.some(idx => idx.includes('status'))).toBe(true);
    });
  });

  describe('repayment_schedules table', () => {
    it('should have required columns', async () => {
      const result = await db.execute(`PRAGMA table_info(repayment_schedules)`);
      const columns = result.results.map((r: any) => r.name);

      expect(columns).toContain('id');
      expect(columns).toContain('loan_id');
      expect(columns).toContain('installment_number');
      expect(columns).toContain('due_date');
      expect(columns).toContain('principal_amount');
      expect(columns).toContain('interest_amount');
      expect(columns).toContain('total_amount');
      expect(columns).toContain('status');
    });
  });

  describe('repayments table', () => {
    it('should have required columns', async () => {
      const result = await db.execute(`PRAGMA table_info(repayments)`);
      const columns = result.results.map((r: any) => r.name);

      expect(columns).toContain('id');
      expect(columns).toContain('loan_id');
      expect(columns).toContain('amount');
      expect(columns).toContain('method');
      expect(columns).toContain('status');
      expect(columns).toContain('paid_at');
    });
  });

  describe('penalties table', () => {
    it('should have required columns', async () => {
      const result = await db.execute(`PRAGMA table_info(penalties)`);
      const columns = result.results.map((r: any) => r.name);

      expect(columns).toContain('id');
      expect(columns).toContain('loan_id');
      expect(columns).toContain('overdue_days');
      expect(columns).toContain('penalty_amount');
      expect(columns).toContain('daily_rate');
      expect(columns).toContain('status');
    });
  });

  describe('audit_logs table', () => {
    it('should have required columns', async () => {
      const result = await db.execute(`PRAGMA table_info(audit_logs)`);
      const columns = result.results.map((r: any) => r.name);

      expect(columns).toContain('id');
      expect(columns).toContain('user_id');
      expect(columns).toContain('action');
      expect(columns).toContain('entity_type');
      expect(columns).toContain('entity_id');
      expect(columns).toContain('old_value');
      expect(columns).toContain('new_value');
      expect(columns).toContain('created_at');
    });

    it('should have timestamp index', async () => {
      const result = await db.execute(`PRAGMA index_list(audit_logs)`);
      const indexes = result.results.map((r: any) => r.name);

      expect(indexes.some(idx => idx.includes('created_at'))).toBe(true);
    });
  });

  describe('Table Relationships', () => {
    it('should have proper foreign key constraints', async () => {
      // Check loans -> users FK
      const loansFK = await db.execute(`PRAGMA foreign_key_list(loans)`);
      const userFK = loansFK.results.find((fk: any) => fk.table === 'users');
      expect(userFK).toBeDefined();

      // Check loans -> loan_products FK
      const productFK = loansFK.results.find((fk: any) => fk.table === 'loan_products');
      expect(productFK).toBeDefined();
    });

    it('should have repayment_schedules -> loans FK', async () => {
      const result = await db.execute(`PRAGMA foreign_key_list(repayment_schedules)`);
      const loanFK = result.results.find((fk: any) => fk.table === 'loans');
      
      expect(loanFK).toBeDefined();
    });

    it('should have repayments -> loans FK', async () => {
      const result = await db.execute(`PRAGMA foreign_key_list(repayments)`);
      const loanFK = result.results.find((fk: any) => fk.table === 'loans');
      
      expect(loanFK).toBeDefined();
    });
  });
});
