#!/usr/bin/env node
// Lann Backend - 本地开发启动脚本

import { serve } from '@hono/node-server';
import app from './workers/index.local.ts';

serve({
  fetch: app.fetch,
  port: 8787,
}, (info) => {
  console.log('🦞 Lann Backend API - Development Mode');
  console.log(`📍 Server: http://localhost:${info.port}`);
  console.log('🧪 Test phone: +66812345678');
  console.log('🔑 Test OTP: 123456');
  console.log('');
});
