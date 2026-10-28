@echo off
cd /d "%~dp0"
chcp 65001 >nul
title Wiz Timeline — macOS Team Resource Timeline
color 0B

echo ======================================================================
echo                Wiz Timeline - Team Resource Timeline
echo                      macOS HIG Design System
echo ======================================================================
echo.

REM 检查 Node.js 环境变量
where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=C:\Program Files\nodejs;%PATH%"
    ) else (
        echo [错误] 未检测到 Node.js，请确保已安装 Node.js LTS (v18+ 或 v20+)。
        pause
        exit /b 1
    )
)

echo [1/3] 检查依赖...
if not exist "node_modules" (
    echo [提示] 首次运行，正在安装依赖包...
    call npm.cmd install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败。
        pause
        exit /b 1
    )
)

echo [2/3] 启动本地服务 (http://localhost:3000)...
start "" http://localhost:3000

echo [3/3] 正在运行 Next.js 服务，按 Ctrl+C 可停止服务。
call npm.cmd run dev

pause
