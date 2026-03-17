# Lann 项目 - 新开发任务清单

**创建日期:** 2026-03-18  
**状态:** 🟡 待启动

---

## 🎯 项目目标

**短期目标 (1 周):**
- ✅ 完成核心功能 E2E 测试 (注册/登录/借款/还款)
- ✅ 测试覆盖率 ≥ 80%
- ✅ CI/CD 自动执行

**中期目标 (2 周):**
- ✅ 完成所有业务流程测试
- ✅ 性能优化 (启动时间 < 2 秒)
- ✅ 安全加固

**长期目标 (1 个月):**
- ✅ Google Play 上架准备
- ✅ 生产环境部署
- ✅ 监控告警配置

---

## 📋 任务列表

### Sprint 1: 核心功能完善 (Week 1)

#### Task 1.1: 完整注册流程 E2E
**优先级:** P0  
**预计时间:** 2 小时  
**负责人:** 待分配

**验收标准:**
- [ ] 测试所有必填字段
- [ ] 测试字段验证 (手机号/身份证/邮箱)
- [ ] 测试成功场景
- [ ] 测试失败场景 (重复注册/无效数据)

**测试文件:**
```yaml
# test/e2e/flows/02-complete-register.yaml
appId: com.lann.app
---
- launchApp
- tapOn: "ลงทะเบียน"
- inputText: "0812345678"
- tapOn: "ส่ง OTP"
- inputText: "123456"
- tapOn: "ยืนยัน"
- assertVisible: "ลงทะเบียนสำเร็จ"
```

---

#### Task 1.2: 登录流程 E2E
**优先级:** P0  
**预计时间:** 2 小时  
**负责人:** 待分配

**验收标准:**
- [ ] 测试 OTP 登录
- [ ] 测试密码登录
- [ ] 测试记住密码功能
- [ ] 测试登录失败场景

**测试文件:**
```yaml
# test/e2e/flows/03-login-flow.yaml
appId: com.lann.app
---
- launchApp
- tapOn: "เข้าสู่ระบบ"
- inputText: "0812345678"
- inputText: "TestPassword123!"
- tapOn: "เข้าสู่ระบบ"
- assertVisible: "ยินดีต้อนรับ"
```

---

#### Task 1.3: 信用申请流程 E2E
**优先级:** P0  
**预计时间:** 4 小时  
**负责人:** 待分配

**验收标准:**
- [ ] 测试 4 步表单完整流程
- [ ] 测试信用评分计算
- [ ] 测试额度授予
- [ ] 测试审核状态查询

**测试文件:**
```yaml
# test/e2e/flows/04-credit-apply.yaml
appId: com.lann.app
---
- launchApp
- tapOn: "สมัครวงเงิน"
- inputText: "50000"  # 月收入
- tapOn: "ต่อไป"
- assertVisible: "คะแนนเครดิต"
- assertVisible: "วงเงินที่ใช้ได้"
```

---

#### Task 1.4: 借款流程 E2E
**优先级:** P0  
**预计时间:** 4 小时  
**负责人:** 待分配

**验收标准:**
- [ ] 测试金额选择
- [ ] 测试期限选择
- [ ] 测试利息计算
- [ ] 测试借款确认
- [ ] 测试借款状态查询

**测试文件:**
```yaml
# test/e2e/flows/05-loan-apply.yaml
appId: com.lann.app
---
- launchApp
- tapOn: "กู้เงิน"
- tapOn: "10,000 ฿"
- tapOn: "14 วัน"
- assertVisible: "ดอกเบี้ย"
- assertVisible: "ยอดชำระรวม"
- tapOn: "ยืนยันการกู้"
- assertVisible: "กู้เงินสำเร็จ"
```

---

### Sprint 2: 架构优化 (Week 2)

#### Task 2.1: i18n 国际化完善
**优先级:** P1  
**预计时间:** 3 小时  
**负责人:** 待分配

**验收标准:**
- [ ] 所有页面有泰语翻译
- [ ] 所有页面有英语翻译
- [ ] 语言切换功能正常
- [ ] 翻译准确率 100%

**工作内容:**
1. 补充缺失的翻译键
2. 校对现有翻译
3. 测试语言切换
4. 添加翻译验证测试

---

#### Task 2.2: 服务层重构
**优先级:** P1  
**预计时间:** 4 小时  
**负责人:** 待分配

**验收标准:**
- [ ] 统一 API 调用方式
- [ ] 添加错误处理中间件
- [ ] 添加请求重试机制
- [ ] 添加请求日志

**工作内容:**
1. 创建统一的 ApiClient
2. 添加错误拦截器
3. 添加重试逻辑
4. 更新所有服务调用

---

#### Task 2.3: 测试框架优化
**优先级:** P1  
**预计时间:** 3 小时  
**负责人:** 待分配

**验收标准:**
- [ ] Maestro 并行执行
- [ ] 测试报告自动生成
- [ ] CI/CD 集成
- [ ] 测试覆盖率报告

**工作内容:**
1. 配置 Maestro 并行执行
2. 添加 HTML 报告生成
3. 配置 GitHub Actions
4. 集成覆盖率工具

