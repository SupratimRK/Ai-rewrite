// === AI TEXT REWRITER CONTENT SCRIPT ===

// Helper function to safely send messages to background script
function safeSendMessage(message) {
    try {
        if (chrome.runtime?.id) {
            chrome.runtime.sendMessage(message).catch(err => {
                // Extension context invalidated - page needs refresh
                console.log('AI Rewriter: Extension was reloaded. Please refresh the page.');
            });
        }
    } catch (err) {
        // Extension context invalidated
        console.log('AI Rewriter: Extension was reloaded. Please refresh the page.');
    }
}

// Listen for messages from injected scripts
window.addEventListener('message', (event) => {
    // Only accept messages from same origin
    if (event.source !== window) return;
    
    if (event.data.type === 'AI_REWRITER_OPEN_SETTINGS') {
        safeSendMessage({ action: 'openSettings' });
    }
    
    // Handle preview insert action
    if (event.data.type === 'AI_REWRITER_PREVIEW_INSERT') {
        safeSendMessage({ 
            action: 'previewInsert', 
            previewId: event.data.previewId 
        });
    }
    
    // Handle preview cancel action
    if (event.data.type === 'AI_REWRITER_PREVIEW_CANCEL') {
        safeSendMessage({ 
            action: 'previewCancel', 
            previewId: event.data.previewId 
        });
    }
});
