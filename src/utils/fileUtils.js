// src/utils/fileUtils.js

const fs = require('fs');
const path = require('path');

// Check if a file exists
const fileExists = (filePath) => {
    return fs.existsSync(filePath);
};

// Read a file
const readFile = (filePath) => {
    if (!fileExists(filePath)) {
        throw new Error(`File not found: ${filePath}. Did you lose it in a tragic accident?`);
    }
    return fs.readFileSync(filePath, 'utf8');
};

// Write to a file
const writeFile = (filePath, data) => {
    fs.writeFileSync(filePath, data);
    console.log(`Successfully wrote to ${filePath}. Hope you remember where you put it!`);
};

// Delete a file
const deleteFile = (filePath) => {
    if (fileExists(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted ${filePath}. It's like it never existed... or did it?`);
    } else {
        console.warn(`Attempted to delete ${filePath}, but it was already gone. Poof!`);
    }
};

// Get the file extension
const getFileExtension = (filePath) => {
    return path.extname(filePath);
};

// Export utility functions
module.exports = {
    fileExists,
    readFile,
    writeFile,
    deleteFile,
    getFileExtension,
};