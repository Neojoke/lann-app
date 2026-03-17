# Lann 项目 - 重启指南

**创建日期:** 2026-03-18  
**状态:** 🟡 待启动

---

## 🚀 快速启动步骤

### Step 1: 环境准备 (5 分钟)

**1.1 启动 Android 模拟器:**
```bash
export ANDROID_HOME=/home/neo/android-sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools

# 启动模拟器
emulator -avd LannDemo -no-snapshot -no-audio

# 等待启动完成 (约 2 分钟)
adb wait-for-device
adb shell "echo '模拟器就绪'"
```

**1.2 验证环境:**
```bash
# 检查 ADB 连接
adb devices

# 检查 Maestro
export PATH=$PATH:$HOME/.maestro/bin
maestro --version

# 检查 Java
java -version  # 应该是 21
```

---

### Step 2: 代码同步 (2 分钟)

**2.1 拉取最新代码:**
```bash
cd /home/neo/.openclaw/workspace/projects/lann-thailand-loan-app
git pull origin main
```

**2.2 安装依赖:**
```bash
# 前端
cd mobile-app
npm install

# 后端
cd ../backend
npm install
```

---

### Step 3: 构建和安装 (5 分钟)

**3.1 构建前端:**
```bash
cd mobile-app
npm run build
npx cap sync android
```

**3.2 构建 APK:**
```bash
cd android
./gradlew assembleDebug
```

**3.3 安装到模拟器:**
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

### Step 4: 运行测试 (3 分钟)

**4.1 运行基础测试:**
```bash
export PATH=$PATH:$HOME/.maestro/bin
cd /home/neo/.openclaw/workspace/projects/lann-thailand-loan-app
maestro test test/e2e/flows/00-smoke-test.yaml
maestro test test/e2e/flows/01-register-flow.yaml
```

**4.2 验证通过率:**
```
预期结果:
✅ Smoke Test (1-2s)
✅ Register Flow (3-5s)
```

---

## 📋 待开发任务清单

### P0 - 核心功能完善

**Task 1: 完整注册流程 E2E 测试**
- [ ] 创建 `02-complete-register.yaml`
- [ ] 包含所有必填字段验证
- [ ] 测试成功和失败场景
- 预计时间：2 小时

**Task 2: 登录流程 E2E 测试**
- [ ] 创建 `03-login-flow.yaml`
- [ ] 测试 OTP 发送和验证
- [ ] 测试密码登录
- 预计时间：2 小时

**Task 3: 信用申请流程**
- [ ] 创建 `04-credit-apply.yaml`
- [ ] 测试 4 步表单
- [ ] 测试信用评分计算
- 预计时间：4 小时

**Task 4: 借款流程**
- [ ] 创建 `05-loan-apply.yaml`
- [ ] 测试金额和期限选择
- [ ] 测试利息计算
- 预计时间：4 小时

---

### P1 - 架构优化

**Task 5: i18n 国际化完善**
- [ ] 补充所有页面的泰语翻译
- [ ] 补充所有页面的英语翻译
- [ ] 测试语言切换功能
- 预计时间：3 小时

**Task 6: 服务层重构**
- [ ] 统一 API 调用方式
- [ ] 添加错误处理中间件
- [ ] 添加请求重试机制
- 预计时间：4 小时

**Task 7: 测试框架优化**
- [ ] 配置 Maestro 并行执行
- [ ] 添加测试报告生成
- [ ] 集成到 CI/CD
- 预计时间：3 小时

---

### P2 - 功能增强

**Task 8: 还款流程测试**
- [ ] 创建 `06-repayment-flow.yaml`
- [ ] 测试 4 种还款方式
- [ ] 测试提前还款
- 预计时间：4 小时

**Task 9: 后台管理测试**
- [ ] 创建 `07-admin-review.yaml`
- [ ] 测试借款审核
- [ ] 测试信用审核
- 预计时间：4 小时

**Task 10: 性能测试**
- [ ] 创建性能测试脚本
- [ ] 测试启动时间
- [ ] 测试 API 响应时间
- 预计时间：3 小时

---

## 🎯 推荐启动顺序

### 第一次重启 (建议)

**目标:** 验证环境，运行基础测试

**执行步骤:**
1. 按照 Step 1-4 启动环境
2. 运行 Smoke Test
3. 运行 Register Flow Test
4. 确认通过率 100%

**预计时间:** 15 分钟

**成功标准:**
```
✅ 模拟器正常启动
✅ App 正常安装
✅ 2/2 E2E 测试通过
```

---

### 第二次重启 (P0 任务)

**目标:** 完成核心功能 E2E 测试

