// === ENHANCED CONFIGURATION ===
const CONFIG = {
    API_ENDPOINTS: {
        'gpt-4o-mini': "https://api.openai.com/v1/chat/completions",
        'gpt-4o': "https://api.openai.com/v1/chat/completions",
        'gpt-3.5-turbo': "https://api.openai.com/v1/chat/completions"
    },
    DEFAULT_MODEL: 'amazon/nova-micro',
    DEFAULT_ENDPOINT: "https://api.openai.com/v1/chat/completions",
    MAX_TEXT_LENGTH: 8000,
    MIN_TEXT_LENGTH: 3,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    REQUEST_TIMEOUT: 30000,
    RATE_LIMIT: {
        requests: 60,
        windowMs: 60000, // 1 minute
        burstLimit: 5,   // Max 5 requests in 10 seconds
        burstWindow: 10000
    },
    CACHE: {
        enabled: true,
        maxSize: 100,
        ttl: 300000 // 5 minutes
    },
    RESTRICTED_URLS: [
        'chrome://',
        'chrome-extension://',
        'moz-extension://',
        'edge://',
        'opera://',
        'about:',
        'file://',
        'data:',
        'javascript:'
    ],
    SUPPORTED_ELEMENTS: {
        tags: ['TEXTAREA', 'INPUT'],
        inputTypes: ['text', 'search', 'email', 'url', 'password', 'tel'],
        contentEditable: true
    }
};

// === CONTEXT MENU SETUP ===
const CONTEXT_MENU_ID = "GEMINI_REWRITE";

// Built-in modes with enhanced prompts and metadata
const BUILT_IN_MODES = {
    retone: {
        name: "Retone (Context & Polish)",
        description: "Intelligently adapt tone, enhance clarity, grammar, and vocabulary based on context",
        icon: "✨",
        category: "tone"
    },
    humanize: {
        name: "Humanize (Make Natural)",
        description: "Make text sound more natural and conversational",
        icon: "🧑",
        category: "style"
    },
    grammar: {
        name: "Fix Grammar & Spelling", 
        description: "Correct grammatical errors and typos",
        icon: "✏️",
        category: "correction"
    },
    professional: {
        name: "Professional Tone",
        description: "Formal business communication style",
        icon: "💼",
        category: "tone"
    },
    polite: {
        name: "Polite & Courteous",
        description: "Soften language with respectful phrasing",
        icon: "🙏",
        category: "tone"
    },
    casual: {
        name: "Casual & Friendly", 
        description: "Informal, conversational style",
        icon: "😊",
        category: "tone"
    },
    confident: {
        name: "Confident & Assertive",
        description: "Strong, decisive language",
        icon: "💪",
        category: "tone"
    },
    empathetic: {
        name: "Empathetic & Understanding",
        description: "Caring and emotionally aware tone",
        icon: "❤️",
        category: "tone"
    },
    persuasive: {
        name: "Persuasive & Compelling",
        description: "Convincing and motivating language",
        icon: "🎯",
        category: "style"
    },
    concise: {
        name: "Concise & Clear",
        description: "Remove fluff, get to the point",
        icon: "⚡",
        category: "structure"
    },
    detailed: {
        name: "Detailed & Comprehensive",
        description: "Add depth and explanations",
        icon: "📚",
        category: "structure"
    },
    creative: {
        name: "Creative & Engaging",
        description: "Vivid, imaginative language",
        icon: "🎨",
        category: "style"
    },
    technical: {
        name: "Technical & Precise",
        description: "Accurate technical terminology",
        icon: "⚙️",
        category: "specialized"
    },
    academic: {
        name: "Academic & Scholarly",
        description: "Formal academic writing style",
        icon: "🎓",
        category: "specialized"
    },
    marketing: {
        name: "Marketing & Sales",
        description: "Promotional and engaging copy",
        icon: "📢",
        category: "specialized"
    }
};

// === ENHANCED STATE MANAGEMENT ===
let rewriteHistory = [];
let requestCount = 0;
let lastRequestTime = 0;
let burstRequestCount = 0;
let lastBurstTime = 0;
let responseCache = new Map();
let activeRequests = new Set();
let contextMenusSetup = false;
let setupInProgress = false;

// Performance monitoring
let performanceMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    cacheHits: 0
};

// === INSTALLATION & SETUP ===
chrome.runtime.onInstalled.addListener(async () => {
    console.log("AI Rewriter Extension Installed/Updated");
    
    // Initialize default settings
    await initializeDefaultSettings();
    
    // Setup context menus
    await setupContextMenus();
    
    // Check API key and notify if needed
    await checkApiKeyStatus();
    
    // Verify keyboard shortcuts are registered
    await verifyKeyboardShortcuts();
});

// === STARTUP HANDLER ===
chrome.runtime.onStartup.addListener(async () => {
    console.log("AI Rewriter Extension Starting Up");
    
    // Ensure context menus are set up on browser startup
    if (!contextMenusSetup) {
        await setupContextMenus();
    }
});

async function initializeDefaultSettings() {
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
                }
            } else {
                enabledModes = validBuiltInKeys;
            }

            const defaults = {
                selectedModel: result.selectedModel || CONFIG.DEFAULT_MODEL,
                customModes: result.customModes || {},
                enabledModes: enabledModes,
                maxTextLength: result.maxTextLength || CONFIG.MAX_TEXT_LENGTH,
                enableUndo: result.enableUndo !== false,
                enablePreviewMode: result.enablePreviewMode !== false,
                enableUsageTracking: result.enableUsageTracking !== false,
                enableKeyboardShortcuts: result.enableKeyboardShortcuts !== false,
                darkMode: result.darkMode || false
            };
            
            chrome.storage.sync.set(defaults, () => {
                console.log("Default settings initialized");
                resolve();
            });
        });
    });
}

