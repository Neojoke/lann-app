# Sook Lending Platform - 设计规范 v2026.Q1

**项目名称:** Sook_Lending_Platform  
**版本:** 2026.Q1.Industrial  
**设计风格:** Bento-Style Architecture  
**创建日期:** 2026-03-18

---

## 🎨 设计理念

**核心理念:** Bento-Style Architecture
- 模块化卡片布局
- 清晰的视觉层次
- 流畅的交互体验

**品牌调性:**
- Trustworthy - 可信赖
- Fluid - 流畅自然
- Modern - 现代感

**无障碍标准:** WCAG 2.1 AA Compliant

---

## 📐 1. 全局层级规范 (Z-Index Stack)

| 层级 | 名称 | Z-Index | 用途 |
|------|------|---------|------|
| Level 0 | Background | -1 | 背景层 |
| Level 1 | Base | 0 | 页面内容 |
| Level 2 | Card | 10 | Bento 卡片 |
| Level 3 | Sticky | 100 | 顶部导航/吸底按钮 |
| Level 4 | Overlay | 500 | 遮罩层 (Background Blur) |
| Level 5 | Drawer | 600 | 底部抽屉 (Action Sheets) |
| Level 6 | Modal | 700 | 关键流程模态框 (KYC/借款协议) |
| Level 7 | Feedback | 1000 | Toasts, Loading Indicators |

---

## 🎯 2. 增强型原子系统 (Foundations)

### 2.1 间距系统

**基础单位:** 4px

```
全局水平间距：20px
纵向组件间距：16px
```

**间距等级:**
```
xs: 4px    - 紧凑元素间距
sm: 8px    - 相关元素间距
md: 16px   - 组件间距
lg: 24px   - 区块间距
xl: 32px   - 页面间距
2xl: 48px  - 大区块间距
```

---

### 2.2 圆角系统

| 等级 | 值 | 用途 |
|------|-----|------|
| sm | 12px | Tag, Small Button |
| md | 16px | Input Field, Secondary Button |
| lg | 24px | Standard Bento Card |
| xl | 32px | Main Container, Bottom Sheet Top |
| full | 100px | Avatar, Pill Button |

---

### 2.3 字体系统

**字体系列:**
- 主字体：Inter, Noto Sans Thai
- 备用字体：system-ui, -apple-system, sans-serif

**字体等级:**

| 等级 | 大小 | 字重 | 行高 | 用途 |
|------|------|------|------|------|
| Display | 32px | 700 | 1.2 | 大标题 |
| H1 | 24px | 700 | 1.3 | 页面标题 |
| H2 | 20px | 600 | 1.4 | 区块标题 |
| Body LG | 16px | 400 | 1.5 | 正文字体 |
| Body SM | 14px | 400 | 1.5 | 辅助文字 |
| Caption | 12px | 500 | 1.4 | 说明文字 |

---

## 🧩 3. 语义化多态组件规范

### 3.1 输入框 (Inputs)

**变体:**
- Text - 文本输入
- Amount - 金额输入
- Password - 密码输入
- OTP - 验证码输入
- Select - 选择器

**状态:**

| 状态 | 背景 | 边框 | 效果 |
|------|------|------|------|
| Default | input_bg | transparent | - |
| Focus | input_bg | primary.500 | ring: primary.100 |
| Error | input_bg | error.500 | shake: true |
| Disabled | gray.100 | - | opacity: 0.5 |

**元素组成:**
- Prefix Icon (可选)
- Label
- Placeholder
- Clear Button (可选)
- Helper Text (可选)

---

### 3.2 按钮 (Buttons)

**主要按钮:**
```css
background: primary.500
color: white
shadow: primary_soft
```

**次要按钮:**
```css
background: primary.50
color: primary.600
```

**幽灵按钮:**
```css
background: transparent
color: gray.600
```

**加载状态:**
- 显示 spinner
- 禁用交互

---

### 3.3 反馈指示器

**Toast:**
- 震动：light
- 持续时间：3000ms

**Skeleton:**
- 动画：pulse
- 背景：gray.200

**Empty State:**
- 插图：3d_clay
- 按钮：retry_action

---

## 💰 4. 金融场景专用规范

### 4.1 金额显示
- 使用等宽数字 (Tabular Numbers)
- 确保金额对齐

### 4.2 隐私保护
- 敏感数据使用星号掩码 (****)
- 身份证号：110***********1234
- 手机号：110****1234

### 4.3 风险警告
```css
background: warning.50
color: warning.700
icon: alert-triangle
```

---

## 🎨 5. 颜色系统

### 5.1 浅色模式

| 令牌 | 值 | 用途 |
|------|-----|------|
| canvas | #F8F9FC | 画布背景 |
| surface | #FFFFFF | 卡片背景 |
| primary | #8B5CF6 | 品牌紫 |
| secondary | #F97316 | 动作橙 |
| success | #10B981 | 成功 |
| error | #EF4444 | 错误 |
| warning | #F59E0B | 警告 |
| text.p | #1A1C1E | 主文字 |
| text.s | #6C727A | 次要文字 |
| text.t | #9BA1A8 | 提示文字 |

### 5.2 深色模式

| 令牌 | 值 | 用途 |
|------|-----|------|
| canvas | #0A0A0B | 画布背景 |
| surface | #161618 | 卡片背景 |
| primary | #A78BFA | 品牌紫 |
| secondary | #FB923C | 动作橙 |
| success | #34D399 | 成功 |
| error | #F87171 | 错误 |
| warning | #FBBF24 | 警告 |
| text.p | #F9F9FB | 主文字 |
| text.s | #9BA1A8 | 次要文字 |
| text.t | #64748B | 提示文字 |

