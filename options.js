// === ENHANCED OPTIONS PAGE SCRIPT WITH OFFICIAL REAL BRAND LOGOS & LIQUID GLASS ICONS ===

// Built-in modes configuration (matching background.js)
const BUILT_IN_MODES = {
    retone: "Retone (Context & Polish)",
    humanize: "Humanize (Make Natural)",
    grammar: "Fix Grammar & Spelling",
    professional: "Professional Tone",
    polite: "Polite & Courteous",
    casual: "Casual & Friendly",
    confident: "Confident & Assertive",
    empathetic: "Empathetic & Caring",
    persuasive: "Persuasive & Compelling",
    concise: "Concise & Direct",
    detailed: "Detailed & In-Depth",
    creative: "Creative & Engaging",
    technical: "Technical & Precise",
    academic: "Academic & Scholarly",
    marketing: "Marketing & Copywriting"
};

// Popular AI Provider Presets with Standardized High-Contrast Logos
const POPULAR_PROVIDERS = {
    openai: {
        name: "OpenAI",
        iconUrl: "icons/providers/openai.png",
        baseUrl: "",
        defaultModel: "chat-latest",
        suggestedModels: ["chat-latest", "gpt-5.6-luna", "gpt-4o-mini", "o4-mini"],
        apiKeyPlaceholder: "Paste your OpenAI API Key (sk-...)",
        apiKeyLabel: "OpenAI API Key *",
        apiKeyHelpUrl: "https://platform.openai.com/api-keys",
        apiKeyHelpText: "Get your API key from OpenAI Platform"
    },
    openrouter: {
        name: "OpenRouter",
        iconUrl: "icons/providers/openrouter.png",
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
        apiKeyLabel: "OpenRouter API Key *",
        apiKeyHelpUrl: "https://openrouter.ai/keys",
        apiKeyHelpText: "Get your API key from OpenRouter (auto-routes to best model)"
    },
    groq: {
        name: "Groq",
        iconUrl: "icons/providers/groq.png",
        invertInDark: true,
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
        apiKeyLabel: "Groq API Key *",
        apiKeyHelpUrl: "https://console.groq.com/keys",
        apiKeyHelpText: "Get your API key from Groq Console"
    },
    deepseek: {
        name: "DeepSeek",
        iconUrl: "icons/providers/deepseek.png",
        baseUrl: "https://api.deepseek.com",
        defaultModel: "deepseek-v4-flash",
        suggestedModels: ["deepseek-v4-flash", "deepseek-v4-flash-vision-exp", "deepseek-v4-pro"],
        apiKeyPlaceholder: "Paste your DeepSeek API Key (sk-...)",
        apiKeyLabel: "DeepSeek API Key *",
        apiKeyHelpUrl: "https://platform.deepseek.com/api_keys",
        apiKeyHelpText: "Get your API key from DeepSeek Platform"
    },
    gemini: {
        name: "Google Gemini",
        iconUrl: "icons/providers/gemini.png",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
        defaultModel: "gemini-flash-lite-latest",
        suggestedModels: ["gemini-flash-lite-latest", "gemini-flash-latest", "gemini-3.7-flash", "gemini-3.5-flash-lite", "gemini-3.6-flash"],
        apiKeyPlaceholder: "Paste your Gemini API Key (AIzaSy...)",
        apiKeyLabel: "Google Gemini API Key *",
        apiKeyHelpUrl: "https://aistudio.google.com/app/apikey",
        apiKeyHelpText: "Get your free API key from Google AI Studio"
    },
    vercel: {
        name: "Vercel Gateway",
        iconUrl: "icons/providers/vercel.png",
        invertInDark: true,
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
        apiKeyLabel: "Vercel AI Gateway Key *",
        apiKeyHelpUrl: "https://vercel.com/dashboard",
        apiKeyHelpText: "Get your key from Vercel Dashboard"
    },
    ollama: {
        name: "Ollama (Local)",
        iconUrl: "icons/providers/ollama.png",
        invertInDark: true,
        baseUrl: "http://localhost:11434/v1",
        defaultModel: "llama3.2",
        suggestedModels: ["llama3.2", "qwen2.5:7b", "phi4-mini", "mistral", "deepseek-r1:8b"],
        apiKeyPlaceholder: "Not required (local server)",
        apiKeyLabel: "API Key (Optional for Local)",
        apiKeyHelpUrl: "https://ollama.com",
        apiKeyHelpText: "Run local models for free with Ollama"
    },
    lmstudio: {
        name: "LM Studio",
        iconUrl: "icons/providers/lmstudio.svg",
        baseUrl: "http://localhost:1234/v1",
        defaultModel: "local-model",
        suggestedModels: ["local-model"],
        apiKeyPlaceholder: "Not required (local server)",
        apiKeyLabel: "API Key (Optional for Local)",
        apiKeyHelpUrl: "https://lmstudio.ai",
        apiKeyHelpText: "Routes to whatever model is loaded in LM Studio"
    },
    custom: {
        name: "Custom",
        iconUrl: "icons/providers/custom.png",
        baseUrl: "custom",
        defaultModel: "",
        suggestedModels: [],
        apiKeyPlaceholder: "Paste your API key (if required)",
        apiKeyLabel: "API Key",
        apiKeyHelpUrl: "",
        apiKeyHelpText: "Enter your custom endpoint Base URL and model name below"
    }
};