async function setupContextMenus() {
    // Prevent concurrent setup calls
    if (setupInProgress) {
        console.log("Context menu setup already in progress, skipping...");
        return;
    }

    setupInProgress = true;
    
    return new Promise((resolve, reject) => {
        // Remove existing menus first
        chrome.contextMenus.removeAll(() => {
            if (chrome.runtime.lastError) {
                console.error("Error removing context menus:", chrome.runtime.lastError);
                setupInProgress = false;
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            
            console.log("Removed old context menus.");
            
            // Get current settings
            chrome.storage.sync.get(['enabledModes', 'customModes'], (result) => {
                if (chrome.runtime.lastError) {
                    console.error("Error getting storage:", chrome.runtime.lastError);
                    setupInProgress = false;
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                
                try {
                    const enabledModes = result.enabledModes || Object.keys(BUILT_IN_MODES);
                    const customModes = result.customModes || {};
                    
                    // Create parent menu
                    chrome.contextMenus.create({
                        id: CONTEXT_MENU_ID,
                        title: "✨ Rewrite with AI",
                        contexts: ["editable"]
                    }, () => {
                        if (chrome.runtime.lastError) {
                            console.error("Error creating parent menu:", chrome.runtime.lastError);
                            setupInProgress = false;
                            reject(new Error(chrome.runtime.lastError.message));
                            return;
                        }
                        
                        let menuItemsCreated = 0;
                        let totalMenuItems = enabledModes.length + Object.keys(customModes).length + 3; // +3 for separator, undo, settings
                        
                        const checkComplete = () => {
                            menuItemsCreated++;
                            if (menuItemsCreated >= totalMenuItems) {
                                contextMenusSetup = true;
                                setupInProgress = false;
                                console.log("Context menus created successfully.");
                                resolve();
                            }
                        };
                        
                        // Add built-in modes
                        enabledModes.forEach(modeKey => {
                            if (BUILT_IN_MODES[modeKey]) {
                                chrome.contextMenus.create({
                                    id: `${CONTEXT_MENU_ID}_${modeKey}`,
                                    parentId: CONTEXT_MENU_ID,
                                    title: `${BUILT_IN_MODES[modeKey].icon} ${BUILT_IN_MODES[modeKey].name}`,
                                    contexts: ["editable"]
                                }, () => {
                                    if (chrome.runtime.lastError) {
                                        console.error(`Error creating menu for ${modeKey}:`, chrome.runtime.lastError);
                                    }
                                    checkComplete();
                                });
                            } else {
                                checkComplete();
                            }
                        });
                        
                        // Add custom modes
                        Object.entries(customModes).forEach(([key, mode]) => {
                            chrome.contextMenus.create({
                                id: `${CONTEXT_MENU_ID}_custom_${key}`,
                                parentId: CONTEXT_MENU_ID,
                                title: `🎨 ${mode.name}`,
                                contexts: ["editable"]
                            }, () => {
                                if (chrome.runtime.lastError) {
                                    console.error(`Error creating custom menu for ${key}:`, chrome.runtime.lastError);
                                }
                                checkComplete();
                            });
                        });
                        
                        // Add separator and utility options
                        chrome.contextMenus.create({
                            id: "separator1",
                            parentId: CONTEXT_MENU_ID,
                            type: "separator",
                            contexts: ["editable"]
                        }, () => {
                            if (chrome.runtime.lastError) {
                                console.error("Error creating separator:", chrome.runtime.lastError);
                            }
                            checkComplete();
                        });
                        
                        chrome.contextMenus.create({
                            id: `${CONTEXT_MENU_ID}_undo`,
                            parentId: CONTEXT_MENU_ID,
                            title: "↶ Undo Last Rewrite",
                            contexts: ["editable"]
                        }, () => {
                            if (chrome.runtime.lastError) {
                                console.error("Error creating undo menu:", chrome.runtime.lastError);
                            }
                            checkComplete();
                        });
                        
                        chrome.contextMenus.create({
                            id: `${CONTEXT_MENU_ID}_settings`,
                            parentId: CONTEXT_MENU_ID,
                            title: "⚙️ Settings",
                            contexts: ["editable"]
                        }, () => {
                            if (chrome.runtime.lastError) {
                                console.error("Error creating settings menu:", chrome.runtime.lastError);
                            }
                            checkComplete();
                        });
                    });
                } catch (error) {
                    console.error("Error creating context menus:", error);
                    setupInProgress = false;
                    reject(error);
                }
            });
        });
    });
}

async function checkApiKeyStatus() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['openaiApiKey', 'openaiBaseUrl'], (result) => {
            const isLocal = result.openaiBaseUrl && (result.openaiBaseUrl.includes('localhost') || result.openaiBaseUrl.includes('127.0.0.1'));
            if (!result.openaiApiKey && !isLocal) {
                console.log("API Key not found. User needs to configure.");
                // Show notification to configure API key
                showApiKeyNotification();
            } else {
                console.log("API Key/Endpoint configured.");
            }
            resolve();
        });
    });
}

async function verifyKeyboardShortcuts() {
    try {
        const commands = await chrome.commands.getAll();
        console.log("Registered keyboard shortcuts:", commands);
        
        const missingShortcuts = commands.filter(cmd => !cmd.shortcut);
        if (missingShortcuts.length > 0) {
            console.warn("Some keyboard shortcuts are not assigned:", missingShortcuts.map(c => c.name));
            console.log("Users can configure shortcuts at chrome://extensions/shortcuts");
        } else {
            console.log("All keyboard shortcuts are properly registered");
        }
    } catch (error) {
        console.error("Error verifying keyboard shortcuts:", error);
    }
}

// Show notification when API key is not configured
function showApiKeyNotification() {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'AI Text Rewriter - Setup Required',
        message: 'Please configure your OpenAI API key in the extension settings to start rewriting text.',
        buttons: [
            { title: 'Open Settings' },
            { title: 'Dismiss' }
        ],
        priority: 1
    }, (notificationId) => {
        // Store notification ID for handling clicks
        chrome.storage.local.set({ 'setupNotificationId': notificationId });
    });
}

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    chrome.storage.local.get(['setupNotificationId'], (result) => {
        if (result.setupNotificationId === notificationId) {
            if (buttonIndex === 0) {
                // Open Settings button clicked
                chrome.runtime.openOptionsPage();
            }
            // Clear notification
            chrome.notifications.clear(notificationId);
            chrome.storage.local.remove('setupNotificationId');
        }
    });
});

// Handle notification clicks (entire notification)
chrome.notifications.onClicked.addListener((notificationId) => {
    chrome.storage.local.get(['setupNotificationId'], (result) => {
        if (result.setupNotificationId === notificationId) {
            // Open settings when notification is clicked
            chrome.runtime.openOptionsPage();
            chrome.notifications.clear(notificationId);
            chrome.storage.local.remove('setupNotificationId');
        }
    });
});

// === ENHANCED CONTEXT MENU HANDLER ===

// Helper function to validate if a tab is valid for rewriting
function isValidTab(tab) {
    if (!tab || !tab.url) {
        return false;
    }
    
    // Check against restricted URLs
    return !CONFIG.RESTRICTED_URLS.some(restrictedUrl => 
        tab.url.startsWith(restrictedUrl)
    );
}

// Helper function to parse mode information from menu item ID
function parseModeFromMenuId(menuItemId) {
    if (!menuItemId || !menuItemId.startsWith(CONTEXT_MENU_ID)) {
        return null;
    }
    
    // Remove the base context menu ID and underscore
    const modeKey = menuItemId.replace(`${CONTEXT_MENU_ID}_`, '');
    
    // Check if it's a custom mode
    if (modeKey.startsWith('custom_')) {
        const customKey = modeKey.replace('custom_', '');
        return { type: 'custom', key: customKey };
    }
    
    // Check if it's a built-in mode
    if (BUILT_IN_MODES[modeKey]) {
        return { type: 'builtin', key: modeKey };
    }
    
    return null;
}

// Helper function to get settings from storage
async function getSettings() {
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
            'enableKeyboardShortcuts'
        ], (result) => {
            const validBuiltInKeys = Object.keys(BUILT_IN_MODES);
            let enabledModes = result.enabledModes;
            if (Array.isArray(enabledModes)) {
                enabledModes = enabledModes.filter(k => validBuiltInKeys.includes(k));
            } else {
                enabledModes = validBuiltInKeys;
            }
            
            resolve({
                openaiApiKey: result.openaiApiKey || '',
                openaiBaseUrl: result.openaiBaseUrl || '',
                selectedModel: result.selectedModel || CONFIG.DEFAULT_MODEL,
                customModes: result.customModes || {},
                enabledModes: enabledModes,
                maxTextLength: result.maxTextLength || CONFIG.MAX_TEXT_LENGTH,
                enableUndo: result.enableUndo !== false,
                enablePreviewMode: result.enablePreviewMode !== false,
                enableUsageTracking: result.enableUsageTracking !== false,
                enableKeyboardShortcuts: result.enableKeyboardShortcuts !== false
            });
        });
    });
}

