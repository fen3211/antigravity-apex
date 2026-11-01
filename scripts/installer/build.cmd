@echo off
setlocal
echo ===================================================
echo Building AI-Command-Center-Setup.exe with csc.exe
echo ===================================================

set CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe
if not exist "%CSC%" set CSC=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe

if not exist "%CSC%" (
    echo [ERROR] Microsoft .NET Framework 4.0+ C# Compiler (csc.exe) not found!
    exit /b 1
)

echo Using C# Compiler: %CSC%
"%CSC%" /target:exe /out:"%~dp0..\..\AI-Command-Center-Setup.exe" /optimize+ "%~dp0Program.cs"

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Compiled AI-Command-Center-Setup.exe successfully!
) else (
    echo [ERROR] Compilation failed!
    exit /b %ERRORLEVEL%
)
