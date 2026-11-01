@echo off
setlocal
echo ===================================================
echo Building Antigravity-Apex-Setup.exe with csc.exe
echo ===================================================

set "CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if not exist "%CSC%" (
    set "CSC=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe"
)

if not exist "%CSC%" (
    echo [ERROR] Microsoft .NET Framework 4.0+ C# Compiler (csc.exe) not found!
    exit /b 1
)

echo Using C# Compiler: %CSC%
"%CSC%" /target:exe /out:"%~dp0..\..\Antigravity-Apex-Setup.exe" /optimize+ "%~dp0Program.cs"

if %ERRORLEVEL% EQU 0 (
    if not exist "%~dp0..\..\bin" mkdir "%~dp0..\..\bin"
    copy /Y "%~dp0..\..\Antigravity-Apex-Setup.exe" "%~dp0..\..\bin\Antigravity-Apex-Setup.exe" >nul
    echo [SUCCESS] Compiled Antigravity-Apex-Setup.exe successfully (root ^& bin/)!
) else (
    echo [ERROR] Compilation failed!
    exit /b %ERRORLEVEL%
)
