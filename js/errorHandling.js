function handleError(err) {
    document.getElementById("status").textContent = "Error: " + err.type;
    document.getElementById("status").className =
        "connection-status disconnected";

    if (err.type === "peer-unavailable") {
        log("Peer not found or unavailable");
    } else if (err.type === "network" || err.type === "disconnected") {
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
}