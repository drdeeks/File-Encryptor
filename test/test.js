const { encryptFile } = require('../src/encryption/encrypt');
const { decryptFile } = require('../src/encryption/decrypt');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const testFilePath = path.join(__dirname, 'test-file.txt');
const encryptedFilePath = path.join(__dirname, 'test-file.txt.enc');
const decryptedFilePath = path.join(__dirname, 'test-file.txt');
const password = 'test-password';

describe('Encryption and Decryption', () => {
    before((done) => {
        fs.writeFile(testFilePath, 'This is a test file.', done);
    });

    after(() => {
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
        if (fs.existsSync(encryptedFilePath)) {
            fs.unlinkSync(encryptedFilePath);
        }
    });

    it('should encrypt and decrypt a file successfully', async () => {
        await encryptFile(testFilePath, password, {});
        assert(fs.existsSync(encryptedFilePath), 'Encrypted file should exist');

        await decryptFile(encryptedFilePath, password);
        assert(fs.existsSync(decryptedFilePath), 'Decrypted file should exist');

        const decryptedContent = fs.readFileSync(decryptedFilePath, 'utf-8');
        assert.strictEqual(decryptedContent, 'This is a test file.', 'Decrypted content should match original content');
    });

    it('should fail decryption with a wrong password', async () => {
        await encryptFile(testFilePath, password, {});
        assert(fs.existsSync(encryptedFilePath), 'Encrypted file should exist');

        try {
            await decryptFile(encryptedFilePath, 'wrong-password');
            assert.fail('Decryption should have failed');
        } catch (error) {
            assert.strictEqual(error.message, 'Decryption failed. Check your password or file integrity.');
        }
    });

    it('should fail decryption with a corrupted file', async () => {
        await encryptFile(testFilePath, password, {});
        assert(fs.existsSync(encryptedFilePath), 'Encrypted file should exist');

        // Corrupt the file
        fs.appendFileSync(encryptedFilePath, 'corrupted');

        try {
            await decryptFile(encryptedFilePath, password);
            assert.fail('Decryption should have failed');
        } catch (error) {
            assert.strictEqual(error.message, 'Decryption failed. Check your password or file integrity.');
        }
    });
});