@echo off
echo 🚀 DNS解析工具 - 一键部署到Vercel
echo =====================================

echo 📦 检查Vercel CLI...
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI未安装，正在安装...
    npm install -g vercel
    if %errorlevel% neq 0 (
        echo ❌ 安装失败，请手动安装: npm install -g vercel
        pause
        exit /b 1
    )
    echo ✅ Vercel CLI安装完成
)

echo 🔑 登录Vercel...
vercel login

echo 🚀 开始部署...
vercel --prod

echo ✅ 部署完成！
echo 🌐 你的DNS解析工具现在可以通过云端访问了
echo 📋 请查看上方显示的域名链接
pause