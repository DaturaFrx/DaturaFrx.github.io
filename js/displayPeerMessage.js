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