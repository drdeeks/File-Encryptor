# File Encryptor GUI

A sophisticated desktop application for encrypting and managing your files with a modern, user-friendly interface. Built with Electron, React, and Node.js, featuring AES-256-CBC encryption with a healthy dose of dark humor.

## 🔒 Features

### Core Encryption
- **File Encryption**: Secure your files with AES-256-CBC encryption using scrypt key derivation
- **Multiple File Handling Options**:
  - **Keep Original**: Preserve the original file (for the sentimental)
  - **Delete Original**: Remove the original file after encryption (no looking back)
  - **Erase Traces**: Overwrite and delete the original file (secret agent mode)

### File Management & Browsing
- **Directory Scanner**: Recursively scan directories for encrypted `.enc` files
- **File Browser**: Modern interface for browsing and managing encrypted files
- **Drag & Drop Support**: Drop `.enc` files directly into the application
- **File Operations**: Rename, delete, and organize encrypted files
- **Search & Sort**: Find files by name and sort by date, size, or name

### Decryption & Recovery
- **Smart Decryption**: Decrypt files with automatic output path detection
- **File Path Validation**: Intelligent handling of uploaded vs. scanned files
- **Progress Feedback**: Real-time scanning progress and operation status

### User Experience
- **Dark Theme**: Easy on the eyes (and the soul)
- **Custom Window Controls**: Frameless window with minimize, maximize, and close
- **Scalable UI**: Adjustable interface scaling (80% - 150%)
- **Operation History**: Track your encryption activities
- **Export/Import History**: Backup and restore your operation history

## 📁 Project Structure

### Core Application Files

#### **Main Application**
- **`src/main.js`** - Electron main process that creates the application window and handles IPC communication
- **`src/App.jsx`** - Main React component containing the UI logic and state management
- **`src/preload.js`** - Security bridge between Electron main and renderer processes
- **`src/index.js`** - Entry point that renders the React app

#### **Encryption Engine**
- **`src/encryption/encrypt.js`** - Core file encryption logic using AES-256-CBC with IV generation
- **`src/encryption/decrypt.js`** - File decryption logic with path validation and error handling

#### **Utilities**
- **`src/utils/fileUtils.js`** - Utility functions for file operations (read, write, delete, validate)

#### **UI Components & Styling**
- **`src/styles.css`** - Main application styling with dark theme
- **`src/gui/App.jsx`** - Additional GUI components (if needed)
- **`src/gui/styles.css`** - GUI-specific styling
- **`src/gui/index.js`** - GUI entry point

### Build & Configuration Files

#### **Build Scripts**
- **`build.bat`** - Interactive Windows build script with menu options:
  - Package creation (app folder)
  - Windows installer (.exe setup)
  - Portable ZIP creation
  - Clean build folders
- **`run-encryptor.bat`** - Quick launcher that installs dependencies and starts the app
- **`package.json`** - Node.js project configuration with scripts and dependencies
- **`webpack.config.js`** - Webpack bundling configuration for React components

#### **Documentation**
- **`README.md`** - This comprehensive guide
- **`BUILD_INSTRUCTIONS.md`** - Detailed build and distribution instructions
- **`DEVELOPMENT.md`** - Development setup and contribution guidelines
- **`DISTRIBUTION_GUIDE.md`** - Guide for distributing the application
- **`LICENSE`** - MIT license file

#### **Assets & Resources**
- **`assets/README.md`** - Guide for adding application icons
- **`public/index.html`** - Main HTML template for the Electron renderer
- **`public/static/`** - Compiled JavaScript and CSS files

## 🚀 Installation & Quick Start

