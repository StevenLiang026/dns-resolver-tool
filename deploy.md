# DNS解析工具 - 云端部署指南

## 🚀 部署到Vercel（推荐）

### 方法1：使用Vercel CLI（最简单）

1. **安装Vercel CLI**
```bash
npm install -g vercel
```

2. **登录Vercel**
```bash
vercel login
```

3. **部署项目**
```bash
cd dns-resolver-tool
vercel
```

4. **按提示操作**
- 选择账户
- 确认项目名称
- 选择部署设置

### 方法2：GitHub + Vercel（推荐）

1. **上传到GitHub**
   - 创建新的GitHub仓库
   - 上传dns-resolver-tool文件夹

2. **连接Vercel**
   - 访问 https://vercel.com
   - 用GitHub账号登录
   - 导入GitHub仓库
   - 自动部署

### 方法3：拖拽部署

1. **访问Vercel**
   - 打开 https://vercel.com
   - 注册/登录账号

2. **拖拽文件夹**
   - 将dns-resolver-tool文件夹拖到Vercel页面
   - 自动上传和部署

## 🌐 部署后获得

- **免费域名**：如 `your-project.vercel.app`
- **HTTPS支持**：自动SSL证书
- **全球CDN**：快速访问
- **自动更新**：代码更新自动部署

## 📝 部署步骤（详细）

1. **准备文件**
   - ✅ server.js（已配置）
   - ✅ vercel.json（已创建）
   - ✅ package.json（已存在）
   - ✅ 前端文件（index.html, style.css, script.js）

2. **选择部署方式**
   - 推荐：GitHub + Vercel（自动化）
   - 快速：Vercel CLI
   - 简单：拖拽上传

3. **访问你的DNS解析工具**
   - 部署完成后获得公网域名
   - 全世界都能访问
   - 支持HTTPS安全连接

## 🎯 部署优势

- **免费托管**：Vercel免费计划足够使用
- **全球访问**：任何人都能使用
- **自动扩展**：根据访问量自动调整
- **零维护**：无需管理服务器