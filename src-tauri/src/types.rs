use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptionOptions {
    pub delete_original: bool,
    pub erase_traces: bool,
    pub compression_enabled: bool,
    pub integrity_check: bool,
}

impl Default for EncryptionOptions {
    fn default() -> Self {
        Self {
            delete_original: false,
            erase_traces: false,
            compression_enabled: true,
            integrity_check: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptionResult {
    pub success: bool,
    pub output_path: PathBuf,
    pub original_size: u64,
    pub encrypted_size: u64,
    pub compression_ratio: Option<f64>,
    pub processing_time_ms: u64,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
    pub name: String,
    pub path: PathBuf,
    pub size: u64,
    pub modified: DateTime<Utc>,
    pub directory: PathBuf,
    pub is_encrypted: bool,
    pub encryption_version: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanProgress {
    pub directories_processed: u64,
    pub files_found: u64,
    pub current_path: String,
    pub is_complete: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptionMetadata {
    pub version: String,
    pub algorithm: String,
    pub key_derivation: String,
    pub salt: Vec<u8>,
    pub iv: Vec<u8>,
    pub compressed: bool,
    pub original_filename: String,
    pub created_at: DateTime<Utc>,
    pub integrity_hash: Option<Vec<u8>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchOperation {
    pub files: Vec<PathBuf>,
    pub password: String,
    pub options: EncryptionOptions,
    pub output_directory: Option<PathBuf>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchResult {
    pub total_files: usize,
    pub successful: usize,
    pub failed: usize,
    pub errors: Vec<String>,
    pub results: Vec<EncryptionResult>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecuritySettings {
    pub key_derivation_iterations: u32,
    pub memory_cost: u32,
    pub parallelism: u32,
    pub salt_length: usize,
    pub iv_length: usize,
    pub tag_length: usize,
}

impl Default for SecuritySettings {
    fn default() -> Self {
        Self {
            key_derivation_iterations: 100_000, // High iteration count for security
            memory_cost: 65536, // 64MB for Argon2
            parallelism: 4,
            salt_length: 32,
            iv_length: 12, // For AES-GCM
            tag_length: 16, // For AES-GCM
        }
    }
}