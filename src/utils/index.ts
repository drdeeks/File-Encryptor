import { invoke } from '@tauri-apps/api/tauri';
import { open, save } from '@tauri-apps/api/dialog';
import { open as shellOpen } from '@tauri-apps/api/shell';
import type { 
  EncryptionOptions, 
  EncryptionResult, 
  FileInfo, 
  Message,
  TauriAPI 
} from '../types';

// Tauri API wrapper
export const tauriAPI: TauriAPI = {
  encrypt_file: async (filePath: string, password: string, options: EncryptionOptions, outputPath?: string) => {
    return invoke('encrypt_file_command', { filePath, password, options, outputPath });
  },
  
  decrypt_file: async (filePath: string, password: string) => {
    return invoke('decrypt_file_command', { filePath, password });
  },
  
  scan_directory: async (dirPath: string) => {
    return invoke('scan_directory_command', { dirPath });
  },
  
  verify_password: async (filePath: string, password: string) => {
    return invoke('verify_password_command', { filePath, password });
  },
  
  get_random_joke: async () => {
    return invoke('get_random_joke');
  },
  
  get_encryption_joke: async () => {
    return invoke('get_encryption_joke');
  },
  
  get_decryption_joke: async () => {
    return invoke('get_decryption_joke');
  },
  
  get_error_joke: async () => {
    return invoke('get_error_joke');
  },
  
  get_success_joke: async () => {
    return invoke('get_success_joke');
  },
  
  show_open_dialog: async (options: any) => {
    return open(options);
  },
  
  show_save_dialog: async (options: any) => {
    return save(options);
  },
  
  show_in_folder: async (filePath: string) => {
    return shellOpen(filePath);
  },
};

// File size formatting
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Date formatting
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Processing time formatting
export function formatProcessingTime(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  } else if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}

// Compression ratio formatting
export function formatCompressionRatio(ratio: number): string {
  const percentage = ((1 - ratio) * 100).toFixed(1);
  return `${percentage}% smaller`;
}

// Message creation helpers
export function createMessage(
  type: Message['type'], 
  text: string, 
  duration: number = 5000
): Message {
  return { type, text, duration };
}

export function createSuccessMessage(text: string, duration?: number): Message {
  return createMessage('success', text, duration);
}

export function createErrorMessage(text: string, duration?: number): Message {
  return createMessage('error', text, duration);
}

export function createWarningMessage(text: string, duration?: number): Message {
  return createMessage('warning', text, duration);
}

export function createInfoMessage(text: string, duration?: number): Message {
  return createMessage('info', text, duration);
}

// File validation
export function validateFile(file: FileInfo): string | null {
  if (!file.path) {
    return 'File path is required';
  }
  
  if (file.size === 0) {
    return 'File is empty';
  }
  
  if (file.size > 1024 * 1024 * 1024 * 2) { // 2GB limit
    return 'File is too large (max 2GB)';
  }
  
  return null;
}

// Password validation
export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required';
  }
  
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  
  if (password.length > 128) {
    return 'Password is too long (max 128 characters)';
  }
  
  return null;
}

// File sorting
export function sortFiles(files: FileInfo[], sortBy: 'name' | 'date' | 'size', sortOrder: 'asc' | 'desc'): FileInfo[] {
  return [...files].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
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
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
}

// File filtering
export function filterFiles(files: FileInfo[], searchTerm: string): FileInfo[] {
  if (!searchTerm) return files;
  
  const term = searchTerm.toLowerCase();
  return files.filter(file => 
    file.name.toLowerCase().includes(term) ||
    file.directory.toLowerCase().includes(term)
  );
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Check if running in Tauri
export function isTauri(): boolean {
  return typeof window !== 'undefined' && window.__TAURI__ !== undefined;
}

// Get file extension
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

// Check if file is encrypted
export function isEncryptedFile(filename: string): boolean {
  return getFileExtension(filename) === 'enc';
}

// Get file name without extension
export function getFileNameWithoutExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex === -1 ? filename : filename.substring(0, lastDotIndex);
}