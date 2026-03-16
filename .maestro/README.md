# Maestro E2E 测试配置 - 本地测试方案

**测试框架:** Maestro CLI  
**运行环境:** GitHub Actions + Android 模拟器  
**创建日期:** 2026-03-16  
**更新:** 2026-03-16 (改为本地测试方案)

---

## 📦 本地开发环境配置

### 1. 安装 Maestro CLI

```bash
# macOS / Linux
curl -fsSL "https://get.maestro.mobile.dev" | bash

# 验证安装
maestro --version
```

### 2. 安装 Java 17

```bash
# macOS (Homebrew)
brew install openjdk@17

# Ubuntu/Debian
sudo apt-get install openjdk-17-jdk

# 验证
java -version
```

### 3. 安装 Android Studio

下载：https://developer.android.com/studio

安装后配置环境变量：
```bash
# ~/.bashrc 或 ~/.zshrc
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

---

## 🚀 本地运行测试

### 启动 Android 模拟器

```bash
# 创建模拟器 (如果还没有)
avdmanager create avd -n lann-test -k "system-images;android-33;google_apis;x86_64"

# 启动模拟器
emulator -avd lann-test -no-snapshot -no-audio
```

### 构建并安装 App

```bash
cd mobile-app

# 安装依赖
npm install

# 构建 Web 应用
npm run build

# 同步到 Android
npx cap sync android

# 构建 APK
cd android
./gradlew assembleDebug

# 安装到模拟器
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### 运行 Maestro 测试

```bash
# 运行所有测试
maestro test .maestro/flows/

# 运行单个测试
maestro test .maestro/flows/login.yaml

# 运行带标签的测试
maestro test .maestro/flows/ --tags login

# 生成 HTML 报告
maestro test .maestro/flows/ --reporter html
```

---

## 📝 测试用例列表

### 核心流程测试

| 测试文件 | 描述 | 标签 | 状态 |
|---------|------|------|------|
| `login.yaml` | 用户登录流程 | login, auth | ✅ 待创建 |
| `register.yaml` | 用户注册流程 | register, auth | ✅ 待创建 |
| `borrow.yaml` | 借款申请流程 | borrow, loan | ✅ 待创建 |
| `repay.yaml` | 还款流程 | repay, loan | ✅ 待创建 |
| `language-switch.yaml` | 语言切换测试 | i18n, settings | ✅ 待创建 |
| `credit-apply.yaml` | 信用申请流程 | credit, apply | ⏳ 待创建 |

---

## 🎯 测试用例模板

### 登录测试 (`login.yaml`)

```yaml
appId: com.lann.app
name: 用户登录测试
tags:
  - login
  - auth

---
# 启动应用
- launchApp

# 验证启动页面
- assertVisible: "สวัสดี" # 泰语"欢迎"
- assertVisible: "Welcome" # 英语"欢迎"

# 进入登录页面
- tapOn:
    text: "Login"
- assertVisible: "Phone Number"

# 输入手机号
- inputText: "+66812345678"
- tapOn:
    text: "Next"

# 输入密码
- inputText: "password123"
- tapOn:
    text: "Login"

# 验证登录成功
- assertVisible: "Available Credit"
- assertVisible: "Borrow Now"
```

### 注册测试 (`register.yaml`)

```yaml
appId: com.lann.app
name: 用户注册测试
tags:
  - register
  - auth

---
- launchApp

# 进入注册页面
- tapOn:
    text: "Register"

# 输入手机号
- assertVisible: "Phone Number"
- inputText: "+66898765432"

# 获取 OTP
- tapOn:
    text: "Send OTP"
- assertVisible: "Enter OTP"

# 验证 OTP
- inputText: "123456"
- tapOn:
    text: "Verify OTP"

# 设置密码
- inputText: "TestUser"
- inputText: "password123"
- inputText: "password123"

# 完成注册
- tapOn:
    text: "Register"

# 验证成功
- assertVisible: "Registration Successful"
- assertVisible: "Available Credit"
```

### 借款申请测试 (`borrow.yaml`)

