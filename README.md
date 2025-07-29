# File Encryptor v2.0 - Tauri Edition

A secure, modern file encryption application with dark humor, built with Tauri, Rust, and React.

![File Encryptor](https://img.shields.io/badge/File%20Encryptor-v2.0-blue)
![Tauri](https://img.shields.io/badge/Tauri-1.5-green)
![Rust](https://img.shields.io/badge/Rust-2021-orange)
![React](https://img.shields.io/badge/React-18-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Features

### 🔐 Security
- **AES-256-GCM Encryption**: Military-grade authenticated encryption
- **Argon2id Key Derivation**: Memory-hard password hashing with 100,000 iterations
- **Secure Random Generation**: Cryptographically secure random number generation
- **Integrity Verification**: SHA-256 integrity checks for encrypted data
- **Memory Protection**: Secure memory handling with zeroization
- **Compression Support**: Optional data compression for efficiency

### 🎯 Enhanced Decryption
- **Robust File Format Detection**: Intelligent encrypted file recognition
- **Batch Decryption**: Process multiple files simultaneously
- **Progress Tracking**: Real-time progress with time estimates
- **Error Recovery**: Comprehensive error handling and recovery mechanisms
- **Password Verification**: Test passwords without full decryption
- **File Integrity Checks**: Verify encrypted file integrity

### 🎨 Modern UI/UX
- **Dark Theme**: Beautiful dark interface with glass morphism effects
- **Drag & Drop**: Intuitive file selection with visual feedback
- **Real-time Progress**: Live progress indicators with contextual humor
- **Responsive Design**: Works seamlessly across different screen sizes
- **Accessibility**: Full keyboard navigation and screen reader support
- **Cross-platform**: Native performance on Windows, macOS, and Linux

### 😈 Dark Humor Integration
- **Contextual Jokes**: Humor that appears during specific operations
- **Progress Humor**: Entertaining messages during long operations
- **Error Humor**: Light-hearted error messages to reduce frustration
- **Success Humor**: Celebratory messages for completed operations

## 🛠️ Technology Stack

### Backend (Rust)
- **Tauri**: Cross-platform desktop application framework
- **AES-GCM**: Authenticated encryption with associated data
- **Argon2id**: Memory-hard password hashing
- **Tokio**: Asynchronous runtime for non-blocking operations
- **Memmap2**: Memory-mapped file operations for large files
- **Walkdir**: Efficient directory traversal

### Frontend (React + TypeScript)
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icon library
- **React Hot Toast**: Elegant toast notifications
- **React Dropzone**: Drag and drop file handling

## 📦 Installation

### Prerequisites
- **Node.js** 18+ and **npm** 9+
- **Rust** 1.70+ and **Cargo**
- **Tauri CLI**: `npm install -g @tauri-apps/cli`

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/drdeeks/File-Encryptor.git
   cd File-Encryptor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run tauri:dev
   ```

### Building for Production

1. **Build the application**
   ```bash
   npm run tauri:build
   ```

2. **Find the executable**
   - **Windows**: `src-tauri/target/release/bundle/msi/`
   - **macOS**: `src-tauri/target/release/bundle/dmg/`
   - **Linux**: `src-tauri/target/release/bundle/appimage/`

## 🔧 Usage

### Encrypting Files
1. **Select a file** using drag & drop or the file picker
2. **Enter a strong password** (minimum 8 characters)
3. **Choose an action** for the original file:
   - Keep Original: Preserve the original file
   - Delete Original: Remove the original file
   - Erase Traces: Overwrite with random data before deletion
4. **Click "Encrypt File"** and enjoy the dark humor

### Decrypting Files
1. **Select an encrypted file** (.enc extension)
2. **Enter the password** (hope you remember it!)
3. **Click "Decrypt File"** to restore your data

### Managing Files
1. **Choose a directory** to scan for encrypted files
2. **Browse and search** through your encrypted files
3. **Sort by name, date, or size** for easy organization
4. **Quick actions**: Decrypt, show in folder, or delete files

## 🔒 Security Features

### Cryptographic Implementation
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: Argon2id with 100,000 iterations
- **Memory Cost**: 64MB for memory-hard operations
- **Salt Length**: 32 bytes of cryptographically secure random data
- **Nonce**: 12 bytes for AES-GCM
- **Authentication Tag**: 16 bytes for integrity verification

### Security Best Practices
- **Zeroization**: Sensitive data is securely cleared from memory
- **Constant-time Operations**: Protection against timing attacks
- **Input Validation**: Comprehensive validation of all inputs
- **Error Handling**: Secure error messages that don't leak information
- **File Permissions**: Proper handling of file system permissions

### File Format
```
[8 bytes]  Magic Header: "FE2.0\0\0\0"
[1024 bytes] Metadata (JSON with padding)
[N bytes]  Encrypted Data
```

## 🚨 Security Considerations

### Password Security
- **Use strong passwords**: Minimum 8 characters, longer is better
- **Don't reuse passwords**: Each file should have a unique password
- **Store passwords securely**: Consider using a password manager
- **Backup passwords**: Losing the password means losing the data forever

### File Security
- **Backup important files**: Always keep backups of critical data
- **Test decryption**: Verify you can decrypt files after encryption
- **Secure storage**: Store encrypted files in secure locations
- **Regular updates**: Keep the application updated for security patches

## 🐛 Troubleshooting

### Common Issues

**"File not found" error**
- Ensure the file path is correct and accessible
- Check file permissions on your system

**"Invalid password" error**
- Double-check the password spelling and case
- Ensure you're using the correct password for the file

**"Permission denied" error**
- Run the application with appropriate permissions
- Check if the file is being used by another application

**"Disk space insufficient" error**
- Ensure you have enough free disk space
- Encrypted files may be larger than the original

### Performance Tips
- **Large files**: The application can handle files up to several GB
- **Batch operations**: Use the file manager for multiple files
- **Compression**: Enable compression for better storage efficiency
- **Memory usage**: Close other applications for very large files

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Guidelines
- Follow Rust best practices and idioms
- Use TypeScript for frontend code
- Write comprehensive tests
- Follow security-first principles
- Add appropriate dark humor to new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tauri Team**: For the amazing cross-platform framework
- **Rust Crypto Team**: For the excellent cryptographic libraries
- **React Team**: For the powerful frontend framework
- **Dark Humor Community**: For inspiration on making security fun

## 🔗 Links

- **Repository**: https://github.com/drdeeks/File-Encryptor
- **Issues**: https://github.com/drdeeks/File-Encryptor/issues
- **Discussions**: https://github.com/drdeeks/File-Encryptor/discussions
- **Releases**: https://github.com/drdeeks/File-Encryptor/releases

## 📊 Version History

### v2.0.0 (Current)
- Complete rewrite with Tauri and Rust
- Modern React TypeScript frontend
- Enhanced security with AES-256-GCM
- Improved decryption capabilities
- Dark humor integration
- Cross-platform native performance

### v1.0.0 (Legacy)
- Original Electron-based implementation
- Basic AES-256-CBC encryption
- Simple React frontend

---

**Remember**: Your secrets are only as safe as your password. Choose wisely, and may the dark humor be with you! 😈🔐
