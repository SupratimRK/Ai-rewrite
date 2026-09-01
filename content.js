// === AI TEXT REWRITER CONTENT SCRIPT ===

// Helper function to safely send messages to background script
function safeSendMessage(message, callback) {
    try {
        if (chrome.runtime?.id) {
            chrome.runtime.sendMessage(message, (res) => {
                if (chrome.runtime.lastError) {
                    // Extension context invalidated or inactive
                    return;
                }
                if (typeof callback === 'function') callback(res);
            });
        }
    } catch (err) {
        // Extension context invalidated
    }
}

// Listen for messages from injected scripts (preview accept/cancel/open settings)
window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    
    if (event.data.type === 'AI_REWRITER_OPEN_SETTINGS') {
        safeSendMessage({ action: 'openSettings' });
    }
    
    if (event.data.type === 'AI_REWRITER_PREVIEW_INSERT') {
        safeSendMessage({ 
            action: 'previewInsert', 
            previewId: event.data.previewId 
        });
    }
    
    if (event.data.type === 'AI_REWRITER_PREVIEW_CANCEL') {
        safeSendMessage({ 
            action: 'previewCancel', 
            previewId: event.data.previewId 
        });
    }
});

// === IN-TEXTBOX FLOATING QUICK REWRITE BUTTON ===