// Helper function to get user-friendly error messages
function getUserFriendlyError(error) {
    if (!error) return "Unknown error occurred";
    
    const errorMsg = error.message || error.toString();
    
    if (errorMsg.includes('API key') || errorMsg.includes('invalid key') || errorMsg.includes('authentication')) {
        return "API key error - Please check your Gemini API key in settings";
    }
    if (errorMsg.includes('quota') || errorMsg.includes('rate limit') || errorMsg.includes('429')) {
        return "API rate limit reached - Please try again in a few minutes";
    }
    if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('NetworkError')) {
        return "Network error - Please check your internet connection";
    }
    if (errorMsg.includes('timeout') || errorMsg.includes('AbortError')) {
        return "Request timed out - Please try again";
    }
    if (errorMsg.includes('blocked') || errorMsg.includes('safety') || errorMsg.includes('SAFETY')) {
        return "Content blocked by safety filters - Try rephrasing your text";
    }
    if (errorMsg.includes('400')) {
        return "Invalid request - Please check your text and try again";
    }
    if (errorMsg.includes('401') || errorMsg.includes('403')) {
        return "API key invalid or expired - Please update your API key in settings";
    }
    if (errorMsg.includes('404')) {
        return "API endpoint not found - The selected model may not be available";
    }
    if (errorMsg.includes('500') || errorMsg.includes('502') || errorMsg.includes('503')) {
        return "Server error - Please try again later";
    }
    
    return "Something went wrong - Please try again";
}

// Helper function to track usage statistics
async function trackUsage(mode, originalLength, rewrittenLength) {
    try {
        const stats = await new Promise((resolve) => {
            chrome.storage.local.get(['usageStats'], (result) => {
                resolve(result.usageStats || {
                    totalRewrites: 0,
                    modeUsage: {},
                    charactersProcessed: 0,
                    charactersGenerated: 0
                });
            });
        });
        
        stats.totalRewrites++;
        stats.modeUsage[mode] = (stats.modeUsage[mode] || 0) + 1;
        stats.charactersProcessed += originalLength;
        stats.charactersGenerated += rewrittenLength;
        
        chrome.storage.local.set({ usageStats: stats });
    } catch (error) {
        console.error("Error tracking usage:", error);
    }
}

// Helper function to store text for undo functionality
function storeForUndo(tabId, frameId, originalText) {
    const undoData = {
        tabId,
        frameId,
        originalText,
        timestamp: Date.now()
    };
    
    // Store in memory for quick access
    rewriteHistory.unshift(undoData);
    
    // Keep only last 10 items
    if (rewriteHistory.length > 10) {
        rewriteHistory = rewriteHistory.slice(0, 10);
    }
}

// Helper function to handle undo functionality
async function handleUndo(tabId, frameId) {
    const undoItem = rewriteHistory.find(item => 
        item.tabId === tabId && item.frameId === (frameId || 0)
    );
    
    if (!undoItem) {
        notifyUser(tabId, "⚠️ No text to undo", true);
        return;
    }
    
    try {
        await injectTextIntoPage(tabId, frameId || 0, undoItem.originalText);
        
        // Remove from history
        const index = rewriteHistory.indexOf(undoItem);
        if (index > -1) {
            rewriteHistory.splice(index, 1);
        }
        
        notifyUser(tabId, "↶ Text restored", false, 2000);
    } catch (error) {
        console.error("Undo failed:", error);
        notifyUser(tabId, "❌ Undo failed", true);
    }
}

// Helper function to check rate limiting
function checkRateLimit() {
    const now = Date.now();
    
    // Check burst rate limiting (max 5 requests in 10 seconds)
    if (now - lastBurstTime > CONFIG.RATE_LIMIT.burstWindow) {
        burstRequestCount = 0;
        lastBurstTime = now;
    }
    
    if (burstRequestCount >= CONFIG.RATE_LIMIT.burstLimit) {
        return false;
    }
    
    // Check overall rate limiting (max 60 requests per minute)
    if (now - lastRequestTime > CONFIG.RATE_LIMIT.windowMs) {
        requestCount = 0;
        lastRequestTime = now;
    }
    
    if (requestCount >= CONFIG.RATE_LIMIT.requests) {
        return false;
    }
    
    // Increment counters
    requestCount++;
    burstRequestCount++;
    
    return true;
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    // Handle special actions
    if (info.menuItemId === `${CONTEXT_MENU_ID}_undo`) {
        await handleUndo(tab.id, info.frameId);
        return;
    }
    
    if (info.menuItemId === `${CONTEXT_MENU_ID}_settings`) {
        chrome.runtime.openOptionsPage();
        return;
    }
    
    // Ensure the click is one of our rewrite menus
    if (!info.parentMenuItemId || info.parentMenuItemId !== CONTEXT_MENU_ID) {
        return;
    }

    // Validate tab and URL
    if (!isValidTab(tab)) {
        console.warn(`AI Rewriter cannot run on this URL: ${tab?.url || 'unknown'}`);
        notifyUser(tab.id, "❌ Cannot rewrite text on this page (restricted URL)", true);
        return;
    }

    // Validate text selection
    if (!info.selectionText || info.selectionText.trim() === "") {
        notifyUser(tab.id, "⚠️ Please select text to rewrite", true);
        return;
    }

    // Check text length
    const settings = await getSettings();
    if (info.selectionText.length > settings.maxTextLength) {
        notifyUser(tab.id, `⚠️ Text too long (max ${settings.maxTextLength} characters)`, true);
        return;
    }

    // Parse mode
    const modeInfo = parseModeFromMenuId(info.menuItemId);
    if (!modeInfo) {
        notifyUser(tab.id, "❌ Unknown rewrite mode", true);
        return;
    }

    console.log(`Rewrite requested: Mode='${modeInfo.key}', Text length=${info.selectionText.length}, URL: ${tab.url}`);

    // Check rate limiting
    if (!checkRateLimit()) {
        notifyUser(tab.id, "⏳ Too many requests. Please wait a moment.", true);
        return;
    }

    // Perform rewrite
    await performRewrite(tab, info, modeInfo, settings);
});

async function performRewrite(tab, info, modeInfo, settings) {
    try {
        const isLocal = settings.openaiBaseUrl && (settings.openaiBaseUrl.includes('localhost') || settings.openaiBaseUrl.includes('127.0.0.1'));
        // Validate API key first (skip for local endpoints)
        if (!isLocal && (!settings.openaiApiKey || settings.openaiApiKey.trim() === '')) {
            notifyUser(tab.id, "❌ No API key configured - Click to open settings", true, 6000);
            // Show setup notification
            showApiKeyNotification();
            return;
        }

        // Show progress notification
        const modeName = modeInfo.type === 'builtin' 
            ? BUILT_IN_MODES[modeInfo.key]?.name || modeInfo.key
            : modeInfo.name || modeInfo.key;
        
        notifyUser(tab.id, `🤖 Rewriting (${modeName})...`, false, 2000);

        // Store original text for undo
        if (settings.enableUndo) {
            storeForUndo(tab.id, info.frameId || 0, info.selectionText);
        }

        // Call API
        const resultText = await callOpenAIApiWithRetry(
            settings.openaiApiKey,
            settings.openaiBaseUrl,
            info.selectionText,
            modeInfo,
            settings
        );

        if (resultText && resultText.trim()) {
            // Check if preview mode is enabled
            if (settings.enablePreviewMode) {
                // Show preview popover instead of directly injecting
                await showPreviewPopover(tab.id, info.frameId || 0, info.selectionText, resultText, modeInfo.key, settings);
            } else {
                // Direct injection (old behavior)
                await injectTextIntoPage(tab.id, info.frameId || 0, resultText);
                
                if (settings.enableUsageTracking) {
                    await trackUsage(modeInfo.key, info.selectionText.length, resultText.length);
                }
                
                notifyUser(tab.id, "✅ Text rewritten successfully!", false, 2000);
            }
        } else {
            throw new Error("Empty response from AI");
        }

    } catch (error) {
        console.error(`Context menu rewrite failed:`, error);
        const errorMsg = getUserFriendlyError(error);
        notifyUser(tab.id, `❌ ${errorMsg}`, true);
        
        // Show additional help for common errors
        if (error.message && (error.message.includes('API key') || error.message.includes('401') || error.message.includes('403'))) {
            setTimeout(() => {
                showApiKeyNotification();
            }, 2000);
        }
    }
}

