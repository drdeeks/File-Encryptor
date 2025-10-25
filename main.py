""" File Encryptor - Simple, Secure, Fast A standalone Python application for file encryption with modern GUI No complex build systems - just Python! """
import os
import json
import hashlib
import secrets
from pathlib import Path
from typing import Optional, Tuple
from dataclasses import dataclass, asdict
import threading
import tkinter as tk
from tkinter import filedialog, messagebox, ttk
# Cryptography imports
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.argon2 import Argon2id
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
# Optional: Modern UI (install with: pip install customtkinter)
try: import customtkinter as ctk USE_MODERN_UI = True except ImportError: USE_MODERN_UI = False print("CustomTkinter not found. Using standard Tkinter.")
# ============================================================================
# CONFIGURATION
# ============================================================================
@dataclass class EncryptionConfig: """Encryption configuration settings""" argon2_iterations: int = 100_000 argon2_memory_kb: int = 65536 # 64MB argon2_parallelism: int = 4 buffer_size: int = 1024 * 1024 # 1MB encrypted_extension: str = ".enc"
@classmethod
def load(cls):
    """Load config from file or use defaults"""
    config_path = Path.home() / ".file_encryptor" / "config.json"
    if config_path.exists():
        with open(config_path) as f:
            return cls(**json.load(f))
    return cls()

def save(self):
    """Save config to file"""
    config_path = Path.home() / ".file_encryptor" / "config.json"
    config_path.parent.mkdir(exist_ok=True)
    with open(config_path, 'w') as f:
        json.dump(asdict(self), f, indent=2)

# ============================================================================
# CRYPTO CORE
# ============================================================================
class FileCrypto: """High-performance file encryption/decryption"""
MAGIC_HEADER = b"FENC2.0\x00"
VERSION = 2

def __init__(self, config: EncryptionConfig):
    self.config = config

def derive_key(self, password: str, salt: bytes) -> bytes:
    """Derive encryption key from password using Argon2id"""
    kdf = Argon2id(
        time_cost=self.config.argon2_iterations,
        memory_cost=self.config.argon2_memory_kb,
        parallelism=self.config.argon2_parallelism,
        hash_len=32,
        salt=salt,
        backend=default_backend()
    )
    return kdf.derive(password.encode())

def encrypt_file(
    self,
    input_path: Path,
    password: str,
    output_path: Optional[Path] = None,
    progress_callback=None
) -> Path:
    """Encrypt a file with AES-256-GCM"""

    # Validate input
    if not input_path.exists():
        raise FileNotFoundError(f"File not found: {input_path}")

    # Set output path
    if output_path is None:
        output_path = input_path.with_suffix(
            input_path.suffix + self.config.encrypted_extension
        )

    # Generate cryptographic parameters
    salt = secrets.token_bytes(32)
    nonce = secrets.token_bytes(12)

    # Derive key
    key = self.derive_key(password, salt)
    cipher = AESGCM(key)

    # Get file info
    file_size = input_path.stat().st_size
    original_hash = self._hash_file(input_path)

    # Create metadata
    metadata = {
        "version": self.VERSION,
        "original_name": input_path.name,
        "original_size": file_size,
        "salt": salt.hex(),
        "nonce": nonce.hex(),
        "hash": original_hash.hex(),
    }
    metadata_bytes = json.dumps(metadata).encode()
    metadata_length = len(metadata_bytes)

    # Write encrypted file
    with open(input_path, 'rb') as fin, open(output_path, 'wb') as fout:
        # Write header
        fout.write(self.MAGIC_HEADER)
        fout.write(metadata_length.to_bytes(4, 'little'))
        fout.write(metadata_bytes)

        # Encrypt and write data in chunks
        bytes_processed = 0
        while True:
            chunk = fin.read(self.config.buffer_size)
            if not chunk:
                break

            encrypted_chunk = cipher.encrypt(nonce, chunk, None)
            fout.write(len(encrypted_chunk).to_bytes(4, 'little'))
            fout.write(encrypted_chunk)

            bytes_processed += len(chunk)
            if progress_callback:
                progress_callback(bytes_processed, file_size)

    return output_path

