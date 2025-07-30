#!/bin/bash

# File Encryptor v2.0 - Build Script
# This script automates the development and build process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local missing_deps=()
    
    if ! command_exists node; then
        missing_deps+=("Node.js")
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    if ! command_exists rustc; then
        missing_deps+=("Rust")
    fi
    
    if ! command_exists cargo; then
        missing_deps+=("Cargo")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        print_status "Please install the missing dependencies and try again."
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if [ ! -d "node_modules" ]; then
        npm install
        print_success "Node.js dependencies installed"
    else
        print_status "Node.js dependencies already installed"
    fi
    
    # Check if Tauri CLI is installed
    if ! command_exists tauri; then
        print_status "Installing Tauri CLI..."
        npm install -g @tauri-apps/cli
        print_success "Tauri CLI installed"
    else
        print_status "Tauri CLI already installed"
    fi
}

# Function to run development mode
run_dev() {
    print_status "Starting development mode..."
    npm run tauri:dev
}

# Function to build for production
build_production() {
    print_status "Building for production..."
    
    # Clean previous builds
    if [ -d "src-tauri/target" ]; then
        print_status "Cleaning previous builds..."
        cargo clean --manifest-path src-tauri/Cargo.toml
    fi
    
    # Build the application
    npm run tauri:build
    
    print_success "Production build completed"
    print_status "Check the following directories for builds:"
    print_status "  - Windows: src-tauri/target/release/bundle/msi/"
    print_status "  - macOS: src-tauri/target/release/bundle/dmg/"
    print_status "  - Linux: src-tauri/target/release/bundle/appimage/"
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    # Frontend tests
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        npm test
    else
        print_warning "No test script found in package.json"
    fi
    
    # Rust tests
    if [ -f "src-tauri/Cargo.toml" ]; then
        print_status "Running Rust tests..."
        cargo test --manifest-path src-tauri/Cargo.toml
    fi
}

# Function to clean build artifacts
clean_builds() {
    print_status "Cleaning build artifacts..."
    
    # Remove node_modules
    if [ -d "node_modules" ]; then
        rm -rf node_modules
        print_status "Removed node_modules"
    fi
    
    # Remove dist directory
    if [ -d "dist" ]; then
        rm -rf dist
        print_status "Removed dist directory"
    fi
    
    # Clean Rust builds
    if [ -d "src-tauri/target" ]; then
        cargo clean --manifest-path src-tauri/Cargo.toml
        print_status "Cleaned Rust builds"
    fi
    
    print_success "Build artifacts cleaned"
}

# Function to show help
show_help() {
    echo "File Encryptor v2.0 - Build Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev, develop    Start development mode"
    echo "  build           Build for production"
    echo "  test            Run tests"
    echo "  clean           Clean build artifacts"
    echo "  install         Install dependencies"
    echo "  check           Check prerequisites"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev          # Start development mode"
    echo "  $0 build        # Build for production"
    echo "  $0 clean        # Clean all build artifacts"
}

# Main script logic
main() {
    case "${1:-help}" in
        "dev"|"develop")
            check_prerequisites
            install_dependencies
            run_dev
            ;;
        "build")
            check_prerequisites
            install_dependencies
            build_production
            ;;
        "test")
            check_prerequisites
            install_dependencies
            run_tests
            ;;
        "clean")
            clean_builds
            ;;
        "install")
            check_prerequisites
            install_dependencies
            ;;
        "check")
            check_prerequisites
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"