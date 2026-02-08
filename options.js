// === ENHANCED OPTIONS PAGE SCRIPT ===

// Built-in modes configuration (updated to match background.js)
const BUILT_IN_MODES = {
    humanize: "Humanize (Make Natural)",
    grammar: "Fix Grammar & Spelling",
    professional: "Professional Tone",
    polite: "Polite & Courteous",
    casual: "Casual & Friendly",
    confident: "Confident & Assertive",
    empathetic: "Empathetic & Understanding",
    persuasive: "Persuasive & Compelling",
    concise: "Concise & Clear",
    detailed: "Detailed & Comprehensive",
    creative: "Creative & Engaging",
    technical: "Technical & Precise",
    academic: "Academic & Scholarly",
    marketing: "Marketing & Sales",
    cheeky: "Cheeky & Playful",
    newby: "Beginner-Friendly",
    composer: "Compose from Instruction",
    translate: "Translate to English",
    summarize: "Summarize Key Points",
    expand: "Expand & Elaborate",
    simplify: "Simplify & Clarify"
};

// Global state
let currentSettings = {};
let currentStats = {};
let contextMenuUpdateTimeout = null;

// Debounced context menu update function
function updateContextMenusDebounced() {
    if (contextMenuUpdateTimeout) {
        clearTimeout(contextMenuUpdateTimeout);
    }
    
    contextMenuUpdateTimeout = setTimeout(() => {
        chrome.runtime.sendMessage({ action: 'updateContextMenus' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Error updating context menus:", chrome.runtime.lastError.message || chrome.runtime.lastError);
            } else if (response && !response.success) {
                console.error("Context menu update failed:", response.error || "Unknown error");
            }
        });
    }, 500); // Wait 500ms before updating
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', async () => {
    setupTabs();
    setupThemeToggle();
    await loadAllSettings();
    setupEventListeners();
    await loadUsageStats();
    renderModesList();
    renderCustomModes();
});

function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            const targetContent = document.getElementById(targetTab);

            // Ensure target element exists before proceeding
            if (!targetContent) {
                console.error(`Tab content element with ID '${targetTab}' not found`);
                return;
            }

            // Remove active from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            // Add active to clicked tab and corresponding content
            tab.classList.add('active');
            targetContent.classList.add('active');
        });
    });
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    themeToggle.addEventListener('click', () => {
        const isDark = body.hasAttribute('data-theme');
        
        if (isDark) {
            body.removeAttribute('data-theme');
            themeToggle.textContent = '🌙';
            currentSettings.darkMode = false;
        } else {
            body.setAttribute('data-theme', 'dark');
            themeToggle.textContent = '☀️';
            currentSettings.darkMode = true;
        }

        chrome.storage.sync.set({ darkMode: currentSettings.darkMode });
    });
}

// === SETTINGS MANAGEMENT ===
async function loadAllSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get([
            'openaiApiKey',
            'openaiBaseUrl',
            'selectedModel',
            'customModes',
            'enabledModes',
            'maxTextLength',
            'enableUndo',
            'enablePreviewMode',
            'enableUsageTracking',
            'enableKeyboardShortcuts',
            'darkMode'
        ], (result) => {
            currentSettings = {
                openaiApiKey: result.openaiApiKey || '',
                openaiBaseUrl: result.openaiBaseUrl || '',
                selectedModel: result.selectedModel || 'amazon/nova-micro',
                customModes: result.customModes || {},
                enabledModes: result.enabledModes || Object.keys(BUILT_IN_MODES),
                maxTextLength: result.maxTextLength || 8000,
                enableUndo: result.enableUndo !== false,
                enablePreviewMode: result.enablePreviewMode !== false,
                enableUsageTracking: result.enableUsageTracking !== false,
                enableKeyboardShortcuts: result.enableKeyboardShortcuts !== false,
                darkMode: result.darkMode || false
            };

            updateUIFromSettings();
            resolve();
        });
    });
}