### Prerequisites
- **Node.js** (v16 or higher) - Download from [nodejs.org](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Windows 7/8/10/11** (for .bat scripts)

### Option 1: Quick Start (Windows)
1. **Download/Clone** the project
2. **Double-click** `run-encryptor.bat`
3. Wait for automatic dependency installation and app launch

### Option 2: Manual Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/drdeeks/File-Encryptor.git
   cd File-Encryptor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the application:**
   ```bash
   npm start
   ```

### Option 3: Development Mode
```bash
npm run dev
```

## 📖 How to Use the Application

### 🔐 Encrypting Files

1. **Launch the Application**
   - Use `run-encryptor.bat` or `npm start`
   - The app opens with a dark-themed interface

2. **Select File to Encrypt**
   - Click "Choose File to Encrypt" button
   - Browse and select any file from your computer
   - File path will be displayed

3. **Set Encryption Password**
   - Enter a strong password (minimum 8 characters recommended)
   - Password is not stored - remember it!

4. **Choose Original File Action**
   - **Keep Original**: File remains unchanged after encryption
   - **Delete Original**: Original file is deleted after encryption
   - **Erase Traces**: Original file is overwritten with random data then deleted

5. **Optional: Custom Output Location**
   - Click "Choose Save Location" to specify where encrypted file goes
   - If not specified, saves in same folder as original with `.enc` extension

6. **Encrypt**
   - Click "Encrypt File" button
   - Watch progress and enjoy the dark humor quotes
   - Success message shows location of encrypted file

### 🔓 Decrypting Files

#### Method 1: From Browser Tab
1. **Switch to "Browse Encrypted Files" tab**
2. **Browse Directory** containing `.enc` files
3. **Select encrypted file** from the grid view
4. **Enter decryption password**
5. **Click "Decrypt File"**

#### Method 2: Drag & Drop
1. **Drag `.enc` files** into the browse area
2. **Select uploaded file** from the list
3. **Enter password and decrypt**

### 📁 Managing Encrypted Files

#### **Directory Scanning**
- Click "Browse Directory" to scan folders for `.enc` files
- Recursive scanning shows progress with directory count
- Results display in a modern grid layout

#### **File Operations**
- **Right-click** files for context menu:
  - **Rename**: Change file name
  - **Delete**: Permanently remove file
  - **Show in Folder**: Open file location in Windows Explorer

#### **Search & Sort**
- **Search**: Type in search box to filter by filename
- **Sort**: Click column headers to sort by name, date, or size
- **View**: Grid layout shows file details and thumbnails

### ⚙️ Application Settings

#### **UI Scaling**
- Use zoom controls to adjust interface size (80% - 150%)
- Perfect for different screen sizes and accessibility needs

#### **History Management**
- View encryption/decryption history in the History tab
- Export history to JSON file for backup
- Import previously exported history

## 🛠️ Development

### Development Scripts
```bash
# Start in development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Create distributable packages
npm run make

# Platform-specific builds
npm run make-win    # Windows
npm run make-linux  # Linux
npm run make-mac    # macOS

# Clean build folders
npm run clean
```

### Build Targets
- **Package**: Creates app folder (fastest, for testing)
- **Installer**: Creates `.exe` setup file (recommended for distribution)
- **Portable**: Creates `.zip` archive (no installation required)

### Development Environment
- **Electron Forge**: Build and packaging system
- **React**: UI framework with hooks
- **Webpack**: Module bundling
- **Node.js**: Core runtime for encryption and file operations

### File Watcher & Hot Reload
Development mode includes:
- Automatic React component reloading
- Console logging for debugging
- DevTools access for inspection

## 🔧 Technical Details

### Encryption Specifications
- **Algorithm**: AES-256-CBC (Advanced Encryption Standard)
- **Key Derivation**: scrypt with salt
- **IV**: Random 16-byte initialization vector per file
- **File Format**: `[16-byte IV][encrypted content]`

### Security Features
- Passwords never stored or logged
- Cryptographically secure random IV generation
- Memory-safe password handling
- Secure file deletion options with data overwriting

### Error Handling
- Comprehensive error messages for user guidance
- Graceful handling of file permission issues
- Recovery suggestions for common problems
- Detailed logging in development mode

## 🐛 Troubleshooting

### Common Issues & Solutions

#### **"Node.js not found" Error**
- **Problem**: Node.js not installed or not in system PATH
- **Solution**: Download and install from [nodejs.org](https://nodejs.org/)
- **Verify**: Run `node --version` in command prompt

#### **"npm install" Fails**
- **Problem**: Network issues or permission errors
- **Solutions**:
  ```bash
  # Clear npm cache
  npm cache clean --force
  
  # Use different registry
  npm install --registry https://registry.npmjs.org/
  
  # Run as administrator (Windows)
  ```

#### **Application Won't Start**
- **Problem**: Missing dependencies or build issues
- **Solutions**:
  ```bash
  # Reinstall dependencies
  rm -rf node_modules
  npm install
  
  # Rebuild native modules
  npm run build
  ```

#### **"Invalid or missing file path" During Decryption**
- **Problem**: File path validation issues with uploaded files
- **Solution**: Use "Browse Directory" instead of drag & drop, or reselect file when prompted

#### **Files Not Appearing in Directory Scan**
- **Problem**: Permission issues or incorrect file extensions
- **Solutions**:
  - Ensure files have `.enc` extension
  - Check read permissions for selected directory
  - Try scanning a different directory

#### **Encryption/Decryption Fails**
- **Problem**: Disk space, permissions, or corrupted files
- **Solutions**:
  - Check available disk space
  - Verify file isn't currently open in another program
  - Try different output location
  - Check file integrity

### Debug Mode
Enable verbose logging:
```bash
# Development mode with debug output
npm run dev

# Check console for detailed error messages
# Look for red error text in terminal
```

### Performance Optimization
- **Large Files**: Encryption/decryption is streaming-based for memory efficiency
- **Directory Scanning**: Progress updates prevent UI freezing
- **UI Responsiveness**: Background processing with IPC communication

## 📦 Building for Distribution

### Windows Distribution
```bash
# Interactive build menu
build.bat

# Command line options
npm run make-win        # Creates installer
npm run package         # Creates app folder
```

### Cross-Platform Building
```bash
# Requires appropriate OS or virtualization
npm run make-linux      # .deb, .rpm, .zip
npm run make-mac        # .dmg, .zip
```

### Distribution Files
- **Windows**: `File-Encryptor-Setup.exe` (installer)
- **Portable**: `File-Encryptor-Portable.zip`
- **Linux**: `.deb` and `.rpm` packages
- **macOS**: `.dmg` disk image

## 🔒 Security Considerations

### Password Security
- **Use strong passwords** (12+ characters, mixed case, numbers, symbols)
- **Never reuse passwords** from other accounts
- **Consider password managers** for generation and storage
- **Remember**: Lost passwords = lost files (no recovery possible)

### File Handling Best Practices
- **Test decryption** immediately after encryption
- **Backup important files** before encryption
- **Use "Erase Traces"** for sensitive data
- **Store encrypted files** in secure locations

### System Security
- **Keep system updated** for latest security patches
- **Use antivirus software** (app may trigger false positives)
- **Secure your computer** with login passwords
- **Regular backups** of encrypted files

## 📝 License & Legal

This project is licensed under the **MIT License** - see the `LICENSE` file for details.

### Third-Party Licenses
- **Electron**: MIT License
- **React**: MIT License
- **Node.js**: Node.js License (MIT-style)

## 🤝 Contributing

### Development Setup
1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes** and test thoroughly
4. **Follow code style** (see `DEVELOPMENT.md`)
5. **Submit Pull Request** with clear description

### Code Standards
- Use ESLint configuration
- Include error handling
- Add comments for complex logic
- Test on Windows, Linux, and macOS if possible

### Bug Reports
Please include:
- Operating system and version
- Node.js version (`node --version`)
- Steps to reproduce
- Error messages
- Screenshots if relevant

## 🎭 Acknowledgments

- **Dark humor** that keeps us coding through existential dread
- **Security community** for encryption best practices
- **Open source contributors** making desktop apps possible
- **Coffee** ☕ and **late-night coding sessions** 🌙

---

## ⚠️ Important Reminders

- **🔑 Password Management**: This app does NOT store passwords. Write them down securely!
- **🔒 Encryption Strength**: AES-256 is currently unbreakable with proper implementation
- **💾 File Backups**: Always backup important files before encryption
- **🛡️ Security**: Keep your system updated and use strong passwords

---

**Encrypt wisely, laugh darkly, and may your passwords be ever in your favor. 🔒💀**

*Built by developers who understand that sometimes you need to encrypt your feelings too.*