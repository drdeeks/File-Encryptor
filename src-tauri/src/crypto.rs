use crate::error::{EncryptionError, Result};
use crate::types::{EncryptionMetadata, EncryptionOptions, EncryptionResult, SecuritySettings};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use aes_gcm::aead::{Aead, NewAead};
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::password_hash::rand_core::OsRng;
use base64::{Engine as _, engine::general_purpose};
use chrono::Utc;
use log::{debug, error, info, warn};
use memmap2::Mmap;
use rand::{Rng, RngCore};
use serde_json;
use sha2::{Digest, Sha256};
use std::fs::{self, File, OpenOptions};
use std::io::{Read, Seek, SeekFrom, Write};
use std::path::Path;
use std::time::Instant;
use zeroize::Zeroizing;

const MAGIC_HEADER: &[u8; 8] = b"FE2.0\0\0\0"; // File Encryptor 2.0
const METADATA_SIZE: usize = 1024; // Fixed size for metadata block

pub struct CryptoEngine {
    settings: SecuritySettings,
}

impl Default for CryptoEngine {
    fn default() -> Self {
        Self {
            settings: SecuritySettings::default(),
        }
    }
}

impl CryptoEngine {
    pub fn new(settings: SecuritySettings) -> Self {
        Self { settings }
    }

    pub fn derive_key(&self, password: &str, salt: &[u8]) -> Result<Key<Aes256Gcm>> {
        let salt_string = SaltString::encode_b64(salt)
            .map_err(|e| EncryptionError::KeyDerivationError(e.to_string()))?;
        
        let argon2 = Argon2::new(
            argon2::Algorithm::Argon2id,
            argon2::Version::V0x13,
            argon2::Params::new(
                self.settings.memory_cost,
                self.settings.key_derivation_iterations,
                self.settings.parallelism,
                None,
            ).map_err(|e| EncryptionError::KeyDerivationError(e.to_string()))?,
        );

        let password_hash = argon2
            .hash_password(password.as_bytes(), &salt_string)
            .map_err(|e| EncryptionError::KeyDerivationError(e.to_string()))?;

        let hash_bytes = password_hash.hash.unwrap().as_bytes();
        let key_bytes = &hash_bytes[..32]; // Take first 32 bytes for AES-256
        
        Key::from_slice(key_bytes)
    }

    pub fn generate_salt(&self) -> Result<Vec<u8>> {
        let mut salt = vec![0u8; self.settings.salt_length];
        OsRng.fill_bytes(&mut salt);
        Ok(salt)
    }

    pub fn generate_nonce(&self) -> Result<Nonce<Aes256Gcm>> {
        let mut nonce_bytes = vec![0u8; self.settings.iv_length];
        OsRng.fill_bytes(&mut nonce_bytes);
        Nonce::from_slice(&nonce_bytes)
    }

    pub fn calculate_integrity_hash(&self, data: &[u8]) -> Vec<u8> {
        let mut hasher = Sha256::new();
        hasher.update(data);
        hasher.finalize().to_vec()
    }
}

