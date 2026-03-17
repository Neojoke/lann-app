# Android 构建修复 - Java 25 兼容

**问题:** Java 25 (major version 69) 不被 Gradle 8.13 支持

**错误信息:**
```
BUG! exception in phase 'semantic analysis' in source unit '_BuildScript_' 
Unsupported class file major version 69
```

---

## 🔧 解决方案

### 方案 1: 升级 Gradle (推荐)

**步骤:**
```bash
cd mobile-app/android

# 升级 Gradle 到 8.14+ (支持 Java 25)
./gradlew wrapper --gradle-version=8.14

# 重新构建
./gradlew assembleDebug
```

**Gradle 版本兼容性:**
- Gradle 8.14+ → Java 25 ✅
- Gradle 8.13 → Java 24 ❌
- Gradle 8.11+ → Java 23 ❌
- Gradle 8.5+ → Java 21 ❌
- Gradle 8.0+ → Java 17 ✅

---

### 方案 2: 使用 Docker 构建

**使用官方 Android 构建镜像:**
```bash
docker run --rm -v $(pwd):/app \
  gradle:8.14-jdk17 \
  gradle assembleDebug
```

---

### 方案 3: 安装 Java 17

**Fedora:**
```bash
sudo dnf install java-17-openjdk-devel
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
export PATH=$JAVA_HOME/bin:$PATH

# 重新构建
cd mobile-app/android
./gradlew assembleDebug
```

---

## 📊 当前环境

**已安装:**
- Java 25 (OpenJDK)
- Gradle 8.13 (不支持 Java 25)
- Android SDK 33

**需要:**
- Gradle 8.14+ 或 Java 17

---

## ✅ 推荐执行

```bash
cd /home/neo/.openclaw/workspace/projects/lann-thailand-loan-app/mobile-app/android

# 升级 Gradle
./gradlew wrapper --gradle-version=8.14

# 构建 APK
./gradlew assembleDebug
```

---

**预计修复时间:** 2-5 分钟
