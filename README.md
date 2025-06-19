# File Encryptor GUI

A sophisticated yet darkly humorous desktop application for encrypting and managing your files. Built with Electron, React, and a healthy dose of existential dread.

## 🔒 Features

### Core Encryption
- **File Encryption**: Secure your files with AES-256-CBC encryption
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

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/file-encryptor-gui.git
   cd file-encryptor-gui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

## 📖 Usage

### Encrypting Files
1. Launch the application
2. Click "Choose File to Encrypt" or use the file dialog
3. Enter a strong password (no, "password123" doesn't count)
4. Select your preferred action for the original file
5. Optionally choose a custom save location
6. Click "Encrypt" and watch your secrets disappear into the digital void

### Browsing & Managing Encrypted Files
1. Switch to the "Browse Encrypted Files" tab
2. Click "Browse Directory" to select a folder to scan
3. View all `.enc` files in a modern grid layout
4. Use search and sort functions to organize your encrypted collection
5. Right-click files for rename, delete, or "show in folder" options

### Decrypting Files
1. From the browse tab, select an encrypted file
2. Enter the decryption password
3. Click "Decrypt File"
4. For uploaded files without proper paths, you'll be prompted to select the file location
5. Your file will be restored to its original format

### File Operations
- **Rename**: Change the name of encrypted files
- **Delete**: Permanently remove encrypted files
- **Show in Folder**: Open the file location in your system file manager
- **Drag & Drop**: Add `.enc` files by dragging them into the application

## 🛠️ Development

### Build Commands
```bash
# Development build
npm run build:dev

# Production build
npm run build

# Start in development mode
npm run dev

# Create distributable packages
npm run make
```

### Project Structure
```
src/
├── App.jsx                 # Main React application
├── main.js                 # Electron main process
├── preload.js             # Electron preload script
├── encryption/
│   ├── encrypt.js         # File encryption logic
│   └── decrypt.js         # File decryption logic
├── gui/                   # Additional GUI components
└── utils/                 # Utility functions
```

### Technologies Used
- **Electron**: Desktop application framework
- **React**: UI library
- **Node.js**: Runtime environment
- **Webpack**: Module bundler
- **Crypto**: Built-in Node.js cryptography

## 🔧 Configuration

### Build Configuration
The application uses Electron Forge for building and packaging. Configuration files:
- `webpack.config.js` - Webpack bundling configuration
- `package.json` - Application metadata and scripts

### Environment Variables
- Development builds include debugging capabilities
- Production builds are optimized and minified

## 🐛 Troubleshooting

### Common Issues

**"Invalid or missing file path" error during decryption:**
- This usually occurs with uploaded files. The app will automatically prompt you to select the correct file location.

**Application won't close properly:**
- Fixed in recent versions. The app now properly handles window closing and process termination.

**Files not appearing in directory scan:**
- Ensure you have proper read permissions for the selected directory
- Check that the files have the `.enc` extension

### Debug Mode
Run with debugging enabled:
```bash
npm run dev
```

This provides console output for troubleshooting encryption/decryption operations.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate error handling.

## ⚠️ Security Notice

- **Password Strength**: Use strong, unique passwords for encryption
- **Key Storage**: Passwords are not stored by the application
- **File Handling**: Original files can be securely deleted or overwritten based on your selection
- **Encryption**: Uses AES-256-CBC with scrypt key derivation

## 🎭 Acknowledgments

- Thanks to the dark humor that keeps us coding through the existential dread
- Built by developers who understand that sometimes you need to encrypt your feelings too
- Remember: With great encryption power comes great password responsibility

---

**Encrypt wisely, laugh darkly. 🔒💀**