// === ENHANCED API FUNCTIONS ===

async function callOpenAIApiWithRetry(apiKey, baseUrl, text, modeInfo, settings) {
    // Validate API key
    if (!apiKey || apiKey.trim() === '') {
        throw new Error('API key not configured - Please add your OpenAI API key in settings');
    }
    
    // Basic API key format validation (OpenAI keys typically start with 'sk-')
    if (!apiKey.startsWith('sk-') && !apiKey.startsWith('sess-')) {
        console.warn('API key format might be incorrect - OpenAI keys typically start with sk-');
    }
    
    let lastError;
    
    for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
        try {
            console.log(`API call attempt ${attempt}/${CONFIG.MAX_RETRIES}`);
            
            const result = await callOpenAIApi(apiKey, baseUrl, text, modeInfo, settings);
            if (result && result.trim()) {
                return result;
            }
            throw new Error("Empty response from API");
            
        } catch (error) {
            lastError = error;
            console.warn(`API call attempt ${attempt} failed:`, error.message);
            
            // Don't retry on certain errors
            if (error.message.includes('401') || error.message.includes('403') || 
                error.message.includes('API key') || error.message.includes('authentication') ||
                error.message.includes('invalid key') || attempt === CONFIG.MAX_RETRIES) {
                throw error;
            }
            
            // Wait before retry
            if (attempt < CONFIG.MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * attempt));
            }
        }
    }
    
    throw lastError;
}

async function callOpenAIApi(apiKey, baseUrl, text, modeInfo, settings) {
    const model = settings.selectedModel || CONFIG.DEFAULT_MODEL;
    
    // Use custom base URL if provided, otherwise use default OpenAI endpoint
    // This allows any model name when using custom endpoints
    const endpoint = baseUrl && baseUrl.trim() !== '' 
        ? `${baseUrl.replace(/\/$/, '')}/chat/completions`
        : (CONFIG.API_ENDPOINTS[model] || CONFIG.DEFAULT_ENDPOINT);

    const prompt = await generatePrompt(text, modeInfo, settings);
    
    const requestBody = {
        model: model,
        messages: [
            {
                role: "system",
                content: "You are a helpful AI assistant that rewrites text according to specific instructions. Always respond with only the rewritten text, no explanations or additional formatting."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: getTemperatureForMode(modeInfo.key),
        max_tokens: 4096,
        top_p: 0.8
    };

    console.log(`Sending request to OpenAI (${model})...`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (apiKey && apiKey.trim() !== '') {
            headers['Authorization'] = `Bearer ${apiKey}`;
        } else if (baseUrl && (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1'))) {
            headers['Authorization'] = 'Bearer local';
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            let errorBody = "Could not read error response";
            try {
                const errorData = await response.json();
                errorBody = errorData.error?.message || JSON.stringify(errorData);
            } catch (e) {
                errorBody = await response.text();
            }
            throw new Error(`API request failed (${response.status}): ${errorBody}`);
        }

        const data = await response.json();
        
        if (data.choices?.[0]?.message?.content) {
            let resultText = data.choices[0].message.content.trim();
            return postProcessResult(resultText, modeInfo.key);
        } else {
            throw new Error("Invalid API response structure");
        }
        
    } catch (error) {
        clearTimeout(timeout);
        if (error.name === 'AbortError') {
            throw new Error("Request timeout - please try again");
        }
        throw error;
    }
}

// === ENHANCED PROMPT GENERATION ===

async function generatePrompt(text, modeInfo, settings) {
    const baseInstruction = `IMPORTANT: Respond with ONLY the final text result. No explanations, no markdown formatting, no bullet points, no preambles, no quotes around the result. Just the direct text output. CRITICAL: Preserve the original language of the input text - if the input is in a specific language, respond in that same language.`;

    if (modeInfo.type === 'custom') {
        const customMode = settings.customModes[modeInfo.key];
        return `${customMode.prompt}\n\n${baseInstruction}\n\nInput text:\n"${text}"\n\nOutput:`;
    }

    // Enhanced built-in prompts with better context awareness
    const prompts = {
        retone: `Analyze the context, intent, and target audience of the provided text. Rewrite it to elevate its tone, enhance clarity and flow, fix subtle grammatical flaws, and select more contextually appropriate, sophisticated vocabulary. Make it sound polished, articulate, and well-crafted while strictly preserving the underlying message, core facts, and original intent.`,
        
        humanize: `Rewrite this text to sound more natural and human-like. Use conversational language, vary sentence structures, and make it feel like a real person wrote it. Avoid overly formal or robotic phrasing. Add natural flow and personality while preserving the core message.`,
        
        grammar: `Fix only the grammar, spelling, and punctuation errors in this text. Keep the original meaning, tone, and style exactly the same. Make minimal changes - only correct actual errors without changing the author's voice or intent.`,
        
        professional: `Rewrite this text in a professional business tone. Use formal language, clear structure, and maintain credibility. Be concise and respectful while ensuring the message is authoritative and appropriate for a business context.`,
        
        polite: `Rewrite this text to be more polite and courteous. Soften any direct language, add respectful phrasing like "please" and "thank you" where appropriate, and ensure a warm, considerate tone throughout.`,
        
        casual: `Rewrite this text in a casual, friendly tone. Use informal language, contractions, and make it sound like a conversation between friends. Keep it relaxed and approachable while maintaining clarity.`,
        
        confident: `Rewrite this text to sound more confident and assertive. Use strong, decisive language while maintaining professionalism. Eliminate uncertainty and make statements clear and authoritative.`,
        
        empathetic: `Rewrite this text with an empathetic and understanding tone. Show care, consideration, and emotional awareness. Use language that demonstrates you understand and relate to the reader's situation.`,
        
        persuasive: `Rewrite this text to be more persuasive and compelling. Use convincing language, logical flow, and motivating phrases. Structure arguments effectively and include compelling reasons to strengthen the message.`,
        
        concise: `Rewrite this text to be more concise and clear. Remove unnecessary words, eliminate redundancy, simplify complex sentences, and get straight to the point while preserving all essential information.`,
        
        detailed: `Rewrite this text to be more detailed and comprehensive. Add relevant information, examples, explanations, and context to make it more complete and informative without losing focus.`,
        
        creative: `Rewrite this text to be more creative and engaging. Use vivid language, interesting metaphors, varied sentence structures, and captivating phrasing while keeping the core message intact.`,
        
        technical: `Rewrite this text in a technical and precise manner. Use accurate terminology, clear specifications, proper technical language, and maintain professional technical standards appropriate for the subject matter.`,
        
        academic: `Rewrite this text in an academic and scholarly style. Use formal academic language, proper citation style markers where appropriate, objective tone, and structured argumentation suitable for academic writing.`,
        
        marketing: `Rewrite this text as engaging marketing copy. Use persuasive language, highlight benefits, create urgency or excitement, and make it compelling for the target audience while maintaining authenticity.`
    };

    const modePrompt = prompts[modeInfo.key] || prompts.retone || prompts.humanize;
    return `${modePrompt}\n\n${baseInstruction}\n\nInput text:\n"${text}"\n\nOutput:`;
}

function getTemperatureForMode(mode) {
    const temperatures = {
        grammar: 0.7,
        retone: 0.75,
        professional: 0.8,
        technical: 0.8,
        academic: 0.8,
        polite: 0.9,
        humanize: 1.0,
        casual: 1.0,
        confident: 1.0,
        empathetic: 1.0,
        persuasive: 1.1,
        concise: 1.0,
        detailed: 1.0,
        marketing: 1.2,
        creative: 1.4
    };
    return temperatures[mode] || 1.0;
}

function postProcessResult(text, mode) {
    // Remove potential wrapping quotes
    if ((text.startsWith('"') && text.endsWith('"')) || 
        (text.startsWith("'") && text.endsWith("'"))) {
        text = text.slice(1, -1);
    }
    
    // Remove markdown formatting
    text = text.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
    text = text.replace(/\*(.*?)\*/g, '$1');     // Italic
    text = text.replace(/`(.*?)`/g, '$1');       // Code
    text = text.replace(/_{2,}(.*?)_{2,}/g, '$1'); // Underline
    
    // Remove list formatting for non-list modes
    if (!['detailed'].includes(mode)) {
        text = text.replace(/^[\*\-\+]\s+/gm, '');
        text = text.replace(/^\d+\.\s+/gm, '');
    }
    
    // Remove common preambles
    const preambles = [
        /^Here's the rewritten text:?\s*/i,
        /^Rewritten text:?\s*/i,
        /^Result:?\s*/i,
        /^Output:?\s*/i,
        /^The rewritten version:?\s*/i,
        /^Here's the .*?:?\s*/i,
        /^This .*? version:?\s*/i
    ];
    
    for (const pattern of preambles) {
        text = text.replace(pattern, '');
    }
    
    // Clean up extra whitespace
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/\s{2,}/g, ' ');
    
    return text.trim();
}

// === MESSAGE HANDLING ===
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === 'updateContextMenus') {
        try {
            await setupContextMenus();
            sendResponse({ success: true });
        } catch (error) {
            console.error("Error updating context menus:", error);
            sendResponse({ success: false, error: error.message });
        }
        return true; // Keep the message channel open for async response
    }
    
    if (message.action === 'getPerformanceMetrics') {
        sendResponse({ metrics: performanceMetrics });
    }
    
    if (message.action === 'clearCache') {
        responseCache.clear();
        sendResponse({ success: true });
    }
});