function updateUIFromSettings() {
    // General tab
    document.getElementById('apiKey').value = currentSettings.openaiApiKey;
    document.getElementById('baseUrl').value = currentSettings.openaiBaseUrl || '';
    document.getElementById('selectedModel').value = currentSettings.selectedModel;
    document.getElementById('maxTextLength').value = currentSettings.maxTextLength;
    document.getElementById('enableUndo').checked = currentSettings.enableUndo;
    document.getElementById('enablePreviewMode').checked = currentSettings.enablePreviewMode;
    document.getElementById('enableUsageTracking').checked = currentSettings.enableUsageTracking;
    document.getElementById('enableKeyboardShortcuts').checked = currentSettings.enableKeyboardShortcuts;
    document.getElementById('darkMode').checked = currentSettings.darkMode;

    // Apply theme
    if (currentSettings.darkMode) {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('themeToggle').textContent = '☀️';
    }
}

function setupEventListeners() {
    // General tab
    document.getElementById('saveGeneral').addEventListener('click', saveGeneralSettings);
    document.getElementById('testConnection').addEventListener('click', testApiConnection);
    
    // Vercel AI Gateway quick setup button
    const setVercelBtn = document.getElementById('setVercelUrl');
    if (setVercelBtn) {
        setVercelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('baseUrl').value = 'https://ai-gateway.vercel.sh/v1';
            showStatus('✅ Vercel AI Gateway URL set! Remember to save your settings.', 'success');
        });
    }

    // Modes tab
    document.getElementById('saveModes').addEventListener('click', saveModeSettings);
    document.getElementById('resetModes').addEventListener('click', resetModeSettings);
    document.getElementById('selectAllModes').addEventListener('click', selectAllModes);
    document.getElementById('deselectAllModes').addEventListener('click', deselectAllModes);

    // Custom modes tab
    document.getElementById('addCustomMode').addEventListener('click', addCustomMode);

    // Stats tab
    document.getElementById('refreshStats').addEventListener('click', loadUsageStats);
    document.getElementById('clearStats').addEventListener('click', clearUsageStats);

    // Advanced tab
    document.getElementById('darkMode').addEventListener('change', (e) => {
        currentSettings.darkMode = e.target.checked;
        if (e.target.checked) {
            document.body.setAttribute('data-theme', 'dark');
            document.getElementById('themeToggle').textContent = '☀️';
        } else {
            document.body.removeAttribute('data-theme');
            document.getElementById('themeToggle').textContent = '🌙';
        }
        chrome.storage.sync.set({ darkMode: currentSettings.darkMode });
    });

    document.getElementById('exportSettings').addEventListener('click', exportSettings);
    document.getElementById('importSettings').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importSettings);
    document.getElementById('resetAllSettings').addEventListener('click', resetAllSettings);

    // Clear status on input changes
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', clearStatus);
    });
}

// === GENERAL SETTINGS ===
async function saveGeneralSettings() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const baseUrl = document.getElementById('baseUrl').value.trim();
    
    if (!apiKey) {
        showStatus('❌ API Key cannot be empty', 'error');
        return;
    }

    // Validate API key format for OpenAI (keys typically start with 'sk-' or 'sess-')
    if (!apiKey.startsWith('sk-') && !apiKey.startsWith('sess-')) {
        showStatus('⚠️ Warning: OpenAI API keys typically start with "sk-". Double-check your key.', 'warning');
    }

    const settings = {
        openaiApiKey: apiKey,
        openaiBaseUrl: baseUrl,
        selectedModel: document.getElementById('selectedModel').value,
        maxTextLength: parseInt(document.getElementById('maxTextLength').value),
        enableUndo: document.getElementById('enableUndo').checked,
        enablePreviewMode: document.getElementById('enablePreviewMode').checked,
        enableUsageTracking: document.getElementById('enableUsageTracking').checked,
        enableKeyboardShortcuts: document.getElementById('enableKeyboardShortcuts').checked
    };

    try {
        await saveSettings(settings);
        currentSettings = { ...currentSettings, ...settings };
        showStatus('✅ Settings saved successfully!', 'success');
        
        // Update context menus
        updateContextMenusDebounced();
    } catch (error) {
        showStatus(`❌ Error saving settings: ${error.message}`, 'error');
    }
}

