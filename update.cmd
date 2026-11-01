@echo off
setlocal enabledelayedexpansion

title Antigravity Apex - Updater
color 0A

echo =======================================================================
echo     ANTIGRAVITY APEX -- PROJECT UPDATER
echo =======================================================================
echo.

if not exist ".git" (
    echo [Error] Папка .git не найдена. Обновление возможно только в клонированном репозитории.
    pause
    exit /b 1
)

echo [1/4] Получение обновлений из репозитория GitHub...
git pull origin main
if %ERRORLEVEL% NEQ 0 (
    echo [Warning] Не удалось выполнить git pull. Проверьте подключение к сети.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/4] Обновление зависимостей сервера и клиента...
call npm install
call npm --prefix client install

echo.
echo [3/4] Сборка сервера...
call npm run server:build

echo.
echo [4/4] Сборка клиентского интерфейса...
call npm run client:build

echo.
echo =======================================================================
echo     ANTIGRAVITY APEX УСПЕШНО ОБНОВЛЕН ДО ПОСЛЕДНЕЙ ВЕРСИИ!
echo =======================================================================
echo.
pause
