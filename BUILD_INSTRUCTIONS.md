# Build Instructions - File Encryptor GUI

This document explains how to build distributable executables for the File Encryptor GUI application.

## 🚀 Quick Start (Windows)

### For Development/Testing
```bash
# Run the application in development mode
run-encryptor.bat
```

### For Building Distributables
```bash
# Interactive build script with menu options
build.bat
```

## 📦 Build Options

### 1. **Package Only** (Fastest)
Creates a folder with all application files. Users need to run the .exe inside the folder.
```bash
npm run package
```
Output: `out/File Encryptor GUI-win32-x64/`

### 2. **Windows Installer** (Recommended for Distribution)
Creates a proper Windows installer (.exe) that users can double-click to install.
```bash
npm run make-win
```
Output: `out/make/squirrel.windows/x64/File-Encryptor-GUI-Setup.exe`

### 3. **Portable ZIP**
Creates a compressed archive for portable use.
```bash
npm run package
# Then manually zip the output folder, or use build.bat option 3
```

### 4. **Cross-Platform Builds**
```bash
# Linux builds (run on Linux or WSL)
npm run make-linux

# macOS builds (run on macOS)
npm run make-mac
```

## 🛠 Prerequisites

### For Basic Building
- **Node.js** 16+ (https://nodejs.org/)
- **npm** (comes with Node.js)

### For Advanced Builds
- **Visual Studio Build Tools** (for native modules on Windows)
- **Python 3** (for some native dependencies)

### Installation Command
```bash
# Install all dependencies
npm install

# Install specific makers if needed
npm install --save-dev @electron-forge/maker-squirrel @electron-forge/maker-zip
```

## 📁 Output Structure

After building, you'll find files in the `out/` directory:

```
out/
├── File Encryptor GUI-win32-x64/          # Packaged app folder
│   ├── File Encryptor GUI.exe             # Main executable
│   ├── resources/                         # App resources
│   └── ...                               # Electron runtime files
├── make/                                  # Installers and packages
│   ├── squirrel.windows/                 # Windows installer
│   ├── zip/                             # ZIP packages
│   └── ...
└── File-Encryptor-GUI-Portable.zip       # Manual portable version
```

## 🎯 Distribution Formats

### Windows
- **`.exe` Installer** - Full installer with uninstall support
- **Portable `.zip`** - Extract and run, no installation needed
- **App Folder** - Developer/testing version

### Linux
- **`.deb`** - Debian/Ubuntu packages
- **`.rpm`** - Red Hat/Fedora packages
- **`.zip`** - Portable archive

### macOS
- **`.dmg`** - Disk image for easy installation
- **`.zip`** - Portable archive

## 🔧 Configuration

### App Metadata
Edit `package.json` to customize:
- App name and version
- Author information
- Description
- Icons and assets

### Build Settings
The `config.forge` section in `package.json` controls:
- Output file names
- Installer appearance
- Platform-specific options
- Ignored files during build

### Icons
Place your app icons in the `assets/` folder:
- `icon.ico` - Windows icon
- `icon.icns` - macOS icon
- `icon.png` - Linux icon (256x256 recommended)

## 🐛 Troubleshooting

### Common Issues

1. **"npm command not found"**
   - Install Node.js from https://nodejs.org/
   - Restart your terminal

2. **Build fails with native module errors**
   - Install Visual Studio Build Tools
   - Install Python 3
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`

3. **Out of memory during build**
   - Close other applications
   - Increase Node.js memory: `node --max-old-space-size=4096`

4. **Icons not showing**
   - Ensure icon files exist in `assets/` folder
   - Check file formats (ICO for Windows, ICNS for macOS)

### Getting Help

1. Check the main `README.md` for general app information
2. Review `DEVELOPMENT.md` for development setup
3. Look at Electron Forge documentation: https://www.electronforge.io/

## 📋 Build Checklist

Before building for distribution:

- [ ] Update version number in `package.json`
- [ ] Test the app thoroughly in development mode
- [ ] Add proper app icons to `assets/` folder
- [ ] Update app metadata (author, description, etc.)
- [ ] Test on target platforms if possible
- [ ] Create proper documentation for end users

## 🚢 Distribution

### For End Users
Distribute the installer files:
- **Windows**: `File-Encryptor-GUI-Setup.exe`
- **Linux**: `.deb` or `.rpm` files
- **macOS**: `.dmg` file

### System Requirements
- **Windows**: 7/8/10/11 (64-bit)
- **Linux**: Ubuntu 16.04+, CentOS 7+, or equivalent
- **macOS**: 10.10+ (Yosemite)
- **RAM**: 512MB minimum, 1GB recommended
- **Disk**: 200MB free space

---

*Built with Electron Forge and a lot of caffeine ☕* 