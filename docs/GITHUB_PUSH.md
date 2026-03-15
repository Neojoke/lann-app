# GitHub 推送指南

## 当前状态
✅ Git 仓库已初始化  
✅ 首次提交已完成  
❌ 推送到 GitHub 需要认证

---

## 方法一：使用 gh CLI（推荐）

```bash
# 1. 登录 GitHub
gh auth login

# 选择以下选项：
# - GitHub.com
# - HTTPS
# - Login with a web browser
# - 在浏览器中完成授权

# 2. 创建新仓库
gh repo create lann-thailand-loan-app --private

# 3. 推送代码
git push -u origin main
```

---

## 方法二：使用 Personal Access Token

### 创建 Token
1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 选择权限：`repo` (全部勾选)
4. 生成并复制 token

### 使用 Token 推送
```bash
# 替换 YOUR_TOKEN 和 YOUR_USERNAME
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/lann-thailand-loan-app.git
git push -u origin main
```

---

## 方法三：使用 SSH

```bash
# 1. 生成 SSH Key（如果没有）
ssh-keygen -t ed25519 -C "peng@lann.app"

# 2. 添加到 GitHub
# 访问 https://github.com/settings/keys
# 复制 ~/.ssh/id_ed25519.pub 内容

# 3. 切换为 SSH 远程
git remote set-url origin git@github.com:YOUR_USERNAME/lann-thailand-loan-app.git

# 4. 推送
git push -u origin main
```

---

## 当前仓库信息

**提交历史:**
```
commit c658898 (HEAD -> main)
Author: 吴鹏 (Lann) <peng@lann.app>
Date:   Sun Mar 15 14:58:00 2026 +0800

    feat: Lann 项目初始化 - 泰国借款 App MVP
```

**文件列表:**
- PROJECT.md
- README.md
- QUICKSTART.md
- TODO_CONFIRM.md
- .gitignore
- .opencode.json
- backend/wrangler.toml
- docs/design/UI_UX_SPEC.md
- mobile-app/angular.json
- mobile-app/package.json

---

**请选择一种方法完成推送，完成后告诉我！** 👿
