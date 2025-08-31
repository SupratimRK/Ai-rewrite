// === AI TEXT REWRITER CONTENT SCRIPT ===

// Listen for messages from injected scripts
window.addEventListener('message', (event) => {
    // Only accept messages from same origin
    if (event.source !== window) return;
    
    if (event.data.type === 'AI_REWRITER_OPEN_SETTINGS') {
        // Forward the message to the background script
        chrome.runtime.sendMessage({ action: 'openSettings' });
    }
});
