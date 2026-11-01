@echo off
setlocal enabledelayedexpansion

title AI Command Center - Quick Launcher
color 0B

echo =======================================================================
echo     AI COMMAND CENTER -- QUICK LAUNCHER
echo     URL: http://127.0.0.1:5173/
echo =======================================================================
echo.

if not exist ".env" (
    echo [.env] Creating default .env from .env.example...
    copy .env.example .env >nul
)

if not exist "node_modules" (
    echo [Dependencies] Missing node_modules! Running initial setup...
    call "%~dp0setup.cmd"
    exit /b %ERRORLEVEL%
)

:: Open browser automatically
start "" powershell -NoProfile -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:5173/'"

:: Run Server and Client
call npm run dev

pause
