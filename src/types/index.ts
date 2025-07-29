export interface EncryptionOptions {
  delete_original: boolean;
  erase_traces: boolean;
  compression_enabled: boolean;
  integrity_check: boolean;
}

export interface EncryptionResult {
  success: boolean;
  output_path: string;
  original_size: number;
  encrypted_size: number;
  compression_ratio?: number;
  processing_time_ms: number;
  message: string;
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  modified: string;
  directory: string;
  is_encrypted: boolean;
  encryption_version?: string;
}

export interface ScanProgress {
  directories_processed: number;
  files_found: number;
  current_path: string;
  is_complete: boolean;
}

export interface BatchOperation {
  files: string[];
  password: string;
  options: EncryptionOptions;
  output_directory?: string;
}

export interface BatchResult {
  total_files: number;
  successful: number;
  failed: number;
  errors: string[];
  results: EncryptionResult[];
}

export interface SecuritySettings {
  key_derivation_iterations: number;
  memory_cost: number;
  parallelism: number;
  salt_length: number;
  iv_length: number;
  tag_length: number;
}

export interface AppState {
  selectedFile: FileInfo | null;
  password: string;
  decryptPassword: string;
  action: 'keep' | 'delete' | 'erase';
  outputPath: string;
  message: Message | null;
  activeTab: 'encrypt' | 'decrypt' | 'manage';
  currentDirectory: string;
  encryptedFiles: FileInfo[];
  selectedEncryptedFile: FileInfo | null;
  isScanning: boolean;
  scanProgress: ScanProgress | null;
  sortBy: 'name' | 'date' | 'size';
  sortOrder: 'asc' | 'desc';
  searchTerm: string;
  dragOver: boolean;
  uploadedFiles: FileInfo[];
  isProcessing: boolean;
  processingProgress: number;
  processingMessage: string;
  joke: string;
}

export interface Message {
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
  duration?: number;
}

export interface WindowControls {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
}

export interface TauriAPI {
  encrypt_file: (filePath: string, password: string, options: EncryptionOptions, outputPath?: string) => Promise<EncryptionResult>;
  decrypt_file: (filePath: string, password: string) => Promise<EncryptionResult>;
  scan_directory: (dirPath: string) => Promise<FileInfo[]>;
  verify_password: (filePath: string, password: string) => Promise<boolean>;
  get_random_joke: () => Promise<string>;
  get_encryption_joke: () => Promise<string>;
  get_decryption_joke: () => Promise<string>;
  get_error_joke: () => Promise<string>;
  get_success_joke: () => Promise<string>;
  show_open_dialog: (options: any) => Promise<any>;
  show_save_dialog: (options: any) => Promise<any>;
  show_in_folder: (filePath: string) => Promise<void>;
}

declare global {
  interface Window {
    __TAURI__: {
      invoke: (command: string, args?: any) => Promise<any>;
      event: {
        listen: (event: string, callback: (event: any) => void) => Promise<() => void>;
        emit: (event: string, payload?: any) => Promise<void>;
      };
      dialog: {
        open: (options: any) => Promise<any>;
        save: (options: any) => Promise<any>;
      };
      shell: {
        open: (path: string) => Promise<void>;
      };
    };
  }
}