(function initFloatingQuickButton() {
    let buttonEl = null;
    let currentTarget = null;
    let hideTimer = null;
    let cachedSettings = {
        enableFloatingButton: true,
        defaultRewriteMode: 'retone',
        defaultModeName: 'Retone'
    };

    // Refresh settings from background
    function syncSettings() {
        safeSendMessage({ action: 'getFloatingButtonSettings' }, (res) => {
            if (res) {
                cachedSettings = res;
                if (!cachedSettings.enableFloatingButton && buttonEl) {
                    buttonEl.style.display = 'none';
                }
            }
        });
    }
    syncSettings();

    // Inject styles for the floating quick button
    function injectFloatingButtonStyles() {
        if (document.getElementById('--ai-rewriter-floating-btn-styles')) return;
        const style = document.createElement('style');
        style.id = '--ai-rewriter-floating-btn-styles';
        style.textContent = `
            #--ai-rewriter-quick-btn {
                position: absolute;
                z-index: 2147483640;
                display: flex;
                align-items: center;
                gap: 5px;
                padding: 4px 9px 4px 6px;
                height: 28px;
                border-radius: 9999px;
                background: rgba(15, 23, 42, 0.92);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08);
                color: #ffffff;
                font-family: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
                font-size: 11px;
                font-weight: 700;
                cursor: pointer;
                user-select: none;
                opacity: 0;
                transform: scale(0.92) translateY(4px);
                transition: opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), background 0.15s, border-color 0.15s;
                pointer-events: auto;
            }
            #--ai-rewriter-quick-btn.visible {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
            #--ai-rewriter-quick-btn:hover {
                background: rgba(30, 41, 59, 0.98);
                border-color: rgba(99, 102, 241, 0.7);
                box-shadow: 0 6px 20px -2px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.5);
                transform: scale(1.04) translateY(-1px);
            }
            #--ai-rewriter-quick-btn .btn-sparkle-icon {
                width: 17px;
                height: 17px;
                border-radius: 50%;
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                box-shadow: 0 0 8px rgba(99, 102, 241, 0.6);
            }
            #--ai-rewriter-quick-btn .btn-sparkle-icon svg {
                width: 9.5px;
                height: 9.5px;
                fill: white;
            }
            #--ai-rewriter-quick-btn.loading .btn-sparkle-icon svg {
                animation: aiQuickSpin 0.8s linear infinite;
            }
            @keyframes aiQuickSpin {
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    // Create or get DOM floating button
    function getOrCreateButton() {
        if (buttonEl) return buttonEl;
        injectFloatingButtonStyles();

        buttonEl = document.createElement('div');
        buttonEl.id = '--ai-rewriter-quick-btn';
        buttonEl.setAttribute('role', 'button');
        buttonEl.setAttribute('tabindex', '-1');
        buttonEl.title = 'Click to quickly rewrite with AI';

        buttonEl.innerHTML = `
            <div class="btn-sparkle-icon">
                <svg viewBox="0 0 24 24"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>
            </div>
            <span class="btn-label">Rewrite</span>
        `;

        // Click handler
        buttonEl.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        buttonEl.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            triggerButtonRewrite();
        });

        document.body.appendChild(buttonEl);
        return buttonEl;
    }

    // Extract text from element or selection
    function getTargetText(el) {
        if (!el) return '';
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
            const selectedText = sel.toString().trim();
            if (selectedText) return selectedText;
        }

        if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
            const start = el.selectionStart;
            const end = el.selectionEnd;
            if (start !== end) {
                return el.value.substring(start, end).trim();
            }
            return (el.value || '').trim();
        }

        if (el.isContentEditable || el.getAttribute('role') === 'textbox') {
            return (el.innerText || el.textContent || '').trim();
        }

        return '';
    }

    // Trigger Quick Rewrite
    function triggerButtonRewrite() {
        if (!currentTarget) return;
        const text = getTargetText(currentTarget);
        if (!text) return;

        const btn = getOrCreateButton();
        btn.classList.add('loading');
        const label = btn.querySelector('.btn-label');
        if (label) label.textContent = 'Writing...';

        safeSendMessage({
            action: 'triggerQuickRewrite',
            text: text
        }, () => {
            setTimeout(() => {
                btn.classList.remove('loading');
                if (label) label.textContent = cachedSettings.defaultModeName || 'Rewrite';
            }, 600);
        });
    }

    // Position floating button near the bottom-right of the active editor
    function updateButtonPosition(el) {
        if (!el || !cachedSettings.enableFloatingButton) {
            hideButton();
            return;
        }

        const text = getTargetText(el);
        if (!text || text.length < 2) {
            hideButton();
            return;
        }

        const rect = el.getBoundingClientRect();
        // If element is not visible or too small
        if (rect.width < 50 || rect.height < 20 || rect.bottom < 0 || rect.top > window.innerHeight) {
            hideButton();
            return;
        }

        const btn = getOrCreateButton();
        const label = btn.querySelector('.btn-label');
        if (label && !btn.classList.contains('loading')) {
            label.textContent = cachedSettings.defaultModeName || 'Rewrite';
        }

        // Calculate bottom-right inside/attached position
        let top = rect.bottom + window.scrollY - 34;
        let left = rect.right + window.scrollX - 96;

        // If field is too short (single-line input), place slightly outside on the right or below
        if (rect.height < 40) {
            top = rect.top + window.scrollY + (rect.height - 28) / 2;
            left = rect.right + window.scrollX - 88;
        }

        // Keep within viewport bounds
        left = Math.max(10, Math.min(window.innerWidth - 110, left));

        btn.style.top = `${top}px`;
        btn.style.left = `${left}px`;
        btn.style.display = 'flex';
        
        requestAnimationFrame(() => {
            btn.classList.add('visible');
        });
    }

    function hideButton() {
        if (buttonEl) {
            buttonEl.classList.remove('visible');
            clearTimeout(hideTimer);
            hideTimer = setTimeout(() => {
                if (!buttonEl.classList.contains('visible')) {
                    buttonEl.style.display = 'none';
                }
            }, 180);
        }
    }

    // Listeners for focus, input, and typing
    function isEditable(el) {
        if (!el || el === document.body) return false;
        if (el.tagName === 'TEXTAREA') return true;
        if (el.tagName === 'INPUT' && /^(text|search|email|url|password|tel)$/i.test(el.type)) return true;
        if (el.isContentEditable || el.getAttribute('role') === 'textbox') return true;
        if (el.classList.contains('copyable-text') || el.classList.contains('ProseMirror')) return true;
        return false;
    }

    document.addEventListener('focusin', (e) => {
        if (isEditable(e.target)) {
            currentTarget = e.target;
            syncSettings();
            setTimeout(() => updateButtonPosition(currentTarget), 80);
        }
    }, true);

    document.addEventListener('input', (e) => {
        if (isEditable(e.target)) {
            currentTarget = e.target;
            updateButtonPosition(currentTarget);
        }
    }, true);

    document.addEventListener('keyup', (e) => {
        if (isEditable(e.target)) {
            currentTarget = e.target;
            updateButtonPosition(currentTarget);
        }
    }, true);

    document.addEventListener('selectionchange', () => {
        const active = document.activeElement;
        if (isEditable(active)) {
            currentTarget = active;
            updateButtonPosition(currentTarget);
        }
    });

    document.addEventListener('focusout', (e) => {
        setTimeout(() => {
            const newActive = document.activeElement;
            if (!isEditable(newActive) && (!buttonEl || !buttonEl.contains(newActive))) {
                hideButton();
                currentTarget = null;
            }
        }, 150);
    }, true);

    window.addEventListener('scroll', () => {
        if (currentTarget) updateButtonPosition(currentTarget);
    }, { passive: true });

    window.addEventListener('resize', () => {
        if (currentTarget) updateButtonPosition(currentTarget);
    }, { passive: true });
})();
