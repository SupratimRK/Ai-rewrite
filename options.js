// === ENHANCED OPTIONS PAGE SCRIPT ===

// Built-in modes configuration (updated to match background.js)
const BUILT_IN_MODES = {
    retone: "Retone (Context & Polish)",
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
    marketing: "Marketing & Sales"
};

// Popular AI Provider Presets (Curated with Latest & Dynamic Pointer Endpoints)
const POPULAR_PROVIDERS = {
    openai: {
        name: "OpenAI",
        icon: "🟢",
        baseUrl: "",
        defaultModel: "chat-latest",
        suggestedModels: ["chat-latest", "gpt-5.6-luna", "gpt-4o-mini", "o4-mini"],
        apiKeyPlaceholder: "Paste your OpenAI API Key (sk-...)",
        apiKeyLabel: "🔑 OpenAI API Key *",
        apiKeyHelpUrl: "https://platform.openai.com/api-keys",
        apiKeyHelpText: "Get your API key from OpenAI Platform"
    },
    openrouter: {
        name: "OpenRouter",
        icon: "🔀",
        baseUrl: "https://openrouter.ai/api/v1",
        defaultModel: "openrouter/auto",
        suggestedModels: [
            "openrouter/auto",
            "google/gemini-3.7-flash",
            "deepseek/deepseek-v4-flash",
            "anthropic/claude-3.5-haiku",
            "meta-llama/llama-3.3-70b-instruct",
            "google/gemini-3.5-flash-lite"
        ],
        apiKeyPlaceholder: "Paste your OpenRouter API Key (sk-or-v1-...)",
        apiKeyLabel: "🔑 OpenRouter API Key *",
        apiKeyHelpUrl: "https://openrouter.ai/keys",
        apiKeyHelpText: "Get your API key from OpenRouter (auto-routes to latest best model)"
    },
    groq: {
        name: "Groq",
        icon: "⚡",
        baseUrl: "https://api.groq.com/openai/v1",
        defaultModel: "llama-3.3-70b-versatile",
        suggestedModels: [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "openai/gpt-oss-20b",
            "groq/compound-mini",
            "qwen/qwen3.6-27b"
        ],
        apiKeyPlaceholder: "Paste your Groq API Key (gsk_...)",
        apiKeyLabel: "🔑 Groq API Key *",
        apiKeyHelpUrl: "https://console.groq.com/keys",
        apiKeyHelpText: "Get your API key from Groq Console"
    },
    deepseek: {
        name: "DeepSeek",
        icon: "🐋",
        baseUrl: "https://api.deepseek.com",
        defaultModel: "deepseek-v4-flash",
        suggestedModels: ["deepseek-v4-flash", "deepseek-v4-flash-vision-exp", "deepseek-v4-pro"],
        apiKeyPlaceholder: "Paste your DeepSeek API Key (sk-...)",
        apiKeyLabel: "🔑 DeepSeek API Key *",
        apiKeyHelpUrl: "https://platform.deepseek.com/api_keys",
        apiKeyHelpText: "Get your API key from DeepSeek Platform"
    },
    gemini: {
        name: "Google Gemini",
        icon: "✨",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
        defaultModel: "gemini-flash-lite-latest",
        suggestedModels: ["gemini-flash-lite-latest", "gemini-flash-latest", "gemini-3.7-flash", "gemini-3.5-flash-lite", "gemini-3.6-flash"],
        apiKeyPlaceholder: "Paste your Gemini API Key (AIzaSy...)",
        apiKeyLabel: "🔑 Google Gemini API Key *",
        apiKeyHelpUrl: "https://aistudio.google.com/app/apikey",
        apiKeyHelpText: "Get your free API key from Google AI Studio"
    },
    vercel: {
        name: "Vercel Gateway",
        icon: "▲",
        baseUrl: "https://ai-gateway.vercel.sh/v1",
        defaultModel: "openai/chat-latest",
        suggestedModels: [
            "openai/chat-latest",
            "openai/gpt-4o-mini",
            "google/gemini-3.7-flash",
            "anthropic/claude-3-5-haiku",
            "meta/llama-3.3-70b",
            "amazon/nova-micro"
        ],
        apiKeyPlaceholder: "Paste your Vercel AI Gateway Key",
        apiKeyLabel: "🔑 Vercel AI Gateway Key *",
        apiKeyHelpUrl: "https://vercel.com/dashboard",
        apiKeyHelpText: "Get your key from Vercel Dashboard"
    },
    ollama: {
        name: "Ollama (Local)",
        icon: "🦙",
        baseUrl: "http://localhost:11434/v1",
        defaultModel: "llama3.2",
        suggestedModels: ["llama3.2", "qwen2.5:7b", "phi4-mini", "mistral", "deepseek-r1:8b"],
        apiKeyPlaceholder: "Not required (local server)",
        apiKeyLabel: "🔑 API Key (Optional for Local)",
        apiKeyHelpUrl: "https://ollama.com",
        apiKeyHelpText: "Run local models for free with Ollama"
    },
    lmstudio: {
        name: "LM Studio",
        icon: "🧪",
        baseUrl: "http://localhost:1234/v1",
        defaultModel: "local-model",
        suggestedModels: ["local-model"],
        apiKeyPlaceholder: "Not required (local server)",
        apiKeyLabel: "🔑 API Key (Optional for Local)",
        apiKeyHelpUrl: "https://lmstudio.ai",
        apiKeyHelpText: "Routes to whatever model is loaded in LM Studio"
    },
    custom: {
        name: "Custom",
        icon: "⚙️",
        baseUrl: "custom",
        defaultModel: "",
        suggestedModels: [],
        apiKeyPlaceholder: "Paste your API key (if required)",
        apiKeyLabel: "🔑 API Key",
        apiKeyHelpUrl: "",
        apiKeyHelpText: "Enter your custom endpoint Base URL and model name below"
    }
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
    renderProviderPresets();
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

function getBrowserTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(isDark) {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    const darkModeCheckbox = document.getElementById('darkMode');

    if (isDark) {
        body.setAttribute('data-theme', 'dark');
        if (themeToggle) themeToggle.textContent = '☀️';
        if (darkModeCheckbox) darkModeCheckbox.checked = true;
    } else {
        body.setAttribute('data-theme', 'light');
        if (themeToggle) themeToggle.textContent = '🌙';
        if (darkModeCheckbox) darkModeCheckbox.checked = false;
    }
    currentSettings.darkMode = isDark;
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    themeToggle.addEventListener('click', () => {
        const isCurrentlyDark = document.body.getAttribute('data-theme') === 'dark' ||
            (!document.body.hasAttribute('data-theme') && getBrowserTheme());
        const newDark = !isCurrentlyDark;
        applyTheme(newDark);
        chrome.storage.sync.set({ darkMode: newDark });
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
            const validBuiltInKeys = Object.keys(BUILT_IN_MODES);
            let enabledModes = result.enabledModes;
            if (Array.isArray(enabledModes)) {
                enabledModes = enabledModes.filter(k => validBuiltInKeys.includes(k));
                if (!enabledModes.includes('retone')) {
                    enabledModes.unshift('retone');
                    chrome.storage.sync.set({ enabledModes });
                }
            } else {
                enabledModes = validBuiltInKeys;
                chrome.storage.sync.set({ enabledModes });
            }

            // Auto-detect browser theme if not explicitly set in sync storage
            const browserIsDark = getBrowserTheme();
            const isDarkMode = (result.darkMode !== undefined && result.darkMode !== null)
                ? result.darkMode
                : browserIsDark;

            currentSettings = {
                openaiApiKey: result.openaiApiKey || '',
                openaiBaseUrl: result.openaiBaseUrl || '',
                selectedModel: result.selectedModel || 'chat-latest',
                customModes: result.customModes || {},
                enabledModes: enabledModes,
                maxTextLength: result.maxTextLength || 8000,
                enableUndo: result.enableUndo !== false,
                enablePreviewMode: result.enablePreviewMode !== false,
                enableUsageTracking: result.enableUsageTracking !== false,
                enableKeyboardShortcuts: result.enableKeyboardShortcuts !== false,
                darkMode: isDarkMode
            };

            updateUIFromSettings();
            resolve();
        });
    });
}

