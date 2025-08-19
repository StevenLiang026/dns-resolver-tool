# DNS解析工具 - GitHub + Vercel 部署指南

## 🚀 GitHub + Vercel 自动部署（推荐方案）

### 第一步：上传到GitHub

1. **创建GitHub仓库**
   - 访问 https://github.com
   - 点击 "New repository"
   - 仓库名：`dns-resolver-tool`
   - 设为Public（免费用户）
   - 点击 "Create repository"

2. **上传代码**
   ```bash
   cd dns-resolver-tool
   git init
   git add .
   git commit -m "DNS解析工具 - 初始版本"
   git branch -M main
   git remote add origin https://github.com/你的用户名/dns-resolver-tool.git
   git push -u origin main
   ```

### 第二步：连接Vercel

1. **访问Vercel**
   - 打开 https://vercel.com
   - 用GitHub账号登录

2. **导入项目**
   - 点击 "New Project"
   - 选择你的 `dns-resolver-tool` 仓库
   - 点击 "Import"

3. **配置部署**
   - Framework Preset: 选择 "Other"
   - Root Directory: 保持默认
   - 点击 "Deploy"

### 第三步：享受自动部署

✅ **完成后你将获得：**
- 免费公网域名：`dns-resolver-tool-xxx.vercel.app`
- 自动部署：代码推送后自动更新
- HTTPS安全连接
- 全球CDN加速

## 🎯 优势对比

| 方式 | GitHub + Vercel | 直接部署 |
|------|----------------|----------|
| 自动更新 | ✅ 代码推送自动部署 | ❌ 需手动重新部署 |
| 版本管理 | ✅ 完整代码历史 | ❌ 无版本记录 |
| 团队协作 | ✅ 多人可贡献 | ❌ 仅个人使用 |
| 备份安全 | ✅ GitHub云端备份 | ❌ 仅本地文件 |

## 📝 快速命令（PowerShell）

如果你已经有GitHub账号，可以直接运行：

```powershell
# 初始化Git（已完成）
git init
git add .
git commit -m "DNS解析工具 - 美观界面版本"

# 创建main分支
git branch -M main

# 连接GitHub（替换为你的实际仓库地址）
git remote add origin https://github.com/你的GitHub用户名/dns-resolver-tool.git
git push -u origin main
```

**注意：请将上面的"你的GitHub用户名"替换为你的实际GitHub用户名！**

然后在Vercel导入这个仓库即可！
