use thiserror::Error;
use std::path::PathBuf;

#[derive(Error, Debug)]
pub enum EncryptionError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("Crypto error: {0}")]
    Crypto(String),
    
    #[error("Invalid password")]
    InvalidPassword,
    
    #[error("File not found: {0}")]
    FileNotFound(PathBuf),
    
    #[error("File already exists: {0}")]
    FileExists(PathBuf),
    
    #[error("Invalid file format: {0}")]
    InvalidFileFormat(String),
    
    #[error("Corrupted encrypted file: {0}")]
    CorruptedFile(String),
    
    #[error("Unsupported encryption version: {0}")]
    UnsupportedVersion(String),
    
    #[error("Memory allocation failed: {0}")]
    MemoryError(String),
    
    #[error("Permission denied: {0}")]
    PermissionDenied(PathBuf),
    
    #[error("Disk space insufficient")]
    InsufficientDiskSpace,
    
    #[error("Operation cancelled by user")]
    Cancelled,
    
    #[error("Timeout occurred during operation")]
    Timeout,
    
    #[error("Compression error: {0}")]
    CompressionError(String),
    
    #[error("Integrity check failed: {0}")]
    IntegrityCheckFailed(String),
    
    #[error("Key derivation failed: {0}")]
    KeyDerivationError(String),
    
    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),
    
    #[error("Unknown error: {0}")]
    Unknown(String),
}

impl From<argon2::Error> for EncryptionError {
    fn from(err: argon2::Error) -> Self {
        EncryptionError::KeyDerivationError(err.to_string())
    }
}

impl From<aes_gcm::Error> for EncryptionError {
    fn from(err: aes_gcm::Error) -> Self {
        EncryptionError::Crypto(format!("AES-GCM error: {}", err))
    }
}

impl From<pbkdf2::Error> for EncryptionError {
    fn from(err: pbkdf2::Error) -> Self {
        EncryptionError::KeyDerivationError(err.to_string())
    }
}

impl From<base64::DecodeError> for EncryptionError {
    fn from(err: base64::DecodeError) -> Self {
        EncryptionError::SerializationError(serde_json::Error::custom(err))
    }
}

impl From<hex::FromHexError> for EncryptionError {
    fn from(err: hex::FromHexError) -> Self {
        EncryptionError::SerializationError(serde_json::Error::custom(err))
    }
}

pub type Result<T> = std::result::Result<T, EncryptionError>;