pub async fn encrypt_file(
    file_path: &Path,
    password: &str,
    options: &EncryptionOptions,
    output_path: Option<&Path>,
) -> Result<EncryptionResult> {
    let start_time = Instant::now();
    let crypto_engine = CryptoEngine::default();
    
    // Validate input file
    if !file_path.exists() {
        return Err(EncryptionError::FileNotFound(file_path.to_path_buf()));
    }

    let file_size = fs::metadata(file_path)?.len();
    if file_size == 0 {
        return Err(EncryptionError::InvalidFileFormat("File is empty".to_string()));
    }

    // Determine output path
    let output_path = match output_path {
        Some(path) => path.to_path_buf(),
        None => {
            let mut path = file_path.to_path_buf();
            path.set_extension("enc");
            path
        }
    };

    // Check if output file already exists
    if output_path.exists() {
        return Err(EncryptionError::FileExists(output_path));
    }

    // Generate cryptographic materials
    let salt = crypto_engine.generate_salt()?;
    let nonce = crypto_engine.generate_nonce()?;
    let key = crypto_engine.derive_key(password, &salt)?;

    // Create encryption metadata
    let metadata = EncryptionMetadata {
        version: "2.0.0".to_string(),
        algorithm: "AES-256-GCM".to_string(),
        key_derivation: "Argon2id".to_string(),
        salt,
        iv: nonce.to_vec(),
        compressed: options.compression_enabled,
        original_filename: file_path.file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string(),
        created_at: Utc::now(),
        integrity_hash: None, // Will be calculated after encryption
    };

    // Read input file
    let input_file = File::open(file_path)?;
    let mmap = unsafe { Mmap::map(&input_file)? };
    let mut input_data = mmap.to_vec();

    // Calculate original integrity hash if requested
    let original_hash = if options.integrity_check {
        Some(crypto_engine.calculate_integrity_hash(&input_data))
    } else {
        None
    };

    // Compress data if enabled
    if options.compression_enabled {
        input_data = compress_data(&input_data)?;
    }

    // Encrypt the data
    let cipher = Aes256Gcm::new(&key);
    let encrypted_data = cipher
        .encrypt(&nonce, input_data.as_ref())
        .map_err(|e| EncryptionError::Crypto(e.to_string()))?;

    // Calculate encrypted data integrity hash
    let encrypted_hash = crypto_engine.calculate_integrity_hash(&encrypted_data);

    // Create final metadata with integrity hash
    let mut final_metadata = metadata;
    final_metadata.integrity_hash = Some(encrypted_hash);

    // Write encrypted file
    let mut output_file = OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .open(&output_path)?;

    // Write magic header
    output_file.write_all(MAGIC_HEADER)?;

    // Write metadata
    let metadata_json = serde_json::to_string(&final_metadata)?;
    let mut metadata_bytes = metadata_json.as_bytes().to_vec();
    metadata_bytes.resize(METADATA_SIZE, 0); // Pad to fixed size
    output_file.write_all(&metadata_bytes)?;

    // Write encrypted data
    output_file.write_all(&encrypted_data)?;

    // Handle original file based on options
    if options.delete_original {
        fs::remove_file(file_path)?;
    } else if options.erase_traces {
        // Overwrite with random data before deletion
        let mut file = OpenOptions::new().write(true).open(file_path)?;
        let file_size = file.metadata()?.len();
        let random_data: Vec<u8> = (0..file_size).map(|_| rand::random::<u8>()).collect();
        file.write_all(&random_data)?;
        file.sync_all()?;
        fs::remove_file(file_path)?;
    }

    let processing_time = start_time.elapsed().as_millis() as u64;
    let encrypted_size = output_path.metadata()?.len();

    let compression_ratio = if options.compression_enabled {
        Some(encrypted_data.len() as f64 / file_size as f64)
    } else {
        None
    };

    info!("File encrypted successfully: {} -> {}", 
          file_path.display(), output_path.display());

    Ok(EncryptionResult {
        success: true,
        output_path,
        original_size: file_size,
        encrypted_size,
        compression_ratio,
        processing_time_ms: processing_time,
        message: "Encryption completed successfully".to_string(),
    })
}