// === ENHANCED CONTENT SCRIPT FUNCTIONS ===
async function injectTextIntoPage(tabId, frameId, textToInject) {
    console.log("Injecting text into tab:", tabId, "Frame:", frameId);
    
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabId, frameIds: frameId ? [frameId] : undefined },
            func: replaceSelectedTextEnhanced,
            args: [textToInject],
        });

        if (results[0]?.result?.success) {
            console.log("Text injection successful");
        } else {
            console.warn("Text injection failed or no result");
            throw new Error(results[0]?.result?.reason || "Unknown injection error");
        }
    } catch (error) {
        console.error("Failed to inject script:", error);
        notifyUser(tabId, "❌ Failed to replace text. Try clicking in the text field first.", true);
    }
}

// New function to inject text using stored selection state (for preview mode)
async function injectTextWithSelectionState(tabId, frameId, textToInject, selectionState) {
    console.log("Injecting text with selection state into tab:", tabId, "State:", selectionState);
    
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabId, frameIds: frameId ? [frameId] : undefined },
            func: replaceTextWithStoredSelection,
            args: [textToInject, selectionState],
        });

        if (results[0]?.result?.success) {
            console.log("Text injection with selection state successful");
            notifyUser(tabId, "✅ Text replaced successfully!", false, 2000);
        } else {
            console.warn("Text injection failed:", results[0]?.result?.reason);
            throw new Error(results[0]?.result?.reason || "Unknown injection error");
        }
    } catch (error) {
        console.error("Failed to inject script with selection state:", error);
        notifyUser(tabId, "❌ Failed to replace text. The selection may have changed.", true);
    }
}

// Function that runs in page context to replace text using stored selection state
function replaceTextWithStoredSelection(replacementText, selectionState) {
    if (!selectionState) {
        return { success: false, reason: "No selection state provided" };
    }
    
    try {
        // Find the element using the stored ID
        const element = document.querySelector(`[data-ai-rewriter-id="${selectionState.elementId}"]`);
        
        if (!element) {
            return { success: false, reason: "Could not find the original element" };
        }
        
        if (selectionState.type === 'input') {
            // For input/textarea elements, use the stored selection positions
            const currentValue = element.value;
            
            // Verify the content hasn't changed dramatically
            if (selectionState.value && currentValue !== selectionState.value) {
                console.warn('Element value changed, but proceeding with replacement');
            }
            
            const beforeText = currentValue.substring(0, selectionState.selectionStart);
            const afterText = currentValue.substring(selectionState.selectionEnd);
            element.value = beforeText + replacementText + afterText;
            
            // Set cursor position at end of replaced text
            const newPosition = selectionState.selectionStart + replacementText.length;
            element.focus();
            element.setSelectionRange(newPosition, newPosition);
            
            // Trigger events
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            
            return { success: true, reason: "Text replaced in input/textarea" };
        } 
        else if (selectionState.type === 'contentEditable') {
            // For contentEditable, we need to find and replace the selected text
            element.focus();
            
            // Try to find the text in the element and replace it
            const textContent = element.textContent || element.innerText;
            const selectedText = selectionState.selectedText;
            
            if (selectedText && textContent.includes(selectedText)) {
                // Use document.execCommand for contentEditable (most reliable)
                // First, try to recreate the selection
                const selection = window.getSelection();
                const range = document.createRange();
                
                // Find the text node containing our text
                const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
                let found = false;
                
                while (walker.nextNode()) {
                    const node = walker.currentNode;
                    const idx = node.textContent.indexOf(selectedText);
                    if (idx >= 0) {
                        range.setStart(node, idx);
                        range.setEnd(node, idx + selectedText.length);
                        selection.removeAllRanges();
                        selection.addRange(range);
                        found = true;
                        break;
                    }
                }
                
                if (found) {
                    // Delete and insert
                    range.deleteContents();
                    const textNode = document.createTextNode(replacementText);
                    range.insertNode(textNode);
                    
                    // Move cursor to end
                    range.setStartAfter(textNode);
                    range.setEndAfter(textNode);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    
                    // Trigger events
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    return { success: true, reason: "Text replaced in contentEditable" };
                }
            }
            
            return { success: false, reason: "Could not find selected text in contentEditable element" };
        }
        
        return { success: false, reason: "Unknown selection type" };
        
    } catch (error) {
        console.error("Error replacing text with stored selection:", error);
        return { success: false, reason: error.message };
    }
}

// Enhanced text replacement function that runs in the page context
function replaceSelectedTextEnhanced(replacementText) {
    const activeElement = document.activeElement;
    let success = false;
    let reason = "Unknown error";

    if (!activeElement) {
        return { success: false, reason: "No active element found" };
    }

    try {
        // Handle textarea and input elements
        if (activeElement.tagName === 'TEXTAREA' || 
            (activeElement.tagName === 'INPUT' && /^(text|search|email|url|password|tel)$/i.test(activeElement.type))) {
            
            const start = activeElement.selectionStart;
            const end = activeElement.selectionEnd;
            
            if (start !== end) {
                // Replace selected text
                const beforeText = activeElement.value.substring(0, start);
                const afterText = activeElement.value.substring(end);
                activeElement.value = beforeText + replacementText + afterText;
                
                // Set cursor position at end of replaced text
                const newPosition = start + replacementText.length;
                activeElement.setSelectionRange(newPosition, newPosition);
                
                // Trigger events
                activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                activeElement.dispatchEvent(new Event('change', { bubbles: true }));
                
                success = true;
                reason = "Text replaced in input/textarea";
            } else {
                reason = "No text selected in input/textarea";
            }
        }
        // Handle contentEditable elements
        else if (activeElement.isContentEditable) {
            const selection = window.getSelection();
            
            if (selection.rangeCount > 0 && !selection.isCollapsed) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                
                const textNode = document.createTextNode(replacementText);
                range.insertNode(textNode);
                
                // Move cursor to end of inserted text
                range.setStartAfter(textNode);
                range.setEndAfter(textNode);
                selection.removeAllRanges();
                selection.addRange(range);
                
                // Trigger events
                activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                activeElement.dispatchEvent(new Event('change', { bubbles: true }));
                
                success = true;
                reason = "Text replaced in contentEditable";
            } else {
                reason = "No text selected in contentEditable element";
            }
        } else {
            reason = "Element is not editable";
        }
        
        if (success) {
            // Focus the element to ensure cursor is visible
            activeElement.focus();
        }
        
    } catch (error) {
        console.error("Error replacing text:", error);
        reason = error.message;
    }

    return { success, reason };
}