async function testApiConnection() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const baseUrl = document.getElementById('baseUrl').value.trim();
    
    if (!apiKey) {
        showStatus('❌ Please enter an API key first', 'error');
        return;
    }

    // Validate API key format before testing
    if (!apiKey.startsWith('sk-') && !apiKey.startsWith('sess-')) {
        showStatus('⚠️ Warning: OpenAI API keys typically start with "sk-". Testing anyway...', 'warning');
    }

    const testButton = document.getElementById('testConnection');
    testButton.disabled = true;
    testButton.textContent = '🧪 Testing...';

    try {
        const model = document.getElementById('selectedModel').value;
        
        // Use custom base URL if provided, otherwise use default OpenAI endpoint
        const endpoint = baseUrl && baseUrl.trim() !== '' 
            ? `${baseUrl.replace(/\/$/, '')}/chat/completions`
            : 'https://api.openai.com/v1/chat/completions';
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: 'Say "test successful"' }
                ],
                max_tokens: 10
            })
        });

        if (response.ok) {
            showStatus('✅ API connection successful!', 'success');
        } else {
            const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
            
            let errorMessage = 'Connection failed';
            if (response.status === 401 || response.status === 403) {
                errorMessage = 'Invalid or expired API key';
            } else if (response.status === 400) {
                errorMessage = 'Invalid request format';
            } else if (response.status === 429) {
                errorMessage = 'Rate limit exceeded';
            } else if (response.status >= 500) {
                errorMessage = 'Server error - try again later';
            } else {
                errorMessage = errorData.error?.message || `HTTP ${response.status}`;
            }
            
            throw new Error(errorMessage);
        }
    } catch (error) {
        let errorMessage = error.message;
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Network error - check your internet connection';
        } else if (error.message.includes('API key')) {
            errorMessage = 'Invalid API key - please check your key';
        }
        
        showStatus(`❌ ${errorMessage}`, 'error');
    } finally {
        testButton.disabled = false;
        testButton.textContent = '🧪 Test API Key';
    }
}

// === MODES MANAGEMENT ===
function renderModesList() {
    // Instead of dynamically creating the modes list, work with the existing checkboxes
    Object.entries(BUILT_IN_MODES).forEach(([key, name]) => {
        const checkbox = document.getElementById(`mode-${key}`);
        if (checkbox) {
            checkbox.checked = currentSettings.enabledModes.includes(key);
        }
    });
}

async function saveModeSettings() {
    const checkedModes = [];
    
    // Check each built-in mode checkbox
    Object.keys(BUILT_IN_MODES).forEach(key => {
        const checkbox = document.getElementById(`mode-${key}`);
        if (checkbox && checkbox.checked) {
            checkedModes.push(key);
        }
    });

    if (checkedModes.length === 0) {
        showStatus('Please select at least one mode', 'error');
        return;
    }

    try {
        await saveSettings({ enabledModes: checkedModes });
        currentSettings.enabledModes = checkedModes;
        showStatus('Mode settings saved!', 'success');
        
        // Update context menus
        updateContextMenusDebounced();
    } catch (error) {
        showStatus(`Error saving modes: ${error.message}`, 'error');
    }
}

function resetModeSettings() {
    currentSettings.enabledModes = Object.keys(BUILT_IN_MODES);
    renderModesList();
    showStatus('Mode settings reset to default', 'success');
}