function updateUIFromSettings() {
    // General tab
    const baseUrl = currentSettings.openaiBaseUrl || '';
    document.getElementById('apiKey').value = currentSettings.openaiApiKey;
    document.getElementById('baseUrl').value = baseUrl;
    document.getElementById('selectedModel').value = currentSettings.selectedModel;
    document.getElementById('maxTextLength').value = currentSettings.maxTextLength;
    document.getElementById('enableUndo').checked = currentSettings.enableUndo;
    document.getElementById('enablePreviewMode').checked = currentSettings.enablePreviewMode;
    document.getElementById('enableUsageTracking').checked = currentSettings.enableUsageTracking;
    document.getElementById('enableKeyboardShortcuts').checked = currentSettings.enableKeyboardShortcuts;

    // Detect and configure provider UI
    const detectedKey = detectProviderFromUrl(baseUrl);
    const provider = POPULAR_PROVIDERS[detectedKey] || POPULAR_PROVIDERS.openai;
    
    const apiKeyLabel = document.getElementById('apiKeyLabel');
    const apiKeyInput = document.getElementById('apiKey');
    const apiKeyHelp = document.getElementById('apiKeyHelp');
    
    if (apiKeyLabel) apiKeyLabel.textContent = provider.apiKeyLabel;
    if (apiKeyInput) apiKeyInput.placeholder = provider.apiKeyPlaceholder;
    if (apiKeyHelp) {
        apiKeyHelp.innerHTML = `<a href="${provider.apiKeyHelpUrl}" target="_blank" rel="noopener noreferrer">${provider.apiKeyHelpText}</a>`;
    }
    
    updateModelSuggestions(provider.suggestedModels);

    // Apply auto-detected or configured theme
    applyTheme(currentSettings.darkMode);
}

