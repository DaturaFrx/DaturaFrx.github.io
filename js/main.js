// Connection variables
let myId;
let peer = null;
let conn = null;
let retryCount = 0;
const MAX_RETRIES = 3;
// User variables
let username = '';
let password = '';
let encryptionKey = '';
// File transfer variables
const activeFileTransfers = new Map();
let transferCounter = 0;

function generatePersistentId(username, password) {
    const hash = CryptoJS.SHA256(username + password).toString().substring(0, 32);
    return `user-${hash}`;
}

function setUsername() {
    const usernameInput = document.getElementById('usernameInput');
    const passwordInput = document.getElementById('passwordInput');
    if (usernameInput.value.trim()) {
        username = usernameInput.value.trim();
        password = passwordInput.value.trim();
        localStorage.setItem('username', username);
        localStorage.setItem('password', password);
        document.getElementById('displayUsername').textContent = username;
        document.getElementById('setupPanel').style.display = 'none';
        document.getElementById('mainPanel').style.display = 'block';
        initPeer();
        loadSavedContacts();
    } else {
        alert('Please enter a valid username');
    }
}

window.onload = function() {
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
        document.getElementById('usernameInput').value = savedUsername;
        setUsername();
    }
};

function clearContacts() {
    if (confirm('Are you sure you want to clear all contacts? This cannot be undone.')) {
        localStorage.removeItem('contacts');
        loadSavedContacts();
        log('All contacts cleared');
    }
}

function exportContacts() {
    const contacts = localStorage.getItem('contacts') || '{}';
    const blob = new Blob([contacts], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'p2p-contacts.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importContacts(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const contacts = JSON.parse(e.target.result);
                localStorage.setItem('contacts', JSON.stringify(contacts));
                loadSavedContacts();
                log('Contacts imported successfully');
            } catch (err) {
                log('Error importing contacts: ' + err.message);
            }
        };
        reader.readAsText(file);
    }
}

function removeContact(peerId) {
    if (confirm('Are you sure you want to remove this contact?')) {
        let contacts = JSON.parse(localStorage.getItem('contacts') || '{}');
        delete contacts[peerId];
        localStorage.setItem('contacts', JSON.stringify(contacts));
        loadSavedContacts();
        log(`Contact ${peerId} removed`);
    }
}

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

function setUsername() {
    const usernameInput = document.getElementById('usernameInput');
    if (usernameInput.value.trim()) {
        username = usernameInput.value.trim();
        document.getElementById('displayUsername').textContent = username;
        document.getElementById('setupPanel').style.display = 'none';
        document.getElementById('mainPanel').style.display = 'block';
        initPeer();
        loadSavedContacts();
    } else {
        alert('Please enter a valid username');
    }
}

function saveContact(peerId, peerUsername) {
    let contacts = JSON.parse(localStorage.getItem('contacts') || '{}');
    contacts[peerId] = peerUsername;
    localStorage.setItem('contacts', JSON.stringify(contacts));
    loadSavedContacts();
}

function loadSavedContacts() {
    const contacts = JSON.parse(localStorage.getItem('contacts') || '{}');
    const contactsDiv = document.getElementById('savedContacts');
    contactsDiv.innerHTML = '';

    Object.entries(contacts).forEach(([peerId, peerUsername]) => {
        // Skip the user's own ID
        // NOT WORKING LEL :3
        // WAIT NO... it is...
        if (peerId === myId) return;

        const contactElement = document.createElement('div');
        contactElement.className = 'contact-item';
        contactElement.innerHTML = `
            <span>${peerUsername} (${peerId})</span>
            <div>
                <button onclick="connectToPeerById('${peerId}')">Connect</button>
                <button class="danger-button" onclick="removeContact('${peerId}')">Remove</button>
            </div>
        `;
        contactsDiv.appendChild(contactElement);
    });
}

function connectToPeerById(peerId) {
    document.getElementById('peerIdInput').value = peerId;
    connectToPeer();
}

function log(message) {
    const debugArea = document.getElementById('debugArea');
    const timestamp = new Date().toLocaleTimeString();
    debugArea.innerHTML += `<div>[${timestamp}] ${message}</div>`;
    debugArea.scrollTop = debugArea.scrollHeight;
    console.log(`[${timestamp}] ${message}`);
}

// Connections
let connectionQueue = [];
let connectionRequestPending = false;
let connectButtonCooldown = false;

