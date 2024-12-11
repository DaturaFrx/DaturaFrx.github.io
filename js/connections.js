// Connections
let connectionQueue = [];
let connectionRequestPending = false;

function connectToPeerById(peerId) {
  document.getElementById("peerIdInput").value = peerId;
  connectToPeer();
}

function initPeer() {
  const persistentId = generatePersistentId(username);
  const config = {
    debug: 2,
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
      iceCandidatePoolSize: 10,
    },
  };

  peer = new Peer(persistentId, config);

  peer.on("open", (id) => {
    myId = id;
    document.getElementById("myId").textContent = id;
    updateConnectionStatus("Ready to connect");
  });

  peer.on("connection", (connection) => {
    const requesterId = connection.peer;
    const requesterName = connection.metadata.username || "Unknown User";

    const acceptConnection = confirm(
      `User ${requesterName} (ID: ${requesterId}) is trying to connect. Do you want to accept this connection?`
    );

    if (acceptConnection) {
      conn = connection;
      updateConnectionStatus("Connected");
      setupConnection();
    } else {
      connection.on("open", () => {
        connection.send({
          type: "connection_rejected",
          username: username,
        });
        connection.close();
      });
      updateConnectionStatus("Connection rejected");
    }
  });

  peer.on("error", handleError);
  peer.on("disconnected", () => {
    updateConnectionStatus("Disconnected, reconnecting...");
    peer.reconnect();
  });
}

function connectToPeer() {
  const peerId = document.getElementById("peerIdInput").value;
  if (!peerId) {
    alert("Please enter a peer ID");
    return;
  }

  if (connectionRequestPending) {
    alert(
      "A connection request is already pending. Please wait for a response."
    );
    return;
  }

  updateConnectionStatus("Pending connection...");
  connectionRequestPending = true;

  const connectionOptions = {
    reliable: true,
    serialization: "json",
    metadata: {
      username: username,
      timestamp: Date.now(),
      encryptionKey: generateEncryptionKey(),
    },
  };

  conn = peer.connect(peerId, connectionOptions);
  setupConnection();
}

function setupConnection() {
  conn.on("open", () => {
    connectionRequestPending = false;
    updateConnectionStatus("Connected");

    if (conn.metadata?.username) {
      saveContact(conn.peer, conn.metadata.username);
    }
  });

  conn.on("data", (data) => {
    if (data.type === "connection_rejected") {
      connectionRequestPending = false;
      updateConnectionStatus("Connection rejected");
      alert(`Connection request was rejected by ${data.username}`);
      conn.close();
      return;
    }

    displayMessage(data.username, decryptMessage(data.message));
  });

  conn.on("close", () => {
    connectionRequestPending = false;
    updateConnectionStatus("Disconnected");
    conn = null;
  });

  conn.on("error", handleError);
}

function updateConnectionStatus(status) {
  const statusElement = document.getElementById("status");
  statusElement.textContent = status;
  statusElement.className = `connection-status ${status
    .toLowerCase()
    .replace(/\s+/g, "-")}`;
}