// Global state
let currentSettings = {};
let currentStats = {};
let contextMenuUpdateTimeout = null;

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
    }, 500);
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', async () => {
    setupTabs();
    setupThemeControls();
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

            if (!targetContent) return;

            tabs.forEach(t => {
                t.classList.remove('active', 'bg-white', 'dark:bg-slate-700/90', 'text-indigo-600', 'dark:text-indigo-400', 'shadow-sm');
                t.classList.add('text-slate-500', 'dark:text-slate-400');
            });
            contents.forEach(c => {
                c.classList.add('hidden');
                c.classList.remove('block');
            });

            tab.classList.add('active', 'bg-white', 'dark:bg-slate-700/90', 'text-indigo-600', 'dark:text-indigo-400', 'shadow-sm');
            tab.classList.remove('text-slate-500', 'dark:text-slate-400');

            targetContent.classList.remove('hidden');
            targetContent.classList.add('block');
        });
    });
}

function getBrowserTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveIsDark(mode) {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return getBrowserTheme();
}

function applyThemeMode(mode) {
    let activeMode = mode;
    if (!activeMode) {
        try {
            activeMode = localStorage.getItem('ai_rewrite_theme_mode') || 'dark';
        } catch (e) {
            activeMode = 'dark';
        }
    }
    currentSettings.themeMode = activeMode;
    try {
        localStorage.setItem('ai_rewrite_theme_mode', activeMode);
    } catch (e) {}
    
    const isDark = resolveIsDark(activeMode);
    const html = document.documentElement;
    const themeIcon = document.getElementById('themeToggleIcon');
    const darkModeCheckbox = document.getElementById('darkMode');

    if (isDark) {
        html.setAttribute('data-theme', 'dark');
        html.classList.add('dark');
        if (themeIcon) themeIcon.src = 'icons/glass/sun.png';
        if (darkModeCheckbox) darkModeCheckbox.checked = true;
    } else {
        html.setAttribute('data-theme', 'light');
        html.classList.remove('dark');
        if (themeIcon) themeIcon.src = 'icons/glass/moon.png';
        if (darkModeCheckbox) darkModeCheckbox.checked = false;
    }

    currentSettings.darkMode = isDark;
    updateThemeSelectorUI(activeMode);
}

function updateThemeSelectorUI(mode) {
    const activeMode = mode || 'dark';
    const buttons = document.querySelectorAll('.theme-mode-btn');
    const badge = document.getElementById('activeThemeBadge');
    if (badge) {
        badge.textContent = activeMode.toUpperCase();
    }
    buttons.forEach(btn => {
        const val = btn.dataset.themeVal;
        if (val === activeMode) {
            btn.className = 'theme-mode-btn active flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-white/10';
        } else {
            btn.className = 'theme-mode-btn flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400';
        }
    });
}

