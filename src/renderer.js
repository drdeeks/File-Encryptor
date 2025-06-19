// src/renderer.js

const { ipcRenderer } = require('electron');
const { encryptFile } = require('./encryption/encrypt');
const { decryptFile } = require('./encryption/decrypt');

document.getElementById('encryptButton').addEventListener('click', async () => {
    const filePath = document.getElementById('filePath').value;
    const password = document.getElementById('password').value;
    const eraseOption = document.querySelector('input[name="eraseOption"]:checked').value;

    if (!filePath || !password) {
        alert("Come on! You can't just leave me hanging with an empty file path or password. Fill it in, or I'll cry!");
        return;
    }

    try {
        await encryptFile(filePath, password, eraseOption);
        alert("File encrypted successfully! The old file is now as dead as my sense of humor.");
    } catch (error) {
        alert(`Oops! Something went wrong: ${error.message}. Maybe the file was too scared to be encrypted?`);
    }
});

document.getElementById('decryptButton').addEventListener('click', async () => {
    const encryptedFilePath = document.getElementById('encryptedFilePath').value;
    const password = document.getElementById('decryptPassword').value;

    if (!encryptedFilePath || !password) {
        alert("Seriously? You need to provide both the encrypted file path and the password. Or do you just enjoy living dangerously?");
        return;
    }

    try {
        await decryptFile(encryptedFilePath, password);
        alert("File decrypted successfully! It's like magic, but without the rabbits.");
    } catch (error) {
        alert(`Yikes! Decryption failed: ${error.message}. Maybe the password was too weak, like my coffee this morning.`);
    }
});

// Additional GUI setup and event listeners can be added here.