pub async fn decrypt_file(
    file_path: &Path,
    password: &str,
) -> Result<EncryptionResult> {
    let start_time = Instant::now();
    let crypto_engine = CryptoEngine::default();

    // Validate input file
    if !file_path.exists() {
        return Err(EncryptionError::FileNotFound(file_path.to_path_buf()));
    }

    let file_size = fs::metadata(file_path)?.len();
    if file_size < (MAGIC_HEADER.len() + METADATA_SIZE) as u64 {
        return Err(EncryptionError::InvalidFileFormat("File too small to be encrypted".to_string()));
    }

    // Read and validate magic header
    let mut input_file = File::open(file_path)?;
    let mut magic_header = [0u8; 8];
    input_file.read_exact(&mut magic_header)?;
    
    if magic_header != *MAGIC_HEADER {
        return Err(EncryptionError::InvalidFileFormat("Invalid file format".to_string()));
    }

    // Read metadata
    let mut metadata_bytes = vec![0u8; METADATA_SIZE];
    input_file.read_exact(&mut metadata_bytes)?;
    
    // Find the end of JSON data (null terminator)
    let json_end = metadata_bytes.iter()
        .position(|&b| b == 0)
        .unwrap_or(METADATA_SIZE);
    
    let metadata_json = String::from_utf8_lossy(&metadata_bytes[..json_end]);
    let metadata: EncryptionMetadata = serde_json::from_str(&metadata_json)
        .map_err(|e| EncryptionError::SerializationError(e))?;

    // Validate version
    if !metadata.version.starts_with("2.") {
        return Err(EncryptionError::UnsupportedVersion(metadata.version));
    }

    // Derive key
    let key = crypto_engine.derive_key(password, &metadata.salt)?;
    let nonce = Nonce::from_slice(&metadata.iv);

    // Read encrypted data
    let encrypted_data = {
        let mut data = Vec::new();
        input_file.read_to_end(&mut data)?;
        data
    };

    // Verify integrity hash if present
    if let Some(expected_hash) = &metadata.integrity_hash {
        let actual_hash = crypto_engine.calculate_integrity_hash(&encrypted_data);
        if actual_hash != *expected_hash {
            return Err(EncryptionError::IntegrityCheckFailed("Data integrity check failed".to_string()));
        }
    }

    // Decrypt data
    let cipher = Aes256Gcm::new(&key);
    let decrypted_data = cipher
        .decrypt(nonce, encrypted_data.as_ref())
        .map_err(|_| EncryptionError::InvalidPassword)?;

    // Decompress if necessary
    let final_data = if metadata.compressed {
        decompress_data(&decrypted_data)?
    } else {
        decrypted_data
    };

    // Determine output path
    let output_path = {
        let mut path = file_path.to_path_buf();
        path.set_extension("");
        if metadata.original_filename.is_empty() {
            path.set_file_name(format!("decrypted_{}", 
                path.file_name().unwrap_or_default().to_string_lossy()));
        } else {
            path.set_file_name(&metadata.original_filename);
        }
        path
    };

    // Check if output file already exists
    if output_path.exists() {
        return Err(EncryptionError::FileExists(output_path));
    }

    // Write decrypted file
    fs::write(&output_path, &final_data)?;

    let processing_time = start_time.elapsed().as_millis() as u64;
    let decrypted_size = final_data.len() as u64;

    info!("File decrypted successfully: {} -> {}", 
          file_path.display(), output_path.display());

    Ok(EncryptionResult {
        success: true,
        output_path,
        original_size: file_size,
        encrypted_size: decrypted_size,
        compression_ratio: None,
        processing_time_ms: processing_time,
        message: "Decryption completed successfully".to_string(),
    })
}

pub async fn verify_password(
    file_path: &Path,
    password: &str,
) -> Result<bool> {
    let crypto_engine = CryptoEngine::default();

    // Read magic header and metadata
    let mut input_file = File::open(file_path)?;
    let mut magic_header = [0u8; 8];
    input_file.read_exact(&mut magic_header)?;
    
    if magic_header != *MAGIC_HEADER {
        return Ok(false);
    }

    let mut metadata_bytes = vec![0u8; METADATA_SIZE];
    input_file.read_exact(&mut metadata_bytes)?;
    
    let json_end = metadata_bytes.iter()
        .position(|&b| b == 0)
        .unwrap_or(METADATA_SIZE);
    
    let metadata_json = String::from_utf8_lossy(&metadata_bytes[..json_end]);
    let metadata: EncryptionMetadata = serde_json::from_str(&metadata_json)
        .map_err(|_| Ok(false))?;

    // Try to derive key
    let key = crypto_engine.derive_key(password, &metadata.salt)?;
    let nonce = Nonce::from_slice(&metadata.iv);

    // Read a small portion of encrypted data for testing
    let mut test_data = vec![0u8; 64];
    input_file.read_exact(&mut test_data)?;

    // Try to decrypt a small portion
    let cipher = Aes256Gcm::new(&key);
    match cipher.decrypt(nonce, &test_data) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

fn compress_data(data: &[u8]) -> Result<Vec<u8>> {
    use flate2::write::DeflateEncoder;
    use flate2::Compression;
    use std::io::Write;

    let mut encoder = DeflateEncoder::new(Vec::new(), Compression::best());
    encoder.write_all(data)
        .map_err(|e| EncryptionError::CompressionError(e.to_string()))?;
    encoder.finish()
        .map_err(|e| EncryptionError::CompressionError(e.to_string()))
}

fn decompress_data(data: &[u8]) -> Result<Vec<u8>> {
    use flate2::read::DeflateDecoder;
    use std::io::Read;

    let mut decoder = DeflateDecoder::new(data);
    let mut decompressed = Vec::new();
    decoder.read_to_end(&mut decompressed)
        .map_err(|e| EncryptionError::CompressionError(e.to_string()))?;
    Ok(decompressed)
}

pub fn generate_key() -> Result<Vec<u8>> {
    let mut key = vec![0u8; 32];
    OsRng.fill_bytes(&mut key);
    Ok(key)
}