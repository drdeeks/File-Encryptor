const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const width = Math.floor(primaryDisplay.workAreaSize.width * 0.75);
    const height = Math.floor(primaryDisplay.workAreaSize.height * 0.75);

    const win = new BrowserWindow({
        width,
        height,
        x: Math.floor((primaryDisplay.workAreaSize.width - width) / 2),
        y: Math.floor((primaryDisplay.workAreaSize.height - height) / 2),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        frame: false, // Removed default OS window bar to allow custom controls
        fullscreen: false,
        resizable: true,
        show: true,
    });

    win.loadFile(path.join(__dirname, '../public/index.html'));

    win.on('closed', () => {
        console.log('Main window closed. Don\'t worry, we won\'t cry... much.');
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        console.log('All windows closed. Time to hit the road, Jack!');
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        console.log('Reactivating the app. Like a bad penny, it just keeps coming back!');
        createWindow();
    }
});

// IPC handlers for file encryption and decryption
ipcMain.on('encrypt-file', async (event, filePath, password, action, outputPath) => {
    if (!filePath || typeof filePath !== 'string') {
        event.reply('encryption-failure', 'Invalid or missing file path.');
        return;
    }
    if (!password) {
        event.reply('encryption-failure', 'Password is required.');
        return;
    }
    let finalOutputPath = outputPath;
    if (!finalOutputPath) {
        // If renderer did not supply a save path, default to same folder as original file.
        const parsed = path.parse(filePath);
        finalOutputPath = path.join(parsed.dir, parsed.base + '.enc');
    }
    const { encryptFile } = require('./encryption/encrypt');
    const options = {
        delete: action === 'delete',
        eraseTraces: action === 'erase',
    };
    try {
        await encryptFile(filePath, password, options, finalOutputPath);
        // After encryption completes, verify that the output file exists and is not empty
        try {
            if (!fs.existsSync(finalOutputPath) || fs.statSync(finalOutputPath).size === 0) {
                throw new Error('Output file not created or is empty.');
            }
        } catch (verErr) {
            event.reply('encryption-failure', verErr.message);
            return;
        }
        // Extra safety: ensure the original file is handled according to user's choice
        if ((action === 'delete' || action === 'erase') && fs.existsSync(filePath)) {
            // Attempt one more time to delete any straggler
            try {
                fs.unlinkSync(filePath);
            } catch (delErr) {
                event.reply('encryption-failure', `Failed to delete original file after encryption: ${delErr.message}`);
                return;
            }
            if (fs.existsSync(filePath)) {
                event.reply('encryption-failure', 'Original file still exists after attempted deletion.');
                return;
            }
        }
        // Reply with success including the action that was taken for the original file
        event.reply('encryption-success', finalOutputPath, action);
    } catch (err) {
        event.reply('encryption-failure', err.message);
    }
});

// Enhanced decrypt file handler
ipcMain.on('decrypt-file', async (event, filePath, password) => {
    console.log('Decrypt request received:', { filePath, hasPassword: !!password });
    
    if (!filePath || typeof filePath !== 'string') {
        console.error('Invalid file path:', filePath);
        event.reply('decryption-failure', 'Invalid or missing file path.');
        return;
    }
    if (!password) {
        console.error('No password provided');
        event.reply('decryption-failure', 'Password is required.');
        return;
    }

    try {
        const { decryptFile } = require('./encryption/decrypt');
        console.log('Attempting to decrypt:', filePath);
        const outputPath = await decryptFile(filePath, password);
        console.log('Decryption successful, output:', outputPath);
        event.reply('decryption-success', outputPath);
    } catch (err) {
        console.error('Decryption error:', err);
        event.reply('decryption-failure', err.message);
    }
});