function setupThemeControls() {
    // 1. General Tab Segmented Theme Selector Buttons
    const buttons = document.querySelectorAll('.theme-mode-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.themeVal;
            applyThemeMode(mode);
            chrome.storage.sync.set({ themeMode: mode, darkMode: currentSettings.darkMode });
        });
    });

    // 2. Floating Quick Toggle at top-right
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentIsDark = document.documentElement.classList.contains('dark');
            const newMode = currentIsDark ? 'light' : 'dark';
            applyThemeMode(newMode);
            chrome.storage.sync.set({ themeMode: newMode, darkMode: !currentIsDark });
        });
    }

    // 3. Dynamic system theme change listener (only triggers if mode is 'system')
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (currentSettings.themeMode === 'system') {
                applyThemeMode('system');
            }
        });
    }
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
            'darkMode',
            'themeMode'
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

            let savedLocal = null;
            try {
                savedLocal = localStorage.getItem('ai_rewrite_theme_mode');
            } catch (e) {}

            const themeMode = result.themeMode || savedLocal || (result.darkMode !== undefined && result.darkMode !== null ? (result.darkMode ? 'dark' : 'light') : 'dark');
            try {
                localStorage.setItem('ai_rewrite_theme_mode', themeMode);
            } catch (e) {}

            const isDarkMode = resolveIsDark(themeMode);

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
                darkMode: isDarkMode,
                themeMode: themeMode
            };

            updateUIFromSettings();
            resolve();
        });
    });
}

function updateUIFromSettings() {
    const baseUrl = currentSettings.openaiBaseUrl || '';
    document.getElementById('apiKey').value = currentSettings.openaiApiKey;
    document.getElementById('baseUrl').value = baseUrl;
    document.getElementById('selectedModel').value = currentSettings.selectedModel;
    document.getElementById('maxTextLength').value = currentSettings.maxTextLength;
    document.getElementById('enableUndo').checked = currentSettings.enableUndo;
    document.getElementById('enablePreviewMode').checked = currentSettings.enablePreviewMode;
    document.getElementById('enableUsageTracking').checked = currentSettings.enableUsageTracking;
    document.getElementById('enableKeyboardShortcuts').checked = currentSettings.enableKeyboardShortcuts;

    const detectedKey = detectProviderFromUrl(baseUrl);
    const provider = POPULAR_PROVIDERS[detectedKey] || POPULAR_PROVIDERS.openai;
    
    const apiKeyLabel = document.getElementById('apiKeyLabel');
    const apiKeyInput = document.getElementById('apiKey');
    const apiKeyHelp = document.getElementById('apiKeyHelp');
    
    if (apiKeyLabel) apiKeyLabel.textContent = provider.apiKeyLabel;
    if (apiKeyInput) apiKeyInput.placeholder = provider.apiKeyPlaceholder;
    if (apiKeyHelp) {
        apiKeyHelp.innerHTML = `<a href="${provider.apiKeyHelpUrl}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">${provider.apiKeyHelpText}</a>`;
    }
    
    updateModelSuggestions(provider.suggestedModels);
    applyThemeMode(currentSettings.themeMode);
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
        const isActive = key === activeKey;
        const card = document.createElement('div');
        card.className = `provider-card group relative flex flex-col items-center justify-center py-4 px-3 rounded-2xl transition-all duration-200 cursor-pointer select-none text-center ${
            isActive 
                ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-2 border-indigo-500 shadow-md shadow-indigo-500/10 scale-[1.02]' 
                : 'glass-nested bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/10 hover:border-indigo-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-slate-800 hover:-translate-y-0.5 shadow-sm'
        }`;
        card.dataset.provider = key;

        card.innerHTML = `
            <img src="${provider.iconUrl}" alt="${provider.name}" class="w-8 h-8 mb-2.5 object-contain transition-transform duration-200 group-hover:scale-110 drop-shadow-sm ${provider.invertInDark ? 'dark:invert' : ''}">
            <div class="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">${provider.name}</div>
        `;

        card.addEventListener('click', () => selectProvider(key));
        container.appendChild(card);
    });
}

