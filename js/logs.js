function log(message) {
    const debugArea = document.getElementById('debugArea');
    const timestamp = new Date().toLocaleTimeString();
    debugArea.innerHTML += `<div>[${timestamp}] ${message}</div>`;
    debugArea.scrollTop = debugArea.scrollHeight;
    console.log(`[${timestamp}] ${message}`);
}