// === ENHANCED NOTIFICATION SYSTEM ===
function notifyUser(tabId, message, isError = false, duration = 4000) {
    console.log(`Notifying user in tab ${tabId}: ${message}`);
    
    // Check if message contains settings-related content
    const isSettingsMessage = message.includes('API key') || message.includes('settings');
    
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (msg, errorFlag, durationMs, isSettings) => {
            let notifyDiv = document.getElementById('--ai-rewriter-notifier');
            if (!notifyDiv) {
                notifyDiv = document.createElement('div');
                notifyDiv.id = '--ai-rewriter-notifier';
                Object.assign(notifyDiv.style, {
                    position: 'fixed', 
                    top: '10px', 
                    right: '10px', 
                    padding: '12px 16px',
                    borderRadius: '8px', 
                    color: 'white',
                    backgroundColor: errorFlag ? 'rgba(211, 47, 47, 0.95)' : 'rgba(46, 125, 50, 0.95)',
                    zIndex: '2147483647', 
                    fontSize: '14px', 
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontWeight: '500',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    border: errorFlag ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.2)',
                    opacity: '0',
                    transform: 'translateX(100%)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    maxWidth: '350px',
                    wordWrap: 'break-word',
                    cursor: isSettings ? 'pointer' : 'default'
                });
                
                // Add click handler for settings messages
                if (isSettings) {
                    notifyDiv.addEventListener('click', () => {
                        // Create a custom event to communicate with the extension
                        window.postMessage({ type: 'AI_REWRITER_OPEN_SETTINGS' }, '*');
                    });
                    notifyDiv.title = 'Click to open extension settings';
                }
                
                document.body.appendChild(notifyDiv);
                
                // Trigger animation
                setTimeout(() => {
                    notifyDiv.style.opacity = '1';
                    notifyDiv.style.transform = 'translateX(0)';
                }, 10);
            } else {
                notifyDiv.style.backgroundColor = errorFlag ? 'rgba(211, 47, 47, 0.95)' : 'rgba(46, 125, 50, 0.95)';
                notifyDiv.style.border = errorFlag ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.2)';
                notifyDiv.style.opacity = '1';
                notifyDiv.style.transform = 'translateX(0)';
                notifyDiv.style.cursor = isSettings ? 'pointer' : 'default';
                
                // Update click handler
                if (isSettings) {
                    notifyDiv.onclick = () => {
                        window.postMessage({ type: 'AI_REWRITER_OPEN_SETTINGS' }, '*');
                    };
                    notifyDiv.title = 'Click to open extension settings';
                } else {
                    notifyDiv.onclick = null;
                    notifyDiv.title = '';
                }
                
                if (notifyDiv.dataset.timeoutId) {
                    clearTimeout(parseInt(notifyDiv.dataset.timeoutId));
                }
            }
            
            notifyDiv.textContent = msg;
            
            const timeoutId = setTimeout(() => {
                notifyDiv.style.opacity = '0';
                notifyDiv.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notifyDiv.parentNode) {
                        notifyDiv.parentNode.removeChild(notifyDiv);
                    }
                }, 300);
            }, durationMs);
            
            notifyDiv.dataset.timeoutId = timeoutId.toString();
        },
        args: [message, isError, duration, isSettingsMessage],
    }).catch(err => { 
        console.error("Failed to inject notification script:", err);
    });
}

// === PREVIEW POPOVER SYSTEM ===
// Store pending preview data for when user clicks Insert
let pendingPreviews = new Map();

