# 🎨 Lann UI/UX 设计规范 v1.0

**创建日期:** 2026-03-15  
**设计风格:** 简约、高效、自然  
**语言支持:** 泰语 (th) + 英语 (en)

---

## 🌈 颜色系统

### 主色调
```scss
// 金色 - 财富与信任
$primary: #D4AF37;
$primary-light: #F4CF57;
$primary-dark: #B48F17;

// 深蓝色 - 专业与安全
$secondary: #1E3A8A;
$secondary-light: #3B5998;
$secondary-dark: #0F2463;
```

### 功能色
```scss
// 成功 - 绿色
$success: #10B981;
$success-light: #34D399;

// 警告 - 橙色
$warning: #F59E0B;

// 错误 - 红色
$error: #EF4444;
$error-light: #F87171;

// 信息 - 蓝色
$info: #3B82F6;
```

### 中性色
```scss
$gray-50: #F9FAFB;
$gray-100: #F3F4F6;
$gray-200: #E5E7EB;
$gray-300: #D1D5DB;
$gray-400: #9CA3AF;
$gray-500: #6B7280;
$gray-600: #4B5563;
$gray-700: #374151;
$gray-800: #1F2937;
$gray-900: #111827;
```

---

## 📐 间距系统

基于 4px 网格系统：

```scss
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;
$spacing-2xl: 48px;
$spacing-3xl: 64px;
```

---

## 🔤 字体系统

### 泰文字体
```scss
// 主字体 - Google Fonts
@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');

$font-family-th: 'Prompt', sans-serif;
```

### 英文字体
```scss
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

$font-family-en: 'Inter', sans-serif;
```

### 字号 scale
```scss
$text-xs: 12px;    // 辅助文字
$text-sm: 14px;    // 次要文字
$text-base: 16px;  // 正文字
$text-lg: 18px;    // 小标题
$text-xl: 20px;    // 卡片标题
$text-2xl: 24px;   // 页面标题
$text-3xl: 30px;   // 大标题
```

**注意:** 泰语字符比英文高约 20%，行高需要相应调整。

---

## 📱 核心页面设计

### 1. 启动页 (Splash Screen)
```
┌─────────────────────────┐
│                         │
│         🦞              │
│                         │
│       L a n n           │
│                         │
│   ง่าย รวดเร็ว ปลอดภัย  │
│  Easy • Fast • Secure   │
│                         │
└─────────────────────────┘
```

### 2. 登录/注册页
- 手机号输入（+66 泰国区号默认）
- OTP 验证码输入（6 位数字）
- 语言切换按钮（TH/EN）

### 3. 首页 (Dashboard)
```
┌─────────────────────────┐
│  สวัสดี, คุณผู้ใช้      │
│  Hello, User            │
├─────────────────────────┤
│  💰 可用额度             │
│     ฿ 20,000            │
├─────────────────────────┤
│  [ 立即申请借款 ]        │
├─────────────────────────┤
│  📊 借款记录             │
│  ⚙️ 设置                 │
│  💬 客服                 │
└─────────────────────────┘
```

### 4. 借款申请页
- 金额滑块 (1,000 - 50,000 泰铢)
- 期限选择 (7/14/21/30 天)
- 实时计算利息和还款金额
- 确认按钮

### 5. 还款页
- 应还金额
- 还款日期倒计时
- 还款方式选择
  - 银行转账
  - 便利店 (7-11)
  - PromptPay
  - TrueMoney

---

## 🎯 交互设计原则

### 1. 三步完成原则
任何核心功能必须在 3 步内完成：
- 借款申请：选择金额 → 选择期限 → 确认
- 还款：选择方式 → 确认 → 完成

### 2. 即时反馈
- 所有操作有加载状态
- 成功/失败有明确提示
- 金额计算实时显示

### 3. 无障碍设计
- 最小点击区域 44x44px
- 颜色对比度 ≥ 4.5:1 (WCAG AA)
- 支持系统字体大小

---

## 📱 组件规范

### 按钮
```scss
.btn-primary {
  background: $primary;
  color: white;
  height: 48px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
}

.btn-secondary {
  background: transparent;
  border: 2px solid $primary;
  color: $primary;
}
```

### 输入框
```scss
.input {
  height: 48px;
  border: 1px solid $gray-300;
  border-radius: 8px;
  padding: 0 16px;
  font-size: 16px;
  
  &:focus {
    border-color: $primary;
    box-shadow: 0 0 0 3px rgba($primary, 0.1);
  }
}
```

### 卡片
```scss
.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
```

---

## 🌐 多语言配置

### i18n 结构
```json
{
  "th": {
    "welcome": "สวัสดี",
    "borrow": "ยืมเงิน",
    "repay": "ชำระคืน",
    "amount": "จำนวนเงิน",
    "days": "วัน"
  },
  "en": {
    "welcome": "Hello",
    "borrow": "Borrow",
    "repay": "Repay",
    "amount": "Amount",
    "days": "Days"
  }
}
```

### 语言切换
- 首次启动自动检测系统语言
- 设置中可随时切换
- 切换后即时生效

---

## 📊 设计资源

### Figma 文件
- [Lann Design System](待创建)
- [Lann Components](待创建)
- [Lann Prototypes](待创建)

### 图标
- 使用 Ionicons (Ionic 内置)
- 自定义图标待设计

---

**版本:** 1.0  
**状态:** MVP 设计基线  
**下次更新:** UI 评审后