---

## 📱 6. 页面模板

### 6.1 首页模板

```
┌─────────────────────────────────┐
│  Header (z-100)                 │
│  [Logo]              [Profile]  │
├─────────────────────────────────┤
│                                 │
│  Hero Card (z-10)               │
│  ┌─────────────────────────┐   │
│  │ 可用额度                │   │
│  │ ฿ 50,000               │   │
│  │ [立即借款]              │   │
│  └─────────────────────────┘   │
│                                 │
│  Quick Actions (z-10)           │
│  ┌─────┐ ┌─────┐ ┌─────┐      │
│  │借款 │ │还款 │ │记录 │      │
│  └─────┘ └─────┘ └─────┘      │
│                                 │
│  Recent Activity (z-10)         │
│  ┌─────────────────────────┐   │
│  │ 借款记录 #1             │   │
│  │ 借款记录 #2             │   │
│  └─────────────────────────┘   │
│                                 │
├─────────────────────────────────┤
│  Bottom Navigation (z-100)      │
│  [首页] [借款] [我的]           │
└─────────────────────────────────┘
```

### 6.2 借款页面模板

```
┌─────────────────────────────────┐
│  Header (z-100)                 │
│  [← 返回]        借款           │
├─────────────────────────────────┤
│                                 │
│  Amount Card (z-10)             │
│  ┌─────────────────────────┐   │
│  │ 借款金额                │   │
│  │ ฿ [_________]          │   │
│  │ [10,000] [20,000]      │   │
│  │ [30,000] [50,000]      │   │
│  └─────────────────────────┘   │
│                                 │
│  Term Card (z-10)               │
│  ┌─────────────────────────┐   │
│  │ 借款期限                │   │
│  │ ○ 7 天  ○ 14 天         │   │
│  │ ○ 21 天  ○ 30 天        │   │
│  └─────────────────────────┘   │
│                                 │
│  Summary Card (z-10)            │
│  ┌─────────────────────────┐   │
│  │ 利息：฿ 1,400          │   │
│  │ 总还款：฿ 11,400       │   │
│  │ 到期日：2026-04-01      │   │
│  └─────────────────────────┘   │
│                                 │
├─────────────────────────────────┤
│  Submit Button (z-100)          │
│  ┌─────────────────────────┐   │
│  │      确认借款           │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

### 6.3 模态框模板 (KYC)

```
┌─────────────────────────────────┐
│  Overlay (z-500)                │
│  [Background Blur]              │
│                                 │
│  ┌───────────────────────────┐ │
│  │  Modal (z-700)            │ │
│  │                           │ │
│  │  KYC Verification         │ │
│  │  ┌─────────────────────┐ │ │
│  │  │ [身份证正面]        │ │ │
│  │  └─────────────────────┘ │ │
│  │                           │ │
│  │  [上传身份证正面]         │ │
│  │  [上传身份证反面]         │ │
│  │                           │ │
│  │  [取消]  [提交]           │ │
│  └───────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

---

## 🎬 7. 交互动画

### 7.1 页面转场
- 推入动画：300ms ease-out
- 弹出动画：300ms ease-in

### 7.2 卡片交互
- 点击反馈：scale(0.98), 100ms
- 悬浮效果：translateY(-2px), 200ms

### 7.3 按钮交互
- 点击反馈：scale(0.95), 100ms
- 加载状态：spinner rotation, 1s linear infinite

### 7.4 表单验证
- 错误状态：shake 动画，300ms
- 成功状态：checkmark 动画，500ms

---

## 📐 8. 响应式断点

| 断点 | 宽度 | 用途 |
|------|------|------|
| xs | 320px | 小屏手机 |
| sm | 375px | 标准手机 |
| md | 428px | 大屏手机 |
| lg | 768px | 平板 |
| xl | 1024px | 桌面 |

---

## ✅ 9. 设计检查清单

**每个页面设计前:**
- [ ] 确认 Z-Index 层级
- [ ] 使用标准间距系统
- [ ] 使用标准圆角系统
- [ ] 使用标准字体系统
- [ ] 使用标准颜色系统
- [ ] 考虑深色模式适配
- [ ] 考虑无障碍访问
- [ ] 考虑响应式布局

**每个组件设计前:**
- [ ] 定义所有状态 (default/focus/error/disabled)
- [ ] 定义所有变体
- [ ] 定义交互动画
- [ ] 定义无障碍属性

---

## 🎨 10. Tailwind 配置

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
        },
        secondary: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          500: '#F97316',
          600: '#EA580C',
        },
        // ... 其他颜色
      },
      borderRadius: {
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        full: '100px',
      },
      fontSize: {
        display: ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        h1: ['24px', { lineHeight: '1.3', fontWeight: '700' }],
        h2: ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        bodyLg: ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        bodySm: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.4', fontWeight: '500' }],
      },
      zIndex: {
        background: '-1',
        base: '0',
        card: '10',
        sticky: '100',
        overlay: '500',
        drawer: '600',
        modal: '700',
        feedback: '1000',
      },
    },
  },
}
```

---

**设计规范版本:** 2026.Q1.Industrial  
**最后更新:** 2026-03-18  
**维护人:** 设计团队
