# Development Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm start       # Start Electron app in development mode
npm run dev     # Alternative start command
npm run build   # Build for production
npm run package # Package the app
npm run make    # Create distributable
```

## 📁 Project Structure

```
File-Encryptor/
├── src/
│   ├── main.js              # Electron main process
│   ├── preload.js           # Preload script
│   ├── App.jsx              # Main React component
│   ├── styles.css           # Global styles
│   ├── encryption/
│   │   ├── encrypt.js       # File encryption logic
│   │   └── decrypt.js       # File decryption logic
│   └── utils/
│       └── fileUtils.js     # File utility functions
├── public/
│   └── index.html           # Electron renderer HTML
└── package.json
```

## 🛠 Development Tools

### Code Quality
- **ESLint**: `npm run lint` (when configured)
- **Prettier**: Code formatting
- **React DevTools**: Available in development

### Security
- All file operations are sandboxed through Electron's IPC
- No direct file system access from renderer process
- Context isolation enabled

## 📦 Building & Distribution

### Build for Production
```bash
npm run build
```

### Package the App
```bash
npm run package
```

### Create Distributables
```bash
npm run make
```

## 🔧 Configuration

### Electron Security
- `nodeIntegration: false`
- `contextIsolation: true`
- Preload script for secure IPC communication

### File Handling
- AES-256-CBC encryption
- Secure random IV generation
- Scrypt key derivation

## 🐛 Debugging

### Main Process
```bash
# Add to main.js
console.log('Debug info');
```

### Renderer Process
- Use browser DevTools (F12)
- React DevTools extension

### Common Issues

1. **IPC Communication Failed**
   - Check preload script is loaded
   - Verify IPC channel names match

2. **File Access Denied**
   - Run as administrator (if needed)
   - Check file permissions

3. **Build Errors**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Clear npm cache: `npm cache clean --force`

## 📝 Adding Features

### New IPC Handlers
1. Add handler in `src/main.js`
2. Add corresponding call in renderer
3. Update preload script if needed

### New UI Components
1. Add component to `src/App.jsx`
2. Add styles to `src/styles.css`
3. Follow existing patterns

## 🔐 Security Notes

- Never store passwords in plain text
- Always validate file paths
- Use secure IPC communication
- Follow Electron security best practices

## 🎨 UI Development

### Theme
- Dark theme with orange accents (#ffb347)
- Responsive design with vw units
- CSS Grid and Flexbox layouts

### Components
- Tab-based navigation
- File grid display
- Search and sort functionality
- Action buttons with icons

---

*Built with ❤️ and a sense of humor* 