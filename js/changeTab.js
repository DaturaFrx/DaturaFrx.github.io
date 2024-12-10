function showTab(tabId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.nav-link[onclick="showTab('${tabId}')"]`).classList.add('active');
}

function refreshConnection() {
    const connectionManager = new SupabaseConnectionManager(SUPABASE_URL, SUPABASE_ANON_KEY);
    connectionManager.checkConnection();
}

document.addEventListener('DOMContentLoaded', () => {
    const connectionManager = new SupabaseConnectionManager(SUPABASE_URL, SUPABASE_ANON_KEY);
    connectionManager.checkConnection();
});