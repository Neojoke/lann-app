# Java 21 安装指南 - Capacitor 8 要求

**官方文档:** https://capacitorjs.com/docs/updating/7-0

---

## 📋 Capacitor 8 官方要求

**根据 Ionic Capacitor 官方文档:**

> "Capacitor 7 requires Android Studio Ladybug | 2024.2.1 or newer and **Java JDK 21**. Java 21 ships with Android Studio Ladybug."

**环境要求:**
- ✅ Node.js: 22+
- ✅ Android Studio: 2025.2.1+ (Ladybug)
- ✅ **Java JDK: 21**
- ❌ Java 25: 不支持

---

## 🔧 解决方案

### 方案 1: 使用 Android Studio 内置 JDK (推荐)

**Android Studio 会自动安装 Java 21:**

```bash
# 找到 Android Studio 内置 JDK
export JAVA_HOME=/opt/android-studio/jbr
export PATH=$JAVA_HOME/bin:$PATH

# 验证版本
$JAVA_HOME/bin/java -version
# 应该显示：openjdk version "21"

# 构建 APK
cd mobile-app/android
$JAVA_HOME/bin/java -version
./gradlew assembleDebug
```

---

### 方案 2: 手动安装 Java 21 (无需 root)

**使用 SDKMAN:**

```bash
# 安装 SDKMAN
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"

# 安装 Java 21
sdk install java 21.0.5-ms

# 设置为默认
sdk use java 21.0.5-ms

# 验证
java -version

# 构建 APK
cd mobile-app/android
./gradlew assembleDebug
```

---

### 方案 3: 使用 Gradle 配置指定 JDK

**修改 `mobile-app/android/gradle.properties`:**

```properties
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
org.gradle.java.home=/opt/android-studio/jbr
```

**或者修改 `mobile-app/android/app/build.gradle`:**

```groovy
android {
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_21
        targetCompatibility JavaVersion.VERSION_21
    }
}
```

---

### 方案 4: 使用 Docker 构建 (最简单)

```bash
docker run --rm -v $(pwd):/app \
  gradle:8.14-jdk21 \
  gradle assembleDebug
```

---

## ⚠️ 当前环境

**已安装:**
- Java 25 (OpenJDK) ❌ 不兼容
- Gradle 8.14.3 ✅

**需要:**
- Java 21 ✅ 待安装

---

## 🚀 推荐执行步骤

**步骤 1: 检查 Android Studio 内置 JDK**

```bash
ls -la /opt/android-studio/jbr/bin/java 2>/dev/null || echo "未找到 Android Studio JDK"
```

**步骤 2: 如果找到，使用内置 JDK**

```bash
export JAVA_HOME=/opt/android-studio/jbr
cd mobile-app/android
$JAVA_HOME/bin/java -version
./gradlew assembleDebug
```

**步骤 3: 如果未找到，使用 SDKMAN 安装**

```bash
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"
sdk install java 21.0.5-ms
sdk use java 21.0.5-ms
cd mobile-app/android
./gradlew assembleDebug
```

---

## 📊 Gradle 与 Java 兼容性

| Gradle 版本 | 支持 Java 版本 |
|------------|---------------|
| 8.14 | 21, 22, 23 |
| 8.13 | 21, 22, 23 |
| 8.11 | 21, 22, 23 |
| 8.5 | 17, 20, 21 |
| 8.0 | 17, 19, 20 |

**注意:** Java 25 (major version 69) 需要 Gradle 9.0+ (尚未发布)

---

**参考文档:**
- https://capacitorjs.com/docs/updating/7-0
- https://docs.gradle.org/current/userguide/compatibility.html