// Scan directory for encrypted files (non-blocking with progress updates)
ipcMain.on('scan-directory', async (event, dirPath) => {
    try {
        if (!fs.existsSync(dirPath)) {
            event.reply('scan-error', 'Directory does not exist.');
            return;
        }

        const encryptedFiles = [];
        let scannedCount = 0;
        let directoriesProcessed = 0;
        
        const scanRecursively = async (currentPath) => {
            try {
                const items = await fs.promises.readdir(currentPath);
                directoriesProcessed++;
                
                // Send progress update every 10 directories
                if (directoriesProcessed % 10 === 0) {
                    event.reply('scan-progress', { 
                        directoriesProcessed, 
                        filesFound: encryptedFiles.length,
                        currentPath: currentPath.length > 50 ? '...' + currentPath.slice(-50) : currentPath
                    });
                }
                
                for (const item of items) {
                    const fullPath = path.join(currentPath, item);
                    
                    try {
                        const stats = await fs.promises.stat(fullPath);
                        scannedCount++;
                        
                        if (stats.isDirectory()) {
                            // Yield control periodically to prevent blocking
                            if (scannedCount % 100 === 0) {
                                await new Promise(resolve => setImmediate(resolve));
                            }
                            await scanRecursively(fullPath); // Recursive scan
                        } else if (path.extname(item) === '.enc') {
                            encryptedFiles.push({
                                name: item,
                                path: fullPath,
                                size: stats.size,
                                modified: stats.mtime.toISOString(),
                                directory: currentPath
                            });
                        }
                    } catch (statErr) {
                        // Skip files we can't access (permissions, etc.)
                        console.warn(`Could not access ${fullPath}:`, statErr.message);
                    }
                }
            } catch (err) {
                console.warn(`Could not read directory ${currentPath}:`, err.message);
            }
        };

        await scanRecursively(dirPath);
        event.reply('scan-results', encryptedFiles);
    } catch (err) {
        event.reply('scan-error', err.message);
    }
});

// Delete encrypted file
ipcMain.on('delete-encrypted-file', (event, filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            event.reply('file-operation-error', 'File does not exist.');
            return;
        }

        fs.unlinkSync(filePath);
        event.reply('file-deleted', filePath);
    } catch (err) {
        event.reply('file-operation-error', `Failed to delete file: ${err.message}`);
    }
});

// Rename encrypted file
ipcMain.on('rename-encrypted-file', (event, oldPath, newName) => {
    try {
        if (!fs.existsSync(oldPath)) {
            event.reply('file-operation-error', 'File does not exist.');
            return;
        }

        const directory = path.dirname(oldPath);
        const newPath = path.join(directory, newName);

        if (fs.existsSync(newPath)) {
            event.reply('file-operation-error', 'A file with that name already exists.');
            return;
        }

        fs.renameSync(oldPath, newPath);
        event.reply('file-renamed', oldPath, newPath);
    } catch (err) {
        event.reply('file-operation-error', `Failed to rename file: ${err.message}`);
    }
});

// IPC handlers for window controls
const performWithWindow = (event, cb) => {
    let win = BrowserWindow.fromWebContents(event.sender);
    if (!win) win = BrowserWindow.getFocusedWindow();
    if (win) cb(win);
};

ipcMain.on('window-minimize', (event) => {
    performWithWindow(event, (win) => win.minimize());
});

ipcMain.on('window-maximize', (event) => {
    performWithWindow(event, (win) => {
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    });
});

ipcMain.on('window-close', (event) => {
    performWithWindow(event, (win) => {
        win.close();
        // Force quit the app when the main window is closed
        if (BrowserWindow.getAllWindows().length <= 1) {
            app.quit();
        }
    });
});

// IPC handler for save dialog (always ask user)
ipcMain.handle('show-save-dialog', async (event, defaultName) => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showSaveDialog(win, {
        title: 'Choose where to save your encrypted file',
        defaultPath: defaultName || 'encrypted.enc',
        buttonLabel: 'Save Here',
        filters: [
            { name: 'Encrypted Files', extensions: ['enc'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['createDirectory', 'showOverwriteConfirmation']
    });
    return result;
});

// IPC handler for open dialog (directory selection)
ipcMain.handle('show-open-dialog', async (event, options) => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(win, options);
    return result;
});

// New IPC handler to show file in folder
ipcMain.on('show-in-folder', (event, filePath) => {
    const { shell } = require('electron');
    if (filePath) {
        shell.showItemInFolder(filePath);
    }
});

// Handle app quit more forcefully
app.on('before-quit', (event) => {
    console.log('App is quitting...');
});

// Force quit when all windows are closed
app.on('window-all-closed', () => {
    console.log('All windows closed, quitting app...');
    app.quit();
});