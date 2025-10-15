import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

function encryptFile(filePath, password, options, outputPath) {
    return new Promise((resolve, reject) => {
        const iv = crypto.randomBytes(16);
        const key = crypto.scryptSync(password, 'salt', 32);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        const inputFile = fs.createReadStream(filePath);
        const outPath = outputPath || `${filePath}.enc`;
        const outputFile = fs.createWriteStream(outPath);

        outputFile.write(iv, (err) => {
            if (err) {
                return reject(new Error('Failed to write IV to output file: ' + err.message));
            }

            const stream = inputFile.pipe(cipher);

            stream.on('end', () => {
                const authTag = cipher.getAuthTag();
                outputFile.write(authTag, (err) => {
                    if (err) {
                        return reject(new Error('Failed to write auth tag to output file: ' + err.message));
                    }
                    outputFile.close(() => {
                        if (options.delete) {
                            fs.unlink(filePath, (err) => {
                                if (err) {
                                    reject(new Error('Failed to delete original file.'));
                                } else {
                                    resolve();
                                }
                            });
                        } else if (options.eraseTraces) {
                            fs.writeFile(filePath, crypto.randomBytes(fs.statSync(filePath).size), (err) => {
                                if (err) {
                                    reject(new Error('Failed to erase traces.'));
                                } else {
                                    fs.unlink(filePath, (err) => {
                                        if (err) {
                                            reject(new Error('Failed to delete original file after erasing.'));
                                        } else {
                                            resolve();
                                        }
                                    });
                                }
                            });
                        } else {
                            resolve();
                        }
                    });
                });
            });

            stream.pipe(outputFile, { end: false });

        });

        outputFile.on('error', (err) => reject(new Error('Encryption failed: ' + err.message)));
        inputFile.on('error', (err) => reject(new Error('Input file read failed: ' + err.message)));
        cipher.on('error', (err) => reject(new Error('Cipher error: ' + err.message)));
    });
}

export { encryptFile };