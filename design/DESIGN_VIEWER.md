# Sook Lending Platform - 设计稿查看指南

**设计稿文件:** `system_design.pen`

---

## 🖥️ 查看方式

### 方式 1: 使用 Pencil GUI (推荐)

**安装 Pencil:**
```bash
# 1. 下载 Pencil
wget https://github.com/evolus/pencil/releases/download/v3.1.4/Pencil-3.1.4.AppImage

# 2. 添加执行权限
chmod +x Pencil-3.1.4.AppImage

# 3. 安装 FUSE (必需)
sudo dnf install -y fuse

# 4. 运行 Pencil
./Pencil-3.1.4.AppImage design/system_design.pen
```

**打开设计稿:**
```bash
cd /home/neo/.openclaw/workspace/projects/lann-thailand-loan-app
pencil design/system_design.pen
```

---

### 方式 2: 查看 XML 源码

Pencil 文件是基于 XML 的，可以直接查看：

```bash
# 查看设计稿结构
cat design/system_design.pen | grep -A 5 "<Page"

# 查看特定页面
cat design/system_design.pen | grep -A 50 'name="1. Color System"'
```

---

### 方式 3: 导出为图片/PDF

**在 Pencil 中导出:**
1. 打开 Pencil
2. File → Export → PDF/PNG
3. 选择页面和分辨率
4. 保存到 `design/exports/`

**命令行导出 (如果支持):**
```bash
pencil --export-pdf design/system_design.pen design/exports/design-system.pdf
```

---

## 📊 设计稿内容概览

### Page 0: Design System Cover
- 项目标题：Sook Lending Platform
- 版本：v2026.Q1
- 设计原则：Bento-Style, Trustworthy, WCAG 2.1 AA

### Page 1: Color System
**Primary (品牌紫):**
- #F5F3FF → #EDE9FE → #8B5CF6 → #7C3AED → #6D28D9

**Secondary (动作橙):**
- #FFF7ED → #FFEDD5 → #F97316 → #EA580C

**Semantic:**
- ✅ Success: #10B981
- ❌ Error: #EF4444
- ⚠️ Warning: #F59E0B

### Page 2: Typography
```
Display:   32px/700 - 大标题
H1:        24px/700 - 页面标题
H2:        20px/600 - 区块标题
Body LG:   16px/400 - 正文
Body SM:   14px/400 - 辅助文字
Caption:   12px/500 - 说明文字
```

### Page 3: Components
**Buttons:**
- Primary (#8B5CF6, rx-16)
- Secondary (#F5F3FF)
- Ghost (transparent, border)

**Inputs:**
- Default/Focus/Error/Disabled 状态

**Bento Cards:**
- 可用额度卡片示例

### Page 4: Home Page Template
完整首页布局 (375x812):
- Status Bar
- Header (z-100)
- Hero Card (z-10)
- Quick Actions (z-10)
- Bottom Nav (z-100)

### Page 5: Z-Index Layers
7 个层级规范图示

---

## 🎨 设计规范文档

**文本规范:** `docs/SOOK_DESIGN_SPEC.md`
- 完整的设计系统文档
- Tailwind 配置
- 组件规范
- 页面模板

**可视化设计:** `design/system_design.pen`
- Pencil 设计稿
- 6 个页面
- 67 个设计元素

---

## 📝 快速参考

**颜色令牌:**
```css
--primary-500: #8B5CF6;
--primary-600: #7C3AED;
--secondary-500: #F97316;
--success: #10B981;
--error: #EF4444;
```

**字体系统:**
```css
--font-display: 32px/700;
--font-h1: 24px/700;
--font-h2: 20px/600;
--font-body: 16px/400;
```

**圆角系统:**
```css
--radius-sm: 12px;
--radius-md: 16px;
--radius-lg: 24px;
--radius-xl: 32px;
```

**Z-Index:**
```css
--z-card: 10;
--z-sticky: 100;
--z-overlay: 500;
--z-modal: 700;
--z-feedback: 1000;
```

---

**最后更新:** 2026-03-18  
**维护人:** 设计团队
