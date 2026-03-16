#!/usr/bin/env tsx
/**
 * 数据库初始化脚本
 * 
 * 功能:
 * 1. 创建数据库目录
 * 2. 执行 schema.sql 创建表结构
 * 3. 执行 seeds.sql 插入种子数据
 * 4. 验证数据库初始化结果
 */

import Database from 'better-sqlite3';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件所在目录
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const sqlDir = join(rootDir, 'sql');
const localDir = join(rootDir, 'local');
const dbPath = join(localDir, 'dev.db');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function main() {
  log('🦞 Lann 数据库初始化', colors.cyan);
  log('=' .repeat(50), colors.cyan);

  // 1. 创建数据库目录
  if (!existsSync(localDir)) {
    mkdirSync(localDir, { recursive: true });
    log('✅ 创建数据库目录：local/', colors.green);
  }

  // 2. 删除旧数据库文件 (如果存在)
  if (existsSync(dbPath)) {
    log('⚠️  发现旧数据库文件，将被覆盖', colors.yellow);
  }

  // 3. 创建数据库连接
  const db = new Database(dbPath);
  log(`✅ 数据库文件创建成功：${dbPath}`, colors.green);

  // 启用外键约束
  db.pragma('foreign_keys = ON');
  log('✅ 外键约束已启用', colors.green);

  // 4. 读取并执行 schema.sql
  const schemaPath = join(sqlDir, 'schema.sql');
  if (!existsSync(schemaPath)) {
    log(`❌ Schema 文件不存在：${schemaPath}`, colors.red);
    db.close();
    process.exit(1);
  }

  const schemaSql = readFileSync(schemaPath, 'utf-8');
  log('📄 执行 schema.sql...', colors.blue);
  
  try {
    db.exec(schemaSql);
    log('✅ Schema 执行成功', colors.green);
  } catch (error) {
    log(`❌ Schema 执行失败：${error}`, colors.red);
    db.close();
    process.exit(1);
  }

  // 5. 读取并执行 seeds.sql (如果存在)
  const seedsPath = join(sqlDir, 'seeds.sql');
  if (existsSync(seedsPath)) {
    const seedsSql = readFileSync(seedsPath, 'utf-8');
    log('📄 执行 seeds.sql...', colors.blue);
    
    try {
      db.exec(seedsSql);
      log('✅ 种子数据插入成功', colors.green);
    } catch (error) {
      log(`⚠️  种子数据执行失败：${error}`, colors.yellow);
    }
  } else {
    log('⚠️  种子文件不存在，跳过种子数据插入', colors.yellow);
  }

  // 6. 验证数据库
  log('\n🔍 验证数据库...', colors.cyan);
  log('=' .repeat(50), colors.cyan);

  // 查询所有表
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  log(`✅ 表数量：${tables.length}`, colors.green);
  log('   表列表:', colors.blue);
  tables.forEach((table: any) => {
    log(`     - ${table.name}`, colors.reset);
  });

  // 查询所有索引
  const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
  log(`\n✅ 索引数量：${indexes.length}`, colors.green);

  // 验证关键表
  const criticalTables = ['users', 'user_profiles', 'credit_limits', 'loan_products', 'loans', 'repayment_schedules', 'repayments', 'transactions', 'repayment_channels'];
  log('\n📋 关键表验证:', colors.blue);
  
  criticalTables.forEach(tableName => {
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as { count: number };
      log(`   ✓ ${tableName}: ${count.count} 条记录`, colors.green);
    } catch (error) {
      log(`   ✗ ${tableName}: 验证失败`, colors.red);
    }
  });

  // 7. 显示种子数据预览
  log('\n📊 种子数据预览:', colors.blue);
  
  try {
    const users = db.prepare('SELECT id, phone, status FROM users').all();
    log(`   用户：${users.length} 条`, colors.cyan);
    
    const products = db.prepare('SELECT id, name_en, type FROM loan_products').all();
    log(`   借款产品：${products.length} 条`, colors.cyan);
    products.forEach((p: any) => {
      log(`     - ${p.name_en} (${p.type})`, colors.reset);
    });
    
    const channels = db.prepare('SELECT id, name_en, type FROM repayment_channels').all();
    log(`   还款渠道：${channels.length} 条`, colors.cyan);
    channels.forEach((c: any) => {
      log(`     - ${c.name_en} (${c.type})`, colors.reset);
    });
  } catch (error) {
    log(`⚠️  数据预览失败：${error}`, colors.yellow);
  }

  // 关闭数据库
  db.close();

  log('\n' + '=' .repeat(50), colors.cyan);
  log('🎉 数据库初始化完成!', colors.green);
  log(`📁 数据库位置：${dbPath}`, colors.blue);
  log('=' .repeat(50) + '\n', colors.cyan);
}

// 运行主函数
main();
