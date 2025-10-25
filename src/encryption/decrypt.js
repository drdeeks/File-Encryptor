import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

function decryptFile(encryptedFilePath, password) {
    return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(encryptedFilePath);
        let iv, authTag;
        const chunks = [];

        readStream.on('data', (chunk) => {
            chunks.push(chunk);
        });

        readStream.on('close', () => {
            const data = Buffer.concat(chunks);
            iv = data.slice(0, 16);
            authTag = data.slice(data.length - 16);
            const encryptedContent = data.slice(16, data.length - 16);

            if (iv.length < 16) {
                return reject(new Error('Invalid file: IV is missing or too short.'));
            }
            if (authTag.length < 16) {
                return reject(new Error('Invalid file: Auth tag is missing or too short.'));
            }

            try {
                const key = crypto.scryptSync(password, 'salt', 32);
                const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
                decipher.setAuthTag(authTag);

                const decrypted = Buffer.concat([
                    decipher.update(encryptedContent),
                    decipher.final()
                ]);

                const originalFilePath = path.join(
                    path.dirname(encryptedFilePath),
                    path.basename(encryptedFilePath, '.enc')
                );

                const writeStream = fs.createWriteStream(originalFilePath);
                writeStream.write(decrypted, (err) => {
                    if (err) {
                        return reject(new Error('Failed to write decrypted file: ' + err.message));
                    }
                    writeStream.close(() => {
                        console.log(`🎉 Decryption successful! Your file is back from the dead: ${originalFilePath}`);
                        resolve(originalFilePath);
                    });
                });
                writeStream.on('error', (err) => {
                    reject(new Error('Output file write failed: ' + err.message));
                });
            } catch (error) {
                reject(new Error('Decryption failed. Check your password or file integrity.'));
            }
        });

        readStream.on('error', (err) => {
            reject(new Error('Input file read failed: ' + err.message));
        });
    });
}

export { decryptFile };