function showHelp() {
    const helpFrame = document.getElementById("helpFrame");
    helpFrame.style.display = helpFrame.style.display === "none" ? "block" : "none";

    if (helpFrame.style.display === "block") {
        helpFrame.onload = function () {
            const doc = helpFrame.contentDocument || helpFrame.contentWindow.document;
            const style = doc.createElement("style");
            style.textContent = "body { background-color: #fff; color: #000; font-family: Arial, sans-serif; padding: 10px; }";
            doc.head.appendChild(style);
        };
    }
}