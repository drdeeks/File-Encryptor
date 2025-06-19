# Application Icons

This folder should contain the application icons for different platforms.

## Required Icon Files

### Windows
- **`icon.ico`** - Windows icon file (16x16, 32x32, 48x48, 256x256 sizes)

### macOS  
- **`icon.icns`** - macOS icon file (16x16 to 1024x1024 sizes)

### Linux
- **`icon.png`** - PNG icon (256x256 recommended)

## Icon Specifications

### Design Guidelines
- **Style**: Clean, simple, recognizable at small sizes
- **Theme**: Security/encryption related (lock, shield, key, etc.)
- **Colors**: Should work on both light and dark backgrounds
- **Format**: Vector-based for best scaling

### Size Requirements
- **Minimum**: 256x256 pixels
- **Recommended**: 512x512 or 1024x1024 pixels for source
- **Multiple sizes**: ICO and ICNS should contain multiple resolutions

## Creating Icons

### Option 1: Online Tools
- **Favicon.io** - Convert PNG to ICO/ICNS
- **IconArchive** - Free icon downloads
- **Flaticon** - Professional icons (check license)

### Option 2: Design Software
- **GIMP** (Free) - Can export ICO files
- **Adobe Illustrator** - Professional vector icons
- **Inkscape** (Free) - Open source vector editor

### Option 3: Automated Generation
```bash
# Install icon generation tool
npm install -g electron-icon-maker

# Generate all formats from a 1024x1024 PNG
electron-icon-maker --input=source-icon.png --output=./
```

## Default Behavior

If no icons are provided:
- Electron will use its default icon
- Applications will still build and run normally
- Professional appearance requires custom icons

## Icon Ideas for File Encryptor

- 🔒 Lock symbol with file/document
- 🛡️ Shield with encryption symbols
- 🔐 Key with binary code
- 📁 Folder with lock overlay
- 🔑 Modern key design
- 🛡️ Security badge

## Quick Start

1. Create or download a 512x512 PNG icon
2. Use online converter to create ICO and ICNS files
3. Place files in this folder
4. Update icon paths in `package.json` if needed
5. Rebuild application with `build.bat`

---

*Note: Remember to respect icon licenses and attribution requirements* 