function selectProvider(key) {
    const provider = POPULAR_PROVIDERS[key];
    if (!provider) return;

    renderProviderPresets();

    const baseUrlInput = document.getElementById('baseUrl');
    const selectedModelInput = document.getElementById('selectedModel');
    const apiKeyInput = document.getElementById('apiKey');
    const apiKeyLabel = document.getElementById('apiKeyLabel');
    const apiKeyHelp = document.getElementById('apiKeyHelp');

    if (key === 'custom') {
        if (apiKeyLabel) apiKeyLabel.textContent = "API Key (Custom Provider)";
        if (apiKeyInput) apiKeyInput.placeholder = "Enter your API key (if required)";
        if (apiKeyHelp) {
            apiKeyHelp.innerHTML = `Enter your custom endpoint Base URL (e.g. <code>https://api.your-provider.com/v1</code>) and model below.`;
        }
        baseUrlInput.focus();
        showStatus('Custom endpoint selected. Enter your Base URL and model below.', 'info');
    } else {
        baseUrlInput.value = provider.baseUrl;
        selectedModelInput.value = provider.defaultModel;

        if (apiKeyLabel) apiKeyLabel.textContent = provider.apiKeyLabel;
        if (apiKeyInput) apiKeyInput.placeholder = provider.apiKeyPlaceholder;
        if (apiKeyHelp) {
            apiKeyHelp.innerHTML = `<a href="${provider.apiKeyHelpUrl}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">${provider.apiKeyHelpText}</a>`;
        }

        updateModelSuggestions(provider.suggestedModels);
        showStatus(`Configured for ${provider.name}! Click 'Save Settings' to apply.`, 'success');
    }
}

function updateModelSuggestions(models) {
    const modelSelect = document.getElementById('modelSelect');
    const selectedModelInput = document.getElementById('selectedModel');
    const quickChips = document.getElementById('quickModelChips');
    if (!modelSelect || !selectedModelInput) return;

    const currentVal = (selectedModelInput.value || '').trim();
    modelSelect.innerHTML = '';

    const modelList = Array.isArray(models) && models.length > 0 ? models : [
        "chat-latest",
        "gpt-4o-mini",
        "openrouter/auto",
        "gemini-flash-lite-latest",
        "gemini-3.7-flash",
        "llama-3.3-70b-versatile",
        "deepseek-v4-flash"
    ];

    let foundMatch = false;
    modelList.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        if (m === currentVal) {
            opt.selected = true;
            foundMatch = true;
        }
        modelSelect.appendChild(opt);
    });

    const customOpt = document.createElement('option');
    customOpt.value = "__custom__";
    customOpt.textContent = "+ Type Custom Model Name...";
    if (!foundMatch && currentVal) {
        customOpt.selected = true;
    }
    modelSelect.appendChild(customOpt);

    if (quickChips) {
        quickChips.innerHTML = '';
        modelList.slice(0, 5).forEach(m => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = `px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                m === currentVal 
                    ? 'bg-indigo-600 text-white shadow-sm scale-105' 
                    : 'glass-nested bg-slate-200/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-300'
            }`;
            chip.textContent = m;
            chip.addEventListener('click', () => {
                selectedModelInput.value = m;
                modelSelect.value = m;
                setCustomModelVisible(false);
                updateModelChipsActiveState(m);
            });
            quickChips.appendChild(chip);
        });
    }

    if (!foundMatch && currentVal) {
        setCustomModelVisible(true);
    } else {
        setCustomModelVisible(false);
    }
}

function updateModelChipsActiveState(activeModel) {
    const chips = document.querySelectorAll('#quickModelChips button');
    chips.forEach(chip => {
        if (chip.textContent === activeModel) {
            chip.className = 'px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all bg-indigo-600 text-white shadow-sm scale-105';
        } else {
            chip.className = 'glass-nested px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all bg-slate-200/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-300';
        }
    });
}

