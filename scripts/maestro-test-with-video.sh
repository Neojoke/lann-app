#!/bin/bash
# Lann 项目 - Maestro E2E 测试带录屏和飞书上传
# 使用方法：./scripts/maestro-test-with-video.sh test/e2e/flows/01-register.yaml

set -e

# 配置
TEST_FILE="${1:-test/e2e/flows/}"
VIDEO_DIR="test/e2e/videos"
UPLOAD_DIR="/feishu-drive/lann-e2e-tests"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TEST_NAME=$(basename "$TEST_FILE" .yaml)
VIDEO_FILE="$VIDEO_DIR/${TEST_NAME}_${TIMESTAMP}.mp4"
REPORT_FILE="$VIDEO_DIR/${TEST_NAME}_${TIMESTAMP}_report.md"

# 创建视频目录
mkdir -p "$VIDEO_DIR"

echo "🎬 开始执行 E2E 测试并录屏..."
echo "测试文件：$TEST_FILE"
echo "视频输出：$VIDEO_FILE"
echo ""

# 启动模拟器 (如果未启动)
export ANDROID_HOME=/home/neo/android-sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools

if ! adb devices | grep -q "emulator-"; then
    echo "📱 启动 Android 模拟器..."
    emulator -avd LannDemo -no-snapshot -no-audio -no-window &
    sleep 15
fi

# 使用 Maestro 录屏功能执行测试
export PATH=$PATH:$HOME/.maestro/bin

echo "🎥 执行测试并录制视频..."
maestro test "$TEST_FILE" \
    --flatten-debug-output \
    --output-dir "$VIDEO_DIR" \
    --record-video \
    2>&1 | tee "$REPORT_FILE"

# 检查测试结果
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 测试通过！"
    TEST_STATUS="PASSED"
else
    echo ""
    echo "❌ 测试失败！"
    TEST_STATUS="FAILED"
fi

# 查找生成的视频文件
VIDEO_OUTPUT=$(find "$VIDEO_DIR" -name "${TEST_NAME}_*.mp4" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)

if [ -n "$VIDEO_OUTPUT" ] && [ -f "$VIDEO_OUTPUT" ]; then
    echo ""
    echo "📹 视频文件：$VIDEO_OUTPUT"
    
    # 上传到飞书云盘
    echo "☁️ 上传到飞书云盘..."
    
    # 使用飞书 CLI 上传
    if command -v feishu &> /dev/null; then
        echo "📤 使用飞书 CLI 上传视频..."
        
        # 创建测试文件夹 (如果不存在)
        feishu drive mkdir -p "/Lann E2E Tests/$TIMESTAMP" 2>/dev/null || true
        
        # 上传视频文件
        UPLOAD_RESULT=$(feishu drive upload \
            --file "$VIDEO_OUTPUT" \
            --parent "/Lann E2E Tests/$TIMESTAMP" \
            --description "E2E Test: $TEST_NAME | Status: $TEST_STATUS | Date: $TIMESTAMP" 2>&1)
        
        echo "上传结果：$UPLOAD_RESULT"
        
        # 提取文件链接
        FILE_LINK=$(echo "$UPLOAD_RESULT" | grep -o 'https://[^"]*' | head -1)
        
        # 更新报告
        echo "" >> "$REPORT_FILE"
        echo "---" >> "$REPORT_FILE"
        echo "## 视频链接" >> "$REPORT_FILE"
        echo "[$VIDEO_OUTPUT]($FILE_LINK)" >> "$REPORT_FILE"
        echo "测试状态：$TEST_STATUS" >> "$REPORT_FILE"
        echo "执行时间：$TIMESTAMP" >> "$REPORT_FILE"
        
        echo ""
        echo "📤 上传成功！"
        echo "视频链接：$FILE_LINK"
        
        # 发送到飞书群
        echo ""
        echo "💬 发送到飞书群..."
        feishu send \
            --target "chat:oc_89f64fce7bd05bd178a259ae0e9a7162" \
            --message "🎬 E2E 测试完成

测试名称：$TEST_NAME
测试状态：$TEST_STATUS
执行时间：$TIMESTAMP

📹 视频：$FILE_LINK" 2>&1 || echo "消息发送失败"
    else
        echo "⚠️  飞书 CLI 未安装，使用备用方案..."
        
        # 备用方案：使用 feishu_im_bot_image 或手动上传
        echo "请手动上传视频文件到飞书云盘："
        echo "文件路径：$VIDEO_OUTPUT"
        echo ""
        
        # 生成上传说明
        cat > "$VIDEO_DIR/UPLOAD_INSTRUCTIONS_${TIMESTAMP}.md" << EOF
# 视频上传说明

**测试文件:** $TEST_FILE
**视频文件:** $VIDEO_OUTPUT
**测试状态:** $TEST_STATUS
**执行时间:** $TIMESTAMP

## 手动上传步骤

1. 打开飞书云盘
2. 导航到 "Lann E2E Tests" 文件夹
3. 上传视频文件：$VIDEO_OUTPUT
4. 添加描述：E2E Test: $TEST_NAME | Status: $TEST_STATUS

## 或使用飞书 API

\`\`\`bash
curl -X POST "https://open.feishu.cn/open-apis/drive/v1/files" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -F "file=@$VIDEO_OUTPUT" \\
  -F "parent_type=folder" \\
  -F "parent_node=$UPLOAD_DIR"
\`\`\`
EOF
        
        echo "上传说明已生成：$VIDEO_DIR/UPLOAD_INSTRUCTIONS_${TIMESTAMP}.md"
    fi
else
    echo ""
    echo "⚠️  未找到视频文件，可能录制失败"
fi

# 生成测试报告
echo ""
echo "📊 生成测试报告..."

cat > "$REPORT_FILE" << EOF
# E2E 测试报告

## 测试信息
- **测试文件:** $TEST_FILE
- **测试名称:** $TEST_NAME
- **执行时间:** $TIMESTAMP
- **测试状态:** $TEST_STATUS

## 视频记录
- **视频文件:** ${VIDEO_OUTPUT:-"未生成"}
- **视频目录:** $VIDEO_DIR

## 执行详情
EOF

# 添加 Maestro 输出到报告
if [ -f "$REPORT_FILE.tmp" ]; then
    echo '```' >> "$REPORT_FILE"
    cat "$REPORT_FILE.tmp" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    rm -f "$REPORT_FILE.tmp"
fi

echo ""
echo "==================================="
echo "✅ E2E 测试执行完成！"
echo "==================================="
echo "测试状态：$TEST_STATUS"
echo "视频文件：${VIDEO_OUTPUT:-"未生成"}"
echo "测试报告：$REPORT_FILE"
echo ""

# 如果测试失败，退出时返回错误码
if [ "$TEST_STATUS" = "FAILED" ]; then
    exit 1
fi

exit 0
