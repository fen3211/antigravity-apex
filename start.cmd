@echo off
setlocal enabledelayedexpansion

title Antigravity Apex - Quick Launcher
color 0B

echo =======================================================================
echo     ANTIGRAVITY APEX -- QUICK LAUNCHER
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

:: Auto-update check
if exist ".git" (
    echo [Auto-Update] Проверка наличия обновлений...
    git fetch origin main --quiet 2>nul
    for /f %%i in ('git rev-list HEAD..origin/main --count 2^>nul') do (
        if %%i GTR 0 (
            echo [Auto-Update] Найдено новых коммитов: %%i. Загружаем обновления...
            git pull origin main --quiet
            echo [Auto-Update] Обновление зависимостей...
            call npm install --silent
            call npm --prefix client install --silent
            echo [Auto-Update] Пересборка проекта...
            call npm run server:build --silent
            call npm run client:build --silent
            echo [Auto-Update] Обновление успешно установлено!
        ) else (
            echo [Auto-Update] Установлена актуальная версия.
        )
    )
    echo.
)

:: Open browser automatically
start "" powershell -NoProfile -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:5173/'"

:: Run Server and Client
call npm run dev

pause
