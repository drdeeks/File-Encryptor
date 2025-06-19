@echo off
title File Encryptor GUI - Launcher
echo.
echo ========================================
echo    FILE ENCRYPTOR GUI - LAUNCHER
echo ========================================
echo.

:: Change to the directory where this batch file is located
cd /d "%~dp0"
echo Current directory: %CD%
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Check if we're in the right directory
if not exist package.json (
    echo ERROR: package.json not found
    echo Please make sure you're running this from the project directory
    echo.
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist node_modules (
    echo Node modules not found. Installing dependencies...
    echo This may take a few minutes...
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        echo.
        pause
        exit /b 1
    )
)

:: Start the application
echo Starting File Encryptor GUI...
echo.
echo Note: If this is the first run, it may take longer to start
echo The terminal will close automatically once the app opens successfully.
echo.

:: Start npm in a completely detached process
echo Starting File Encryptor GUI in background...
start "" /B cmd /c "npm start >nul 2>&1"

:: Give the app a moment to start, then close this window
echo App is starting... (this may take 10-15 seconds for the first run)
echo Terminal will close automatically - the app will continue running independently
timeout /t 10 /nobreak >nul
exit 