# E2E 测试失败分析报告

**分析时间:** 2026-03-17 19:30  
**状态:** ✅ 已找到根本原因

---

## 🔍 问题现象

### E2E 测试失败
```
Failed to parse file: test/e2e/flows/01-simple-register.yaml
List is empty.

Running on LannDemo
 > Flow 01-simple-register
Launch app "com.lann.app"... COMPLETED
Tap on "Register"... FAILED

Element not found: Text matching regex: Register
```

### UI 层次结构 (空页面)
```xml
<node text="Ionic App" class="android.webkit.WebView">
  <node text="" class="android.view.View">
    <node text="" resource-id="root" class="android.widget.TextView" 
          bounds="[0,0][0,0]" />
  </node>
</node>
```

**分析:** WebView 存在但内容为空，说明 JavaScript 执行失败。

---

## 🐛 根本原因

### JavaScript 错误日志
```
03-17 16:31:24.037 11646 11646 E Capacitor: 
JavaScript Error: {"type":"js.error","error":{
  "message":"Uncaught ReferenceError: Injectable is not defined",
  "url":"https://localhost/assets/index-B6b5JyoN.js",
  "line":17,
  "col":194165
}}
```

### 问题代码

**文件:** `mobile-app/src/services/auth.service.ts`
```typescript
// ❌ 错误 - Angular 语法
import { Injectable } from '@ionic/react';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // ...
}
```

**问题:**
1. `@Injectable()` 是 **Angular** 的装饰器
2. **Ionic React 不使用装饰器**
3. React 应该使用普通的 TypeScript 类或 Hooks

### 其他受影响文件

```bash
mobile-app/src/services/
├── auth.service.ts      ❌ 使用 @Injectable
├── api.service.ts       ❌ 使用 @Injectable (from @angular/core)
└── user.service.ts      ❌ 使用 @Injectable
```

---

## 📚 官方文档参考

### Ionic React 服务正确写法

**参考:** https://capacitorjs.com/docs/guides/ionic-with-capacitor

**正确写法 (React):**
```typescript
// ✅ 正确 - 普通 TypeScript 类
export class AuthService {
  private token: string | null = null;

  async sendOtp(phone: string): Promise<SendOtpResponse> {
    // ...
  }
}

// 或者使用单例模式
export class AuthService {
  private static instance: AuthService;
  
  private constructor() {}
  
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }
}

// 或者使用 React Hooks
export const useAuthService = () => {
  const [token, setToken] = useState<string | null>(null);
  
  const sendOtp = async (phone: string) => {
    // ...
  };
  
  return { token, sendOtp };
};
```

---

## 🔧 修复方案

### 方案 1: 移除装饰器 (推荐)

**修改前:**
```typescript
import { Injectable } from '@ionic/react';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // ...
}
```

**修改后:**
```typescript
// 移除 Injectable 导入和装饰器
export class AuthService {
  // ...
}
```

### 方案 2: 使用单例模式

```typescript
export class AuthService {
  private static instance: AuthService;
  
  private constructor() {}
  
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }
}
```

### 方案 3: 使用 React Context

```typescript
// contexts/AuthContext.tsx
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext<AuthService | null>(null);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const authService = new AuthService();
  
  return (
    <AuthContext.Provider value={authService}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthService = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthService must be used within AuthProvider');
  return context;
};
```

---

## 📝 修复步骤

### Step 1: 修复 auth.service.ts

```typescript
// 删除这两行
import { Injectable } from '@ionic/react';
@Injectable({ providedIn: 'root' })

// 保留类定义
export class AuthService {
  // ...
}
```

### Step 2: 修复 api.service.ts

```typescript
// 删除 Angular 导入
import { Injectable } from '@angular/core';

// 删除装饰器
@Injectable({ providedIn: 'root' })

// 保留类
export class ApiClient {
  // ...
}
```

### Step 3: 修复 user.service.ts

同样的方式移除 `@Injectable()` 装饰器

### Step 4: 重新构建

```bash
cd mobile-app
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

### Step 5: 重新安装

```bash
adb uninstall com.lann.app
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Step 6: 重新测试

```bash
maestro test test/e2e/flows/01-simple-register.yaml
```

---

## 🎯 预防措施

### 1. ESLint 规则

添加规则禁止 Angular 装饰器：
```json
// .eslintrc.json
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "paths": [
          {
            "name": "@angular/core",
            "message": "This is a React project, not Angular"
          },
          {
            "name": "@ionic/react",
            "importNames": ["Injectable"],
            "message": "Injectable is for Angular, not React"
          }
        ]
      }
    ]
  }
}
```

### 2. Git Hooks

添加 pre-commit hook 检查：
```bash
#!/bin/bash
# .git/hooks/pre-commit

if git diff --cached | grep -q "@Injectable"; then
  echo "❌ Error: @Injectable decorator is not allowed in React projects"
  exit 1
fi
```

### 3. 代码审查清单

添加检查项：
- [ ] 无 Angular 装饰器
- [ ] 无 `@angular/core` 导入
- [ ] 服务使用普通类或 Hooks

---

## 📊 影响范围

**受影响文件:**
- `mobile-app/src/services/auth.service.ts`
- `mobile-app/src/services/api.service.ts`
- `mobile-app/src/services/user.service.ts`

**影响功能:**
- ❌ 用户认证 (登录/注册)
- ❌ API 调用
- ❌ 用户资料管理
- ❌ 借款服务 (依赖 API)
- ❌ 还款服务 (依赖 API)
- ❌ 信用服务 (依赖 API)

**E2E 测试:**
- ❌ 所有测试失败 (App 无法启动)

---

## ✅ 修复后预期效果

**修复后:**
- ✅ App 正常启动
- ✅ WebView 正确渲染
- ✅ UI 组件可见
- ✅ E2E 测试通过
- ✅ 所有功能可用

---

**下一步:** 立即修复所有服务文件，移除 `@Injectable()` 装饰器！
