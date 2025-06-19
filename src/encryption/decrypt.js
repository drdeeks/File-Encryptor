const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

function decryptFile(encryptedFilePath, password) {
    return new Promise((resolve, reject) => {
        try {
            // Read the encrypted file
            const encryptedData = fs.readFileSync(encryptedFilePath);
            
            // Extract IV from the first 16 bytes
            const iv = encryptedData.slice(0, 16);
            const encryptedContent = encryptedData.slice(16);
            
            // Derive the key using the same method as encryption
            const key = crypto.scryptSync(password, 'salt', 32);
            
            // Create decipher
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            
            // Decrypt the content
            let decrypted = Buffer.concat([
                decipher.update(encryptedContent),
                decipher.final()
            ]);
            
            // Determine output path (remove .enc extension)
            const originalFilePath = path.join(
                path.dirname(encryptedFilePath), 
                path.basename(encryptedFilePath, '.enc')
            );
            
            // Write the decrypted content
            fs.writeFileSync(originalFilePath, decrypted);
            
            console.log(`🎉 Decryption successful! Your file is back from the dead: ${originalFilePath}`);
            resolve(originalFilePath);
        } catch (error) {
            console.error(`💀 Oops! Something went wrong during decryption: ${error.message}`);
            reject(error);
        }
    });
}

module.exports = { decryptFile };