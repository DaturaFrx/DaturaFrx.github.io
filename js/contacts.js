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
        reader.onload = function (e) {
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