**执行步骤:**
1. 创建 `02-complete-register.yaml`
2. 创建 `03-login-flow.yaml`
3. 运行所有测试
4. 修复失败测试

**预计时间:** 4 小时

**成功标准:**
```
✅ 4/4 E2E 测试通过
✅ 测试覆盖率 ≥ 80%
```

---

### 第三次重启 (P1 任务)

**目标:** 架构优化

**执行步骤:**
1. 重构 i18n 配置
2. 优化服务层
3. 配置 CI/CD
4. 运行回归测试

**预计时间:** 10 小时

**成功标准:**
```
✅ 所有翻译完整
✅ API 调用统一
✅ CI/CD 自动执行
```

---

## 📊 任务优先级矩阵

| 任务 | 优先级 | 预计时间 | 依赖 |
|------|--------|---------|------|
| 环境验证 | P0 | 15 分钟 | 无 |
| 完整注册测试 | P0 | 2 小时 | 环境验证 |
| 登录流程测试 | P0 | 2 小时 | 环境验证 |
| 信用申请测试 | P0 | 4 小时 | 登录测试 |
| 借款流程测试 | P0 | 4 小时 | 信用测试 |
| i18n 完善 | P1 | 3 小时 | 无 |
| 服务层重构 | P1 | 4 小时 | 无 |
| 测试框架优化 | P1 | 3 小时 | 无 |
| 还款流程测试 | P2 | 4 小时 | 借款测试 |
| 后台管理测试 | P2 | 4 小时 | 信用测试 |
| 性能测试 | P2 | 3 小时 | 所有功能 |

---

## 🔧 常见问题解决

### 问题 1: 模拟器启动失败

**症状:**
```
emulator: ERROR: x86_64 emulation currently requires hardware acceleration
```

**解决方案:**
```bash
# 检查 KVM 支持
egrep -c '(vmx|svm)' /proc/cpuinfo

# 如果返回 0，需要启用虚拟化
# 重启电脑，进入 BIOS，启用 Intel VT-x 或 AMD-V
```

---

### 问题 2: ADB 连接失败

**症状:**
```
adb: no devices/emulators found
```

**解决方案:**
```bash
# 重启 ADB 服务
adb kill-server
adb start-server
adb devices

# 如果还是不行，重启模拟器
pkill -f emulator
emulator -avd LannDemo -no-snapshot
```

---

### 问题 3: Maestro 测试失败

**症状:**
```
Failed to parse file: xxx.yaml
List is empty.
```

**解决方案:**
```bash
# 检查 YAML 格式
cat test/e2e/flows/xxx.yaml

# 确保文件格式正确：
# 1. 使用 UTF-8 编码
# 2. 使用 2 空格缩进
# 3. appId 后必须有 ---
# 4. 命令列表以 - 开头

# 或者使用已知正确的模板
cp test/e2e/flows/00-smoke-test.yaml test/e2e/flows/new-test.yaml
```

---

### 问题 4: App 崩溃

**症状:**
```
Unable to launch app com.lann.app
```

**解决方案:**
```bash
# 清除 App 数据
adb shell pm clear com.lann.app

# 重新安装
adb install -r mobile-app/android/app/build/outputs/apk/debug/app-debug.apk

# 检查日志
adb logcat | grep -i "lann\|capacitor"
```

---

## 📝 每次开发前检查清单

**环境检查:**
- [ ] 模拟器正在运行
- [ ] ADB 连接正常
- [ ] Maestro 可用
- [ ] Java 版本正确 (21)

**代码检查:**
- [ ] 已拉取最新代码
- [ ] 依赖已安装
- [ ] 构建成功

**测试检查:**
- [ ] Smoke Test 通过
- [ ] Register Flow 通过
- [ ] 无已知失败测试

---

## 🎯 快速命令参考

**模拟器:**
```bash
# 启动
emulator -avd LannDemo -no-snapshot

# 停止
pkill -f emulator

# 检查状态
adb devices
```

**构建:**
```bash
cd mobile-app
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

**测试:**
```bash
export PATH=$PATH:$HOME/.maestro/bin
maestro test test/e2e/flows/
maestro test test/e2e/flows/00-smoke-test.yaml
```

**安装:**
```bash
adb install -r mobile-app/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📞 需要帮助？

**文档位置:**
- 项目章程：`docs/PROJECT_CHARTER.md`
- 暂停通知：`docs/PROJECT_SUSPENDED.md`
- 问题分析：`docs/E2E_TEST_FAILURE_ANALYSIS.md`

**GitHub 仓库:**
- https://github.com/Neojoke/lann-app

**联系人:**
- 项目负责人：吴鹏 (peng)

---

**准备好开始了吗？执行 `Step 1: 环境准备` 开始！** 🚀
