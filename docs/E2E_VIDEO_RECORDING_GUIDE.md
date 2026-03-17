# E2E 视频录制和上传指南

**版本:** v2.0  
**创建日期:** 2026-03-17  
**状态:** ✅ 已验证

---

## 📦 官方文档参考

**Maestro 官方文档:**
- https://docs.maestro.dev/maestro-flows/workspace-management/record-your-flow

**关键命令:**
```bash
# 本地录制 (推荐)
maestro record --local YourFlow.yaml

# 视频保存位置
# Linux/macOS: ~/.maestro/tests/
# Windows: %userprofile%\.maestro\tests\
```

---

## 🎬 录制方法

### 方法 1: Maestro 内置录制

```bash
export PATH=$PATH:$HOME/.maestro/bin
maestro record --local test/e2e/flows/01-simple-register.yaml
```

**注意:** 最长录制 2 分钟

---

### 方法 2: adb screenrecord (推荐)

```bash
# 开始录制
adb shell screenrecord --time-limit 120 /sdcard/lann_e2e_test.mp4

# 执行测试
maestro test test/e2e/flows/01-simple-register.yaml

# 停止录制 (自动在 120 秒后停止)
# 下载视频
adb pull /sdcard/lann_e2e_test.mp4 test/e2e/videos/
```

---

### 方法 3: Maestro takeScreenshot

**在测试文件中添加截图:**
```yaml
appId: com.lann.app
---
- launchApp
- takeScreenshot: "01_home.png"
- tapOn: "Register"
- takeScreenshot: "02_register.png"
```

**截图位置:** `~/.maestro/tests/YYYY-MM-DD_HH-MM-SS/`

---

## ☁️ 飞书云盘上传

### 使用飞书 CLI

**上传视频:**
```bash
# 上传到根目录
feishu-cli file upload \
  --file test/e2e/videos/video.mp4 \
  --parent-folder root

# 上传到指定文件夹
feishu-cli file upload \
  --file test/e2e/videos/video.mp4 \
  --parent-folder <folder_token>
```

**创建文件夹:**
```bash
feishu-cli file mkdir "Lann E2E Tests"
```

**列出文件:**
```bash
feishu-cli file list
```

---

### 发送到飞书群

**发送文本消息:**
```bash
feishu-cli msg send \
  --receive-id-type chat_id \
  --receive-id "oc_xxx" \
  --text "🎬 E2E 测试完成

视频已上传到飞书云盘"
```

**发送文件消息:**
```bash
feishu-cli msg send \
  --receive-id-type chat_id \
  --receive-id "oc_xxx" \
  --file test/e2e/videos/video.mp4
```

---

## 🚀 完整工作流

### 1. 执行测试并录制

```bash
# 开始录制
adb shell screenrecord --time-limit 120 /sdcard/lann_e2e_test.mp4 &

# 执行测试
maestro test test/e2e/flows/

# 下载视频
adb pull /sdcard/lann_e2e_test.mp4 test/e2e/videos/lann_$(date +%Y%m%d_%H%M%S).mp4
```

### 2. 上传到飞书云盘

```bash
# 上传视频
feishu-cli file upload \
  --file test/e2e/videos/lann_*.mp4 \
  --parent-folder root
```

### 3. 发送通知

```bash
# 发送到飞书群
feishu-cli msg send \
  --receive-id-type chat_id \
  --receive-id "oc_89f64fce7bd05bd178a259ae0e9a7162" \
  --text "🎬 E2E 测试完成

视频已上传到飞书云盘"
```

---

## 📊 视频保存位置

**Maestro 录制:**
```
~/.maestro/tests/
└── 2026-03-17_162949/
    ├── screenshot.png
    └── hierarchy.yaml
```

**adb 录制:**
```
test/e2e/videos/
└── lann_20260317_163057.mp4
```

---

## ✅ 已验证功能

- ✅ Maestro test 执行测试
- ✅ adb screenrecord 录制视频
- ✅ 视频下载到本地
- ✅ 飞书 CLI 文件上传
- ✅ 飞书群消息发送

---

## 📝 环境变量

**Android:**
```bash
export ANDROID_HOME=/home/neo/android-sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**Maestro:**
```bash
export PATH=$PATH:$HOME/.maestro/bin
```

**飞书 CLI:**
```bash
export FEISHU_APP_ID='cli_xxx'
export FEISHU_APP_SECRET='xxx'
```

---

**当前状态:** ✅ 视频录制和飞书上传功能已验证
