function sendMessage() {
    const messageInput = document.getElementById("messageInput");
    const fileInput = document.getElementById("fileInput");
    let message = messageInput.value.trim();

    if (!conn || (!message && !fileInput.files.length)) return;

    function handleFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({
                name: file.name,
                size: file.size,
                type: file.type,
                dataUrl: reader.result,
            });
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    async function processMessage() {
        let finalMessage = escapeHtml(message);

        finalMessage = finalMessage.replace(
            /\[([^\]]+)\]\(([^)]+)\)/g,
            (match, text, url) => {
                // Validate URL
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

        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            try {
                const { name, size, type, dataUrl } = await handleFile(file);
                const fileSizeKB = (size / 1024).toFixed(2);
                const isImage = type.startsWith("image/");
                const safeFileName = escapeHtml(name);

                finalMessage += `
                    <div class="file-container">
                        <p><strong>File:</strong> ${safeFileName} (${fileSizeKB} KB)</p>
                        ${isImage 
                            ? `<img src="${dataUrl}" alt="${safeFileName}" class="message-image"/>` 
                            : `<p>File preview not available</p>`
                        }
                        <a href="${dataUrl}" download="${safeFileName}" class="file-download-link">
                            Download
                        </a>
                    </div>
                `;
            } catch (error) {
                console.error("Error reading file:", error);
                finalMessage += `<p class="error">Error attaching file: ${escapeHtml(error.message)}</p>`;
            }
        }

        return finalMessage;
    }

    processMessage().then((finalMessage) => {
        try {
            const encryptedMessage = encryptMessage(finalMessage);
            conn.send({
                username: username,
                message: encryptedMessage,
            });

            const messageArea = document.getElementById("messageArea");
            const timestamp = new Date().toLocaleTimeString();
            messageArea.innerHTML += `
                <div class="message sent">
                    <strong>${escapeHtml(username)}:</strong> ${finalMessage}
                    <div class="timestamp">${timestamp}</div>
                </div>
            `;
            messageArea.scrollTop = messageArea.scrollHeight;
            messageInput.value = "";
            fileInput.value = "";
            log("Message sent successfully");
        } catch (err) {
            log(`Error sending message: ${err.message}`);
        }
    });
}