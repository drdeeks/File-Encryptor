const { encryptFile } = require('./src/encryption/encrypt');

encryptFile('test-file.txt', 'test-password', {})
    .then(() => console.log('Encryption successful'))
    .catch((err) => console.error(err));