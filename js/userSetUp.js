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

window.onload = function () {
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
        document.getElementById('usernameInput').value = savedUsername;
        setUsername();
    }
};

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