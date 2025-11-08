from __future__ import annotations

import json
import secrets
import hashlib
from typing import TYPE_CHECKING, Callable, Optional
from pathlib import Path
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import argon2


if TYPE_CHECKING:
    from src.config.settings import EncryptionConfig

class FileCrypto:
    """
    High-performance file encryption using AES-256-GCM with Argon2id key derivation

    Features:
    - Streaming encryption for large files
    - Progress callbacks
    - Integrity verification
    - Metadata preservation
    """

    MAGIC_HEADER = b"UENC3.0\x00"  # 8 bytes
    VERSION = 3

    def __init__(self, config: EncryptionConfig):
        """Initialize with configuration"""
        self.config = config

    def encrypt_file(
        self,
        input_path: Path,
        password: str,
        output_path: Optional[Path] = None,
        progress_callback: Optional[Callable] = None
    ) -> Path:
        """
        Encrypt a file

        Args:
            input_path: File to encrypt
            password: Encryption password
            output_path: Optional output path
            progress_callback: Function(bytes_processed, total_bytes)

        Returns:
            Path to encrypted file

        Raises:
            FileNotFoundError: Input file doesn't exist
            PermissionError: Cannot read/write file
            EncryptionError: Encryption failed
        """
        if not input_path.exists():
            raise FileNotFoundError(f"Input file not found: {input_path}")

        if output_path is None:
            output_path = input_path.with_suffix(input_path.suffix + ".enc")

        salt = secrets.token_bytes(32)
        key = self.derive_key(password, salt, self.config)
        aesgcm = AESGCM(key)
        nonce = secrets.token_bytes(12)  # 96-bit nonce

        original_hash = self.calculate_hash(input_path)

        metadata = {
            "salt": salt.hex(),
            "nonce": nonce.hex(),
            "hash": original_hash.hex(),
            "original_name": input_path.name,
        }
        metadata_bytes = json.dumps(metadata).encode('utf-8')

        with open(input_path, 'rb') as fin, open(output_path, 'wb') as fout:
            fout.write(self.MAGIC_HEADER)
            fout.write(self.VERSION.to_bytes(2, 'little'))
            fout.write(len(metadata_bytes).to_bytes(4, 'little'))
            fout.write(metadata_bytes)

            total_size = input_path.stat().st_size
            bytes_processed = 0

            while chunk := fin.read(self.config.chunk_size_mb * 1024 * 1024):
                encrypted_chunk = aesgcm.encrypt(nonce, chunk, None)
                fout.write(len(encrypted_chunk).to_bytes(4, 'little'))
                fout.write(encrypted_chunk)

                bytes_processed += len(chunk)
                if progress_callback:
                    progress_callback(bytes_processed, total_size)

        return output_path

    def decrypt_file(
        self,
        input_path: Path,
        password: str,
        output_path: Optional[Path] = None,
        progress_callback: Optional[Callable] = None,
        verify_integrity: bool = True
    ) -> Path:
        """Decrypt a file with integrity verification"""
        with open(input_path, 'rb') as fin:
            header = fin.read(8)
            if header != self.MAGIC_HEADER:
                raise ValueError("Invalid file header")

            version = int.from_bytes(fin.read(2), 'little')
            if version != self.VERSION:
                raise ValueError(f"Unsupported file version: {version}")

            metadata_len = int.from_bytes(fin.read(4), 'little')
            metadata_bytes = fin.read(metadata_len)
            metadata = json.loads(metadata_bytes.decode('utf-8'))

            salt = bytes.fromhex(metadata['salt'])
            nonce = bytes.fromhex(metadata['nonce'])
            original_hash = bytes.fromhex(metadata['hash'])

            key = self.derive_key(password, salt, self.config)
            aesgcm = AESGCM(key)

            if output_path is None:
                output_path = input_path.parent / metadata['original_name']

            with open(output_path, 'wb') as fout:
                total_size = input_path.stat().st_size - (8 + 2 + 4 + metadata_len)
                bytes_processed = 0

                while True:
                    chunk_len_bytes = fin.read(4)
                    if not chunk_len_bytes:
                        break

                    chunk_len = int.from_bytes(chunk_len_bytes, 'little')
                    encrypted_chunk = fin.read(chunk_len)

                    decrypted_chunk = aesgcm.decrypt(nonce, encrypted_chunk, None)
                    fout.write(decrypted_chunk)

                    bytes_processed += len(encrypted_chunk) + 4
                    if progress_callback:
                        progress_callback(bytes_processed, total_size)

        if verify_integrity:
            decrypted_hash = self.calculate_hash(output_path)
            if decrypted_hash != original_hash:
                raise ValueError("File integrity check failed")

        return output_path

    def verify_file(self, encrypted_path: Path) -> bool:
        """Verify encrypted file integrity without decryption"""
        pass

    @staticmethod
    def derive_key(password: str, salt: bytes, config: EncryptionConfig) -> bytes:
        """Derive encryption key using Argon2id"""
        return argon2.low_level.hash_secret_raw(
            secret=password.encode(),
            salt=salt,
            time_cost=config.argon2_iterations,
            memory_cost=config.argon2_memory_mb * 1024,
            parallelism=config.argon2_parallelism,
            hash_len=32,
            type=argon2.low_level.Type.ID
        )

    @staticmethod
    def calculate_hash(file_path: Path) -> bytes:
        """Calculate SHA-256 hash of file"""
        hasher = hashlib.sha256()
        with open(file_path, 'rb') as f:
            while chunk := f.read(8192):
                hasher.update(chunk)
        return hasher.digest()
