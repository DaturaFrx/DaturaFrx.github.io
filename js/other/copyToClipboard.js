function copyIdToClipboard() {
    const idText = document.getElementById("myId").innerText;
    navigator.clipboard.writeText(idText).then(() => {
        showToast();
    }).catch(err => {
        console.error("Failed to copy ID: ", err);
    });
}

function showToast() {
    const toast = document.getElementById("toast");
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}

document.addEventListener("DOMContentLoaded", generateId);