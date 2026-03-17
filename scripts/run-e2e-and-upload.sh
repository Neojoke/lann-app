#!/bin/bash
# Lann 项目 - 执行 E2E 测试并发送到飞书
# 使用方法：./scripts/run-e2e-and-upload.sh [测试文件]

set -e

# 配置
FEISHU_CLI="/home/neo/.local/bin/feishu-cli"
TEST_FILE="${1:-test/e2e/flows/}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
VIDEO_DIR="test/e2e/videos"

echo "==================================="
echo "🎬 Lann E2E 测试执行"
echo "==================================="
echo ""
echo "测试文件：$TEST_FILE"
echo "时间戳：$TIMESTAMP"
echo ""

# 创建视频目录
mkdir -p "$VIDEO_DIR"

# 环境变量
export ANDROID_HOME=/home/neo/android-sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$HOME/.maestro/bin

# 检查模拟器
if ! adb devices | grep -q "emulator-"; then
    echo "📱 启动 Android 模拟器..."
    emulator -avd LannDemo -no-snapshot -no-audio -no-window &
    echo "等待模拟器启动..."
    sleep 15
fi

# 执行测试
echo "🎥 执行 Maestro 测试..."
echo ""

# 遍历所有测试文件
if [ -d "$TEST_FILE" ]; then
    # 执行目录中的所有测试
    for yaml_file in "$TEST_FILE"/*.yaml; do
        if [ -f "$yaml_file" ]; then
            TEST_NAME=$(basename "$yaml_file" .yaml)
            REPORT_FILE="$VIDEO_DIR/${TEST_NAME}_${TIMESTAMP}_report.md"
            
            echo "-----------------------------------"
            echo "执行测试：$TEST_NAME"
            echo "-----------------------------------"
            
            # 执行测试
            if maestro test "$yaml_file" --flatten-debug-output 2>&1 | tee "$REPORT_FILE"; then
                TEST_STATUS="✅ PASSED"
            else
                TEST_STATUS="❌ FAILED"
            fi
            
            # 发送通知到飞书
            echo ""
            echo "☁️ 发送通知到飞书..."
            
            $FEISHU_CLI msg send \
                --receive-id-type chat_id \
                --receive-id "oc_89f64fce7bd05bd178a259ae0e9a7162" \
                --text "🎬 E2E 测试完成

测试：$TEST_NAME
状态：$TEST_STATUS
时间：$TIMESTAMP

查看报告：test/e2e/videos/${TEST_NAME}_${TIMESTAMP}_report.md" 2>&1 || echo "消息发送失败"
            
            echo ""
        fi
    done
else
    # 执行单个测试文件
    TEST_NAME=$(basename "$TEST_FILE" .yaml)
    REPORT_FILE="$VIDEO_DIR/${TEST_NAME}_${TIMESTAMP}_report.md"
    
    echo "-----------------------------------"
    echo "执行测试：$TEST_NAME"
    echo "-----------------------------------"
    
    # 执行测试
    if maestro test "$TEST_FILE" --flatten-debug-output 2>&1 | tee "$REPORT_FILE"; then
        TEST_STATUS="✅ PASSED"
    else
        TEST_STATUS="❌ FAILED"
    fi
    
    # 发送通知到飞书
    echo ""
    echo "☁️ 发送通知到飞书..."
    $FEISHU_CLI msg send \
        --receive-id-type chat_id \
        --receive-id "oc_89f64fce7bd05bd178a259ae0e9a7162" \
        --text "🎬 E2E 测试完成

测试：$TEST_NAME
状态：$TEST_STATUS
时间：$TIMESTAMP

查看报告：test/e2e/videos/${TEST_NAME}_${TIMESTAMP}_report.md" 2>&1 || echo "消息发送失败"
fi

echo ""
echo "==================================="
echo "✅ E2E 测试执行完成！"
echo "==================================="
echo ""
echo "视频目录：$VIDEO_DIR"
echo ""

exit 0