function setCustomModelVisible(visible) {
    const wrapper = document.getElementById('customModelInputWrapper');
    const toggleBtn = document.getElementById('toggleCustomModelInput');
    const modelSelect = document.getElementById('modelSelect');

    if (visible) {
        if (wrapper) wrapper.classList.remove('hidden');
        if (toggleBtn) toggleBtn.textContent = "Choose from list";
        if (modelSelect) modelSelect.value = "__custom__";
    } else {
        if (wrapper) wrapper.classList.add('hidden');
        if (toggleBtn) toggleBtn.textContent = "Type Custom...";
    }
}

function setupEventListeners() {
    document.getElementById('saveGeneral').addEventListener('click', saveGeneralSettings);
    document.getElementById('testConnection').addEventListener('click', testApiConnection);

    const modelSelect = document.getElementById('modelSelect');
    const selectedModelInput = document.getElementById('selectedModel');
    const toggleCustomModelBtn = document.getElementById('toggleCustomModelInput');

    if (modelSelect && selectedModelInput) {
        modelSelect.addEventListener('change', () => {
            if (modelSelect.value === '__custom__') {
                setCustomModelVisible(true);
                selectedModelInput.focus();
            } else {
                setCustomModelVisible(false);
                selectedModelInput.value = modelSelect.value;
                updateModelChipsActiveState(modelSelect.value);
            }
        });

        selectedModelInput.addEventListener('input', () => {
            updateModelChipsActiveState(selectedModelInput.value.trim());
        });
    }

    if (toggleCustomModelBtn) {
        toggleCustomModelBtn.addEventListener('click', () => {
            const wrapper = document.getElementById('customModelInputWrapper');
            const isHidden = wrapper && wrapper.classList.contains('hidden');
            if (isHidden) {
                setCustomModelVisible(true);
                if (selectedModelInput) selectedModelInput.focus();
            } else {
                setCustomModelVisible(false);
                if (modelSelect && modelSelect.value !== '__custom__') {
                    if (selectedModelInput) selectedModelInput.value = modelSelect.value;
                    updateModelChipsActiveState(modelSelect.value);
                }
            }
        });
    }

    document.getElementById('saveModes').addEventListener('click', saveModeSettings);
    document.getElementById('resetModes').addEventListener('click', resetModeSettings);
    document.getElementById('selectAllModes').addEventListener('click', selectAllModes);
    document.getElementById('deselectAllModes').addEventListener('click', deselectAllModes);

    document.getElementById('addCustomMode').addEventListener('click', addCustomMode);
    document.getElementById('refreshStats').addEventListener('click', loadUsageStats);
    document.getElementById('clearStats').addEventListener('click', clearUsageStats);

    const darkModeCheckbox = document.getElementById('darkMode');
    if (darkModeCheckbox) {
        darkModeCheckbox.addEventListener('change', (e) => {
            const mode = e.target.checked ? 'dark' : 'light';
            applyThemeMode(mode);
            chrome.storage.sync.set({ themeMode: mode, darkMode: e.target.checked });
        });
    }

    document.getElementById('exportSettings').addEventListener('click', exportSettings);
    document.getElementById('importSettings').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importSettings);
    document.getElementById('resetAllSettings').addEventListener('click', resetAllSettings);

    const toggleApiKeyBtn = document.getElementById('toggleApiKeyVisibility');
    if (toggleApiKeyBtn) {
        toggleApiKeyBtn.addEventListener('click', () => {
            const apiKeyInput = document.getElementById('apiKey');
            if (apiKeyInput.type === 'password') {
                apiKeyInput.type = 'text';
            } else {
                apiKeyInput.type = 'password';
            }
        });
    }

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
        showStatus('API Key cannot be empty', 'error');
        return;
    }

    if (!baseUrl && apiKey && !apiKey.startsWith('sk-') && !apiKey.startsWith('sess-')) {
        showStatus('Warning: OpenAI API keys typically start with "sk-". Double-check your key.', 'warning');
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
        showStatus('Settings saved successfully!', 'success');
        updateContextMenusDebounced();
    } catch (error) {
        showStatus(`Error saving settings: ${error.message}`, 'error');
    }
}

