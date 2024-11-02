function generateEncryptionKey() {
    return CryptoJS.lib.WordArray.random(256 / 8).toString();
}

function encryptMessage(message) {
    return CryptoJS.AES.encrypt(message, encryptionKey).toString();
}

function decryptMessage(encryptedMessage) {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
}