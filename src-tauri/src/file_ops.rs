use crate::error::{EncryptionError, Result};
use crate::types::{FileInfo, ScanProgress};
use chrono::{DateTime, Utc};
use log::{debug, info, warn};
use std::path::{Path, PathBuf};
use std::time::Duration;
use tauri::Window;
use tokio::time::sleep;
use walkdir::WalkDir;

const MAGIC_HEADER: &[u8; 8] = b"FE2.0\0\0\0"; // File Encryptor 2.0

pub async fn scan_directory(
    dir_path: &Path,
    window: &Window,
) -> Result<Vec<FileInfo>> {
    info!("Starting directory scan: {}", dir_path.display());
    
    if !dir_path.exists() {
        return Err(EncryptionError::FileNotFound(dir_path.to_path_buf()));
    }
    
    if !dir_path.is_dir() {
        return Err(EncryptionError::InvalidFileFormat("Path is not a directory".to_string()));
    }

    let mut encrypted_files = Vec::new();
    let mut directories_processed = 0u64;
    let mut files_found = 0u64;

    // Walk through directory recursively
    for entry in WalkDir::new(dir_path)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        
        if path.is_dir() {
            directories_processed += 1;
            
            // Send progress update every 10 directories
            if directories_processed % 10 == 0 {
                let progress = ScanProgress {
                    directories_processed,
                    files_found,
                    current_path: path.to_string_lossy().to_string(),
                    is_complete: false,
                };
                
                if let Err(e) = window.emit("scan-progress", progress) {
                    warn!("Failed to emit scan progress: {}", e);
                }
                
                // Yield control to prevent blocking
                sleep(Duration::from_millis(1)).await;
            }
        } else if path.is_file() {
            // Check if file has .enc extension
            if let Some(extension) = path.extension() {
                if extension == "enc" {
                    // Verify it's actually an encrypted file by checking magic header
                    if is_encrypted_file(path).await {
                        if let Ok(metadata) = path.metadata() {
                            let file_info = FileInfo {
                                name: path.file_name()
                                    .unwrap_or_default()
                                    .to_string_lossy()
                                    .to_string(),
                                path: path.to_path_buf(),
                                size: metadata.len(),
                                modified: DateTime::from(metadata.modified().unwrap_or_else(|_| std::time::SystemTime::now())),
                                directory: path.parent().unwrap_or(path).to_path_buf(),
                                is_encrypted: true,
                                encryption_version: Some("2.0.0".to_string()),
                            };
                            
                            encrypted_files.push(file_info);
                            files_found += 1;
                            
                            debug!("Found encrypted file: {}", path.display());
                        }
                    }
                }
            }
        }
    }

    // Send final progress update
    let final_progress = ScanProgress {
        directories_processed,
        files_found,
        current_path: "Scan complete".to_string(),
        is_complete: true,
    };
    
    if let Err(e) = window.emit("scan-progress", final_progress) {
        warn!("Failed to emit final scan progress: {}", e);
    }

    info!("Directory scan completed. Found {} encrypted files in {} directories", 
          encrypted_files.len(), directories_processed);

    Ok(encrypted_files)
}

async fn is_encrypted_file(file_path: &Path) -> bool {
    use std::fs::File;
    use std::io::Read;
    
    match File::open(file_path) {
        Ok(mut file) => {
            let mut header = [0u8; 8];
            match file.read_exact(&mut header) {
                Ok(_) => header == *MAGIC_HEADER,
                Err(_) => false,
            }
        }
        Err(_) => false,
    }
}