function selectAllModes() {
    Object.keys(BUILT_IN_MODES).forEach(key => {
        const checkbox = document.getElementById(`mode-${key}`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
}

function deselectAllModes() {
    Object.keys(BUILT_IN_MODES).forEach(key => {
        const checkbox = document.getElementById(`mode-${key}`);
        if (checkbox) {
            checkbox.checked = false;
        }
    });
}

// === CUSTOM MODES ===
function renderCustomModes() {
    const container = document.getElementById('customModesList');
    container.innerHTML = '';

    Object.entries(currentSettings.customModes).forEach(([key, mode]) => {
        const modeElement = document.createElement('div');
        modeElement.className = 'custom-mode';
        modeElement.innerHTML = `
            <h4>${mode.name}</h4>
            <p>${mode.prompt.substring(0, 100)}${mode.prompt.length > 100 ? '...' : ''}</p>
            <div class="button-group">
                <button class="small secondary" data-action="edit" data-key="${key}">✏️ Edit</button>
                <button class="small danger" data-action="delete" data-key="${key}">🗑️ Delete</button>
            </div>
        `;
        
        // Add event listeners for the buttons
        const editButton = modeElement.querySelector('[data-action="edit"]');
        const deleteButton = modeElement.querySelector('[data-action="delete"]');
        
        editButton.addEventListener('click', () => editCustomMode(key));
        deleteButton.addEventListener('click', () => deleteCustomMode(key));
        
        container.appendChild(modeElement);
    });
}

async function addCustomMode() {
    const name = document.getElementById('customModeName').value.trim();
    const prompt = document.getElementById('customModePrompt').value.trim();

    if (!name || !prompt) {
        showStatus('Please enter both name and prompt', 'error');
        return;
    }

    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    if (BUILT_IN_MODES[key] || currentSettings.customModes[key]) {
        showStatus('A mode with this name already exists', 'error');
        return;
    }

    currentSettings.customModes[key] = { name, prompt };
    
    try {
        await saveSettings({ customModes: currentSettings.customModes });
        
        // Clear form
        document.getElementById('customModeName').value = '';
        document.getElementById('customModePrompt').value = '';
        
        renderCustomModes();
        showStatus('Custom mode added successfully!', 'success');
        
        // Update context menus
        updateContextMenusDebounced();
    } catch (error) {
        showStatus(`Error adding custom mode: ${error.message}`, 'error');
    }
}

function editCustomMode(key) {
    const mode = currentSettings.customModes[key];
    if (mode) {
        document.getElementById('customModeName').value = mode.name;
        document.getElementById('customModePrompt').value = mode.prompt;
        
        // Change button to update mode
        const addButton = document.getElementById('addCustomMode');
        addButton.textContent = '✏️ Update Mode';
        addButton.onclick = () => updateCustomMode(key);
    }
}

async function updateCustomMode(key) {
    const name = document.getElementById('customModeName').value.trim();
    const prompt = document.getElementById('customModePrompt').value.trim();

    if (!name || !prompt) {
        showStatus('Please enter both name and prompt', 'error');
        return;
    }

    currentSettings.customModes[key] = { name, prompt };
    
    try {
        await saveSettings({ customModes: currentSettings.customModes });
        
        // Reset form
        document.getElementById('customModeName').value = '';
        document.getElementById('customModePrompt').value = '';
        
        const addButton = document.getElementById('addCustomMode');
        addButton.textContent = '➕ Add Mode';
        addButton.onclick = addCustomMode;
        
        renderCustomModes();
        showStatus('Custom mode updated successfully!', 'success');
        
        // Update context menus
        updateContextMenusDebounced();
    } catch (error) {
        showStatus(`Error updating custom mode: ${error.message}`, 'error');
    }
}

async function deleteCustomMode(key) {
    if (!confirm('Are you sure you want to delete this custom mode?')) {
        return;
    }

    delete currentSettings.customModes[key];
    
    try {
        await saveSettings({ customModes: currentSettings.customModes });
        renderCustomModes();
        showStatus('Custom mode deleted', 'success');
        
        // Update context menus
        updateContextMenusDebounced();
    } catch (error) {
        showStatus(`Error deleting custom mode: ${error.message}`, 'error');
    }
}

// === USAGE STATISTICS ===
async function loadUsageStats() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['usageStats'], (result) => {
            currentStats = result.usageStats || {
                totalRewrites: 0,
                totalInputChars: 0,
                totalOutputChars: 0,
                modeUsage: {},
                lastUsed: null
            };

            updateStatsDisplay();
            resolve();
        });
    });
}

