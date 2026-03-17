#!/bin/bash
# Lann 项目 - Android 环境和测试工具安装脚本
# 使用方式：./scripts/install-android-env.sh

set -e

echo "🚀 开始安装 Android 环境和测试工具..."

# 设置环境变量
export ANDROID_HOME=$HOME/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator

# 1. 下载 Android 命令行工具
echo "📦 下载 Android 命令行工具..."
cd $HOME
mkdir -p android-sdk
cd android-sdk

if [ ! -f cmdline-tools.zip ]; then
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdline-tools.zip
fi

if [ ! -d cmdline-tools/latest ]; then
    unzip -q cmdline-tools.zip
    mkdir -p cmdline-tools/latest
    mv cmdline-tools/bin cmdline-tools/lib cmdline-tools/NOTICE.txt cmdline-tools/source.properties cmdline-tools/latest/ 2>/dev/null || true
fi

# 2. 接受许可证
echo "📝 接受 Android 许可证..."
yes | sdkmanager --licenses > /dev/null 2>&1 || echo "许可证已接受"

# 3. 安装必要组件
echo "📱 安装 Android SDK 组件..."
sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.1"
sdkmanager "system-images;android-33;google_apis;x86_64"

# 4. 创建模拟器
echo "📲 创建 Android 模拟器..."
avdmanager create avd -n LannDemo -k "system-images;android-33;google_apis;x86_64" -d pixel_6 || echo "模拟器已创建"

# 5. 安装 Maestro
echo "🔧 安装 Maestro E2E 测试工具..."
if ! command -v maestro &> /dev/null; then
    curl -fsSL "https://get.maestro.mobile.dev" | bash
fi

# 6. 安装 Node.js 测试工具
echo "📦 安装 Node.js 测试工具..."
cd /home/neo/.openclaw/workspace/projects/lann-thailand-loan-app

# 后端测试依赖
cd backend
npm install -D vitest @vitest/ui c8

# 前端测试依赖
cd ../mobile-app
npm install -D vitest @vitest/ui c8 @testing-library/react @testing-library/jest-dom

# 7. 验证安装
echo "✅ 验证安装..."
echo ""
echo "Android SDK 版本:"
sdkmanager --version
echo ""
echo "ADB 版本:"
adb --version
echo ""
echo "Maestro 版本:"
maestro --version 2>/dev/null || echo "Maestro 需要重启终端"
echo ""

# 8. 添加到环境变量
echo "📝 添加到环境变量..."
cat >> ~/.bashrc << EOF

# Android SDK
export ANDROID_HOME=\$HOME/android-sdk
export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools:\$ANDROID_HOME/emulator

# Maestro
export PATH=\$PATH:\$HOME/.maestro/bin
EOF

source ~/.bashrc

echo ""
echo "🎉 安装完成！"
echo ""
echo "下一步:"
echo "1. 重启终端或运行：source ~/.bashrc"
echo "2. 启动模拟器：emulator -avd LannDemo"
echo "3. 打包 APK: cd mobile-app && npm run build && npx cap sync android && cd android && ./gradlew assembleDebug"
echo "4. 安装到模拟器：adb install -r android/app/build/outputs/apk/debug/app-debug.apk"
echo "5. 运行 E2E 测试：maestro test test/e2e/flows/"
echo ""