function detectProviderFromUrl(url) {
    const cleanUrl = (url || '').trim().replace(/\/$/, '');
    if (!cleanUrl) return 'openai';
    for (const [key, provider] of Object.entries(POPULAR_PROVIDERS)) {
        if (key === 'custom') continue;
        const pUrl = provider.baseUrl.trim().replace(/\/$/, '');
        if (pUrl && cleanUrl.startsWith(pUrl)) {
            return key;
        }
    }
    return 'custom';
}

function renderProviderPresets() {
    const container = document.getElementById('providerPresets');
    if (!container) return;
    container.innerHTML = '';

    const currentBaseUrl = (currentSettings.openaiBaseUrl || '').trim().replace(/\/$/, '');
    const activeKey = detectProviderFromUrl(currentBaseUrl);

    Object.entries(POPULAR_PROVIDERS).forEach(([key, provider]) => {
        const card = document.createElement('div');
        card.className = `provider-card ${key === activeKey ? 'active' : ''}`;
        card.dataset.provider = key;

        card.innerHTML = `
            <div class="provider-icon">${provider.icon}</div>
            <div class="provider-name">${provider.name}</div>
        `;

        card.addEventListener('click', () => selectProvider(key));
        container.appendChild(card);
    });
}

function selectProvider(key) {
    const provider = POPULAR_PROVIDERS[key];
    if (!provider) return;

    // Update active card
    document.querySelectorAll('.provider-card').forEach(c => {
        c.classList.toggle('active', c.dataset.provider === key);
    });

    // Update inputs
    const baseUrlInput = document.getElementById('baseUrl');
    const selectedModelInput = document.getElementById('selectedModel');
    const apiKeyInput = document.getElementById('apiKey');
    const apiKeyLabel = document.getElementById('apiKeyLabel');
    const apiKeyHelp = document.getElementById('apiKeyHelp');

    if (key === 'custom') {
        if (apiKeyLabel) apiKeyLabel.textContent = "🔑 API Key (Custom Provider)";
        if (apiKeyInput) apiKeyInput.placeholder = "Enter your API key (if required)";
        if (apiKeyHelp) {
            apiKeyHelp.innerHTML = `Enter your custom endpoint Base URL (e.g. <code>https://api.your-provider.com/v1</code>) and model below.`;
        }
        baseUrlInput.focus();
        showStatus('⚙️ Custom endpoint selected. Enter your Base URL and model below.', 'success');
    } else {
        baseUrlInput.value = provider.baseUrl;
        selectedModelInput.value = provider.defaultModel;

        if (apiKeyLabel) apiKeyLabel.textContent = provider.apiKeyLabel;
        if (apiKeyInput) apiKeyInput.placeholder = provider.apiKeyPlaceholder;
        if (apiKeyHelp) {
            apiKeyHelp.innerHTML = `<a href="${provider.apiKeyHelpUrl}" target="_blank" rel="noopener noreferrer">${provider.apiKeyHelpText}</a>`;
        }

        updateModelSuggestions(provider.suggestedModels);
        showStatus(`⚡ Configured for ${provider.name}! Click 'Save Settings' to apply.`, 'success');
    }
}

function updateModelSuggestions(models) {
    const datalist = document.getElementById('modelSuggestions');
    if (!datalist) return;
    datalist.innerHTML = '';
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        datalist.appendChild(option);
    });
}

function setupEventListeners() {
    // General tab
    document.getElementById('saveGeneral').addEventListener('click', saveGeneralSettings);
    document.getElementById('testConnection').addEventListener('click', testApiConnection);

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
    const darkModeCheckbox = document.getElementById('darkMode');
    if (darkModeCheckbox) {
        darkModeCheckbox.addEventListener('change', (e) => {
            applyTheme(e.target.checked);
            chrome.storage.sync.set({ darkMode: e.target.checked });
        });
    }

    // Automatically adapt to browser/system theme changes when user has not saved an explicit override
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            chrome.storage.sync.get(['darkMode'], (result) => {
                if (result.darkMode === undefined || result.darkMode === null) {
                    applyTheme(e.matches);
                }
            });
        });
    }

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
    const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
    
    if (!apiKey && !isLocal) {
        showStatus('❌ API Key cannot be empty', 'error');
        return;
    }

    // Validate API key format for OpenAI only
    if (!baseUrl && apiKey && !apiKey.startsWith('sk-') && !apiKey.startsWith('sess-')) {
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
    const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
    
    if (!apiKey && !isLocal) {
        showStatus('❌ Please enter an API key first', 'error');
        return;
    }

    // Validate API key format before testing for OpenAI
    if (!baseUrl && apiKey && !apiKey.startsWith('sk-') && !apiKey.startsWith('sess-')) {
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
        
        const headers = {
            'Content-Type': 'application/json'
        };
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        } else if (isLocal) {
            headers['Authorization'] = 'Bearer local';
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
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
                errorMessage = 'Invalid request format or model name';
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
            errorMessage = isLocal 
                ? 'Could not connect to local server - is Ollama/LM Studio running?' 
                : 'Network error - check your internet connection or base URL';
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
            version: '2.5.2',
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