async function showPreviewPopover(tabId, frameId, originalText, previewText, modeKey, settings) {
    console.log("Showing preview popover in tab:", tabId);
    
    // Generate unique preview ID
    const previewId = `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store preview data for later use
    pendingPreviews.set(previewId, {
        tabId,
        frameId,
        originalText,
        previewText,
        modeKey,
        settings,
        timestamp: Date.now()
    });
    
    // Clean up old previews (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - 300000;
    for (const [id, data] of pendingPreviews.entries()) {
        if (data.timestamp < fiveMinutesAgo) {
            pendingPreviews.delete(id);
        }
    }
    
    try {
        // First, capture the current selection state before showing popover
        const selectionResult = await chrome.scripting.executeScript({
            target: { tabId: tabId, frameIds: frameId ? [frameId] : undefined },
            func: captureSelectionState
        });
        
        const selectionState = selectionResult[0]?.result;
        if (selectionState) {
            // Store selection state with the preview data
            const previewData = pendingPreviews.get(previewId);
            previewData.selectionState = selectionState;
            pendingPreviews.set(previewId, previewData);
        }
        
        await chrome.scripting.executeScript({
            target: { tabId: tabId, frameIds: frameId ? [frameId] : undefined },
            func: createPreviewPopoverUI,
            args: [previewId, previewText, originalText]
        });
    } catch (error) {
        console.error("Failed to show preview popover:", error);
        notifyUser(tabId, "❌ Failed to show preview. Try clicking in the text field first.", true);
    }
}

// Function to capture the current selection state before showing popover
function captureSelectionState() {
    const activeElement = document.activeElement;
    const selection = window.getSelection();
    
    if (!activeElement) {
        return null;
    }
    
    // For textarea and input elements
    if (activeElement.tagName === 'TEXTAREA' || 
        (activeElement.tagName === 'INPUT' && /^(text|search|email|url|password|tel)$/i.test(activeElement.type))) {
        
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        
        if (start !== end) {
            // Generate a unique ID for referring to this element
            if (!activeElement.dataset.aiRewriterId) {
                activeElement.dataset.aiRewriterId = 'element_' + Math.random().toString(36).substr(2, 9);
            }
            
            return {
                type: 'input',
                elementId: activeElement.dataset.aiRewriterId,
                tagName: activeElement.tagName,
                selectionStart: start,
                selectionEnd: end,
                value: activeElement.value
            };
        }
    }
    // For contentEditable elements
    else if (activeElement.isContentEditable && selection.rangeCount > 0 && !selection.isCollapsed) {
        // Generate a unique ID for referring to this element
        if (!activeElement.dataset.aiRewriterId) {
            activeElement.dataset.aiRewriterId = 'element_' + Math.random().toString(36).substr(2, 9);
        }
        
        const range = selection.getRangeAt(0);
        
        return {
            type: 'contentEditable',
            elementId: activeElement.dataset.aiRewriterId,
            selectedText: selection.toString()
        };
    }
    
    return null;
}

// Function that runs in the page context to create the popover UI
function createPreviewPopoverUI(previewId, previewText, originalText) {
    // Remove any existing preview popover
    const existingPopover = document.getElementById('--ai-rewriter-preview-popover');
    if (existingPopover) {
        existingPopover.remove();
    }
    
    // Store styles for cleanup
    const HIGHLIGHT_STYLES = {
        input: {
            outline: '3px solid rgba(251, 191, 36, 0.8)',
            outlineOffset: '2px',
            boxShadow: '0 0 16px rgba(251, 191, 36, 0.5), 0 0 4px rgba(251, 191, 36, 0.3)'
        },
        mark: {
            backgroundColor: 'rgba(251, 191, 36, 0.5)',
            borderRadius: '2px',
            boxShadow: '0 0 0 2px rgba(251, 191, 36, 0.3)',
            padding: '1px 0'
        }
    };
    
    // Get selection position for popover placement and highlight the selection
    const activeElement = document.activeElement;
    const selection = window.getSelection();
    let popoverTop = 100;
    let popoverLeft = 100;
    let highlightedElement = null;
    let originalStyles = null;
    let isInputHighlight = false;
    let selectionRect = null;
    
    // Determine position and apply highlighting based on element type
    if (activeElement && (activeElement.tagName === 'TEXTAREA' || 
        (activeElement.tagName === 'INPUT' && /^(text|search|email|url|password|tel)$/i.test(activeElement.type)))) {
        // For input/textarea, use element's bounding rect
        const rect = activeElement.getBoundingClientRect();
        selectionRect = rect;
        popoverTop = rect.bottom + window.scrollY + 12;
        popoverLeft = Math.max(10, rect.left + window.scrollX);
        
        // Store original styles for restoration
        originalStyles = {
            outline: activeElement.style.outline,
            outlineOffset: activeElement.style.outlineOffset,
            boxShadow: activeElement.style.boxShadow
        };
        
        // Apply highlight styles directly (more reliable than classes)
        Object.assign(activeElement.style, HIGHLIGHT_STYLES.input);
        activeElement.dataset.aiRewriterHighlighted = 'true';
        highlightedElement = activeElement;
        isInputHighlight = true;
        
        console.log('Applied highlight to input/textarea:', activeElement.tagName);
    } else if (selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        selectionRect = rect;
        popoverTop = rect.bottom + window.scrollY + 12;
        popoverLeft = Math.max(10, rect.left + window.scrollX);
        
        // Try to highlight contentEditable selection with a mark element
        try {
            const highlightMark = document.createElement('mark');
            highlightMark.id = '--ai-rewriter-selection-mark';
            Object.assign(highlightMark.style, HIGHLIGHT_STYLES.mark);
            
            const clonedRange = range.cloneRange();
            try {
                clonedRange.surroundContents(highlightMark);
                highlightedElement = highlightMark;
                console.log('Applied highlight mark to selection');
            } catch (e) {
                console.log('Selection spans multiple elements, skipping highlight wrapping');
            }
        } catch (e) {
            console.log('Could not highlight selection:', e);
        }
    }
    
    // Helper function to remove highlight
    const removeHighlight = () => {
        // Remove mark element highlight (for contentEditable)
        const mark = document.getElementById('--ai-rewriter-selection-mark');
        if (mark) {
            const parent = mark.parentNode;
            while (mark.firstChild) {
                parent.insertBefore(mark.firstChild, mark);
            }
            parent.removeChild(mark);
        }
        
        // Remove input/textarea inline style highlight
        document.querySelectorAll('[data-ai-rewriter-highlighted="true"]').forEach(el => {
            el.style.outline = '';
            el.style.outlineOffset = '';
            el.style.boxShadow = '';
            delete el.dataset.aiRewriterHighlighted;
        });
    };
    
    // Create popover container
    const popover = document.createElement('div');
    popover.id = '--ai-rewriter-preview-popover';
    popover.dataset.previewId = previewId;
    
    // Modern flat styling (no gradients)
    Object.assign(popover.style, {
        position: 'absolute',
        top: `${popoverTop}px`,
        left: `${popoverLeft}px`,
        maxWidth: '450px',
        minWidth: '320px',
        maxHeight: '400px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.08)',
        zIndex: '2147483647',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
        animation: 'aiRewriterFadeIn 0.2s ease-out'
    });
    
    // Add animation keyframes
    if (!document.getElementById('--ai-rewriter-keyframes')) {
        const style = document.createElement('style');
        style.id = '--ai-rewriter-keyframes';
        style.textContent = `
            @keyframes aiRewriterFadeIn {
                from { opacity: 0; transform: translateY(-10px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes aiRewriterFadeOut {
                from { opacity: 1; transform: translateY(0) scale(1); }
                to { opacity: 0; transform: translateY(-10px) scale(0.95); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Header
    const header = document.createElement('div');
    Object.assign(header.style, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: '#3b82f6',
        color: 'white'
    });
    
    const title = document.createElement('div');
    Object.assign(title.style, {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: '600'
    });
    title.innerHTML = `<span style="font-size: 16px;">✨</span> AI Suggestion`;
    
    const closeBtn = document.createElement('button');
    Object.assign(closeBtn.style, {
        background: 'rgba(255, 255, 255, 0.2)',
        border: 'none',
        borderRadius: '8px',
        padding: '6px 10px',
        cursor: 'pointer',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'background 0.15s ease'
    });
    closeBtn.textContent = '✕';
    closeBtn.title = 'Cancel';
    closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
    closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    closeBtn.onclick = () => {
        removeHighlight();
        popover.style.animation = 'aiRewriterFadeOut 0.15s ease-out forwards';
        setTimeout(() => popover.remove(), 150);
        window.postMessage({ type: 'AI_REWRITER_PREVIEW_CANCEL', previewId }, '*');
    };
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Content area
    const content = document.createElement('div');
    Object.assign(content.style, {
        padding: '16px 20px',
        maxHeight: '220px',
        overflowY: 'auto',
        fontSize: '14px',
        lineHeight: '1.6',
        color: '#1f2937',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
    });
    content.textContent = previewText;
    
    // Footer with buttons
    const footer = document.createElement('div');
    Object.assign(footer.style, {
        display: 'flex',
        gap: '10px',
        padding: '16px 20px',
        borderTop: '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: 'rgba(249, 250, 251, 0.8)'
    });
    
    // Cancel button
    const cancelBtn = document.createElement('button');
    Object.assign(cancelBtn.style, {
        flex: '1',
        padding: '10px 16px',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        background: 'white',
        color: '#374151',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        fontFamily: 'inherit'
    });
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onmouseover = () => {
        cancelBtn.style.background = '#f3f4f6';
        cancelBtn.style.borderColor = '#d1d5db';
    };
    cancelBtn.onmouseout = () => {
        cancelBtn.style.background = 'white';
        cancelBtn.style.borderColor = '#e5e7eb';
    };
    cancelBtn.onclick = () => {
        removeHighlight();
        popover.style.animation = 'aiRewriterFadeOut 0.15s ease-out forwards';
        setTimeout(() => popover.remove(), 150);
        window.postMessage({ type: 'AI_REWRITER_PREVIEW_CANCEL', previewId }, '*');
    };
    
    // Insert button
    const insertBtn = document.createElement('button');
    Object.assign(insertBtn.style, {
        flex: '1',
        padding: '10px 16px',
        border: 'none',
        borderRadius: '10px',
        backgroundColor: '#3b82f6',
        color: 'white',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        fontFamily: 'inherit'
    });
    insertBtn.textContent = '✓ Insert';
    insertBtn.onmouseover = () => {
        insertBtn.style.backgroundColor = '#2563eb';
        insertBtn.style.transform = 'translateY(-1px)';
    };
    insertBtn.onmouseout = () => {
        insertBtn.style.backgroundColor = '#3b82f6';
        insertBtn.style.transform = 'translateY(0)';
    };
    insertBtn.onclick = () => {
        removeHighlight();
        popover.style.animation = 'aiRewriterFadeOut 0.15s ease-out forwards';
        setTimeout(() => popover.remove(), 150);
        window.postMessage({ type: 'AI_REWRITER_PREVIEW_INSERT', previewId }, '*');
    };
    
    footer.appendChild(cancelBtn);
    footer.appendChild(insertBtn);
    
    // Assemble popover
    popover.appendChild(header);
    popover.appendChild(content);
    popover.appendChild(footer);
    
    document.body.appendChild(popover);
    
    // Adjust position if popover goes off-screen or covers the selection
    const popoverRect = popover.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Horizontal adjustment - keep popover within viewport
    if (popoverRect.right > viewportWidth - 20) {
        popover.style.left = `${Math.max(10, viewportWidth - popoverRect.width - 20)}px`;
    }
    
    // Vertical adjustment - if popover goes below viewport or covers selection, move above
    if (popoverRect.bottom > viewportHeight - 20) {
        // Calculate position above the selection
        if (selectionRect) {
            const newTop = selectionRect.top + window.scrollY - popoverRect.height - 12;
            // Only move above if there's room, otherwise keep below but scroll into view
            if (newTop > 10) {
                popover.style.top = `${newTop}px`;
            } else {
                // Not enough room above either, position at top of viewport
                popover.style.top = `${window.scrollY + 10}px`;
                popover.style.position = 'fixed';
                popover.style.top = '10px';
            }
        } else {
            popover.style.top = `${Math.max(10, popoverTop - popoverRect.height - 30)}px`;
        }
    }
    
    // Focus the insert button for keyboard accessibility
    insertBtn.focus();
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openSettings') {
        chrome.runtime.openOptionsPage();
    }
    
    // Handle preview insert action
    if (message.action === 'previewInsert') {
        const previewData = pendingPreviews.get(message.previewId);
        if (previewData) {
            (async () => {
                try {
                    // Use stored selection state for reliable text replacement
                    await injectTextWithSelectionState(
                        previewData.tabId, 
                        previewData.frameId, 
                        previewData.previewText,
                        previewData.selectionState
                    );
                    
                    if (previewData.settings.enableUsageTracking) {
                        await trackUsage(previewData.modeKey, previewData.originalText.length, previewData.previewText.length);
                    }
                    
                    if (previewData.settings.enableUndo) {
                        storeForUndo(previewData.tabId, previewData.frameId, previewData.originalText);
                    }
                    
                    notifyUser(previewData.tabId, "✅ Text inserted successfully!", false, 2000);
                    pendingPreviews.delete(message.previewId);
                } catch (error) {
                    console.error("Preview insert failed:", error);
                    notifyUser(previewData.tabId, "❌ Failed to insert text", true);
                }
            })();
        }
        sendResponse({ success: true });
        return true;
    }
    
    // Handle preview cancel action
    if (message.action === 'previewCancel') {
        pendingPreviews.delete(message.previewId);
        sendResponse({ success: true });
        return true;
    }
});

// === KEYBOARD SHORTCUTS ===
chrome.commands.onCommand.addListener(async (command) => {
    console.log("Keyboard shortcut triggered:", command);
    
    const settings = await getSettings();
    console.log("Keyboard shortcuts enabled:", settings.enableKeyboardShortcuts);
    
    if (!settings.enableKeyboardShortcuts) {
        console.log("Keyboard shortcuts are disabled in settings");
        return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
        console.warn("No active tab found");
        return;
    }
    
    console.log("Active tab:", tab.url);
    
    if (!isValidTab(tab)) {
        console.warn("Cannot run on this tab (restricted URL):", tab.url);
        notifyUser(tab.id, "❌ Cannot use shortcuts on this page", true);
        return;
    }

    console.log("Executing command:", command);
    
    switch (command) {
        case 'rewrite-retone':
            await executeShortcutRewrite(tab, 'retone');
            break;
        case 'rewrite-humanize':
            await executeShortcutRewrite(tab, 'humanize');
            break;
        case 'rewrite-professional':
            await executeShortcutRewrite(tab, 'professional');
            break;
        case 'rewrite-grammar':
            await executeShortcutRewrite(tab, 'grammar');
            break;
        case 'undo-rewrite':
            await handleUndo(tab.id);
            break;
        default:
            console.warn("Unknown command:", command);
    }
});

async function executeShortcutRewrite(tab, mode) {
    try {
        // Get settings first to check API key
        const settings = await getSettings();
        
        const isLocal = settings.openaiBaseUrl && (settings.openaiBaseUrl.includes('localhost') || settings.openaiBaseUrl.includes('127.0.0.1'));
        // Validate API key first (skip for local endpoints)
        if (!isLocal && (!settings.openaiApiKey || settings.openaiApiKey.trim() === '')) {
            notifyUser(tab.id, "❌ No API key configured - Click to open settings", true, 6000);
            showApiKeyNotification();
            return;
        }

        // Get selected text from page
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const selection = window.getSelection();
                const selectedText = selection.toString().trim();
                const activeElement = document.activeElement;
                
                // Check if we're in an editable element
                const isEditable = activeElement && (
                    activeElement.tagName === 'TEXTAREA' ||
                    (activeElement.tagName === 'INPUT' && /^(text|search|email|url|password|tel)$/i.test(activeElement.type)) ||
                    activeElement.isContentEditable
                );
                
                return {
                    selectedText,
                    isEditable,
                    hasSelection: selectedText.length > 0
                };
            }
        });

        const result = results[0]?.result;
        
        if (!result?.hasSelection) {
            notifyUser(tab.id, "⚠️ Please select text first", true);
            return;
        }
        
        if (!result.isEditable) {
            notifyUser(tab.id, "⚠️ Please select text in an editable field", true);
            return;
        }
        
        if (result.selectedText.length > settings.maxTextLength) {
            notifyUser(tab.id, `⚠️ Text too long (max ${settings.maxTextLength} characters)`, true);
            return;
        }

        // Check rate limiting
        if (!checkRateLimit()) {
            notifyUser(tab.id, "⏳ Too many requests. Please wait a moment.", true);
            return;
        }

        const modeInfo = { type: 'builtin', key: mode };
        
        // Show progress
        const modeName = BUILT_IN_MODES[mode]?.name || mode;
        notifyUser(tab.id, `🤖 Rewriting (${modeName})...`, false, 2000);

        // Store original text for undo
        if (settings.enableUndo) {
            storeForUndo(tab.id, 0, result.selectedText);
        }

        // Call API
        const resultText = await callOpenAIApiWithRetry(
            settings.openaiApiKey,
            settings.openaiBaseUrl,
            result.selectedText,
            modeInfo,
            settings
        );

        if (resultText && resultText.trim()) {
            // Check if preview mode is enabled
            if (settings.enablePreviewMode) {
                // Show preview popover instead of directly injecting
                await showPreviewPopover(tab.id, 0, result.selectedText, resultText, mode, settings);
            } else {
                // Direct injection (old behavior)
                await injectTextIntoPage(tab.id, 0, resultText);
                
                if (settings.enableUsageTracking) {
                    await trackUsage(mode, result.selectedText.length, resultText.length);
                }
                
                notifyUser(tab.id, "✅ Text rewritten successfully!", false, 2000);
            }
        } else {
            throw new Error("Empty response from AI");
        }

    } catch (error) {
        console.error(`Keyboard shortcut rewrite failed:`, error);
        const errorMsg = getUserFriendlyError(error);
        notifyUser(tab.id, `❌ ${errorMsg}`, true);
        
        // Show additional help for common errors
        if (error.message && (error.message.includes('API key') || error.message.includes('401') || error.message.includes('403'))) {
            setTimeout(() => {
                showApiKeyNotification();
            }, 2000);
        }
    }
}