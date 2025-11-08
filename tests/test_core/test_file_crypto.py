from __future__ import annotations

import pytest
from pathlib import Path
from src.core.file_crypto import FileCrypto
from src.config.settings import EncryptionConfig
from cryptography.exceptions import InvalidTag

class TestFileCrypto:
    """Test file encryption/decryption"""

    @pytest.fixture
    def crypto(self):
        config = EncryptionConfig(argon2_iterations=1)
        return FileCrypto(config)

    @pytest.fixture
    def test_file(self, tmp_path):
        """Create test file"""
        file_path = tmp_path / "test.txt"
        file_path.write_text("Hello, World!" * 1000)
        return file_path

    def test_encrypt_decrypt_roundtrip(self, crypto, test_file):
        """Test encryption and decryption"""
        password = "test_password_123"

        # Encrypt
        encrypted_path = crypto.encrypt_file(test_file, password)
        assert encrypted_path.exists()
        assert encrypted_path.stat().st_size > test_file.stat().st_size

        # Decrypt
        decrypted_path = crypto.decrypt_file(encrypted_path, password)
        assert decrypted_path.exists()

        # Verify content
        assert test_file.read_bytes() == decrypted_path.read_bytes()

    def test_wrong_password(self, crypto, test_file):
        """Test decryption with wrong password"""
        encrypted_path = crypto.encrypt_file(test_file, "correct_password")

        with pytest.raises(InvalidTag):
            crypto.decrypt_file(encrypted_path, "wrong_password")

    def test_corrupted_file(self, crypto, test_file):
        """Test decryption of corrupted file"""
        encrypted_path = crypto.encrypt_file(test_file, "password")

        # Corrupt the file
        with open(encrypted_path, 'r+b') as f:
            f.seek(100)
            f.write(b'\x00' * 10)

        with pytest.raises(ValueError):
            crypto.decrypt_file(encrypted_path, "password")

    def test_large_file(self, crypto, tmp_path):
        """Test encryption of large file (1 MB)"""
        large_file = tmp_path / "large.bin"
        large_file.write_bytes(b'\x00' * (1 * 1024 * 1024))

        encrypted_path = crypto.encrypt_file(large_file, "password")
        decrypted_path = crypto.decrypt_file(encrypted_path, "password")

        assert large_file.read_bytes() == decrypted_path.read_bytes()

    def test_progress_callback(self, crypto, test_file):
        """Test progress callback"""
        progress_calls = []

        def callback(current, total):
            progress_calls.append((current, total))

        crypto.encrypt_file(test_file, "password", progress_callback=callback)

        assert len(progress_calls) > 0
        assert progress_calls[-1][0] <= progress_calls[-1][1]