function initPeer() {
    const persistentId = generatePersistentId(username);
    const config = {
        debug: 2,
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ],
            iceCandidatePoolSize: 10,
        }
    };
    
    peer = new Peer(persistentId, config);
    
    peer.on('open', (id) => {
        myId = id;
        document.getElementById('myId').textContent = id;
        updateConnectionStatus('Ready to connect');
    });

    peer.on('connection', (connection) => {
        const requesterId = connection.peer;
        const requesterName = connection.metadata.username || "Unknown User";
        
        const acceptConnection = confirm(`User ${requesterName} (ID: ${requesterId}) is trying to connect. Do you want to accept this connection?`);

        if (acceptConnection) {
            conn = connection;
            updateConnectionStatus('Connected');
            setupConnection();
        } else {
            connection.on('open', () => {
                connection.send({
                    type: 'connection_rejected',
                    username: username
                });
                connection.close();
            });
            updateConnectionStatus('Connection rejected');
        }
    });

    peer.on('error', handleError);
    peer.on('disconnected', () => {
        updateConnectionStatus('Disconnected, reconnecting...');
        peer.reconnect();
    });
}

function connectToPeer() {
    if (connectButtonCooldown) {
        alert('Please wait 3 seconds before trying to connect again.');
        return;
    }

    const peerId = document.getElementById('peerIdInput').value;
    if (!peerId) {
        alert('Please enter a peer ID');
        return;
    }

    if (connectionRequestPending) {
        const cancelConnection = confirm('A connection request is already pending. Do you want to cancel it?');
        if (cancelConnection) {
            connectionRequestPending = false;
            conn.close();
            updateConnectionStatus('Ready to connect');
        } else {
            return;
        }
    }

    updateConnectionStatus('Pending connection...');
    connectionRequestPending = true;
    
    const connectionOptions = {
        reliable: true,
        serialization: 'json',
        metadata: { 
            username: username,
            timestamp: Date.now(),
            encryptionKey: generateEncryptionKey()
        }
    };

    conn = peer.connect(peerId, connectionOptions);
    setupConnection();

    connectButtonCooldown = true;
    setTimeout(() => {
        connectButtonCooldown = false;
    }, 3000);
}

function setupConnection() {
    conn.on('open', () => {
        connectionRequestPending = false;
        updateConnectionStatus('Connected');
        
        if (conn.metadata?.username) {
            saveContact(conn.peer, conn.metadata.username);
        }
    });

    conn.on('data', (data) => {
        if (data.type === 'connection_rejected') {
            connectionRequestPending = false;
            updateConnectionStatus('Connection rejected');
            alert(`Connection request was rejected by ${data.username}`);
            conn.close();
            return;
        }

        displayMessage(data.username, decryptMessage(data.message));
    });

    conn.on('close', () => {
        connectionRequestPending = false;
        updateConnectionStatus('Disconnected');
        conn = null;
    });

    conn.on('error', handleError);
}

// Fix overflow for messages
function displayMessage(username, message) {
    const messageArea = document.getElementById('messageArea');
    const timestamp = new Date().toLocaleTimeString();
    messageArea.innerHTML += `
        <div class="message received">
            <strong>${username}:</strong> ${message}
            <div class="timestamp">${timestamp}</div>
        </div>
    `;
    messageArea.scrollTop = messageArea.scrollHeight;
}

// Errors Handling
function handleError(err) {
    let errorMessage = 'Error: ' + err.type;
    
    if (err.type === 'peer-unavailable') {
        log('Peer not found or unavailable');
        
        // Cancel the pending connection request
        if (connectionRequestPending) {
            connectionRequestPending = false;
            conn.close();
            updateConnectionStatus('Ready to connect');
        }
    } else if (err.type === 'network' || err.type === 'disconnected') {
        if (retryCount < MAX_RETRIES) {
            retryCount++;
            log(`Attempting reconnection (${retryCount}/${MAX_RETRIES})...`);
            setTimeout(() => {
                if (conn) {
                    conn.close();
                }
                connectToPeer();
            }, 2000);
        }
    }

    updateConnectionStatus(errorMessage);
}

function updateConnectionStatus(status) {
    const statusElement = document.getElementById('status');
    statusElement.textContent = status;
    statusElement.className = `connection-status ${status.toLowerCase().replace(/\s+/g, '-')}`;
}

// Message sending
// Function to open the file manager by clicking the hidden file input
function openFileManager() {
    document.getElementById('fileInput').click();
}

function getTimestamp() {
    return new Date().toLocaleTimeString();
}

