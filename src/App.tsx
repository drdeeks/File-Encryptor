import React, { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import { 
  Shield, 
  Unlock, 
  FolderOpen, 
  File, 
  Settings, 
  X, 
  Minimize, 
  Maximize, 
  Search,
  SortAsc,
  SortDesc,
  RefreshCw,
  Trash2,
  Eye,
  Download,
  Upload,
  Lock,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { tauriAPI, formatFileSize, formatDate, createSuccessMessage, createErrorMessage } from './utils';
import type { AppState, FileInfo, Message, EncryptionOptions } from './types';
import './App.css';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    selectedFile: null,
    password: '',
    decryptPassword: '',
    action: 'keep',
    outputPath: '',
    message: null,
    activeTab: 'encrypt',
    currentDirectory: '',
    encryptedFiles: [],
    selectedEncryptedFile: null,
    isScanning: false,
    scanProgress: null,
    sortBy: 'name',
    sortOrder: 'asc',
    searchTerm: '',
    dragOver: false,
    uploadedFiles: [],
    isProcessing: false,
    processingProgress: 0,
    processingMessage: '',
    joke: 'Loading dark humor...'
  });

  // Initialize app
  useEffect(() => {
    const initApp = async () => {
      try {
        const joke = await tauriAPI.get_random_joke();
        setState(prev => ({ ...prev, joke }));
      } catch (error) {
        console.error('Failed to load joke:', error);
      }
    };

    initApp();
  }, []);

  // Event listeners
  useEffect(() => {
    const unlisten = listen('scan-progress', (event) => {
      setState(prev => ({ 
        ...prev, 
        scanProgress: event.payload as any,
        isScanning: !event.payload.is_complete 
      }));
    });

    return () => {
      unlisten.then(f => f());
    };
  }, []);

  // File drop handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const fileInfo: FileInfo = {
        name: file.name,
        path: file.path || '',
        size: file.size,
        modified: new Date().toISOString(),
        directory: '',
        is_encrypted: false
      };
      
      setState(prev => ({ 
        ...prev, 
        selectedFile: fileInfo,
        joke: 'File selected... now for the password that you\'ll probably forget'
      }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/*': ['.*'],
      'text/*': ['.*'],
      'image/*': ['.*'],
      'video/*': ['.*'],
      'audio/*': ['.*']
    },
    multiple: false
  });

  // File selection
  const handleChooseFile = async () => {
    try {
      const result = await tauriAPI.show_open_dialog({
        multiple: false,
        filters: [{ name: 'All Files', extensions: ['*'] }]
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const fileName = filePath.split(/[/\\]/).pop() || '';
        
        const fileInfo: FileInfo = {
          name: fileName,
          path: filePath,
          size: 0, // Will be updated
          modified: new Date().toISOString(),
          directory: filePath.substring(0, filePath.lastIndexOf('/') || filePath.lastIndexOf('\\')),
          is_encrypted: false
        };

        setState(prev => ({ 
          ...prev, 
          selectedFile: fileInfo,
          joke: await tauriAPI.get_random_joke()
        }));
      }
    } catch (error) {
      toast.error('Failed to select file');
    }
  };

  // Directory selection
  const handleChooseDirectory = async () => {
    try {
      const result = await tauriAPI.show_open_dialog({
        directory: true,
        multiple: false
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const dirPath = result.filePaths[0];
        setState(prev => ({ 
          ...prev, 
          currentDirectory: dirPath,
          isScanning: true 
        }));

        try {
          const files = await tauriAPI.scan_directory(dirPath);
          setState(prev => ({ 
            ...prev, 
            encryptedFiles: files,
            isScanning: false 
          }));
        } catch (error) {
          toast.error('Failed to scan directory');
          setState(prev => ({ ...prev, isScanning: false }));
        }
      }
    } catch (error) {
      toast.error('Failed to select directory');
    }
  };

  // Encryption
  const handleEncrypt = async () => {
    if (!state.selectedFile || !state.password) {
      toast.error('Please select a file and enter a password');
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isProcessing: true,
      processingMessage: await tauriAPI.get_encryption_joke()
    }));

    try {
      const options: EncryptionOptions = {
        delete_original: state.action === 'delete',
        erase_traces: state.action === 'erase',
        compression_enabled: true,
        integrity_check: true
      };

      const result = await tauriAPI.encrypt_file(
        state.selectedFile.path,
        state.password,
        options,
        state.outputPath || undefined
      );

      if (result.success) {
        toast.success('File encrypted successfully!');
        setState(prev => ({ 
          ...prev, 
          selectedFile: null,
          password: '',
          outputPath: '',
          joke: await tauriAPI.get_success_joke()
        }));
      }
    } catch (error) {
      const errorJoke = await tauriAPI.get_error_joke();
      toast.error(`Encryption failed: ${error}`);
      setState(prev => ({ ...prev, joke: errorJoke }));
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Decryption
  const handleDecrypt = async () => {
    if (!state.selectedEncryptedFile || !state.decryptPassword) {
      toast.error('Please select an encrypted file and enter the password');
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isProcessing: true,
      processingMessage: await tauriAPI.get_decryption_joke()
    }));

    try {
      const result = await tauriAPI.decrypt_file(
        state.selectedEncryptedFile.path,
        state.decryptPassword
      );

      if (result.success) {
        toast.success('File decrypted successfully!');
        setState(prev => ({ 
          ...prev, 
          selectedEncryptedFile: null,
          decryptPassword: '',
          joke: await tauriAPI.get_success_joke()
        }));
      }
    } catch (error) {
      const errorJoke = await tauriAPI.get_error_joke();
      toast.error(`Decryption failed: ${error}`);
      setState(prev => ({ ...prev, joke: errorJoke }));
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Window controls
  const handleMinimize = () => {
    invoke('window_minimize');
  };

  const handleMaximize = () => {
    invoke('window_maximize');
  };

  const handleClose = () => {
    invoke('window_close');
  };

  // Filtered and sorted files
  const filteredFiles = state.encryptedFiles.filter(file =>
    file.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
    file.directory.toLowerCase().includes(state.searchTerm.toLowerCase())
  );

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let comparison = 0;
    switch (state.sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'date':
        comparison = new Date(a.modified).getTime() - new Date(b.modified).getTime();
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
    }
    return state.sortOrder === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Window Title Bar */}
      <div className="flex items-center justify-between bg-card border-b border-border px-4 py-2">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold">File Encryptor</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleMinimize}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <Minimize className="h-4 w-4" />
          </button>
          <button
            onClick={handleMaximize}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <Maximize className="h-4 w-4" />
          </button>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-60px)]">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r border-border p-4">
          <nav className="space-y-2">
            <button
              onClick={() => setState(prev => ({ ...prev, activeTab: 'encrypt' }))}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                state.activeTab === 'encrypt' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted'
              }`}
            >
              <Lock className="h-4 w-4" />
              <span>Encrypt</span>
            </button>
            
            <button
              onClick={() => setState(prev => ({ ...prev, activeTab: 'decrypt' }))}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                state.activeTab === 'decrypt' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted'
              }`}
            >
              <Unlock className="h-4 w-4" />
              <span>Decrypt</span>
            </button>
            
            <button
              onClick={() => setState(prev => ({ ...prev, activeTab: 'manage' }))}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                state.activeTab === 'manage' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted'
              }`}
            >
              <FolderOpen className="h-4 w-4" />
              <span>Manage Files</span>
            </button>
          </nav>

          {/* Dark Humor Section */}
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h3 className="text-sm font-medium mb-2">Dark Humor Corner</h3>
            <p className="text-xs text-muted-foreground italic">
              {state.joke}
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          {state.activeTab === 'encrypt' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Encrypt Files</h2>
                <p className="text-muted-foreground">
                  Secure your files with military-grade encryption and a side of dark humor
                </p>
              </div>

              {/* File Selection */}
              <div className="space-y-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragActive 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  {state.selectedFile ? (
                    <div>
                      <p className="font-medium">{state.selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(state.selectedFile.size)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">Drop a file here, or click to select</p>
                      <p className="text-sm text-muted-foreground">
                        Your secrets are safe with us... probably
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleChooseFile}
                  className="flex items-center space-x-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                >
                  <File className="h-4 w-4" />
                  <span>Choose File</span>
                </button>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <input
                  type="password"
                  value={state.password}
                  onChange={(e) => setState(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter a strong password (you'll regret it if you forget)"
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Action Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">After Encryption</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="keep"
                      checked={state.action === 'keep'}
                      onChange={(e) => setState(prev => ({ ...prev, action: e.target.value as any }))}
                      className="text-primary"
                    />
                    <span>Keep Original</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="delete"
                      checked={state.action === 'delete'}
                      onChange={(e) => setState(prev => ({ ...prev, action: e.target.value as any }))}
                      className="text-primary"
                    />
                    <span>Delete Original</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="erase"
                      checked={state.action === 'erase'}
                      onChange={(e) => setState(prev => ({ ...prev, action: e.target.value as any }))}
                      className="text-primary"
                    />
                    <span>Erase Traces</span>
                  </label>
                </div>
              </div>

              {/* Encrypt Button */}
              <button
                onClick={handleEncrypt}
                disabled={!state.selectedFile || !state.password || state.isProcessing}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {state.isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                <span>
                  {state.isProcessing ? state.processingMessage : 'Encrypt File'}
                </span>
              </button>
            </div>
          )}

          {state.activeTab === 'decrypt' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Decrypt Files</h2>
                <p className="text-muted-foreground">
                  Unlock your secrets... if you remember the password
                </p>
              </div>

              {/* File Selection */}
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  {state.selectedEncryptedFile ? (
                    <div>
                      <File className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="font-medium">{state.selectedEncryptedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(state.selectedEncryptedFile.size)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Unlock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="font-medium">Select an encrypted file</p>
                      <p className="text-sm text-muted-foreground">
                        Hope you remember the password better than your anniversary
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={async () => {
                    try {
                      const result = await tauriAPI.show_open_dialog({
                        multiple: false,
                        filters: [{ name: 'Encrypted Files', extensions: ['enc'] }]
                      });

                      if (!result.canceled && result.filePaths.length > 0) {
                        const filePath = result.filePaths[0];
                        const fileName = filePath.split(/[/\\]/).pop() || '';
                        
                        const fileInfo: FileInfo = {
                          name: fileName,
                          path: filePath,
                          size: 0,
                          modified: new Date().toISOString(),
                          directory: filePath.substring(0, filePath.lastIndexOf('/') || filePath.lastIndexOf('\\')),
                          is_encrypted: true
                        };

                        setState(prev => ({ 
                          ...prev, 
                          selectedEncryptedFile: fileInfo
                        }));
                      }
                    } catch (error) {
                      toast.error('Failed to select file');
                    }
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                >
                  <File className="h-4 w-4" />
                  <span>Choose Encrypted File</span>
                </button>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <input
                  type="password"
                  value={state.decryptPassword}
                  onChange={(e) => setState(prev => ({ ...prev, decryptPassword: e.target.value }))}
                  placeholder="Enter the password you probably forgot"
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Decrypt Button */}
              <button
                onClick={handleDecrypt}
                disabled={!state.selectedEncryptedFile || !state.decryptPassword || state.isProcessing}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {state.isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Unlock className="h-4 w-4" />
                )}
                <span>
                  {state.isProcessing ? state.processingMessage : 'Decrypt File'}
                </span>
              </button>
            </div>
          )}

          {state.activeTab === 'manage' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Manage Encrypted Files</h2>
                  <p className="text-muted-foreground">
                    Browse and manage your encrypted files
                  </p>
                </div>
                
                <button
                  onClick={handleChooseDirectory}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                >
                  <FolderOpen className="h-4 w-4" />
                  <span>Choose Directory</span>
                </button>
              </div>

              {/* Search and Sort */}
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={state.searchTerm}
                    onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                
                <select
                  value={state.sortBy}
                  onChange={(e) => setState(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="name">Name</option>
                  <option value="date">Date</option>
                  <option value="size">Size</option>
                </select>
                
                <button
                  onClick={() => setState(prev => ({ 
                    ...prev, 
                    sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                  }))}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  {state.sortOrder === 'asc' ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* File List */}
              <div className="bg-card rounded-lg border border-border">
                {state.isScanning ? (
                  <div className="p-8 text-center">
                    <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
                    <p>Scanning directory...</p>
                    {state.scanProgress && (
                      <p className="text-sm text-muted-foreground">
                        Found {state.scanProgress.files_found} files
                      </p>
                    )}
                  </div>
                ) : sortedFiles.length > 0 ? (
                  <div className="divide-y divide-border">
                    {sortedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <File className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {file.directory} • {formatFileSize(file.size)} • {formatDate(file.modified)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setState(prev => ({ ...prev, selectedEncryptedFile: file }))}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Decrypt"
                          >
                            <Unlock className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => tauriAPI.show_in_folder(file.path)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Show in folder"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => {
                              // Handle delete
                            }}
                            className="p-2 hover:bg-destructive hover:text-destructive-foreground rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="font-medium">No encrypted files found</p>
                    <p className="text-sm text-muted-foreground">
                      Choose a directory to scan for encrypted files
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
    </div>
  );
};

export default App;