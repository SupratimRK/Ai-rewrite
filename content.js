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
        defaultModeName: 'Retone',
        theme: 'system'
    };

    // Resolve current theme ('dark' or 'light')
    function resolveTheme() {
        const theme = cachedSettings.themeMode || cachedSettings.theme || 'system';
        if (theme === 'dark') return 'dark';
        if (theme === 'light') return 'light';
        return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }

    function updateButtonTheme() {
        if (!buttonEl) return;
        const currentTheme = resolveTheme();
        buttonEl.setAttribute('data-theme', currentTheme);
    }

    // Helper to get clean mode name without any brackets
    function getCleanModeTitle() {
        const raw = cachedSettings.defaultModeName || 'Retone';
        return raw.split('(')[0].replace(/^Fix\s+/i, '').replace(/\s+Tone$/i, '').trim() || 'Rewrite';
    }

    // Refresh settings from background
    function syncSettings() {
        safeSendMessage({ action: 'getFloatingButtonSettings' }, (res) => {
            if (res) {
                cachedSettings = res;
                if (buttonEl) {
                    buttonEl.title = `Rewrite with ${getCleanModeTitle()}`;
                    updateButtonTheme();
                    if (!cachedSettings.enableFloatingButton) {
                        buttonEl.style.display = 'none';
                    }
                }
            }
        });
    }
    syncSettings();

    // Listen for storage changes in real-time
    try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
            chrome.storage.onChanged.addListener((changes, area) => {
                if (area === 'sync' || area === 'local') {
                    if (changes.themeMode || changes.theme) {
                        cachedSettings.theme = (changes.themeMode || changes.theme).newValue;
                        updateButtonTheme();
                    }
                    if (changes.darkMode !== undefined && !changes.themeMode && !changes.theme) {
                        cachedSettings.theme = changes.darkMode.newValue ? 'dark' : 'light';
                        updateButtonTheme();
                    }
                    if (changes.defaultRewriteMode) {
                        cachedSettings.defaultRewriteMode = changes.defaultRewriteMode.newValue;
                        syncSettings();
                    }
                    if (changes.enableFloatingButton !== undefined) {
                        cachedSettings.enableFloatingButton = changes.enableFloatingButton.newValue;
                        if (!cachedSettings.enableFloatingButton && buttonEl) {
                            buttonEl.style.display = 'none';
                        }
                    }
                }
            });
        }
    } catch (e) {}

    // Listen to system color scheme changes if theme is system
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            const currentPref = cachedSettings.themeMode || cachedSettings.theme || 'system';
            if (currentPref === 'system') {
                updateButtonTheme();
            }
        });
    }

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
                justify-content: center;
                width: 26px;
                height: 26px;
                padding: 0;
                border-radius: 50%;
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                cursor: pointer;
                user-select: none;
                opacity: 0;
                transform: scale(0.85);
                transition: opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.15s, border-color 0.15s, background-color 0.15s;
                pointer-events: auto;
                box-sizing: border-box;
            }
            /* Dark Theme */
            #--ai-rewriter-quick-btn[data-theme="dark"],
            #--ai-rewriter-quick-btn:not([data-theme]) {
                background: rgba(15, 23, 42, 0.94);
                border: 1px solid rgba(255, 255, 255, 0.25);
                box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.5), 0 0 10px rgba(99, 102, 241, 0.4);
            }
            #--ai-rewriter-quick-btn[data-theme="dark"]:hover,
            #--ai-rewriter-quick-btn:not([data-theme]):hover {
                border-color: rgba(99, 102, 241, 0.9);
                box-shadow: 0 6px 20px -2px rgba(99, 102, 241, 0.6), 0 0 0 2px rgba(99, 102, 241, 0.4);
            }
            /* Light Theme */
            #--ai-rewriter-quick-btn[data-theme="light"] {
                background: rgba(255, 255, 255, 0.95);
                border: 1px solid rgba(0, 0, 0, 0.14);
                box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.12), 0 0 10px rgba(99, 102, 241, 0.25);
            }
            #--ai-rewriter-quick-btn[data-theme="light"]:hover {
                border-color: rgba(99, 102, 241, 0.85);
                box-shadow: 0 6px 20px -2px rgba(99, 102, 241, 0.4), 0 0 0 2px rgba(99, 102, 241, 0.25);
            }
            #--ai-rewriter-quick-btn.visible {
                opacity: 0.92;
                transform: scale(1);
            }
            #--ai-rewriter-quick-btn:hover {
                opacity: 1;
                transform: scale(1.15);
            }
            #--ai-rewriter-quick-btn img.btn-brand-img {
                width: 16px;
                height: 16px;
                object-fit: contain;
                border-radius: 50%;
                pointer-events: none;
                transition: transform 0.15s ease;
            }
            #--ai-rewriter-quick-btn.loading {
                opacity: 0.7;
                border-color: #6366f1;
                pointer-events: none;
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
        updateButtonTheme();
        buttonEl.setAttribute('tabindex', '-1');
        buttonEl.title = `Rewrite with ${getCleanModeTitle()}`;

        const brandIconUrl = chrome.runtime.getURL('icons/icon48.png');
        buttonEl.innerHTML = `
            <img class="btn-brand-img" src="${brandIconUrl}" alt="AI">
        `;

        // Prevent focus loss on click
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
        if (btn.classList.contains('loading')) return;
        btn.classList.add('loading');

        let cleared = false;
        const stopSpin = () => {
            if (!cleared) {
                cleared = true;
                btn.classList.remove('loading');
            }
        };

        // Safety fallback timer so it never spins indefinitely
        const timer = setTimeout(stopSpin, 8000);

        safeSendMessage({
            action: 'triggerQuickRewrite',
            text: text
        }, () => {
            clearTimeout(timer);
            stopSpin();
        });
    }

    // Position floating bubble neatly at the end/bottom-right of the active editor
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
        if (rect.width < 40 || rect.height < 18 || rect.bottom < 0 || rect.top > window.innerHeight) {
            hideButton();
            return;
        }

        const btn = getOrCreateButton();
        btn.title = `Rewrite with ${getCleanModeTitle()}`;

        // Calculate pixel-perfect positioning
        let top, left;

        // For single-line inputs & chat input bars (e.g., ChatGPT, Claude <= 68px height)
        if (rect.height <= 68) {
            top = Math.round(rect.top + window.scrollY + (rect.height - 26) / 2);
            left = Math.round(rect.right + window.scrollX - 32);
        } else {
            // For large multi-line textareas and rich text editors
            top = Math.round(rect.bottom + window.scrollY - 33);
            left = Math.round(rect.right + window.scrollX - 33);
        }

        // Keep within viewport bounds
        left = Math.max(8, Math.min(window.innerWidth - 36, left));
        top = Math.max(8, top);

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

    // Check if element is an editable target
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