def decrypt_file(
    self,
    input_path: Path,
    password: str,
    output_path: Optional[Path] = None,
    progress_callback=None
) -> Path:
    """Decrypt a file"""

    with open(input_path, 'rb') as fin:
        # Read and validate header
        magic = fin.read(8)
        if magic != self.MAGIC_HEADER:
            raise ValueError("Not a valid encrypted file")

        # Read metadata
        metadata_length = int.from_bytes(fin.read(4), 'little')
        metadata_bytes = fin.read(metadata_length)
        metadata = json.loads(metadata_bytes.decode())

        # Extract crypto parameters
        salt = bytes.fromhex(metadata['salt'])
        nonce = bytes.fromhex(metadata['nonce'])
        original_hash = bytes.fromhex(metadata['hash'])

        # Derive key
        key = self.derive_key(password, salt)
        cipher = AESGCM(key)

        # Set output path
        if output_path is None:
            output_path = input_path.parent / metadata['original_name']

        # Decrypt data
        with open(output_path, 'wb') as fout:
            bytes_processed = 0
            total_size = metadata['original_size']

            while True:
                # Read chunk length
                chunk_length_bytes = fin.read(4)
                if not chunk_length_bytes:
                    break

                chunk_length = int.from_bytes(chunk_length_bytes, 'little')
                encrypted_chunk = fin.read(chunk_length)

                try:
                    decrypted_chunk = cipher.decrypt(nonce, encrypted_chunk, None)
                except Exception:
                    # Clean up partial file
                    output_path.unlink()
                    raise ValueError("Decryption failed - wrong password?")

                fout.write(decrypted_chunk)
                bytes_processed += len(decrypted_chunk)

                if progress_callback:
                    progress_callback(bytes_processed, total_size)

        # Verify integrity
        decrypted_hash = self._hash_file(output_path)
        if decrypted_hash != original_hash:
            output_path.unlink()
            raise ValueError("File integrity check failed")

    return output_path

def _hash_file(self, path: Path) -> bytes:
    """Calculate SHA-256 hash of file"""
    hasher = hashlib.sha256()
    with open(path, 'rb') as f:
        while chunk := f.read(self.config.buffer_size):
            hasher.update(chunk)
    return hasher.digest()

# ============================================================================
# MODERN GUI
# ============================================================================
class FileEncryptorApp: """Main application window"""
def __init__(self):
    self.config = EncryptionConfig.load()
    self.crypto = FileCrypto(self.config)

    # Create main window
    if USE_MODERN_UI:
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")
        self.root = ctk.CTk()
    else:
        self.root = tk.Tk()

    self.root.title("File Encryptor")
    self.root.geometry("800x600")

    self.setup_ui()

def setup_ui(self):
    """Setup user interface"""

    # Main container
    if USE_MODERN_UI:
        main_frame = ctk.CTkFrame(self.root)
    else:
        main_frame = ttk.Frame(self.root, padding=20)
    main_frame.pack(fill="both", expand=True, padx=20, pady=20)

    # Title
    if USE_MODERN_UI:
        title = ctk.CTkLabel(
            main_frame,
            text="🔐 File Encryptor",
            font=("Arial", 24, "bold")
        )
    else:
        title = ttk.Label(main_frame, text="🔐 File Encryptor", font=("Arial", 24))
    title.pack(pady=20)

    # Tabs
    if USE_MODERN_UI:
        tabview = ctk.CTkTabview(main_frame)
    else:
        tabview = ttk.Notebook(main_frame)
    tabview.pack(fill="both", expand=True)

    # Encrypt tab
    encrypt_tab = self.create_encrypt_tab(tabview)

    # Decrypt tab
    decrypt_tab = self.create_decrypt_tab(tabview)

def create_encrypt_tab(self, parent):
    """Create encryption tab"""
    if USE_MODERN_UI:
        tab = parent.add("Encrypt")
        frame = ctk.CTkFrame(tab)
    else:
        frame = ttk.Frame(parent)
        parent.add(frame, text="Encrypt")

    frame.pack(fill="both", expand=True, padx=20, pady=20)

    # File selection
    self.encrypt_file_label = self._create_label(
        frame, "No file selected", font=("Arial", 12)
    )
    self.encrypt_file_label.pack(pady=10)

    select_btn = self._create_button(
        frame, "📁 Select File", self.select_encrypt_file
    )
    select_btn.pack(pady=5)

    # Password
    password_frame = self._create_frame(frame)
    password_frame.pack(pady=20, fill="x")

    self._create_label(password_frame, "Password:").pack(side="left", padx=5)
    self.encrypt_password = self._create_entry(password_frame, show="*")
    self.encrypt_password.pack(side="left", fill="x", expand=True, padx=5)

    # Progress
    self.encrypt_progress = self._create_progress(frame)
    self.encrypt_progress.pack(pady=10, fill="x")

    # Encrypt button
    encrypt_btn = self._create_button(
        frame, "🔒 Encrypt File", self.encrypt_action, fg_color="green"
    )
    encrypt_btn.pack(pady=10)

    return frame