function updateStatsDisplay() {
    document.getElementById('totalRewrites').textContent = currentStats.totalRewrites || 0;
    document.getElementById('totalChars').textContent = 
        ((currentStats.totalInputChars || 0) + (currentStats.totalOutputChars || 0)).toLocaleString();

    // Find most used mode
    const modeUsage = currentStats.modeUsage || {};
    const mostUsed = Object.entries(modeUsage)
        .sort((a, b) => b[1] - a[1])[0];
    
    document.getElementById('favoriteMode').textContent = mostUsed 
        ? BUILT_IN_MODES[mostUsed[0]] || mostUsed[0] 
        : '-';

    // Last used
    const lastUsed = currentStats.lastUsed 
        ? new Date(currentStats.lastUsed).toLocaleDateString()
        : '-';
    document.getElementById('lastUsed').textContent = lastUsed;
}

async function clearUsageStats() {
    if (!confirm('Are you sure you want to clear all usage statistics?')) {
        return;
    }

    try {
        await new Promise((resolve) => {
            chrome.storage.local.remove(['usageStats'], resolve);
        });
        
        currentStats = {
            totalRewrites: 0,
            totalInputChars: 0,
            totalOutputChars: 0,
            modeUsage: {},
            lastUsed: null
        };
        
        updateStatsDisplay();
        showStatus('Usage statistics cleared', 'success');
    } catch (error) {
        showStatus(`Error clearing stats: ${error.message}`, 'error');
    }
}

// === IMPORT/EXPORT ===
async function exportSettings() {
    try {
        const exportData = {
            version: '2.5.0',
            timestamp: new Date().toISOString(),
            settings: currentSettings,
            stats: currentStats
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], 
            { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-rewriter-settings-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        showStatus('Settings exported successfully!', 'success');
    } catch (error) {
        showStatus(`Export failed: ${error.message}`, 'error');
    }
}

async function importSettings(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        const importData = JSON.parse(text);

        if (!importData.settings) {
            throw new Error('Invalid settings file format');
        }

        // Merge imported settings
        const newSettings = { ...currentSettings, ...importData.settings };
        await saveSettings(newSettings);
        
        currentSettings = newSettings;
        updateUIFromSettings();
        renderModesList();
        renderCustomModes();

        showStatus('Settings imported successfully!', 'success');
        
        // Update context menus
        updateContextMenusDebounced();
    } catch (error) {
        showStatus(`Import failed: ${error.message}`, 'error');
    } finally {
        // Clear file input
        event.target.value = '';
    }
}

async function resetAllSettings() {
    if (!confirm('Are you sure you want to reset all settings to default? This cannot be undone.')) {
        return;
    }

    try {
        await new Promise((resolve) => {
            chrome.storage.sync.clear(resolve);
        });
        
        await new Promise((resolve) => {
            chrome.storage.local.clear(resolve);
        });

        // Reload settings
        await loadAllSettings();
        await loadUsageStats();
        renderModesList();
        renderCustomModes();

        showStatus('All settings reset to default', 'success');
        
        // Update context menus
        updateContextMenusDebounced();
    } catch (error) {
        showStatus(`Reset failed: ${error.message}`, 'error');
    }
}

// === UTILITY FUNCTIONS ===
async function saveSettings(settings) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.set(settings, () => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve();
            }
        });
    });
}

function showStatus(message, type = 'info', duration = 4000) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = type;

    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = '';
        }, duration);
    }
}

function clearStatus() {
    const statusDiv = document.getElementById('status');
    if (statusDiv.textContent !== '') {
        statusDiv.textContent = '';
        statusDiv.className = '';
    }
}