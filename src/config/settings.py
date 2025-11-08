from __future__ import annotations

from dataclasses import dataclass

@dataclass
class EncryptionConfig:
    """Encryption configuration"""
    algorithm: str = "AES-256-GCM"
    argon2_memory_mb: int = 64
    argon2_iterations: int = 100000
    argon2_parallelism: int = 4
    chunk_size_mb: int = 1
    verify_integrity: bool = True
    compress: bool = False
