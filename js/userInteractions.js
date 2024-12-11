
function openFileManager() {
    document.getElementById('fileInput').click();
}

// User keystroke inputs
// Handle Enter key in message input
document.getElementById('messageInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Handle Enter key in username input
document.getElementById('usernameInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        setUsername();
    }
});

// Handle Enter key in peer ID input
document.getElementById('peerIdInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        connectToPeer();
    }
});