# Android App 打包发布指南

**版本:** v1.0  
**创建日期:** 2026-03-16  
**状态:** 🟡 待执行

---

## 📋 目标

将 Ionic React App 打包为 Android APK，准备上架 Google Play Store

---

## 🔧 技术栈

| 组件 | 版本 |
|------|------|
| Ionic Framework | 8.x |
| React | 19.x |
| Capacitor | 6.x |
| Android SDK | 33 (Android 13) |
| 最低 SDK | 26 (Android 8) |

---

## 📦 打包流程

### Step 1: 安装 Capacitor

```bash
cd mobile-app

# 安装 Capacitor 核心
npm install @capacitor/core @capacitor/cli

# 安装 Android 平台
npm install @capacitor/android

# 安装常用原生插件
npm install @capacitor/camera @capacitor/filesystem @capacitor/storage
npm install @capacitor/splash-screen @capacitor/status-bar
```

### Step 2: 初始化 Capacitor 配置

创建 `capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lann.app',
  appName: 'Lann - Loan App',
  webDir: 'dist',
  server: {
    // 生产环境使用打包后的文件
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1E3A8A',
      showSpinner: true,
      spinnerColor: '#D4AF37'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1E3A8A'
    }
  }
};

export default config;
```

### Step 3: 构建 Web 应用

```bash
# 生产环境构建
npm run build

# 验证构建输出
ls -la dist/
```

### Step 4: 添加 Android 平台

```bash
# 添加 Android 平台
npx cap add android

# 同步代码到 Android 项目
npx cap sync
```

### Step 5: Android Studio 配置

打开 Android Studio:

```bash
# 使用 Android Studio 打开项目
npx cap open android
```

**配置 `android/app/build.gradle`:**

```gradle
android {
    namespace "com.lann.app"
    compileSdk 33
    
    defaultConfig {
        applicationId "com.lann.app"
        minSdk 26
        targetSdk 33
        versionCode 1
        versionName "1.0.0"
        
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        
        // 多语言支持
        resConfigs "th", "en"
    }
    
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}
```

### Step 6: 配置应用图标和启动图

**图标要求:**
- 自适应图标 (API 26+)
- 尺寸：108x108 dp
- 格式：PNG

**启动图要求:**
- 尺寸：2732x2732 px
- 格式：PNG
- 背景色：#1E3A8A (深蓝色)

使用 Capacitor Assets Generator:

```bash
npm install -g @capacitor/assets
npx @capacitor/assets generate --iconSrc ./resources/icon.png --splashSrc ./resources/splash.png
```

### Step 7: 生成签名密钥

```bash
cd android

# 生成正式签名密钥
keytool -genkey -v -keystore lann-release-key.keystore \
  -alias lann \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# 按提示输入：
# - 密钥库密码
# - 姓名（泰国）
# - 组织单位（Lann Team）
# - 组织名称（Lann）
# - 城市（曼谷）
# - 省份（曼谷）
# - 国家代码（TH）
```

**配置 `android/gradle.properties`:**

```properties
# 签名配置
RELEASE_STORE_FILE=lann-release-key.keystore
RELEASE_STORE_PASSWORD=你的密钥库密码
RELEASE_KEY_ALIAS=lann
RELEASE_KEY_PASSWORD=你的密钥密码
```

### Step 8: 配置权限

编辑 `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- 网络权限 -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- 相机权限（用于身份证/人脸识别） -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    
    <!-- 存储权限（用于上传文件） -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" 
                     android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" 
                     android:maxSdkVersion="32" />
    
    <!-- Android 13+ 媒体权限 -->
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    
    <!-- 通知权限 -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="false">
        
        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme"
            android:exported="true"
            android:launchMode="singleTask">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### Step 9: 构建 APK

```bash
cd android

# Debug 版本（测试用）
./gradlew assembleDebug

# Release 版本（正式发布）
./gradlew assembleRelease