// Handle regular text messages
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    let message = messageInput.value.trim();
    
    if (!conn || !message) return;
    
    message = message.replace(/\n/g, '<br>');
    
    try {
        // Send the encrypted message
        const encryptedMessage = encryptMessage(message);
        conn.send({
            type: 'text',
            username: username,
            message: encryptedMessage
        });

        // Update UI
        const messageArea = document.getElementById('messageArea');
        messageArea.innerHTML += `
            <div class="message sent">
                <strong>You:</strong> ${message}
                <div class="timestamp">${getTimestamp()}</div>
            </div>
        `;
        messageArea.scrollTop = messageArea.scrollHeight;
        messageInput.value = '';
        
    } catch (err) {
        console.error('Error sending message:', err);
    }
}

// Handle file messages
let fileTransferCount = 0;

function sendFile() {
    const fileInput = document.getElementById('fileInput');
    if (!conn || !fileInput.files.length) return;

    const file = fileInput.files[0];
    const transferId = `file-${++fileTransferCount}`;
    const messageArea = document.getElementById('messageArea');

    // Add loading placeholder
    messageArea.innerHTML += `
        <div class="message sent">
            <strong>You:</strong>
            <div class="file-item" id="${transferId}">
                <p><strong>File:</strong> ${file.name} (${(file.size / 1024).toFixed(2)} KB)</p>
                <div class="loading-indicator">
                    <div class="spinner"></div>
                    <span>Sending file...</span>
                </div>
            </div>
            <div class="timestamp">${getTimestamp()}</div>
        </div>
    `;
    messageArea.scrollTop = messageArea.scrollHeight;

    // Read and send the file
    const reader = new FileReader();
    
    reader.onload = function() {
        try {
            conn.send({
                type: 'file',
                username: username,
                transferId: transferId,
                file: {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: reader.result
                }
            });
        } catch (err) {
            const fileElement = document.getElementById(transferId);
            if (fileElement) {
                fileElement.innerHTML = `
                    <p><strong>File:</strong> ${file.name}</p>
                    <p class="error-text">Error sending file</p>
                `;
            }
            console.error('Error sending file:', err);
        }
    };

    reader.onerror = function() {
        const fileElement = document.getElementById(transferId);
        if (fileElement) {
            fileElement.innerHTML = `
                <p><strong>File:</strong> ${file.name}</p>
                <p class="error-text">Error reading file</p>
            `;
        }
        console.error('Error reading file');
    };

    reader.readAsDataURL(file);
    fileInput.value = ''; // Clear the input
}

// Handle incoming messages
function handleIncomingMessage(data) {
    const messageArea = document.getElementById('messageArea');

    if (data.type === 'text') {
        // Handle text message
        messageArea.innerHTML += `
            <div class="message received">
                <strong>${data.username}:</strong> ${decryptMessage(data.message)}
                <div class="timestamp">${getTimestamp()}</div>
            </div>
        `;
    } 
    else if (data.type === 'file') {
        // Handle file message
        const isImage = data.file.type.startsWith('image/');
        const fileContent = `
            <div class="message received">
                <strong>${data.username}:</strong>
                <div class="file-item">
                    <p><strong>File:</strong> ${data.file.name} (${(data.file.size / 1024).toFixed(2)} KB)</p>
                    ${isImage ? 
                        `<img src="${data.file.data}" alt="${data.file.name}" class="message-image"/>` : 
                        '<p>File preview not available</p>'
                    }
                    <a href="${data.file.data}" download="${data.file.name}" class="file-download-link">
                        Download
                    </a>
                </div>
                <div class="timestamp">${getTimestamp()}</div>
            </div>
        `;

        // If this is a response to our sent file, replace the loading placeholder
        const existingFile = document.getElementById(data.transferId);
        if (existingFile) {
            existingFile.innerHTML = fileContent;
        } else {
            // Otherwise add as new message
            messageArea.innerHTML += fileContent;
        }
    }

    messageArea.scrollTop = messageArea.scrollHeight;
}

// Add event listener for the message input
document.getElementById('messageInput').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        if (!event.shiftKey) {
            event.preventDefault(); // Prevent default Enter behavior
            sendMessage(); // Send message on Enter
        }
        // Shift+Enter will create a new line (default behavior)
    }
});

// Handle Enter key in message input
document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Handle Enter key in username input
document.getElementById('usernameInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        setUsername();
    }
});

// Handle Enter key in peer ID input
document.getElementById('peerIdInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        connectToPeer();
    }
});