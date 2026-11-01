@echo off
setlocal enabledelayedexpansion

title Antigravity Apex - 1-Click Setup & Launch
color 0A

echo =======================================================================
echo     ANTIGRAVITY APEX -- ONE-CLICK INSTALLATION ^& LAUNCHER
echo     Target: Google Antigravity ^& AI Development Director Suite
echo =======================================================================
echo.

:: 1. Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    color 0C
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js 18+ from https://nodejs.org/ or run:
    echo     winget install OpenJS.NodeJS.LTS
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [1/6] Node.js detected: %NODE_VER% (OK)

:: 2. Check Git
where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [WARN] Git is not found in PATH. Continuing without git tracking...
) else (
    echo [2/6] Git detected (OK)
)

:: 3. Setup environment file
if not exist ".env" (
    echo [3/6] Creating .env from .env.example...
    copy .env.example .env >nul
    echo       .env file created successfully.
) else (
    echo [3/6] Existing .env file detected (OK)
)

:: 4. Install npm dependencies
if not exist "node_modules" (
    echo [4/6] Installing root dependencies (this may take a minute)...
    call npm install
) else (
    echo [4/6] Root dependencies already installed (OK)
)

if not exist "client\node_modules" (
    echo       Installing client dependencies...
    cd client
    call npm install
    cd ..
) else (
    echo       Client dependencies already installed (OK)
)

:: 5. Install Antigravity 17-Agent Suite non-destructively
echo [5/6] Deploying 17 Specialist Agents ^& Director Rules to Antigravity...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install.ps1" -Force
if %ERRORLEVEL% neq 0 (
    echo [WARN] Agent configuration installation returned non-zero code.
)

:: 6. Run Diagnostic Doctor
echo [6/6] Verifying system health with Diagnostic Doctor...
node scripts\doctor.js
echo.

echo =======================================================================
echo  INSTALLATION COMPLETE! Launching Antigravity Apex Dashboard...
echo  Local Dashboard URL: http://127.0.0.1:5173/
echo =======================================================================
echo.

:: Open default browser in background after 2 seconds
start "" powershell -NoProfile -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:5173/'"

:: Start Server + Client
call npm run dev

pause