async function testApiConnection() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const baseUrl = document.getElementById('baseUrl').value.trim();
    const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
    
    if (!apiKey && !isLocal) {
        showStatus('Please enter an API key first', 'error');
        return;
    }

    const testButton = document.getElementById('testConnection');
    testButton.disabled = true;
    testButton.innerHTML = `<img class="w-4 h-4 animate-spin" src="icons/glass/test-tube.png" alt="Testing"> Testing...`;

    try {
        const model = document.getElementById('selectedModel').value;
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
            showStatus('API connection verified successfully!', 'success');
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
                : 'Network error - check internet connection or custom Base URL';
        }
        showStatus(`Connection test failed: ${errorMessage}`, 'error');
    } finally {
        testButton.disabled = false;
        testButton.innerHTML = `<img class="w-4 h-4" src="icons/glass/test-tube.png" alt="Test"> Test API Connection`;
    }
}

// === MODES MANAGEMENT ===
function renderModesList() {
    Object.entries(BUILT_IN_MODES).forEach(([key]) => {
        const checkbox = document.getElementById(`mode-${key}`);
        if (checkbox) {
            checkbox.checked = currentSettings.enabledModes.includes(key);
        }
    });
}

async function saveModeSettings() {
    const checkedModes = [];
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
        showStatus('Rewrite mode settings saved successfully!', 'success');
        updateContextMenusDebounced();
    } catch (error) {
        showStatus(`Error saving modes: ${error.message}`, 'error');
    }
}