```yaml
appId: com.lann.app
name: 借款申请测试
tags:
  - borrow
  - loan

---
- launchApp

# 进入借款页面
- tapOn:
    text: "Borrow Now"

# 验证页面元素
- assertVisible: "Amount"
- assertVisible: "Days"

# 选择借款金额 (滑动条)
- swipe:
    start: 20%
    end: 80%
    direction: RIGHT

# 验证金额
- assertVisible: "฿ 10,000"

# 选择借款期限
- tapOn:
    text: "14 Days"

# 验证利息计算
- assertVisible: "Interest"
- assertVisible: "Total Repayment"

# 确认借款
- tapOn:
    text: "Confirm Borrow"

# 验证成功
- assertVisible: "Loan Approved"
- assertVisible: "Success"
```

### 信用申请测试 (`credit-apply.yaml`)

```yaml
appId: com.lann.app
name: 信用申请测试
tags:
  - credit
  - apply

---
- launchApp

# 进入信用申请页面
- tapOn:
    text: "Apply for Credit"

# 填写基本信息
- assertVisible: "Full Name"
- inputText: "Test User"

- assertVisible: "National ID"
- inputText: "1234567890123"

- assertVisible: "Date of Birth"
- inputText: "1990-01-01"

# 填写工作信息
- assertVisible: "Company Name"
- inputText: "Test Company"

- assertVisible: "Monthly Income"
- inputText: "30000"

# 提交申请
- tapOn:
    text: "Submit Application"

# 验证提交成功
- assertVisible: "Application Submitted"
- assertVisible: "Reviewing"
```

---

## 🔧 GitHub Actions 配置

### 工作流文件

位置：`.github/workflows/e2e-test.yml`

### 触发条件

- **Push:** `main`, `develop` 分支
- **Pull Request:** 所有 PR

### 配置说明

```yaml
# 关键配置项
api-level: 33           # Android 13
arch: x86_64           # 64 位架构
profile: pixel_6       # Pixel 6 模拟器
ram-size: 4096M        # 4GB 内存
timeout-minutes: 60    # 60 分钟超时
```

### 输出产物

| 产物 | 路径 | 保留时间 |
|------|------|---------|
| 测试报告 | `report.xml` | 30 天 |
| Debug APK | `app-debug.apk` | 7 天 |

---

## 📊 测试覆盖率目标

| 模块 | 测试用例数 | 覆盖率目标 | 优先级 |
|------|-----------|-----------|--------|
| 用户认证 | 2 | 90% | P0 |
| 信用申请 | 1 | 85% | P0 |
| 借款流程 | 1 | 85% | P0 |
| 还款流程 | 1 | 85% | P0 |
| 多语言 | 1 | 95% | P1 |
| **总计** | **6** | **87%** | - |

---

## 🐛 常见问题

### 1. Maestro 安装失败

```bash
# 检查 Java 版本
java -version

# 必须是 Java 17+
# 如果不是，安装 Java 17 并更新 JAVA_HOME
```

### 2. 模拟器启动失败

```bash
# 检查 KVM 是否启用
kvm-ok

# 如果未启用，在 BIOS 中开启虚拟化
# 或者使用不带 KVM 的镜像
```

### 3. 测试失败

```bash
# 查看详细日志
maestro test .maestro/flows/login.yaml --verbose

# 截图调试
maestro test .maestro/flows/login.yaml --screenshot-on-failure
```

### 4. ADB 找不到设备

```bash
# 等待设备就绪
adb wait-for-device

# 重启 ADB 服务器
adb kill-server
adb start-server

# 重新列出设备
adb devices
```

---

## 📈 最佳实践

1. **测试命名规范**
   - 使用描述性名称：`login-success.yaml`, `borrow-amount-validation.yaml`
   - 添加标签便于筛选

2. **数据隔离**
   - 使用测试专用账号
   - 每次测试后清理数据

3. **等待策略**
   - 使用 `assertVisible` 代替固定等待
   - 设置合理超时时间

4. **错误处理**
   - 添加重试机制
   - 记录详细错误信息

5. **持续维护**
   - 随功能更新同步更新测试
   - 定期审查和优化测试用例

---

## 🔗 参考链接

- **Maestro 官方文档:** https://docs.maestro.dev/
- **GitHub Actions 集成:** https://docs.maestro.dev/maestro-cloud/ci-cd-integration/github-actions
- **Maestro CLI 命令:** https://docs.maestro.dev/maestro-cli/commands/maestro-test
- **Android 模拟器配置:** https://developer.android.com/studio/run/managing-avds

---

**下一步:** 创建实际的测试文件 (.yaml) 并集成到 CI/CD 流程

**维护人:** 小满 (Orchestrator)  
**最后更新:** 2026-03-16 23:17