---

### Sprint 3: 功能增强 (Week 3)

#### Task 3.1: 还款流程 E2E
**优先级:** P2  
**预计时间:** 4 小时  
**负责人:** 待分配

**验收标准:**
- [ ] 测试银行转账还款
- [ ] 测试 PromptPay 还款
- [ ] 测试便利店还款
- [ ] 测试提前还款
- [ ] 测试逾期还款

**测试文件:**
```yaml
# test/e2e/flows/06-repayment-flow.yaml
appId: com.lann.app
---
- launchApp
- tapOn: "ชำระคืน"
- tapOn: "พร้อมเพย์"
- assertVisible: "扫码支付"
- tapOn: "ชำระเลย"
- assertVisible: "ชำระสำเร็จ"
```

---

#### Task 3.2: 后台管理 E2E
**优先级:** P2  
**预计时间:** 4 小时  
**负责人:** 待分配

**验收标准:**
- [ ] 测试借款审核
- [ ] 测试信用审核
- [ ] 测试用户管理
- [ ] 测试数据看板

**测试文件:**
```yaml
# test/e2e/flows/07-admin-review.yaml
appId: com.lann.app.admin
---
- launchApp
- tapOn: "การอนุมัติ"
- tapOn: "คำขอกู้"
- tapOn: "อนุมัติ"
- assertVisible: "อนุมัติสำเร็จ"
```

---

#### Task 3.3: 性能测试
**优先级:** P2  
**预计时间:** 3 小时  
**负责人:** 待分配

**验收标准:**
- [ ] 冷启动时间 < 2 秒
- [ ] 热启动时间 < 1 秒
- [ ] API 响应时间 < 200ms
- [ ] 内存使用 < 200MB

**测试脚本:**
```bash
# scripts/performance-test.sh
# 测试启动时间
adb shell am start -W com.lann.app/.MainActivity

# 测试 API 响应时间
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8787/health
```

---

## 📊 任务状态跟踪

| 任务 ID | 任务名称 | 优先级 | 状态 | 进度 | 负责人 |
|--------|---------|--------|------|------|--------|
| 1.1 | 完整注册测试 | P0 | ⏳ 待开始 | 0% | - |
| 1.2 | 登录流程测试 | P0 | ⏳ 待开始 | 0% | - |
| 1.3 | 信用申请测试 | P0 | ⏳ 待开始 | 0% | - |
| 1.4 | 借款流程测试 | P0 | ⏳ 待开始 | 0% | - |
| 2.1 | i18n 完善 | P1 | ⏳ 待开始 | 0% | - |
| 2.2 | 服务层重构 | P1 | ⏳ 待开始 | 0% | - |
| 2.3 | 测试框架优化 | P1 | ⏳ 待开始 | 0% | - |
| 3.1 | 还款流程测试 | P2 | ⏳ 待开始 | 0% | - |
| 3.2 | 后台管理测试 | P2 | ⏳ 待开始 | 0% | - |
| 3.3 | 性能测试 | P2 | ⏳ 待开始 | 0% | - |

---

## 🎯 启动第一个任务

**推荐启动任务:** Task 1.1 - 完整注册流程 E2E

**启动命令:**
```bash
# 1. 创建测试文件
cd /home/neo/.openclaw/workspace/projects/lann-thailand-loan-app
cat > test/e2e/flows/02-complete-register.yaml << 'EOF'
appId: com.lann.app
name: 02-Complete Register

---
- launchApp
- waitForAnimationToEnd: 3000
- tapOn: "ลงทะเบียน"
- assertVisible: "ลงทะเบียน"
- assertVisible: "เบอร์โทรศัพท์"
EOF

# 2. 运行测试
export PATH=$PATH:$HOME/.maestro/bin
maestro test test/e2e/flows/02-complete-register.yaml
```

**预计完成时间:** 2 小时

---

## 📝 任务完成检查清单

**每个任务完成后需要:**
- [ ] 测试文件已创建
- [ ] 测试通过率 100%
- [ ] 代码已提交
- [ ] 文档已更新
- [ ] GitHub 已推送

**提交规范:**
```bash
git add -A
git commit -m "feat: 完成 [任务名称]

- 创建测试文件：test/e2e/flows/xxx.yaml
- 测试覆盖率：100%
- 通过率：100%"
git push origin main
```

---

## 🚀 快速开始

**立即执行 Task 1.1:**
```bash
# 1. 确保环境就绪
./scripts/restart-environment.sh

# 2. 创建测试文件
cat > test/e2e/flows/02-complete-register.yaml << 'EOF'
appId: com.lann.app
---
- launchApp
- tapOn: "ลงทะเบียน"
- assertVisible: "ลงทะเบียน"
EOF

# 3. 运行测试
maestro test test/e2e/flows/02-complete-register.yaml

# 4. 提交代码
git add -A
git commit -m "feat: 完成完整注册流程 E2E 测试"
git push origin main
```

---

**选择您要执行的任务，或者从 Task 1.1 开始！** 🚀
