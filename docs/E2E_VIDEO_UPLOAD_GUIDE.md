# E2E 测试视频录制和飞书上传指南

**版本:** v1.0  
**创建日期:** 2026-03-17

---

## 📦 已配置功能

### 1. 测试执行脚本
**文件:** `scripts/run-e2e-and-upload.sh`

**功能:**
- ✅ 自动启动 Android 模拟器
- ✅ 执行 Maestro E2E 测试
- ✅ 生成测试报告
- ✅ 发送测试结果到飞书群

**使用方法:**
```bash
# 执行单个测试
./scripts/run-e2e-and-upload.sh test/e2e/flows/01-simple-register.yaml

# 执行所有测试
./scripts/run-e2e-and-upload.sh test/e2e/flows/
```

---

## 🎬 视频录制方案

### 方案 1: Android 模拟器内置录屏

**使用 adb 录屏:**
```bash
# 开始录制
adb shell screenrecord /sdcard/test_video.mp4

# 执行测试
maestro test test/e2e/flows/01-register.yaml

# 停止录制 (Ctrl+C)
# 下载视频
adb pull /sdcard/test_video.mp4 test/e2e/videos/
```

### 方案 2: Maestro 内置录屏

**Maestro 支持自动录屏:**
```bash
# 执行测试并生成调试输出
maestro test test/e2e/flows/01-register.yaml --flatten-debug-output

# 视频和截图保存在：
# ~/.maestro/tests/YYYY-MM-DD_HH-MM-SS/
```

### 方案 3: FFmpeg 录屏

**使用 FFmpeg 录制模拟器窗口:**
```bash
# 安装 FFmpeg
sudo dnf install ffmpeg

# 录制指定窗口
ffmpeg -f x11grab -i :0.0+100,100 -video_size 1080x1920 test_video.mp4
```

---

## ☁️ 飞书云盘上传

### 使用飞书 CLI

**上传文件:**
```bash
# 创建文件夹
feishu-cli file mkdir "Lann E2E Tests"

# 上传视频
feishu-cli file upload \
  --file test/e2e/videos/video.mp4 \
  --parent-folder <folder_token>
```

### 使用飞书 API

**Python 脚本:**
```python
import requests

# 上传视频
url = "https://open.feishu.cn/open-apis/drive/v1/files/upload"
headers = {"Authorization": "Bearer YOUR_TOKEN"}

with open('video.mp4', 'rb') as f:
    response = requests.post(url, headers=headers, files={'file': f})
    print(response.json())
```

---

## 📊 测试报告

**生成的报告包含:**
- 测试名称
- 执行时间
- 测试状态 (PASSED/FAILED)
- Maestro 输出日志
- 视频文件路径 (如果录制)
- 飞书云盘链接 (如果上传)

**报告位置:**
```
test/e2e/videos/
├── 01-simple-register_20260317_145000_report.md
└── ...
```

---

## 🚀 完整工作流

### 1. 执行测试

```bash
./scripts/run-e2e-and-upload.sh test/e2e/flows/
```

### 2. 查看报告

```bash
cat test/e2e/videos/*_report.md
```

### 3. 上传视频 (可选)

```bash
# 手动上传到飞书云盘
feishu-cli file upload \
  --file test/e2e/videos/video.mp4 \
  --parent-folder <folder_token>
```

### 4. 分享到飞书群

```bash
feishu-cli msg send \
  --receive-id-type chat_id \
  --receive-id "oc_xxx" \
  --text "🎬 E2E 测试完成

视频：https://app.feishu.cn/drive/file_xxx"
```

---

## 📝 环境变量配置

**飞书 CLI 配置:**
```bash
export FEISHU_APP_ID='cli_xxx'
export FEISHU_APP_SECRET='xxx'
```

**Android 环境变量:**
```bash
export ANDROID_HOME=/home/neo/android-sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
```

**Maestro 环境变量:**
```bash
export PATH=$PATH:$HOME/.maestro/bin
```

---

## 🎯 下一步

1. **修复测试文件语法** - 移除不支持的 Maestro 语法
2. **配置自动录屏** - 使用 adb screenrecord
3. **完善飞书上传** - 使用 file upload 命令
4. **集成到 CI/CD** - GitHub Actions 自动执行

---

**当前状态:** ✅ 基础功能已配置，视频录制和上传需手动执行
