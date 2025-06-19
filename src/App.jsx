import React, { useState, useEffect } from 'react';
import './styles.css';

const darkJokes = [
  "Encrypting your files, because therapy is too expensive.",
  "Deleting files like your ex deletes your number.",
  "Keeping files? Bold move. Hope you don't regret it.",
  "Erasing traces like a pro—no one will ever know you had that file. Probably.",
  "Remember: If you forget your password, not even your future self can save you."
];

function getRandomJoke() {
  return darkJokes[Math.floor(Math.random() * darkJokes.length)];
}

const initialHistory = [];
const LOCAL_HISTORY_KEY = 'file-encryptor-history';

// Use window.electron.ipcRenderer in the renderer process
const ipcRenderer = window.electron && window.electron.ipcRenderer ? window.electron.ipcRenderer : null;

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [password, setPassword] = useState('');
  const [action, setAction] = useState('keep');
  const [history, setHistory] = useState(initialHistory);
  const [joke, setJoke] = useState(getRandomJoke());
  const [outputPath, setOutputPath] = useState('');
  const [message, setMessage] = useState(null);
  const [lastOutputPath, setLastOutputPath] = useState('');
  const [uiScale, setUiScale] = useState(() => {
    const saved = localStorage.getItem('ui-scale');
    return saved ? Number(saved) : 100;
  });

  // New state for file management
  const [activeTab, setActiveTab] = useState('encrypt');
  const [currentDirectory, setCurrentDirectory] = useState('');
  const [encryptedFiles, setEncryptedFiles] = useState([]);
  const [selectedEncryptedFile, setSelectedEncryptedFile] = useState(null);
  const [decryptPassword, setDecryptPassword] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(null);
  const [sortBy, setSortBy] = useState('name'); // name, date, size
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Apply zoom based on uiScale
  useEffect(() => {
    document.body.style.zoom = `${uiScale}%`;
    localStorage.setItem('ui-scale', uiScale);
  }, [uiScale]);

  const handleFileChange = (e) => {
    // Web file input doesn't provide real paths for security reasons
    // We'll use this to trigger the proper file dialog
    handleChooseFile();
  };

  const handleChooseFile = () => {
    if (ipcRenderer) {
      ipcRenderer.invoke('show-open-dialog', {
        properties: ['openFile'],
        title: 'Select file to encrypt',
        buttonLabel: 'Select File',
        filters: [
          { name: 'All Files', extensions: ['*'] }
        ]
      }).then(result => {
        if (!result.canceled && result.filePaths.length > 0) {
          const filePath = result.filePaths[0];
          const fileName = filePath.split(/[/\\]/).pop();
          setSelectedFile({
            name: fileName,
            path: filePath,
            size: 0 // We'll get this from the file system if needed
          });
          setJoke(getRandomJoke());
        }
      }).catch(err => {
        setMessage({
          type: 'error',
          text: `Failed to select file: ${err.message}`
        });
      });
    }
  };

  const handleChooseOutput = () => {
    if (ipcRenderer) {
      ipcRenderer.invoke('show-save-dialog', selectedFile ? selectedFile.name + '.enc' : 'encrypted.enc')
        .then(result => {
          if (!result.canceled && result.filePath) {
            setOutputPath(result.filePath);
          }
        });
    }
  };

  // Browse for directory to scan for encrypted files
  const handleBrowseDirectory = () => {
    if (ipcRenderer) {
      ipcRenderer.invoke('show-open-dialog', { properties: ['openDirectory'] })
        .then(result => {
          if (!result.canceled && result.filePaths.length > 0) {
            const dirPath = result.filePaths[0];
            setCurrentDirectory(dirPath);
            scanDirectoryForEncryptedFiles(dirPath);
          }
        });
    }
  };

  // Scan directory for .enc files
  const scanDirectoryForEncryptedFiles = (dirPath) => {
    if (ipcRenderer) {
      setIsScanning(true);
      setScanProgress(null);
      setMessage(null);
      ipcRenderer.send('scan-directory', dirPath);
    }
  };

  // Refresh current directory
  const handleRefreshDirectory = () => {
    if (currentDirectory) {
      scanDirectoryForEncryptedFiles(currentDirectory);
    }
  };

  // Sort and filter encrypted files (including uploaded ones)
  const getSortedAndFilteredFiles = () => {
    const allFiles = [...encryptedFiles, ...uploadedFiles];
    let filtered = allFiles.filter(file => 
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'date':
          aVal = new Date(a.modified);
          bVal = new Date(b.modified);
          break;
        case 'size':
          aVal = a.size;
          bVal = b.size;
          break;
        default: // name
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Decrypt selected file
  const handleDecryptFile = () => {
    if (!selectedEncryptedFile || !decryptPassword) {
      setMessage({
        type: 'error',
        text: 'Please select a file and enter the decryption password. Even encrypted files need love!'
      });
      return;
    }

    // Check if this is an uploaded file without a proper path
    if (selectedEncryptedFile.isUploaded && (!selectedEncryptedFile.path || selectedEncryptedFile.path.trim() === '')) {
      // For uploaded files without paths, ask user to select the file again
      if (ipcRenderer) {
        ipcRenderer.invoke('show-open-dialog', {
          properties: ['openFile'],
          title: 'Select the encrypted file to decrypt',
          buttonLabel: 'Select File',
          filters: [
            { name: 'Encrypted Files', extensions: ['enc'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        }).then(result => {
          if (!result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0];
            console.log('User selected file for decryption:', filePath);
            ipcRenderer.send('decrypt-file', filePath, decryptPassword);
          }
        }).catch(err => {
          setMessage({
            type: 'error',
            text: `Failed to select file: ${err.message}`
          });
        });
      }
      return;
    }

    // Additional validation for file path
    if (!selectedEncryptedFile.path || typeof selectedEncryptedFile.path !== 'string') {
      setMessage({
        type: 'error',
        text: `Invalid file path for selected file. Please try selecting the file from the file system instead of uploading.`
      });
      console.error('Invalid selectedEncryptedFile:', selectedEncryptedFile);
      return;
    }

    setMessage(null);
    if (ipcRenderer) {
      console.log('Sending decrypt request:', { path: selectedEncryptedFile.path, hasPassword: !!decryptPassword });
      ipcRenderer.send('decrypt-file', selectedEncryptedFile.path, decryptPassword);
    }
  };

  // Delete encrypted file
  const handleDeleteEncryptedFile = (filePath) => {
    if (confirm('Are you sure you want to delete this encrypted file? This action cannot be undone, just like your regrets.')) {
      if (ipcRenderer) {
        ipcRenderer.send('delete-encrypted-file', filePath);
      }
    }
  };

  // Rename encrypted file
  const handleRenameEncryptedFile = (filePath, currentName) => {
    const newName = prompt('Enter new name (without .enc extension):', currentName.replace('.enc', ''));
    if (newName && newName.trim()) {
      if (ipcRenderer) {
        ipcRenderer.send('rename-encrypted-file', filePath, newName.trim() + '.enc');
      }
    }
  };

  // Load history from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        } else {
          setHistory([]);
        }
      } catch {
        setHistory([]);
      }
    } else {
      setHistory([]);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (!ipcRenderer) return;

    const onSuccess = (_event, outputPath, actionConfirmed) => {
      setLastOutputPath(outputPath);
      setMessage({
        type: 'success',
        text: `Encryption successful! Your secrets are now locked up tighter than your childhood traumas. Saved to: ${outputPath}. Action taken: ${actionConfirmed === 'delete' ? 'Deleted original file' : actionConfirmed === 'erase' ? 'Erased traces of original file' : 'Kept original file'}.`
      });
      setHistory(prev => [
        {
          name: selectedFile ? selectedFile.name : 'Unknown',
          date: new Date().toLocaleString(),
          action: actionConfirmed || action,
        },
        ...prev,
      ]);
      setJoke(getRandomJoke());
      setSelectedFile(null);
      setPassword('');
      setOutputPath('');
      
      // Refresh directory if we're on the browse tab
      if (activeTab === 'browse' && currentDirectory) {
        handleRefreshDirectory();
      }
    };

    const onFailure = (_event, error) => {
      setMessage({
        type: 'error',
        text: `Encryption failed! Even your files are trying to escape you. Error: ${error}`
      });
    };

    const onDecryptSuccess = (_event, outputPath) => {
      setMessage({
        type: 'success',
        text: `Decryption successful! Your file has been resurrected: ${outputPath}. Welcome back to the land of the living!`
      });
      setDecryptPassword('');
      setSelectedEncryptedFile(null);
      
      // Refresh directory
      if (currentDirectory) {
        handleRefreshDirectory();
      }
    };

    const onDecryptFailure = (_event, error) => {
      setMessage({
        type: 'error',
        text: `Decryption failed! Wrong password or the file is corrupted beyond repair. Error: ${error}`
      });
    };

    const onScanResults = (_event, files) => {
      setEncryptedFiles(files);
      setIsScanning(false);
      setScanProgress(null);
      setMessage({
        type: 'success',
        text: `Found ${files.length} encrypted files. ${files.length === 0 ? 'Maybe they\'re hiding from you.' : 'Ready for your dark magic!'}`
      });
    };

    const onScanError = (_event, error) => {
      setIsScanning(false);
      setScanProgress(null);
      setMessage({
        type: 'error',
        text: `Failed to scan directory: ${error}`
      });
    };

    const onScanProgress = (_event, progress) => {
      setScanProgress(progress);
    };

    const onFileDeleted = (_event, filePath) => {
      setEncryptedFiles(prev => prev.filter(file => file.path !== filePath));
      setMessage({
        type: 'success',
        text: 'File deleted successfully. Another one bites the dust!'
      });
      if (selectedEncryptedFile && selectedEncryptedFile.path === filePath) {
        setSelectedEncryptedFile(null);
      }
    };

    const onFileRenamed = (_event, oldPath, newPath) => {
      setEncryptedFiles(prev => prev.map(file => 
        file.path === oldPath 
          ? { ...file, path: newPath, name: newPath.split(/[/\\]/).pop() }
          : file
      ));
      setMessage({
        type: 'success',
        text: 'File renamed successfully. New identity, same secrets!'
      });
      if (selectedEncryptedFile && selectedEncryptedFile.path === oldPath) {
        setSelectedEncryptedFile(prev => ({ 
          ...prev, 
          path: newPath, 
          name: newPath.split(/[/\\]/).pop() 
        }));
      }
    };

    const onFileOperationError = (_event, error) => {
      setMessage({
        type: 'error',
        text: `File operation failed: ${error}`
      });
    };

    ipcRenderer.on('encryption-success', onSuccess);
    ipcRenderer.on('encryption-failure', onFailure);
    ipcRenderer.on('decryption-success', onDecryptSuccess);
    ipcRenderer.on('decryption-failure', onDecryptFailure);
    ipcRenderer.on('scan-results', onScanResults);
    ipcRenderer.on('scan-error', onScanError);
    ipcRenderer.on('scan-progress', onScanProgress);
    ipcRenderer.on('file-deleted', onFileDeleted);
    ipcRenderer.on('file-renamed', onFileRenamed);
    ipcRenderer.on('file-operation-error', onFileOperationError);

    return () => {
      ipcRenderer.removeListener('encryption-success', onSuccess);
      ipcRenderer.removeListener('encryption-failure', onFailure);
      ipcRenderer.removeListener('decryption-success', onDecryptSuccess);
      ipcRenderer.removeListener('decryption-failure', onDecryptFailure);
      ipcRenderer.removeListener('scan-results', onScanResults);
      ipcRenderer.removeListener('scan-error', onScanError);
      ipcRenderer.removeListener('scan-progress', onScanProgress);
      ipcRenderer.removeListener('file-deleted', onFileDeleted);
      ipcRenderer.removeListener('file-renamed', onFileRenamed);
      ipcRenderer.removeListener('file-operation-error', onFileOperationError);
    };
  }, [ipcRenderer, selectedFile, action, activeTab, currentDirectory, selectedEncryptedFile]);

  const handleEncrypt = () => {
    if (!selectedFile || !password) {
      setMessage({
        type: 'error',
        text: 'Please select a file and enter a password. Even chaos needs some order!'
      });
      return;
    }
    
    setMessage(null);
    if (ipcRenderer) {
      // Use the proper file path from the selected file object
      const filePath = selectedFile.path;
      if (!filePath) {
        setMessage({
          type: 'error',
          text: 'Invalid file path. Please select a file again.'
        });
        return;
      }
      
      ipcRenderer.send('encrypt-file', filePath, password, action, outputPath);
    }
  };

  // Export history as JSON file
  const handleExportHistory = () => {
    const data = JSON.stringify(history, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `file-encryptor-history-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Import history from JSON file
  const handleImportHistory = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          setHistory(imported);
          setMessage({ type: 'success', text: 'History imported! Your past is now part of your present. Scary.' });
        } else {
          setMessage({ type: 'error', text: 'Invalid history file. Even your past is corrupted.' });
        }
      } catch {
        setMessage({ type: 'error', text: 'Failed to import history. Some skeletons are best left in the closet.' });
      }
    };
    reader.readAsText(file);
  };

  // Show in folder (after encryption)
  const handleShowInFolder = (filePath) => {
    if (ipcRenderer && filePath) {
      ipcRenderer.send('show-in-folder', filePath);
    }
  };

  // Drag and drop handlers for encrypted files
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const encFiles = files.filter(file => file.name.endsWith('.enc'));
    
    if (encFiles.length === 0) {
      setMessage({
        type: 'error',
        text: 'Please drop only .enc files. Other files are not welcome at this dark party!'
      });
      return;
    }

    // Process each dropped .enc file
    const newUploadedFiles = encFiles.map(file => ({
      name: file.name,
      path: file.path || file.webkitRelativePath || '', // Available in Electron, fallback options
      size: file.size,
      modified: new Date(file.lastModified).toISOString(),
      directory: 'Uploaded',
      isUploaded: true,
      fileObject: file // Store the file object for reading later
    }));

    setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
    setMessage({
      type: 'success',
      text: `Added ${encFiles.length} encrypted file(s) to the list. Time to unlock some secrets!`
    });
  };

  // File input handler for manual file selection
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const encFiles = files.filter(file => file.name.endsWith('.enc'));
    
    if (encFiles.length === 0) {
      setMessage({
        type: 'error',
        text: 'Please select only .enc files. We only deal in encrypted mysteries here!'
      });
      return;
    }

    const newUploadedFiles = encFiles.map(file => ({
      name: file.name,
      path: file.path || file.webkitRelativePath || '',
      size: file.size,
      modified: new Date(file.lastModified).toISOString(),
      directory: 'Uploaded',
      isUploaded: true,
      fileObject: file // Store the file object for reading later
    }));

    setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
    setMessage({
      type: 'success',
      text: `Added ${encFiles.length} encrypted file(s) to the list. Ready for decryption!`
    });
    
    // Clear the input
    e.target.value = '';
  };

  // Remove uploaded file
  const handleRemoveUploadedFile = (filePath) => {
    setUploadedFiles(prev => prev.filter(file => file.path !== filePath));
    if (selectedEncryptedFile && selectedEncryptedFile.path === filePath) {
      setSelectedEncryptedFile(null);
    }
  };

  const sortedFiles = getSortedAndFilteredFiles();

  return (
    <div className="app-container">
      <header>
        <h1>File Encryptor GUI</h1>
        {/* Window controls for Electron */}
        <div className="window-controls-fixed">
          <button className="window-btn" aria-label="Minimize" tabIndex={0} style={{background: '#23272a'}} onClick={() => window.electron?.ipcRenderer?.send('window-minimize')}>_</button>
          <button className="window-btn" aria-label="Maximize" tabIndex={0} style={{background: '#23272a'}} onClick={() => window.electron?.ipcRenderer?.send('window-maximize')}>▢</button>
          <button className="window-btn close" aria-label="Close" tabIndex={0} style={{background: '#23272a'}} onClick={() => window.electron?.ipcRenderer?.send('window-close')}>×</button>
        </div>
        <div className="joke">{joke}</div>
        {/* UI Scale Slider */}
        <div style={{position:'absolute',left:'2vw',top:'1.5vw',display:'flex',alignItems:'center',gap:'0.5vw'}}>
          <label htmlFor="scaleRange" style={{fontSize:'0.9vw'}}>UI&nbsp;Scale</label>
          <input
            id="scaleRange"
            type="range"
            min="80"
            max="150"
            value={uiScale}
            onChange={(e)=>setUiScale(Number(e.target.value))}
            style={{width:'8vw'}}
          />
        </div>
      </header>
      <main>
        {message && (
          <div className={`message-bar ${message.type}`}>{message.text}
            {message.type === 'success' && lastOutputPath && (
              <button
                className="encrypt-btn"
                style={{marginLeft:'1vw',fontSize:'1vw',padding:'0.3vw 1vw'}}
                onClick={() => {
                  handleShowInFolder(lastOutputPath);
                }}
              >Show in Folder</button>
            )}
          </div>
        )}
        
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'encrypt' ? 'active' : ''}`}
            onClick={() => setActiveTab('encrypt')}
          >
            Encrypt Files
          </button>
          <button 
            className={`tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveTab('browse')}
          >
            Browse Encrypted Files
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'encrypt' && (
          <div className="tab-content">
            <div style={{display:'flex',gap:'1vw',marginBottom:'1vw',justifyContent:'center'}}>
              <button className="encrypt-btn" onClick={handleExportHistory} style={{minWidth:'120px'}}>Export History</button>
              <label className="encrypt-btn" style={{cursor:'pointer',minWidth:'120px',textAlign:'center'}}>
                Import History
                <input type="file" accept="application/json" style={{display:'none'}} onChange={handleImportHistory} />
              </label>
            </div>
            <section className="upload-section">
              <h2>Encrypt a File</h2>
              <div className="file-selection">
                <button onClick={handleChooseFile} className="encrypt-btn file-select-btn">
                  {selectedFile ? `Selected: ${selectedFile.name}` : 'Choose File to Encrypt'}
                </button>
                {selectedFile && (
                  <div className="selected-file-info">
                    <span>📄 {selectedFile.name}</span>
                    <button onClick={() => setSelectedFile(null)} className="clear-btn">✕</button>
                  </div>
                )}
              </div>
              <button onClick={handleChooseOutput} className="encrypt-btn" style={{marginBottom: '1vw'}}>
                Choose Save Location
              </button>
              <div style={{fontSize: '0.95vw', color: '#aaa', marginBottom: '1vw'}}>
                {outputPath ? `Will save as: ${outputPath}` : 'No output location selected. Default will be next to original.'}
              </div>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="password-input"
              />
              <div className="action-group">
                <label>
                  <input
                    type="radio"
                    name="action"
                    value="delete"
                    checked={action === 'delete'}
                    onChange={() => setAction('delete')}
                  />
                  Delete Original (Poof! Gone forever.)
                </label>
                <label>
                  <input
                    type="radio"
                    name="action"
                    value="keep"
                    checked={action === 'keep'}
                    onChange={() => setAction('keep')}
                  />
                  Keep Original (Because sometimes you just want to hold onto the past.)
                </label>
                <label>
                  <input
                    type="radio"
                    name="action"
                    value="erase"
                    checked={action === 'erase'}
                    onChange={() => setAction('erase')}
                  />
                  Erase Traces (Feel like a secret agent.)
                </label>
              </div>
              <button onClick={handleEncrypt} className="encrypt-btn" disabled={!selectedFile || !password}>
                Encrypt
              </button>
            </section>
          </div>
        )}

        {activeTab === 'browse' && (
          <div className="tab-content">
            <section className="browse-section">
              <h2>Browse Encrypted Files</h2>
              
              {/* Upload Section */}
              <div className="upload-section-browse">
                <div 
                  className={`drag-drop-zone ${dragOver ? 'drag-over' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="drag-drop-content">
                    <div className="drag-drop-icon">📁</div>
                    <div className="drag-drop-text">
                      <strong>Drag & Drop .enc files here</strong>
                      <p>or click to select files manually</p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept=".enc"
                      onChange={handleFileUpload}
                      className="file-input-hidden"
                      id="enc-file-upload"
                    />
                    <label htmlFor="enc-file-upload" className="upload-btn">
                      Choose .enc Files
                    </label>
                  </div>
                </div>
                
                {uploadedFiles.length > 0 && (
                  <div className="uploaded-files-info">
                    <span>📤 {uploadedFiles.length} file(s) uploaded</span>
                    <button 
                      onClick={() => setUploadedFiles([])} 
                      className="clear-uploads-btn"
                      title="Clear all uploaded files"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>
              
              {/* Directory Selection */}
              <div className="directory-controls">
                <button onClick={handleBrowseDirectory} className="encrypt-btn">
                  Select Directory
                </button>
                {currentDirectory && (
                  <>
                    <button onClick={handleRefreshDirectory} className="encrypt-btn" disabled={isScanning}>
                      {isScanning ? 'Scanning...' : 'Refresh'}
                    </button>
                    <div className="current-directory">
                      Current: {currentDirectory}
                    </div>
                  </>
                )}
                
                {/* Scanning Progress */}
                {isScanning && scanProgress && (
                  <div className="scan-progress">
                    <div className="progress-info">
                      <span>🔍 Scanning: {scanProgress.currentPath}</span>
                      <span>📁 {scanProgress.directoriesProcessed} directories | 🔒 {scanProgress.filesFound} encrypted files</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Search and Sort Controls */}
              {encryptedFiles.length > 0 && (
                <div className="file-controls">
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sort-select"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="date">Sort by Date</option>
                    <option value="size">Sort by Size</option>
                  </select>
                  <button 
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="sort-order-btn"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              )}

              {/* File List */}
              {sortedFiles.length > 0 ? (
                <div className="encrypted-files-list">
                  <div className="files-grid">
                    {sortedFiles.map((file, index) => (
                      <div 
                        key={index} 
                        className={`file-item ${selectedEncryptedFile?.path === file.path ? 'selected' : ''}`}
                        onClick={() => setSelectedEncryptedFile(file)}
                      >
                        <div className="file-icon">
                          {file.isUploaded ? '📤' : '🔒'}
                        </div>
                        <div className="file-info">
                          <div className="file-name" title={file.name}>
                            {file.name}
                            {file.isUploaded && <span className="uploaded-badge">Uploaded</span>}
                          </div>
                          <div className="file-details">
                            <span>{formatFileSize(file.size)}</span>
                            <span>{new Date(file.modified).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="file-actions">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowInFolder(file.path);
                            }}
                            className="action-btn"
                            title="Show in folder"
                          >
                            📁
                          </button>
                          {!file.isUploaded && (
                            <>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRenameEncryptedFile(file.path, file.name);
                                }}
                                className="action-btn"
                                title="Rename"
                              >
                                ✏️
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEncryptedFile(file.path);
                                }}
                                className="action-btn delete"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                          {file.isUploaded && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveUploadedFile(file.path);
                              }}
                              className="action-btn delete"
                              title="Remove from list"
                            >
                              ❌
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : currentDirectory && !isScanning ? (
                <div className="empty-directory">
                  No encrypted files found in this directory. Your secrets are well hidden... or nonexistent.
                </div>
              ) : !currentDirectory ? (
                <div className="no-directory">
                  Select a directory to browse for encrypted files. Time to go treasure hunting!
                </div>
              ) : null}

              {/* Decryption Panel */}
              {selectedEncryptedFile && (
                <section className="decrypt-section">
                  <h3>Decrypt Selected File</h3>
                  <div className="selected-file-info">
                    <strong>Selected:</strong> {selectedEncryptedFile.name}
                    {selectedEncryptedFile.isUploaded && (
                      <div style={{fontSize: '0.9em', color: '#ffa500', marginTop: '0.5em'}}>
                        ⚠️ Uploaded file - you may need to select the file location when decrypting
                      </div>
                    )}
                  </div>
                  <input
                    type="password"
                    placeholder="Enter decryption password"
                    value={decryptPassword}
                    onChange={e => setDecryptPassword(e.target.value)}
                    className="password-input"
                  />
                  <button 
                    onClick={handleDecryptFile} 
                    className="encrypt-btn"
                    disabled={!decryptPassword}
                  >
                    Decrypt File
                  </button>
                </section>
              )}
            </section>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="tab-content">
            <section className="history-section">
              <h2>File History</h2>
              {history.length === 0 ? (
                <div className="empty-history">No files encrypted yet. Your secrets are safe... for now.</div>
              ) : (
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.name}</td>
                        <td>{item.date}</td>
                        <td>{item.action === 'delete' ? 'Deleted' : item.action === 'keep' ? 'Kept' : 'Erased Traces'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        )}
      </main>
      <footer>
        <span>File Encryptor GUI &copy; {new Date().getFullYear()} &mdash; Encrypt wisely, laugh darkly.</span><br/>
        <span className="tagline">Built by Nads, for Nads.</span>
      </footer>
    </div>
  );
};

export default App;
