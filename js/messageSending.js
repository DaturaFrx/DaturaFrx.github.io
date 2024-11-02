function sendMessage() {
    const messageInput = document.getElementById("messageInput");
    const fileInput = document.getElementById("fileInput");
    let message = messageInput.value;

    if (!conn || (!message && !fileInput.files.length)) return;

    function handleFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
                resolve({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    dataUrl: reader.result,
                });
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    }

    async function processMessage() {
        let finalMessage = message;

        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            try {
                const { name, size, type, dataUrl } = await handleFile(file);

                const fileSizeKB = (size / 1024).toFixed(2);
                const isImage = type.startsWith("image/");

                finalMessage += `
        <div class="file-container">
            <p><strong>File:</strong> ${name} (${fileSizeKB} KB)</p>
            ${isImage
                        ? `<img src="${dataUrl}" alt="${name}" class="message-image" style="max-width: 100%; height: auto;"/>`
                        : `<p>File preview not available</p>`
                    }
            <a href="${dataUrl}" download="${name}" class="file-download-link" style="color: red;">
                Download
            </a>
        </div>
    `;
            } catch (error) {
                console.error("Error reading file:", error);
            }
        }

        // Markdown link matching: [text](URL)
        finalMessage = finalMessage
            .replace(/!?\[(.*?)\]\((https?:\/\/[^\s\)]+)\)/g, (match, text, url) => {
                return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
            })
            // Standalone URL matching for images and links
            .replace(/(https?:\/\/[^\s]+)(\s|$)/g, (match, p1, p2) => {
                if (
                    p1.endsWith(".jpg") ||
                    p1.endsWith(".jpeg") ||
                    p1.endsWith(".png") ||
                    p1.endsWith(".gif") ||
                    p1.endsWith(".bmp")
                ) {
                    return `<img src="${p1}" alt="Image" class="message-image" style="max-width: 100%; height: auto;"/>${p2}`;
                } else {
                    return `<a href="${p1}" target="_blank" rel="noopener noreferrer">${p1}</a>${p2}`;
                }
            });

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
                    <strong>You:</strong> ${finalMessage}
                    <div class="timestamp">${timestamp}</div>
                </div>
            `;
            messageArea.scrollTop = messageArea.scrollHeight;
            messageInput.value = "";
            fileInput.value = ""; // Reset file input after sending
            log("Message sent successfully");
        } catch (err) {
            log(`Error sending message: ${err.message}`);
        }
    });
}