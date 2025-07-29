@echo off
setlocal enabledelayedexpansion

REM File Encryptor v2.0 - Build Script for Windows
REM This script automates the development and build process

set "SCRIPT_NAME=%~n0"
set "SCRIPT_DIR=%~dp0"

REM Colors for output (Windows 10+)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Function to print colored output
:print_status
echo %BLUE%[INFO]%NC% %~1
goto :eof

:print_success
echo %GREEN%[SUCCESS]%NC% %~1
goto :eof

:print_warning
echo %YELLOW%[WARNING]%NC% %~1
goto :eof

:print_error
echo %RED%[ERROR]%NC% %~1
goto :eof

REM Function to check if command exists
:command_exists
where %~1 >nul 2>&1
if %errorlevel% equ 0 (
    set "exists=true"
) else (
    set "exists=false"
)
goto :eof

REM Function to check prerequisites
:check_prerequisites
call :print_status "Checking prerequisites..."

set "missing_deps="

call :command_exists node
if "!exists!"=="false" set "missing_deps=!missing_deps! Node.js"

call :command_exists npm
if "!exists!"=="false" set "missing_deps=!missing_deps! npm"

call :command_exists rustc
if "!exists!"=="false" set "missing_deps=!missing_deps! Rust"

call :command_exists cargo
if "!exists!"=="false" set "missing_deps=!missing_deps! Cargo"

if not "!missing_deps!"=="" (
    call :print_error "Missing dependencies:!missing_deps!"
    call :print_status "Please install the missing dependencies and try again."
    exit /b 1
)

call :print_success "All prerequisites are installed"
goto :eof

REM Function to install dependencies
:install_dependencies
call :print_status "Installing dependencies..."

if not exist "node_modules" (
    npm install
    call :print_success "Node.js dependencies installed"
) else (
    call :print_status "Node.js dependencies already installed"
)

REM Check if Tauri CLI is installed
call :command_exists tauri
if "!exists!"=="false" (
    call :print_status "Installing Tauri CLI..."
    npm install -g @tauri-apps/cli
    call :print_success "Tauri CLI installed"
) else (
    call :print_status "Tauri CLI already installed"
)
goto :eof

REM Function to run development mode
:run_dev
call :print_status "Starting development mode..."
npm run tauri:dev
goto :eof

REM Function to build for production
:build_production
call :print_status "Building for production..."

REM Clean previous builds
if exist "src-tauri\target" (
    call :print_status "Cleaning previous builds..."
    cargo clean --manifest-path src-tauri\Cargo.toml
)

REM Build the application
npm run tauri:build

call :print_success "Production build completed"
call :print_status "Check the following directories for builds:"
call :print_status "  - Windows: src-tauri\target\release\bundle\msi\"
call :print_status "  - macOS: src-tauri\target\release\bundle\dmg\"
call :print_status "  - Linux: src-tauri\target\release\bundle\appimage\"
goto :eof

REM Function to run tests
:run_tests
call :print_status "Running tests..."

REM Frontend tests
findstr /c:"\"test\"" package.json >nul 2>&1
if %errorlevel% equ 0 (
    npm test
) else (
    call :print_warning "No test script found in package.json"
)

REM Rust tests
if exist "src-tauri\Cargo.toml" (
    call :print_status "Running Rust tests..."
    cargo test --manifest-path src-tauri\Cargo.toml
)
goto :eof

REM Function to clean build artifacts
:clean_builds
call :print_status "Cleaning build artifacts..."

REM Remove node_modules
if exist "node_modules" (
    rmdir /s /q node_modules
    call :print_status "Removed node_modules"
)

REM Remove dist directory
if exist "dist" (
    rmdir /s /q dist
    call :print_status "Removed dist directory"
)

REM Clean Rust builds
if exist "src-tauri\target" (
    cargo clean --manifest-path src-tauri\Cargo.toml
    call :print_status "Cleaned Rust builds"
)

call :print_success "Build artifacts cleaned"
goto :eof

REM Function to show help
:show_help
echo File Encryptor v2.0 - Build Script for Windows
echo.
echo Usage: %SCRIPT_NAME%.bat [COMMAND]
echo.
echo Commands:
echo   dev, develop    Start development mode
echo   build           Build for production
echo   test            Run tests
echo   clean           Clean build artifacts
echo   install         Install dependencies
echo   check           Check prerequisites
echo   help            Show this help message
echo.
echo Examples:
echo   %SCRIPT_NAME%.bat dev          # Start development mode
echo   %SCRIPT_NAME%.bat build        # Build for production
echo   %SCRIPT_NAME%.bat clean        # Clean all build artifacts
goto :eof

REM Main script logic
set "command=%~1"
if "%command%"=="" set "command=help"

if "%command%"=="dev" (
    call :check_prerequisites
    call :install_dependencies
    call :run_dev
) else if "%command%"=="develop" (
    call :check_prerequisites
    call :install_dependencies
    call :run_dev
) else if "%command%"=="build" (
    call :check_prerequisites
    call :install_dependencies
    call :build_production
) else if "%command%"=="test" (
    call :check_prerequisites
    call :install_dependencies
    call :run_tests
) else if "%command%"=="clean" (
    call :clean_builds
) else if "%command%"=="install" (
    call :check_prerequisites
    call :install_dependencies
) else if "%command%"=="check" (
    call :check_prerequisites
) else if "%command%"=="help" (
    call :show_help
) else if "%command%"=="--help" (
    call :show_help
) else if "%command%"=="-h" (
    call :show_help
) else (
    call :print_error "Unknown command: %command%"
    echo.
    call :show_help
    exit /b 1
)

endlocal