function resetModeSettings() {
    currentSettings.enabledModes = Object.keys(BUILT_IN_MODES);
    renderModesList();
    showStatus('Mode settings reset to defaults', 'success');
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
    const noModesMsg = document.getElementById('noCustomModes');
    if (!container) return;
    container.innerHTML = '';

    const customKeys = Object.keys(currentSettings.customModes || {});
    if (noModesMsg) {
        noModesMsg.style.display = customKeys.length === 0 ? 'block' : 'none';
    }

    customKeys.forEach((key) => {
        const mode = currentSettings.customModes[key];
        const modeElement = document.createElement('div');
        modeElement.className = 'custom-mode-item p-4 rounded-2xl glass-nested bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/5 flex flex-col gap-2 shadow-sm';
        modeElement.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="font-bold text-sm text-indigo-600 dark:text-indigo-400">${escapeHtml(mode.name)}</div>
                <div class="flex gap-2">
                    <button class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-panel bg-white/80 dark:bg-slate-700/80 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:-translate-y-0.5 transition-all shadow-sm" data-action="edit" data-key="${key}">
                        <img src="icons/glass/pencil.png" alt="Edit" class="w-3.5 h-3.5"> Edit
                    </button>
                    <button class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 text-xs font-semibold hover:bg-red-600 hover:text-white transition-all shadow-sm" data-action="delete" data-key="${key}">
                        <img src="icons/glass/trash.png" alt="Delete" class="w-3.5 h-3.5"> Delete
                    </button>
                </div>
            </div>
            <div class="text-xs text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-white/5 leading-relaxed">${escapeHtml(mode.prompt)}</div>
        `;
        
        const editButton = modeElement.querySelector('[data-action="edit"]');
        const deleteButton = modeElement.querySelector('[data-action="delete"]');
        
        editButton.addEventListener('click', () => editCustomMode(key));
        deleteButton.addEventListener('click', () => deleteCustomMode(key));
        
        container.appendChild(modeElement);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function addCustomMode() {
    const name = document.getElementById('customModeName').value.trim();
    const prompt = document.getElementById('customModePrompt').value.trim();

    if (!name || !prompt) {
        showStatus('Please enter both name and prompt instructions', 'error');
        return;
    }

    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    if (BUILT_IN_MODES[key] || (currentSettings.customModes && currentSettings.customModes[key])) {
        showStatus('A mode with this name already exists', 'error');
        return;
    }

    if (!currentSettings.customModes) currentSettings.customModes = {};
    currentSettings.customModes[key] = { name, prompt };
    
    try {
        await saveSettings({ customModes: currentSettings.customModes });
        document.getElementById('customModeName').value = '';
        document.getElementById('customModePrompt').value = '';
        renderCustomModes();
        showStatus('Custom mode created successfully!', 'success');
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
        
        const addButton = document.getElementById('addCustomMode');
        addButton.innerHTML = `<img src="icons/glass/pencil.png" alt="Update" class="w-4 h-4"> Update Custom Mode`;
        addButton.onclick = () => updateCustomMode(key);
        
        document.getElementById('customModeName').focus();
    }
}

async function updateCustomMode(key) {
    const name = document.getElementById('customModeName').value.trim();
    const prompt = document.getElementById('customModePrompt').value.trim();

    if (!name || !prompt) {
        showStatus('Please enter both name and prompt instructions', 'error');
        return;
    }

    currentSettings.customModes[key] = { name, prompt };
    
    try {
        await saveSettings({ customModes: currentSettings.customModes });
        document.getElementById('customModeName').value = '';
        document.getElementById('customModePrompt').value = '';
        
        const addButton = document.getElementById('addCustomMode');
        addButton.innerHTML = `<img src="icons/glass/plus.png" alt="Add" class="w-4 h-4"> Add Custom Mode`;
        addButton.onclick = addCustomMode;
        
        renderCustomModes();
        showStatus('Custom mode updated successfully!', 'success');
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
    document.getElementById('totalRewrites').textContent = (currentStats.totalRewrites || 0).toLocaleString();
    document.getElementById('totalChars').textContent = 
        ((currentStats.totalInputChars || 0) + (currentStats.totalOutputChars || 0)).toLocaleString();

    const modeUsage = currentStats.modeUsage || {};
    const mostUsed = Object.entries(modeUsage)
        .sort((a, b) => b[1] - a[1])[0];
    
    document.getElementById('favoriteMode').textContent = mostUsed 
        ? (BUILT_IN_MODES[mostUsed[0]] || mostUsed[0]) 
        : '-';

    const lastUsed = currentStats.lastUsed 
        ? new Date(currentStats.lastUsed).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : '-';
    document.getElementById('lastUsed').textContent = lastUsed;
}

async function clearUsageStats() {
    if (!confirm('Are you sure you want to clear all usage analytics?')) {
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
            version: '2.6.0',
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
        showStatus('Configuration exported successfully!', 'success');
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

        const newSettings = { ...currentSettings, ...importData.settings };
        await saveSettings(newSettings);
        
        currentSettings = newSettings;
        updateUIFromSettings();
        renderModesList();
        renderCustomModes();

        showStatus('Configuration imported successfully!', 'success');
        updateContextMenusDebounced();
    } catch (error) {
        showStatus(`Import failed: ${error.message}`, 'error');
    } finally {
        event.target.value = '';
    }
}

async function resetAllSettings() {
    if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
        return;
    }

    try {
        await new Promise((resolve) => {
            chrome.storage.sync.clear(resolve);
        });
        
        await new Promise((resolve) => {
            chrome.storage.local.clear(resolve);
        });

        await loadAllSettings();
        await loadUsageStats();
        renderModesList();
        renderCustomModes();

        showStatus('All settings reset to defaults', 'success');
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
    if (!statusDiv) return;
    statusDiv.textContent = message;
    
    let colorClasses = 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/50';
    if (type === 'success') {
        colorClasses = 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50';
    } else if (type === 'error') {
        colorClasses = 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/50';
    } else if (type === 'warning') {
        colorClasses = 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50';
    }

    statusDiv.className = `block mt-6 p-4 rounded-xl text-center text-xs font-bold transition-all shadow-sm ${colorClasses}`;

    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            statusDiv.className = 'hidden';
            statusDiv.textContent = '';
        }, duration);
    }
}

function clearStatus() {
    const statusDiv = document.getElementById('status');
    if (statusDiv && statusDiv.textContent !== '') {
        statusDiv.className = 'hidden';
        statusDiv.textContent = '';
    }
}