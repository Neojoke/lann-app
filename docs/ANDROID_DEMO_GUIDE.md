# Lann 项目 - Android 模拟器演示指南

**版本:** v1.0  
**创建日期:** 2026-03-17 08:37  
**目标:** 真实 Android 环境演示

---

## 🎯 演示方式对比

| 方式 | 优点 | 缺点 | 推荐场景 |
|------|------|------|---------|
| **浏览器** | 快速启动 | 非真实环境 | 开发调试 |
| **Android 模拟器** | 真实用户体验 | 需要打包 | **正式演示** ✅ |
| **真机** | 最真实 | 需要 USB 调试 | 最终测试 |

**推荐:** 正式演示使用 **Android 模拟器**

---

## 📦 前置准备

### 环境要求
- Android Studio (最新版)
- Android SDK 33+
- 8GB+ RAM (模拟器)
- 20GB 空闲存储

### 检查环境
```bash
# 检查 Android SDK
adb version

# 检查模拟器
emulator -list-avds

# 检查 Java
java -version
```

---

## 🚀 快速启动 (15 分钟)

### Step 1: 打包 Android APK (5 分钟)

```bash
cd /home/neo/.openclaw/workspace/projects/lann-thailand-loan-app/mobile-app

# 1. 构建 Web 应用
npm run build

# 2. 同步到 Android
npx cap sync android

# 3. 构建 Debug APK
cd android
./gradlew assembleDebug

# APK 位置:
# android/app/build/outputs/apk/debug/app-debug.apk
```

### Step 2: 创建/启动模拟器 (5 分钟)

**使用 Android Studio:**
1. 打开 Android Studio
2. Tools → Device Manager
3. Create Device
4. 选择：Pixel 6
5. 系统镜像：Android 13 (API 33)
6. 完成创建
7. 点击启动

**或使用命令行:**
```bash
# 创建模拟器
avdmanager create avd \
  -n LannDemo \
  -k "system-images;android-33;google_apis;x86_64" \
  -d pixel_6

# 启动模拟器
emulator -avd LannDemo -no-snapshot -no-audio
```

### Step 3: 安装 APK (2 分钟)

```bash
# 等待模拟器启动
adb wait-for-device

# 解锁屏幕
adb shell input keyevent 82

# 安装 APK
adb install -r \
  mobile-app/android/app/build/outputs/apk/debug/app-debug.apk

# 验证安装
adb shell pm list packages | grep lann
```

### Step 4: 启动后端服务 (3 分钟)

```bash
# 新终端窗口
cd backend
npm run dev:local

# 应该看到:
# 🚀 Server ready at http://localhost:3000
```

**注意:** 模拟器访问本机需要特殊配置
- 模拟器访问：`http://10.0.2.2:3000`
- 或：`http://host.docker.internal:3000`

---

## 📱 演示流程

### 场景 1: 启动 App

**操作:**
1. 在模拟器中找到 Lann App
2. 点击启动
3. 展示启动画面

**预期:**
- Ionic 启动画面
- 首页加载正常
- 泰语/英语显示

---

### 场景 2: 用户注册 + 登录

**注册:**
1. 点击"注册"按钮
2. 输入手机号：`+66812345678`
3. 点击"发送 OTP"
4. 输入 OTP：`123456`
5. 设置密码
6. 完成注册

**登录:**
1. 输入手机号
2. 输入密码
3. 登录成功

---

### 场景 3: 信用申请 + 评估

**步骤:**
1. 点击"信用申请"
2. 填写 4 步表单:
   - 身份信息
   - 联系信息
   - 工作信息
   - 确认提交
3. 提交申请
4. 查看评估结果:
   - 信用评分
   - 信用等级
   - 授信额度

---

### 场景 4: 借款申请 + 审批

**步骤:**
1. 点击"借款"
2. 选择金额：`10,000 THB`
3. 选择期限：`14 天`
4. 查看费用明细
5. 确认借款
6. 电子签名
7. 查看审批状态

---

### 场景 5: 还款流程

**步骤:**
1. 点击"还款"
2. 选择还款方式
3. 确认还款
4. 还款成功

**提前还款:**
1. 选择"提前还款"
2. 查看节省利息
3. 确认还款

---

### 场景 6: 管理后台 (浏览器)

**访问:** http://localhost:5174

**演示:**
1. 登录管理后台
2. 借款审核
3. 产品管理
4. 数据看板

---

## 🎬 演示技巧

### 1. 模拟器优化

**提升性能:**
```bash
# 使用硬件加速
emulator -avd LannDemo \
  -gpu host \
  -accel on \
  -no-snapshot
```

