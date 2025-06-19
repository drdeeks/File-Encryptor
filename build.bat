@echo off
title File Encryptor GUI - Build Script
setlocal enabledelayedexpansion

echo.
echo ============================================
echo    FILE ENCRYPTOR GUI - BUILD SCRIPT
echo ============================================
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

:: Display build options
echo Available build options:
echo.
echo 1. Package (create app folder - fastest)
echo 2. Make Windows Installer (.exe setup)
echo 3. Make Windows Portable (.zip)
echo 4. Make All Windows Distributables
echo 5. Clean build folders
echo 6. Exit
echo.

set /p choice="Choose an option (1-6): "

if "%choice%"=="1" goto :package
if "%choice%"=="2" goto :make_installer
if "%choice%"=="3" goto :make_portable
if "%choice%"=="4" goto :make_all
if "%choice%"=="5" goto :clean
if "%choice%"=="6" goto :exit
goto :invalid

:package
echo.
echo Creating application package...
echo This will create a folder with the application files
echo.
npm run package
if %errorlevel% neq 0 (
    echo ERROR: Package creation failed
    pause
    exit /b 1
)
echo.
echo ✓ Package created successfully!
echo Check the 'out' folder for your application
goto :success

:make_installer
echo.
echo Creating Windows installer...
echo This will create a .exe setup file
echo.
npm run make-win
if %errorlevel% neq 0 (
    echo ERROR: Installer creation failed
    echo Make sure you have the required build tools installed
    pause
    exit /b 1
)
echo.
echo ✓ Windows installer created successfully!
echo Check the 'out\make' folder for your installer
goto :success

:make_portable
echo.
echo Creating portable Windows app...
echo This will create a .zip file with the portable app
echo.
npm run package
if %errorlevel% neq 0 (
    echo ERROR: Package creation failed
    pause
    exit /b 1
)
echo.
echo Creating ZIP archive...
:: Create a simple zip using PowerShell
powershell -command "Compress-Archive -Path 'out\File Encryptor GUI-win32-x64\*' -DestinationPath 'out\File-Encryptor-Portable.zip' -Force"
if %errorlevel% neq 0 (
    echo ERROR: ZIP creation failed
    pause
    exit /b 1
)
echo.
echo ✓ Portable app created successfully!
echo Check 'out\File-Encryptor-Portable.zip'
goto :success

:make_all
echo.
echo Creating all Windows distributables...
echo This will create both installer and portable versions
echo.
call :make_installer
call :make_portable
goto :success

:clean
echo.
echo Cleaning build folders...
npm run clean
if exist out rmdir /s /q out
echo.
echo ✓ Build folders cleaned!
goto :success

:invalid
echo.
echo Invalid choice. Please select 1-6.
echo.
pause
goto :EOF

:success
echo.
echo ============================================
echo Build completed successfully!
echo.
echo Output files location:
if exist out\make echo - Installers: out\make\
if exist out\File* echo - Packages: out\
echo.
echo You can now distribute these files to users.
echo No Node.js installation required on target machines!
echo ============================================
echo.
pause
goto :EOF

:exit
echo.
echo Build cancelled.
pause
goto :EOF 