pub async fn batch_encrypt_files(
    files: Vec<PathBuf>,
    password: &str,
    options: &crate::types::EncryptionOptions,
    output_dir: Option<&Path>,
    window: &Window,
) -> Result<crate::types::BatchResult> {
    let mut results = Vec::new();
    let mut errors = Vec::new();
    let total_files = files.len();
    let mut successful = 0;
    let mut failed = 0;

    for (index, file_path) in files.iter().enumerate() {
        // Send progress update
        let progress = (index as f64 / total_files as f64) * 100.0;
        if let Err(e) = window.emit("batch-progress", progress) {
            warn!("Failed to emit batch progress: {}", e);
        }

        // Determine output path
        let output_path = if let Some(output_dir) = output_dir {
            let filename = file_path.file_name().unwrap_or_default();
            let mut new_path = output_dir.to_path_buf();
            new_path.push(filename);
            new_path.set_extension("enc");
            Some(new_path)
        } else {
            None
        };

        // Encrypt file
        match crate::crypto::encrypt_file(file_path, password, options, output_path.as_deref()).await {
            Ok(result) => {
                results.push(result);
                successful += 1;
                info!("Batch encryption successful: {}", file_path.display());
            }
            Err(e) => {
                failed += 1;
                let error_msg = format!("Failed to encrypt {}: {}", file_path.display(), e);
                errors.push(error_msg.clone());
                error!("{}", error_msg);
            }
        }

        // Yield control to prevent blocking
        sleep(Duration::from_millis(10)).await;
    }

    Ok(crate::types::BatchResult {
        total_files,
        successful,
        failed,
        errors,
        results,
    })
}

pub async fn batch_decrypt_files(
    files: Vec<PathBuf>,
    password: &str,
    output_dir: Option<&Path>,
    window: &Window,
) -> Result<crate::types::BatchResult> {
    let mut results = Vec::new();
    let mut errors = Vec::new();
    let total_files = files.len();
    let mut successful = 0;
    let mut failed = 0;

    for (index, file_path) in files.iter().enumerate() {
        // Send progress update
        let progress = (index as f64 / total_files as f64) * 100.0;
        if let Err(e) = window.emit("batch-progress", progress) {
            warn!("Failed to emit batch progress: {}", e);
        }

        // Decrypt file
        match crate::crypto::decrypt_file(file_path, password).await {
            Ok(result) => {
                // Move to output directory if specified
                if let Some(output_dir) = output_dir {
                    if let Err(e) = move_file_to_directory(&result.output_path, output_dir).await {
                        warn!("Failed to move decrypted file to output directory: {}", e);
                    }
                }
                
                results.push(result);
                successful += 1;
                info!("Batch decryption successful: {}", file_path.display());
            }
            Err(e) => {
                failed += 1;
                let error_msg = format!("Failed to decrypt {}: {}", file_path.display(), e);
                errors.push(error_msg.clone());
                error!("{}", error_msg);
            }
        }

        // Yield control to prevent blocking
        sleep(Duration::from_millis(10)).await;
    }

    Ok(crate::types::BatchResult {
        total_files,
        successful,
        failed,
        errors,
        results,
    })
}

async fn move_file_to_directory(file_path: &Path, target_dir: &Path) -> Result<()> {
    use std::fs;
    
    if !target_dir.exists() {
        fs::create_dir_all(target_dir)?;
    }
    
    let filename = file_path.file_name().unwrap_or_default();
    let target_path = target_dir.join(filename);
    
    if target_path.exists() {
        return Err(EncryptionError::FileExists(target_path));
    }
    
    fs::rename(file_path, &target_path)?;
    Ok(())
}

pub fn get_file_size_formatted(bytes: u64) -> String {
    const UNITS: [&str; 4] = ["B", "KB", "MB", "GB"];
    let mut size = bytes as f64;
    let mut unit_index = 0;
    
    while size >= 1024.0 && unit_index < UNITS.len() - 1 {
        size /= 1024.0;
        unit_index += 1;
    }
    
    if unit_index == 0 {
        format!("{} {}", size as u64, UNITS[unit_index])
    } else {
        format!("{:.2} {}", size, UNITS[unit_index])
    }
}

pub fn get_processing_time_formatted(milliseconds: u64) -> String {
    if milliseconds < 1000 {
        format!("{}ms", milliseconds)
    } else if milliseconds < 60000 {
        format!("{:.1}s", milliseconds as f64 / 1000.0)
    } else {
        let minutes = milliseconds / 60000;
        let seconds = (milliseconds % 60000) / 1000;
        format!("{}m {}s", minutes, seconds)
    }
}