**调整窗口大小:**
```bash
# 缩放模拟器窗口
Ctrl + F11  # 切换全屏
Ctrl + 1~9  # 调整缩放比例
```

### 2. 录屏演示

**使用 scrcpy (推荐):**
```bash
# 安装
sudo apt install scrcpy  # Linux
brew install scrcpy      # Mac

# 启动
scrcpy

# 录屏
scrcpy --record demo.mp4
```

**或使用 Android Studio:**
1. 打开 Logcat
2. 点击屏幕录制按钮
3. 开始录制

### 3. 快速操作

**ADB 快捷命令:**
```bash
# 截屏
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png

# 输入文本
adb shell input text "Hello"

# 点击坐标
adb shell input tap 500 1000

# 返回
adb shell input keyevent 4

# 主页
adb shell input keyevent 3
```

---

## 🔧 常见问题

### Q1: 模拟器启动慢
```bash
# 使用冷启动
emulator -avd LannDemo -no-snapshot

# 增加 RAM
emulator -avd LannDemo -memory 4096
```

### Q2: APK 安装失败
```bash
# 检查模拟器状态
adb devices

# 重新安装
adb uninstall com.lann.app
adb install -r app-debug.apk

# 检查权限
adb shell pm grant com.lann.app android.permission.INTERNET
```

### Q3: 网络无法连接
```bash
# 模拟器访问本机
# Android 模拟器使用 10.0.2.2 访问宿主机

# 修改 API 配置
mobile-app/src/environments/environment.ts
{
  apiUrl: 'http://10.0.2.2:3000'
}
```

### Q4: 应用崩溃
```bash
# 查看日志
adb logcat | grep -i lann

# 清除数据
adb shell pm clear com.lann.app

# 重新安装
adb install -r app-debug.apk
```

---

## 📊 演示数据

### 测试账号

| 手机号 | 密码 | 信用等级 | 额度 |
|--------|------|---------|------|
| +66812345678 | test123 | A (750 分) | 30,000 THB |
| +66823456789 | test123 | B (650 分) | 15,000 THB |
| +66834567890 | test123 | C (550 分) | 8,000 THB |

### OTP 验证码
**始终使用:** `123456`

---

## 🎯 演示检查清单

### 演示前检查
- [ ] Android Studio 已安装
- [ ] 模拟器已创建
- [ ] APK 已打包
- [ ] 后端服务已启动
- [ ] 测试数据已准备

### 演示中检查
- [ ] App 启动正常
- [ ] 网络请求正常
- [ ] 数据展示正常
- [ ] 交互流畅

### 演示后清理
- [ ] 停止模拟器
- [ ] 停止后端服务
- [ ] 清理测试数据 (可选)

---

## 🚀 一键演示脚本

**创建脚本:** `scripts/android-demo.sh`

```bash
#!/bin/bash

echo "🚀 启动 Android 模拟器演示..."

# 1. 打包 APK
echo "📦 打包 Android APK..."
cd mobile-app
npm run build
npx cap sync android
cd android
./gradlew assembleDebug

# 2. 启动模拟器
echo "📱 启动模拟器..."
emulator -avd LannDemo -no-snapshot &
sleep 30

# 3. 安装 APK
echo "📲 安装 APK..."
adb wait-for-device
adb install -r app/build/outputs/apk/debug/app-debug.apk

# 4. 启动后端
echo "🔧 启动后端服务..."
cd ../../backend
npm run dev:local &

echo ""
echo "✅ 演示环境准备就绪!"
echo ""
echo "📱 模拟器：LannDemo"
echo "🔧 后端 API: http://localhost:3000"
echo "📝 测试账号：+66812345678 / test123"
echo ""
echo "按 Ctrl+C 停止所有服务"
wait
```

**使用:**
```bash
chmod +x scripts/android-demo.sh
./scripts/android-demo.sh
```

---

## 📹 演示录制建议

**推荐工具:**
- **scrcpy** (免费，高质量)
- **OBS Studio** (功能强大)
- **Android Studio 录屏** (内置)

**录制设置:**
- 分辨率：1920x1080
- 帧率：30fps
- 码率：8Mbps

**录制场景:**
1. App 启动 (30 秒)
2. 用户注册 (2 分钟)
3. 信用申请 (3 分钟)
4. 借款流程 (3 分钟)
5. 还款流程 (2 分钟)

**总时长:** 约 10-15 分钟

---

## ✅ 演示准备完成确认

**完成标志:**
- [ ] APK 打包成功
- [ ] 模拟器启动正常
- [ ] App 安装成功
- [ ] 后端服务可访问
- [ ] 测试账号可登录
- [ ] 核心流程可演示

---

**准备就绪，开始 Android 演示！** 🎉👿