# 构建 AAB（Google Play 要求）
./gradlew bundleRelease
```

**输出位置:**
- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release APK: `android/app/build/outputs/apk/release/app-release.apk`
- Release AAB: `android/app/build/outputs/bundle/release/app-release.aab`

### Step 10: 验证 APK

```bash
# 安装到测试设备
adb install -r android/app/build/outputs/apk/release/app-release.apk

# 查看应用信息
adb shell dumpsys package com.lann.app

# 测试启动
adb shell am start -n com.lann.app/.MainActivity
```

---

## 📱 Google Play 上架准备

### 1. 创建 Google Play Console 账号

- 注册开发者账号（一次性费用 $25）
- 完成身份验证
- 设置支付资料

### 2. 准备上架素材

| 素材 | 要求 | 数量 |
|------|------|------|
| 应用图标 | 512x512 PNG | 1 |
| 功能图 | 1024x500 PNG | 1 |
| 手机截图 | 16:9 或 9:16, 最小 320dp | 至少 2 张 |
| 平板截图 | 可选 | - |
| 宣传视频 | YouTube 链接 | 可选 |

### 3. 应用信息

- **应用名称:** Lann - Loan App (最多 30 字符)
- **简短描述:** 快速便捷的泰国借款平台 (最多 80 字符)
- **完整描述:** 详细介绍功能、优势、合规性 (最多 4000 字符)

### 4. 内容分级

- 填写内容分级问卷
- 获得分级证书（通常为 PEGI 3 / E for Everyone）

### 5. 隐私政策

必须提供隐私政策 URL，包含：
- 收集的数据类型
- 数据使用方式
- 数据存储位置
- 用户权利（访问、删除、更正）

### 6. 金融应用特殊要求

- 提供金融牌照信息（或合作方牌照）
- 披露利率和费用
- 说明风险评估流程
- 提供客服联系方式

---

## 🚀 发布流程

### 内部测试

```bash
# 上传 AAB 到 Google Play 内部测试轨道
# 最多 100 名测试用户
# 无需审核，立即发布
```

### 封闭测试

```bash
# 上传 AAB 到封闭测试轨道
# 指定测试用户列表
# 审核时间：1-3 天
```

### 公开测试

```bash
# 上传 AAB 到公开测试轨道
# 所有用户可见
# 审核时间：3-7 天
```

### 正式发布

```bash
# 从测试轨道推广到正式轨道
# 审核时间：7-14 天（金融应用可能更长）
```

---

## ⚠️ 常见问题

### 1. 构建失败

```bash
# 清理构建缓存
cd android
./gradlew clean

# 重新同步
npx cap sync android

# 重新构建
./gradlew assembleRelease
```

### 2. 签名错误

检查 `gradle.properties` 中的签名配置：
- 密钥库路径正确
- 密码正确
- 别名正确

### 3. 权限问题

确保 `AndroidManifest.xml` 中声明了所有需要的权限，并在运行时请求危险权限。

### 4. 应用崩溃

```bash
# 查看日志
adb logcat | grep -i "lann"

# 或使用 Android Studio Logcat
```

---

## 📊 构建配置总结

| 配置项 | 值 |
|--------|-----|
| **应用 ID** | com.lann.app |
| **应用名称** | Lann - Loan App |
| **版本号** | 1.0.0 |
| **版本代码** | 1 |
| **最低 SDK** | 26 (Android 8) |
| **目标 SDK** | 33 (Android 13) |
| **签名密钥** | lann-release-key.keystore |
| **构建类型** | Release (minifyEnabled) |
| **输出格式** | AAB (Google Play) + APK (直接分发) |

---

## ✅ 验收清单

- [ ] Capacitor 配置完成
- [ ] Android 平台添加成功
- [ ] 应用图标和启动图生成
- [ ] 签名密钥生成
- [ ] 权限配置完成
- [ ] Debug APK 可安装运行
- [ ] Release APK 签名验证通过
- [ ] AAB 构建成功
- [ ] Google Play Console 账号创建
- [ ] 上架素材准备完成
- [ ] 隐私政策发布

---

**文档状态:** 待执行  
**负责人:** 小满 (Orchestrator)  
**执行 Agent:** oh-my-opencode (devops)