def create_decrypt_tab(self, parent):
    """Create decryption tab"""
    if USE_MODERN_UI:
        tab = parent.add("Decrypt")
        frame = ctk.CTkFrame(tab)
    else:
        frame = ttk.Frame(parent)
        parent.add(frame, text="Decrypt")

    frame.pack(fill="both", expand=True, padx=20, pady=20)

    # File selection
    self.decrypt_file_label = self._create_label(
        frame, "No file selected", font=("Arial", 12)
    )
    self.decrypt_file_label.pack(pady=10)

    select_btn = self._create_button(
        frame, "📁 Select Encrypted File", self.select_decrypt_file
    )
    select_btn.pack(pady=5)

    # Password
    password_frame = self._create_frame(frame)
    password_frame.pack(pady=20, fill="x")

    self._create_label(password_frame, "Password:").pack(side="left", padx=5)
    self.decrypt_password = self._create_entry(password_frame, show="*")
    self.decrypt_password.pack(side="left", fill="x", expand=True, padx=5)

    # Progress
    self.decrypt_progress = self._create_progress(frame)
    self.decrypt_progress.pack(pady=10, fill="x")

    # Decrypt button
    decrypt_btn = self._create_button(
        frame, "🔓 Decrypt File", self.decrypt_action, fg_color="blue"
    )
    decrypt_btn.pack(pady=10)

    return frame

# Helper methods for UI creation
def _create_label(self, parent, text, **kwargs):
    if USE_MODERN_UI:
        return ctk.CTkLabel(parent, text=text, **kwargs)
    return ttk.Label(parent, text=text)

def _create_button(self, parent, text, command, **kwargs):
    if USE_MODERN_UI:
        return ctk.CTkButton(parent, text=text, command=command, **kwargs)
    return ttk.Button(parent, text=text, command=command)

def _create_entry(self, parent, **kwargs):
    if USE_MODERN_UI:
        return ctk.CTkEntry(parent, **kwargs)
    return ttk.Entry(parent, **kwargs)

def _create_frame(self, parent):
    if USE_MODERN_UI:
        return ctk.CTkFrame(parent)
    return ttk.Frame(parent)

def _create_progress(self, parent):
    if USE_MODERN_UI:
        return ctk.CTkProgressBar(parent)
    return ttk.Progressbar(parent, mode='determinate')

# Actions
def select_encrypt_file(self):
    filename = filedialog.askopenfilename(title="Select file to encrypt")
    if filename:
        self.encrypt_file_path = Path(filename)
        self.encrypt_file_label.configure(text=f"Selected: {Path(filename).name}")

def select_decrypt_file(self):
    filename = filedialog.askopenfilename(
        title="Select file to decrypt",
        filetypes=[("Encrypted files", f"*{self.config.encrypted_extension}")]
    )
    if filename:
        self.decrypt_file_path = Path(filename)
        self.decrypt_file_label.configure(text=f"Selected: {Path(filename).name}")

def encrypt_action(self):
    if not hasattr(self, 'encrypt_file_path'):
        messagebox.showerror("Error", "Please select a file first")
        return

    password = self.encrypt_password.get()
    if not password:
        messagebox.showerror("Error", "Please enter a password")
        return

    def progress_update(current, total):
        progress = current / total
        if USE_MODERN_UI:
            self.encrypt_progress.set(progress)
        else:
            self.encrypt_progress['value'] = progress * 100
        self.root.update_idletasks()

    def do_encrypt():
        try:
            output = self.crypto.encrypt_file(
                self.encrypt_file_path,
                password,
                progress_callback=progress_update
            )
            self.root.after(0, lambda: messagebox.showinfo(
                "Success",
                f"File encrypted successfully!\n{output}"
            ))
        except Exception as e:
            self.root.after(0, lambda: messagebox.showerror("Error", str(e)))

    threading.Thread(target=do_encrypt, daemon=True).start()

def decrypt_action(self):
    if not hasattr(self, 'decrypt_file_path'):
        messagebox.showerror("Error", "Please select a file first")
        return

    password = self.decrypt_password.get()
    if not password:
        messagebox.showerror("Error", "Please enter a password")
        return

    def progress_update(current, total):
        progress = current / total
        if USE_MODERN_UI:
            self.decrypt_progress.set(progress)
        else:
            self.decrypt_progress['value'] = progress * 100
        self.root.update_idletasks()

    def do_decrypt():
        try:
            output = self.crypto.decrypt_file(
                self.decrypt_file_path,
                password,
                progress_callback=progress_update
            )
            self.root.after(0, lambda: messagebox.showinfo(
                "Success",
                f"File decrypted successfully!\n{output}"
            ))
        except Exception as e:
            self.root.after(0, lambda: messagebox.showerror("Error", str(e)))

    threading.Thread(target=do_decrypt, daemon=True).start()

def run(self):
    """Run the application"""
    self.root.mainloop()

# ============================================================================
# MAIN
# ============================================================================
if __name__ == "__main__": app = FileEncryptorApp() app.run()
