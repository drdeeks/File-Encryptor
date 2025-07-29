#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{command, App, AppHandle, Manager, Window};
use zeroize::Zeroizing;

mod crypto;
mod error;
mod file_ops;
mod humor;
mod types;

use crypto::{decrypt_file, encrypt_file, generate_key, verify_password};
use error::EncryptionError;
use file_ops::{scan_directory, FileInfo};
use types::{EncryptionOptions, EncryptionResult, ScanProgress};

// Initialize logging
fn init_logging() {
    env_logger::init();
    info!("File Encryptor v2.0.0 - Tauri Edition initialized");
    info!("Dark humor mode: {}", humor::get_random_joke());
}

#[command]
async fn encrypt_file_command(
    file_path: String,
    password: String,
    options: EncryptionOptions,
    output_path: Option<String>,
) -> Result<EncryptionResult, String> {
    info!("Encryption request received for: {}", file_path);
    
    let password = Zeroizing::new(password);
    let file_path = PathBuf::from(file_path);
    let output_path = output_path.map(PathBuf::from);
    
    match encrypt_file(&file_path, &password, &options, output_path.as_ref()).await {
        Ok(result) => {
            info!("Encryption successful: {:?}", result.output_path);
            Ok(result)
        }
        Err(e) => {
            error!("Encryption failed: {}", e);
            Err(format!("Encryption failed: {}", e))
        }
    }
}

#[command]
async fn decrypt_file_command(
    file_path: String,
    password: String,
) -> Result<EncryptionResult, String> {
    info!("Decryption request received for: {}", file_path);
    
    let password = Zeroizing::new(password);
    let file_path = PathBuf::from(file_path);
    
    match decrypt_file(&file_path, &password).await {
        Ok(result) => {
            info!("Decryption successful: {:?}", result.output_path);
            Ok(result)
        }
        Err(e) => {
            error!("Decryption failed: {}", e);
            Err(format!("Decryption failed: {}", e))
        }
    }
}

#[command]
async fn scan_directory_command(
    dir_path: String,
    window: Window,
) -> Result<Vec<FileInfo>, String> {
    info!("Directory scan request for: {}", dir_path);
    
    let dir_path = PathBuf::from(dir_path);
    
    match scan_directory(&dir_path, &window).await {
        Ok(files) => {
            info!("Directory scan completed, found {} encrypted files", files.len());
            Ok(files)
        }
        Err(e) => {
            error!("Directory scan failed: {}", e);
            Err(format!("Directory scan failed: {}", e))
        }
    }
}

#[command]
async fn verify_password_command(
    file_path: String,
    password: String,
) -> Result<bool, String> {
    let password = Zeroizing::new(password);
    let file_path = PathBuf::from(file_path);
    
    match verify_password(&file_path, &password).await {
        Ok(is_valid) => {
            info!("Password verification completed for: {}", file_path.display());
            Ok(is_valid)
        }
        Err(e) => {
            error!("Password verification failed: {}", e);
            Err(format!("Password verification failed: {}", e))
        }
    }
}

#[command]
fn get_random_joke() -> String {
    humor::get_random_joke()
}

#[command]
fn get_encryption_joke() -> String {
    humor::get_encryption_joke()
}

#[command]
fn get_decryption_joke() -> String {
    humor::get_decryption_joke()
}

#[command]
fn get_error_joke() -> String {
    humor::get_error_joke()
}

#[command]
fn get_success_joke() -> String {
    humor::get_success_joke()
}

fn main() {
    init_logging();
    
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            encrypt_file_command,
            decrypt_file_command,
            scan_directory_command,
            verify_password_command,
            get_random_joke,
            get_encryption_joke,
            get_decryption_joke,
            get_error_joke,
            get_success_joke
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}