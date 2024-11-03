function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function processMarkdownLinks(message) {
    return message.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        (match, text, url) => {
            try {
                const validUrl = new URL(url);
                if (validUrl.protocol === 'http:' || validUrl.protocol === 'https:') {
                    return `<a href="${validUrl.href}" target="_blank" rel="noopener noreferrer" class="message-link">${text}</a>`;
                }
            } catch {
                return match;
            }
            return match;
        }
    );
}

// Main function for sending text messages
async function sendTextMessage() {
    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value.trim();

    if (!conn || !message) return;

    try {
        let processedMessage = escapeHtml(message);
        processedMessage = processMarkdownLinks(processedMessage);

        const encryptedMessage = encryptMessage(processedMessage);
        conn.send({
            username: username,
            message: encryptedMessage,
        });

        displayMessage(username, processedMessage);
        messageInput.value = "";
        log("Message sent successfully");
    } catch (err) {
        log(`Error sending message: ${err.message}`);
    }
}

// Determines the type of message to send
function sendMessage() {
    const messageInput = document.getElementById("messageInput");

    if (!conn) return;

    if (messageInput.value.trim()) {
        sendTextMessage();
    }
}
