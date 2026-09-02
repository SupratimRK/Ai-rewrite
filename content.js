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
    let currentBubbleState = 'idle'; // 'idle' | 'loading' | 'success'
    let tickTimer = null;
    let cachedSettings = {
        enableFloatingButton: true,
        defaultRewriteMode: 'retone',
        defaultModeName: 'Retone',
        theme: 'system'
    };

    // Brand icon SVG (Dual magic sparkle stars)
    const BRAND_ICON_SVG = `
        <svg class="btn-brand-svg" viewBox="0 0 48 48" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="#2196f3" d="M23.426,31.911l-1.719,3.936c-0.661,1.513-2.754,1.513-3.415,0l-1.719-3.936c-1.529-3.503-4.282-6.291-7.716-7.815l-4.73-2.1c-1.504-0.668-1.504-2.855,0-3.523l4.583-2.034c3.522-1.563,6.324-4.455,7.827-8.077l1.741-4.195c0.646-1.557,2.797-1.557,3.443,0l1.741,4.195c1.503,3.622,4.305,6.514,7.827,8.077l4.583,2.034c1.504,0.668,1.504,2.855,0,3.523l-4.73,2.1C27.708,25.62,24.955,28.409,23.426,31.911z"/>
            <path fill="#7e57c2" d="M38.423,43.248l-0.493,1.131c-0.361,0.828-1.507,0.828-1.868,0l-0.493-1.131c-0.879-2.016-2.464-3.621-4.44-4.5l-1.52-0.675c-0.822-0.365-0.822-1.56,0-1.925l1.435-0.638c2.027-0.901,3.64-2.565,4.504-4.65l0.507-1.222c0.353-0.852,1.531-0.852,1.884,0l0.507,1.222c0.864,2.085,2.477,3.749,4.504,4.65l1.435,0.638c0.822,0.365,0.822,1.56,0,1.925l-1.52,0.675C40.887,39.627,39.303,41.232,38.423,43.248z"/>
        </svg>
    `;

    // Success Checkmark SVG
    const TICK_ICON_SVG = `
        <svg class="btn-tick-svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
            <polyline points="4 10.5 8 14.5 16 6"></polyline>
        </svg>
    `;

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

    // Set bubble state ('idle', 'loading', 'success')
    function setBubbleState(state) {
        if (!buttonEl) return;
        currentBubbleState = state;
        buttonEl.classList.remove('loading', 'success');
        clearTimeout(tickTimer);

        if (state === 'loading') {
            buttonEl.classList.add('loading');
            buttonEl.title = 'Rewriting text...';
        } else if (state === 'success') {
            buttonEl.classList.add('success');
            buttonEl.title = 'Text rewritten successfully!';
            tickTimer = setTimeout(() => {
                setBubbleState('idle');
                if (currentTarget) {
                    updateButtonPosition(currentTarget);
                }
            }, 1000);
        } else {
            // Idle
            buttonEl.title = `Rewrite with ${getCleanModeTitle()}`;
        }
    }

    // Refresh settings from background
    function syncSettings() {
        safeSendMessage({ action: 'getFloatingButtonSettings' }, (res) => {
            if (res) {
                cachedSettings = res;
                if (buttonEl) {
                    if (currentBubbleState === 'idle') {
                        buttonEl.title = `Rewrite with ${getCleanModeTitle()}`;
                    }
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

    // Inject styles for the floating quick button (Flat design - No shadow, No glow)
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
                cursor: pointer;
                user-select: none;
                opacity: 0;
                transform: scale(0.88);
                transition: opacity 0.15s ease, transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;
                pointer-events: auto;
                box-sizing: border-box;
                box-shadow: none !important;
                filter: none !important;
                text-shadow: none !important;
                outline: none;
            }

            /* Dark Theme - Flat */
            #--ai-rewriter-quick-btn[data-theme="dark"],
            #--ai-rewriter-quick-btn:not([data-theme]) {
                background-color: #1e293b;
                border: 1px solid #334155;
                box-shadow: none !important;
            }
            #--ai-rewriter-quick-btn[data-theme="dark"]:hover,
            #--ai-rewriter-quick-btn:not([data-theme]):hover {
                background-color: #334155;
                border-color: #475569;
                box-shadow: none !important;
            }

            /* Light Theme - Flat */
            #--ai-rewriter-quick-btn[data-theme="light"] {
                background-color: #ffffff;
                border: 1px solid #cbd5e1;
                box-shadow: none !important;
            }
            #--ai-rewriter-quick-btn[data-theme="light"]:hover {
                background-color: #f1f5f9;
                border-color: #94a3b8;
                box-shadow: none !important;
            }

            #--ai-rewriter-quick-btn.visible {
                opacity: 0.95;
                transform: scale(1);
            }
            #--ai-rewriter-quick-btn:hover {
                opacity: 1;
            }

            /* Brand Icon inside button */
            #--ai-rewriter-quick-btn .btn-brand-svg {
                display: block;
                width: 16px;
                height: 16px;
                pointer-events: none;
                transition: transform 0.15s ease;
            }

            /* Spinner element */
            #--ai-rewriter-quick-btn .btn-spinner {
                display: none;
                width: 14px;
                height: 14px;
                border: 2px solid rgba(33, 150, 243, 0.25);
                border-top-color: #2196f3;
                border-radius: 50%;
                animation: --ai-rewriter-spin 0.65s linear infinite;
                box-sizing: border-box;
                pointer-events: none;
            }

            @keyframes --ai-rewriter-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Tick / Checkmark element */
            #--ai-rewriter-quick-btn .btn-tick-svg {
                display: none;
                width: 14px;
                height: 14px;
                pointer-events: none;
                animation: --ai-rewriter-tick-pop 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }

            @keyframes --ai-rewriter-tick-pop {
                0% { transform: scale(0.6); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
            }

            /* Processing / Loading State */
            #--ai-rewriter-quick-btn.loading {
                pointer-events: none;
                cursor: wait;
            }
            #--ai-rewriter-quick-btn.loading .btn-brand-svg {
                display: none;
            }
            #--ai-rewriter-quick-btn.loading .btn-spinner {
                display: block;
            }
            #--ai-rewriter-quick-btn.loading .btn-tick-svg {
                display: none;
            }

            /* Success State - Flat */
            #--ai-rewriter-quick-btn.success {
                pointer-events: none;
            }
            #--ai-rewriter-quick-btn.success[data-theme="dark"],
            #--ai-rewriter-quick-btn.success:not([data-theme]) {
                background-color: #064e3b;
                border-color: #059669;
                box-shadow: none !important;
            }
            #--ai-rewriter-quick-btn.success[data-theme="dark"] .btn-tick-svg,
            #--ai-rewriter-quick-btn.success:not([data-theme]) .btn-tick-svg {
                color: #34d399;
            }
            #--ai-rewriter-quick-btn.success[data-theme="light"] {
                background-color: #f0fdf4;
                border-color: #86efac;
                box-shadow: none !important;
            }
            #--ai-rewriter-quick-btn.success[data-theme="light"] .btn-tick-svg {
                color: #16a34a;
            }
            #--ai-rewriter-quick-btn.success .btn-brand-svg {
                display: none;
            }
            #--ai-rewriter-quick-btn.success .btn-spinner {
                display: none;
            }
            #--ai-rewriter-quick-btn.success .btn-tick-svg {
                display: block;
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
        buttonEl.title = `Rewrite with ${getCleanModeTitle()}`;

        buttonEl.innerHTML = `
            ${BRAND_ICON_SVG}
            <div class="btn-spinner"></div>
            ${TICK_ICON_SVG}
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
        if (currentBubbleState === 'loading') return;

        setBubbleState('loading');

        let isHandled = false;
        // Safety fallback timer so it never spins indefinitely if network drops
        const safetyTimer = setTimeout(() => {
            if (!isHandled) {
                isHandled = true;
                setBubbleState('idle');
            }
        }, 15000);

        safeSendMessage({
            action: 'triggerQuickRewrite',
            text: text
        }, (res) => {
            if (isHandled) return;
            isHandled = true;
            clearTimeout(safetyTimer);

            if (res && res.success) {
                setBubbleState('success');
            } else {
                setBubbleState('idle');
            }
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
        if (currentBubbleState === 'idle') {
            btn.title = `Rewrite with ${getCleanModeTitle()}`;
        }

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
