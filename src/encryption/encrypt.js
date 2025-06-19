function encryptFile(filePath, password, options, outputPath) {
    return new Promise((resolve, reject) => {
        const fs = require('fs');
        const crypto = require('crypto');
        const path = require('path');

        // Generate a random initialization vector
        const iv = crypto.randomBytes(16);

        // Derive a key from the password
        const key = crypto.scryptSync(password, 'salt', 32);

        // Create a cipher using the password and iv
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

        // Read the file to be encrypted
        const inputFile = fs.createReadStream(filePath);
        const outPath = outputPath || `${filePath}.enc`;
        const outputFile = fs.createWriteStream(outPath);

        let errored = false;

        outputFile.on('error', (err) => {
            errored = true;
            reject(new Error('Encryption failed: ' + err.message));
        });
        inputFile.on('error', (err) => {
            errored = true;
            reject(new Error('Input file read failed: ' + err.message));
        });
        cipher.on('error', (err) => {
            errored = true;
            reject(new Error('Cipher error: ' + err.message));
        });

        // Write IV at the start of the file, then pipe
        outputFile.once('open', () => {
            outputFile.write(iv, (err) => {
                if (err) {
                    errored = true;
                    reject(new Error('Failed to write IV to output file: ' + err.message));
                    return;
                }
                inputFile.pipe(cipher).pipe(outputFile, { end: false });
            });
        });

        inputFile.on('end', () => {
            cipher.end();
        });

        cipher.on('end', () => {
            outputFile.end();
        });

        outputFile.on('finish', () => {
            if (errored) return;
            outputFile.close(() => {
                // Handle the original file based on user choice
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
}

module.exports = { encryptFile };