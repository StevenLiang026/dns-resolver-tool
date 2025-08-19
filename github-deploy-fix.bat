@echo off
chcp 65001 >nul
echo 🚀 DNS解析工具 - GitHub部署修复版
echo =====================================

echo 📋 当前状态：
echo    ✅ Git仓库已初始化
echo    ✅ 代码已提交到master分支
echo    ❌ 需要修复分支名和仓库地址

echo.
echo 🔧 请先在GitHub创建仓库：
echo    1. 访问 https://github.com/new
echo    2. 仓库名：dns-resolver-tool
echo    3. 设为Public
echo    4. 点击 "Create repository"
echo.

set /p username="请输入你的GitHub用户名: "

if "%username%"=="" (
    echo ❌ 用户名不能为空
    pause
    exit /b 1
)

set repo_url=https://github.com/%username%/dns-resolver-tool.git

echo.
echo 🔧 修复分支名...
git branch -M main

echo 🔗 设置正确的远程仓库...
git remote remove origin 2>nul
git remote add origin %repo_url%

echo 🚀 推送到GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ✅ 成功推送到GitHub！
    echo 🌐 仓库地址: %repo_url%
    echo.
    echo 📋 下一步：连接Vercel
    echo    1. 访问 https://vercel.com
    echo    2. 用GitHub账号登录
    echo    3. 点击 "New Project"
    echo    4. 选择 dns-resolver-tool 仓库
    echo    5. 点击 "Import" 和 "Deploy"
    echo.
    echo 🎉 完成后你将获得公网域名！
) else (
    echo.
    echo ❌ 推送失败，请检查：
    echo    1. GitHub仓库是否已创建
    echo    2. 用户名是否正确
    echo    3. 网络连接是否正常
    echo    4. 是否需要GitHub身份验证
)

pause