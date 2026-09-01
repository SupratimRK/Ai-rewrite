// === ENHANCED CONFIGURATION ===
const CONFIG = {
    API_ENDPOINTS: {
        'chat-latest': "https://api.openai.com/v1/chat/completions",
        'gpt-5.6-luna': "https://api.openai.com/v1/chat/completions",
        'gpt-4o-mini': "https://api.openai.com/v1/chat/completions",
        'o4-mini': "https://api.openai.com/v1/chat/completions",
        'gpt-4o': "https://api.openai.com/v1/chat/completions",
        'gpt-3.5-turbo': "https://api.openai.com/v1/chat/completions"
    },
    DEFAULT_MODEL: 'chat-latest',
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
        category: "tone"
    },
    humanize: {
        name: "Humanize (Make Natural)",
        description: "Make text sound more natural and conversational",
        category: "style"
    },
    grammar: {
        name: "Fix Grammar & Spelling", 
        description: "Correct grammatical errors and typos",
        category: "correction"
    },
    professional: {
        name: "Professional Tone",
        description: "Formal business communication style",
        category: "tone"
    },
    polite: {
        name: "Polite & Courteous",
        description: "Soften language with respectful phrasing",
        category: "tone"
    },
    casual: {
        name: "Casual & Friendly", 
        description: "Informal, conversational style",
        category: "tone"
    },
    confident: {
        name: "Confident & Assertive",
        description: "Strong, decisive language",
        category: "tone"
    },
    empathetic: {
        name: "Empathetic & Caring",
        description: "Caring and emotionally aware tone",
        category: "tone"
    },
    persuasive: {
        name: "Persuasive & Compelling",
        description: "Convincing and motivating language",
        category: "style"
    },
    concise: {
        name: "Concise & Direct",
        description: "Remove fluff, get to the point",
        category: "structure"
    },
    detailed: {
        name: "Detailed & In-Depth",
        description: "Add depth and explanations",
        category: "structure"
    },
    creative: {
        name: "Creative & Engaging",
        description: "Vivid, imaginative language",
        category: "style"
    },
    technical: {
        name: "Technical & Precise",
        description: "Accurate technical terminology",
        category: "specialized"
    },
    academic: {
        name: "Academic & Scholarly",
        description: "Formal academic writing style",
        category: "specialized"
    },
    marketing: {
        name: "Marketing & Copywriting",
        description: "Promotional and engaging copy",
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

// Ensure context menus are created on service worker initialization
setupContextMenus().catch(err => console.log("Context menu init:", err?.message));

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
                enableKeyboardShortcuts: result.enableKeyboardShortcuts !== false
            };
            if (result.darkMode !== undefined) {
                defaults.darkMode = result.darkMode;
            }
            
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

                    const customModes = result.customModes || {};
                    const contexts = ["editable", "selection"];
                    
                    // Create parent menu
                    chrome.contextMenus.create({
                        id: CONTEXT_MENU_ID,
                        title: "AI Text Rewriter",
                        contexts: contexts
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
                                console.log("Context menus created successfully with modes:", enabledModes);
                                resolve();
                            }
                        };
                        
                        // Add built-in modes
                        enabledModes.forEach(modeKey => {
                            if (BUILT_IN_MODES[modeKey]) {
                                chrome.contextMenus.create({
                                    id: `${CONTEXT_MENU_ID}_${modeKey}`,
                                    parentId: CONTEXT_MENU_ID,
                                    title: BUILT_IN_MODES[modeKey].name,
                                    contexts: contexts
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
                                title: mode.name,
                                contexts: contexts
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
                            contexts: contexts
                        }, () => {
                            if (chrome.runtime.lastError) {
                                console.error("Error creating separator:", chrome.runtime.lastError);
                            }
                            checkComplete();
                        });
                        
                        chrome.contextMenus.create({
                            id: `${CONTEXT_MENU_ID}_undo`,
                            parentId: CONTEXT_MENU_ID,
                            title: "Undo Last Rewrite",
                            contexts: contexts
                        }, () => {
                            if (chrome.runtime.lastError) {
                                console.error("Error creating undo menu:", chrome.runtime.lastError);
                            }
                            checkComplete();
                        });
                        
                        chrome.contextMenus.create({
                            id: `${CONTEXT_MENU_ID}_settings`,
                            parentId: CONTEXT_MENU_ID,
                            title: "Settings & Studio",
                            contexts: contexts
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
        
        const missingShortcuts = commands.filter(cmd => !cmd.shortcut && cmd.name !== '_execute_action');
        if (missingShortcuts.length > 0) {
            console.log("Shortcuts available for custom assignment in chrome://extensions/shortcuts:", missingShortcuts.map(c => c.name));
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
            'temperature',
            'defaultRewriteMode',
            'enableFloatingButton',
            'enableUndo',
            'enablePreviewMode',
            'enableUsageTracking',
            'enableKeyboardShortcuts'
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
            
            resolve({
                openaiApiKey: result.openaiApiKey || '',
                openaiBaseUrl: result.openaiBaseUrl || '',
                selectedModel: result.selectedModel || CONFIG.DEFAULT_MODEL,
                customModes: result.customModes || {},
                enabledModes: enabledModes,
                maxTextLength: result.maxTextLength || CONFIG.MAX_TEXT_LENGTH,
                temperature: result.temperature !== undefined ? parseFloat(result.temperature) : 0.8,
                defaultRewriteMode: result.defaultRewriteMode || 'retone',
                enableFloatingButton: result.enableFloatingButton !== false,
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
        notifyUser(tabId, "No text to undo", true);
        return;
    }
    
    try {
        await injectTextIntoPage(tabId, frameId || 0, undoItem.originalText);
        
        // Remove from history
        const index = rewriteHistory.indexOf(undoItem);
        if (index > -1) {
            rewriteHistory.splice(index, 1);
        }
        
        notifyUser(tabId, "Text restored", false, 2000);
    } catch (error) {
        console.error("Undo failed:", error);
        notifyUser(tabId, "Undo failed", true);
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
        notifyUser(tab.id, "Cannot rewrite text on this page (restricted URL)", true);
        return;
    }

    // Validate text selection
    if (!info.selectionText || info.selectionText.trim() === "") {
        notifyUser(tab.id, "Please select text to rewrite", true);
        return;
    }

    // Check text length
    const settings = await getSettings();
    if (info.selectionText.length > settings.maxTextLength) {
        notifyUser(tab.id, `Text too long (max ${settings.maxTextLength} characters)`, true);
        return;
    }

    // Parse mode
    const modeInfo = parseModeFromMenuId(info.menuItemId);
    if (!modeInfo) {
        notifyUser(tab.id, "Unknown rewrite mode", true);
        return;
    }

    console.log(`Rewrite requested: Mode='${modeInfo.key}', Text length=${info.selectionText.length}, URL: ${tab.url}`);

    // Check rate limiting
    if (!checkRateLimit()) {
        notifyUser(tab.id, "Too many requests. Please wait a moment.", true);
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
            notifyUser(tab.id, "No API key configured - Click to open settings", true, 6000);
            // Show setup notification
            showApiKeyNotification();
            return;
        }

        // Show progress notification
        const modeName = modeInfo.type === 'builtin' 
            ? BUILT_IN_MODES[modeInfo.key]?.name || modeInfo.key
            : modeInfo.name || modeInfo.key;
        
        notifyUser(tab.id, `Rewriting with AI (${modeName})...`, false, 2500);

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
                
                notifyUser(tab.id, "Text rewritten successfully!", false, 2000);
            }
        } else {
            throw new Error("Empty response from AI");
        }

    } catch (error) {
        console.error(`Context menu rewrite failed:`, error);
        const errorMsg = getUserFriendlyError(error);
        notifyUser(tab.id, errorMsg, true);
        
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
        temperature: getCalculatedTemperature(modeInfo.key, settings),
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

function getCalculatedTemperature(modeKey, settings) {
    if (settings && typeof settings.temperature === 'number' && !isNaN(settings.temperature)) {
        const baseTemp = settings.temperature;
        const relativeMultipliers = {
            grammar: 0.85,
            academic: 0.9,
            technical: 0.9,
            professional: 0.95,
            retone: 1.0,
            humanize: 1.05,
            casual: 1.05,
            polite: 1.0,
            confident: 1.0,
            empathetic: 1.0,
            concise: 0.95,
            detailed: 1.0,
            persuasive: 1.1,
            marketing: 1.15,
            creative: 1.3
        };
        const mult = relativeMultipliers[modeKey] || 1.0;
        const result = Math.min(2.0, Math.max(0.0, baseTemp * mult));
        return parseFloat(result.toFixed(2));
    }
    return getTemperatureForMode(modeKey);
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
    text = text.replace(/`([^`]+)`/g, '$1');     // Inline code
    text = text.replace(/^#+\s+/gm, '');         // Headers
    
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
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateContextMenus') {
        setupContextMenus()
            .then(() => sendResponse({ success: true }))
            .catch(error => {
                console.error("Error updating context menus:", error);
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }
    
    if (message.action === 'getPerformanceMetrics') {
        sendResponse({ metrics: performanceMetrics });
        return true;
    }
    
    if (message.action === 'clearCache') {
        responseCache.clear();
        sendResponse({ success: true });
        return true;
    }

    if (message.action === 'getFloatingButtonSettings') {
        getSettings().then(settings => {
            const defaultKey = settings.defaultRewriteMode || 'retone';
            const modeName = BUILT_IN_MODES[defaultKey]?.name || settings.customModes?.[defaultKey]?.name || 'Rewrite';
            sendResponse({
                enableFloatingButton: settings.enableFloatingButton !== false,
                defaultRewriteMode: defaultKey,
                defaultModeName: modeName,
                enablePreviewMode: settings.enablePreviewMode !== false
            });
        }).catch(err => {
            sendResponse({ enableFloatingButton: true, defaultRewriteMode: 'retone', defaultModeName: 'Retone' });
        });
        return true;
    }

    if (message.action === 'triggerQuickRewrite') {
        getSettings().then(async (settings) => {
            const tabId = sender.tab?.id;
            if (!tabId) {
                sendResponse({ success: false, error: 'No active tab' });
                return;
            }

            const defaultKey = settings.defaultRewriteMode || 'retone';
            const modeInfo = defaultKey.startsWith('custom_')
                ? { type: 'custom', key: defaultKey.replace('custom_', '') }
                : { type: 'builtin', key: defaultKey };

            const text = (message.text || '').trim();
            if (!text) {
                notifyUser(tabId, "Please type or select some text to rewrite.", true);
                sendResponse({ success: false, error: 'Empty text' });
                return;
            }

            if (text.length > settings.maxTextLength) {
                notifyUser(tabId, `Text exceeds maximum length of ${settings.maxTextLength} characters`, true);
                sendResponse({ success: false, error: 'Text exceeds limit' });
                return;
            }

            const cleanModeName = BUILT_IN_MODES[defaultKey]?.name || settings.customModes?.[defaultKey]?.name || 'Quick Rewrite';
            notifyUser(tabId, `Rewriting with ${cleanModeName}...`, false, 2500);

            try {
                const resultText = await callOpenAIApiWithRetry(settings.openaiApiKey, settings.openaiBaseUrl, text, modeInfo, settings);
                if (resultText && resultText.trim()) {
                    if (settings.enablePreviewMode) {
                        await showPreviewPopover(tabId, sender.frameId || 0, text, resultText, modeInfo.key, settings);
                    } else {
                        await injectTextIntoPage(tabId, sender.frameId || 0, resultText, text);
                        if (settings.enableUsageTracking) {
                            await trackUsage(modeInfo.key, text.length, resultText.length);
                        }
                        notifyUser(tabId, "Text rewritten successfully!", false, 2000);
                    }
                    sendResponse({ success: true });
                } else {
                    sendResponse({ success: false, error: 'No output generated' });
                }
            } catch (err) {
                console.error("Quick rewrite failed:", err);
                notifyUser(tabId, getUserFriendlyError(err), true);
                sendResponse({ success: false, error: err.message });
            }
        }).catch(err => {
            sendResponse({ success: false, error: err.message });
        });
        return true;
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
        notifyUser(tabId, "Failed to replace text. Try clicking in the text field first.", true);
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
            notifyUser(tabId, "Text replaced successfully!", false, 2000);
        } else {
            console.warn("Text injection failed:", results[0]?.result?.reason);
            throw new Error(results[0]?.result?.reason || "Unknown injection error");
        }
    } catch (error) {
        console.error("Failed to inject script with selection state:", error);
        notifyUser(tabId, "Failed to replace text. The selection may have changed.", true);
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

// Enhanced universal text replacement function for all platforms (WhatsApp Web, Reddit, etc.)
function replaceSelectedTextEnhanced(replacementText, originalText) {
    // Helper: Find target editable element
    function findTargetEditable(targetText) {
        let activeEl = document.activeElement;
        const sel = window.getSelection();

        if (activeEl && activeEl !== document.body && (activeEl.isContentEditable || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
            return activeEl;
        }

        if (sel && sel.rangeCount > 0) {
            let node = sel.anchorNode;
            while (node && node !== document.body) {
                if (node.nodeType === 1 && (node.isContentEditable || node.tagName === 'TEXTAREA' || node.tagName === 'INPUT' || node.getAttribute('role') === 'textbox')) {
                    return node;
                }
                node = node.parentNode;
            }
        }

        if (targetText) {
            const candidates = document.querySelectorAll(
                'div[contenteditable="true"], [role="textbox"], textarea, input, .ProseMirror, .public-DraftEditor-content, .copyable-text, [data-lexical-editor="true"], div[data-tab="10"]'
            );
            for (const el of candidates) {
                const val = el.value || el.innerText || el.textContent;
                if (val && val.includes(targetText)) {
                    return el;
                }
            }
        }

        return activeEl || document.body;
    }

    // Helper: Select text across nodes
    function selectTextInContainer(container, textToSelect) {
        if (!container || !textToSelect) return false;
        const sel = window.getSelection();
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);

        for (const node of nodes) {
            const idx = node.textContent.indexOf(textToSelect);
            if (idx !== -1) {
                const range = document.createRange();
                range.setStart(node, idx);
                range.setEnd(node, idx + textToSelect.length);
                sel.removeAllRanges();
                sel.addRange(range);
                return true;
            }
        }

        let fullText = '';
        const nodeRanges = [];
        for (const node of nodes) {
            const start = fullText.length;
            const end = start + node.textContent.length;
            nodeRanges.push({ node, start, end });
            fullText += node.textContent;
        }

        const matchIdx = fullText.indexOf(textToSelect);
        if (matchIdx !== -1) {
            const matchEnd = matchIdx + textToSelect.length;
            let startNode = null, startOffset = 0;
            let endNode = null, endOffset = 0;

            for (const nr of nodeRanges) {
                if (!startNode && matchIdx >= nr.start && matchIdx < nr.end) {
                    startNode = nr.node;
                    startOffset = matchIdx - nr.start;
                }
                if (matchEnd > nr.start && matchEnd <= nr.end) {
                    endNode = nr.node;
                    endOffset = matchEnd - nr.start;
                    break;
                }
            }

            if (startNode && endNode) {
                const range = document.createRange();
                range.setStart(startNode, startOffset);
                range.setEnd(endNode, endOffset);
                sel.removeAllRanges();
                sel.addRange(range);
                return true;
            }
        }
        return false;
    }

    const container = findTargetEditable(originalText);
    if (!container || container === document.body) {
        return { success: false, reason: "No editable container found" };
    }

    try {
        container.focus();

        // Standard Input / Textarea
        if (container.tagName === 'TEXTAREA' || 
            (container.tagName === 'INPUT' && /^(text|search|email|url|password|tel)$/i.test(container.type))) {
            const proto = container.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
            const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
            let start = container.selectionStart;
            let end = container.selectionEnd;
            const val = container.value;

            if (start === end && originalText) {
                const idx = val.indexOf(originalText);
                if (idx !== -1) {
                    start = idx;
                    end = idx + originalText.length;
                }
            }

            const before = val.substring(0, start);
            const after = val.substring(end);
            const newVal = before + replacementText + after;

            if (descriptor && descriptor.set) {
                descriptor.set.call(container, newVal);
            } else {
                container.value = newVal;
            }

            container.setSelectionRange(start + replacementText.length, start + replacementText.length);
            container.dispatchEvent(new Event('input', { bubbles: true }));
            container.dispatchEvent(new Event('change', { bubbles: true }));
            return { success: true, reason: "Text replaced in input/textarea" };
        }

        // ContentEditable / Complex Editor (WhatsApp Web, Reddit, Facebook, etc.)
        if (container.isContentEditable || container.getAttribute('role') === 'textbox') {
            const sel = window.getSelection();
            if (originalText && (!sel.rangeCount || sel.isCollapsed || sel.toString().trim() !== originalText.trim())) {
                selectTextInContainer(container, originalText);
            }

            let inserted = false;
            try {
                inserted = document.execCommand('insertText', false, replacementText);
            } catch (e) {
                inserted = false;
            }

            if (!inserted) {
                try {
                    const ev = new InputEvent('beforeinput', {
                        bubbles: true,
                        cancelable: true,
                        inputType: 'insertText',
                        data: replacementText
                    });
                    container.dispatchEvent(ev);
                } catch (e) {}

                if (sel.rangeCount > 0) {
                    const range = sel.getRangeAt(0);
                    range.deleteContents();
                    const textNode = document.createTextNode(replacementText);
                    range.insertNode(textNode);
                    range.setStartAfter(textNode);
                    range.setEndAfter(textNode);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }

            container.dispatchEvent(new Event('input', { bubbles: true }));
            container.dispatchEvent(new Event('change', { bubbles: true }));
            return { success: true, reason: "Text replaced in contentEditable" };
        }

        return { success: false, reason: "Element is not editable" };
    } catch (error) {
        console.error("Error replacing text:", error);
        return { success: false, reason: error.message };
    }
}

// === MODERN GLASSMORPHIC NOTIFICATION SYSTEM ===
function notifyUser(tabId, message, isError = false, duration = 4000) {
    console.log(`Notifying user in tab ${tabId}: ${message}`);
    
    // Clean any leading emoji from message string
    const cleanMsg = (message || '').replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\s]+/u, '').trim();
    const isSettingsMessage = cleanMsg.toLowerCase().includes('api key') || cleanMsg.toLowerCase().includes('settings');
    const isLoading = cleanMsg.toLowerCase().includes('rewriting');
    const isSuccess = cleanMsg.toLowerCase().includes('success') || cleanMsg.toLowerCase().includes('inserted') || cleanMsg.toLowerCase().includes('restored');
    const isWarn = cleanMsg.toLowerCase().includes('please select') || cleanMsg.toLowerCase().includes('too long') || cleanMsg.toLowerCase().includes('too many') || cleanMsg.toLowerCase().includes('no text to undo');

    let statusType = 'info';
    if (isLoading) statusType = 'loading';
    else if (isError) statusType = 'error';
    else if (isSuccess) statusType = 'success';
    else if (isWarn) statusType = 'warning';

    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (msg, type, durationMs, isSettings) => {
            let notifyDiv = document.getElementById('--ai-rewriter-notifier');
            if (!notifyDiv) {
                notifyDiv = document.createElement('div');
                notifyDiv.id = '--ai-rewriter-notifier';
                Object.assign(notifyDiv.style, {
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    padding: '12px 18px',
                    borderRadius: '16px',
                    color: '#ffffff',
                    backgroundColor: 'rgba(15, 23, 42, 0.94)',
                    backdropFilter: 'blur(20px)',
                    webkitBackdropFilter: 'blur(20px)',
                    zIndex: '2147483647',
                    fontSize: '13px',
                    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
                    fontWeight: '600',
                    boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.12)',
                    opacity: '0',
                    transform: 'translateX(30px) scale(0.95)',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    maxWidth: '380px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    wordWrap: 'break-word',
                    cursor: isSettings ? 'pointer' : 'default',
                    pointerEvents: 'auto'
                });

                document.body.appendChild(notifyDiv);
                setTimeout(() => {
                    notifyDiv.style.opacity = '1';
                    notifyDiv.style.transform = 'translateX(0) scale(1)';
                }, 10);
            } else {
                notifyDiv.style.opacity = '1';
                notifyDiv.style.transform = 'translateX(0) scale(1)';
                notifyDiv.style.cursor = isSettings ? 'pointer' : 'default';
                if (notifyDiv.dataset.timeoutId) {
                    clearTimeout(parseInt(notifyDiv.dataset.timeoutId));
                }
            }

            // High-resolution SVG indicators
            let iconSvg = '';
            if (type === 'loading') {
                iconSvg = `<div style="width: 22px; height: 22px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;"><svg style="animation: aiSpin 0.9s linear infinite; width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.5" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg></div>`;
            } else if (type === 'success') {
                iconSvg = `<div style="width: 22px; height: 22px; flex-shrink: 0; background: rgba(16, 185, 129, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;"><svg style="width: 13px; height: 13px;" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>`;
            } else if (type === 'error') {
                iconSvg = `<div style="width: 22px; height: 22px; flex-shrink: 0; background: rgba(239, 68, 68, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;"><svg style="width: 13px; height: 13px;" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></div>`;
            } else if (type === 'warning') {
                iconSvg = `<div style="width: 22px; height: 22px; flex-shrink: 0; background: rgba(245, 158, 11, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;"><svg style="width: 13px; height: 13px;" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>`;
            } else {
                iconSvg = `<div style="width: 22px; height: 22px; flex-shrink: 0; background: rgba(99, 102, 241, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;"><svg style="width: 13px; height: 13px;" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></div>`;
            }

            if (!document.getElementById('--ai-rewriter-toast-styles')) {
                const styleEl = document.createElement('style');
                styleEl.id = '--ai-rewriter-toast-styles';
                styleEl.textContent = `@keyframes aiSpin { 100% { transform: rotate(360deg); } }`;
                document.head.appendChild(styleEl);
            }

            notifyDiv.innerHTML = `${iconSvg} <div style="flex: 1; line-height: 1.4;">${msg}</div>`;

            if (isSettings) {
                notifyDiv.onclick = () => window.postMessage({ type: 'AI_REWRITER_OPEN_SETTINGS' }, '*');
                notifyDiv.title = 'Click to open settings';
            } else {
                notifyDiv.onclick = null;
                notifyDiv.title = '';
            }

            const timeoutId = setTimeout(() => {
                notifyDiv.style.opacity = '0';
                notifyDiv.style.transform = 'translateX(30px) scale(0.95)';
                setTimeout(() => {
                    if (notifyDiv.parentNode) notifyDiv.parentNode.removeChild(notifyDiv);
                }, 250);
            }, durationMs);

            notifyDiv.dataset.timeoutId = timeoutId.toString();
        },
        args: [cleanMsg, statusType, duration, isSettingsMessage]
    }).catch(err => {
        console.error("Failed to inject notification script:", err);
    });
}

// === IN-PLACE INLINE PREVIEW & SLIM ACTION PANEL ===
let pendingPreviews = new Map();

async function showPreviewPopover(tabId, frameId, originalText, previewText, modeKey, settings) {
    console.log("Showing in-place preview in tab:", tabId);
    
    // Generate unique preview ID
    const previewId = `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const modeName = BUILT_IN_MODES[modeKey]?.name || modeKey;
    
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
        await chrome.scripting.executeScript({
            target: { tabId: tabId, frameIds: frameId ? [frameId] : undefined },
            func: createInlinePreviewUI,
            args: [previewId, previewText, originalText, modeName]
        });
    } catch (error) {
        console.error("Failed to show in-place preview:", error);
        notifyUser(tabId, "Failed to preview rewrite. Try clicking in the text field first.", true);
    }
}

// Function that runs in page context to overwrite text and attach slim action panel
function createInlinePreviewUI(previewId, previewText, originalText, modeName) {
    // 1. Remove any previous preview panel or revert old session
    const oldPanel = document.getElementById('--ai-rewriter-inline-panel');
    if (oldPanel) {
        if (typeof oldPanel._revert === 'function') {
            try { oldPanel._revert(); } catch (e) {}
        }
        oldPanel.remove();
    }
    const oldOverlay = document.getElementById('--ai-rewriter-highlight-overlay');
    if (oldOverlay) oldOverlay.remove();

    // Helper: Find target editable element (WhatsApp Web, Reddit, etc.)
    function findTargetEditable(targetText) {
        let activeEl = document.activeElement;
        const sel = window.getSelection();

        if (activeEl && activeEl !== document.body && (activeEl.isContentEditable || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
            return activeEl;
        }

        if (sel && sel.rangeCount > 0) {
            let node = sel.anchorNode;
            while (node && node !== document.body) {
                if (node.nodeType === 1 && (node.isContentEditable || node.tagName === 'TEXTAREA' || node.tagName === 'INPUT' || node.getAttribute('role') === 'textbox')) {
                    return node;
                }
                node = node.parentNode;
            }
        }

        if (targetText) {
            const candidates = document.querySelectorAll(
                'div[contenteditable="true"], [role="textbox"], textarea, input, .ProseMirror, .public-DraftEditor-content, .copyable-text, [data-lexical-editor="true"], div[data-tab="10"]'
            );
            for (const el of candidates) {
                const val = el.value || el.innerText || el.textContent;
                if (val && val.includes(targetText)) {
                    return el;
                }
            }
        }

        return activeEl || document.body;
    }

    const activeEl = findTargetEditable(originalText);
    const sel = window.getSelection();

    let targetType = 'none';
    let targetInput = null;
    let inputStart = 0;
    let inputEnd = 0;
    let originalValue = '';
    let anchorRect = null;
    let reverted = false;

    // Helper: Safely set value on React/Vue/standard Inputs
    const setNativeInputValue = (el, val) => {
        const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
        if (descriptor && descriptor.set) {
            descriptor.set.call(el, val);
        } else {
            el.value = val;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    };

    // Helper: Find and select target text across text nodes in contentEditable
    const selectTextInContainer = (container, textToSelect) => {
        if (!container || !textToSelect) return false;
        const currentSel = window.getSelection();
        
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
        const nodes = [];
        while (walker.nextNode()) {
            nodes.push(walker.currentNode);
        }
        
        // Check single node match
        for (const node of nodes) {
            const idx = node.textContent.indexOf(textToSelect);
            if (idx !== -1) {
                const range = document.createRange();
                range.setStart(node, idx);
                range.setEnd(node, idx + textToSelect.length);
                currentSel.removeAllRanges();
                currentSel.addRange(range);
                return true;
            }
        }
        
        // Check across multi-node spans
        let fullText = '';
        const nodeRanges = [];
        for (const node of nodes) {
            const start = fullText.length;
            const end = start + node.textContent.length;
            nodeRanges.push({ node, start, end });
            fullText += node.textContent;
        }
        
        const matchIdx = fullText.indexOf(textToSelect);
        if (matchIdx !== -1) {
            const matchEnd = matchIdx + textToSelect.length;
            let startNode = null, startOffset = 0;
            let endNode = null, endOffset = 0;
            
            for (const nr of nodeRanges) {
                if (!startNode && matchIdx >= nr.start && matchIdx < nr.end) {
                    startNode = nr.node;
                    startOffset = matchIdx - nr.start;
                }
                if (matchEnd > nr.start && matchEnd <= nr.end) {
                    endNode = nr.node;
                    endOffset = matchEnd - nr.start;
                    break;
                }
            }
            
            if (startNode && endNode) {
                const range = document.createRange();
                range.setStart(startNode, startOffset);
                range.setEnd(endNode, endOffset);
                currentSel.removeAllRanges();
                currentSel.addRange(range);
                return true;
            }
        }
        
        return false;
    };

    // Case 1: Standard Input or Textarea
    if (activeEl && (activeEl.tagName === 'TEXTAREA' || 
        (activeEl.tagName === 'INPUT' && /^(text|search|email|url|password|tel)$/i.test(activeEl.type)))) {
        targetType = 'input';
        targetInput = activeEl;
        inputStart = activeEl.selectionStart;
        inputEnd = activeEl.selectionEnd;
        originalValue = activeEl.value;

        // If selection collapsed on context click, find originalText in value
        if (inputStart === inputEnd && originalText) {
            const foundIdx = originalValue.indexOf(originalText);
            if (foundIdx !== -1) {
                inputStart = foundIdx;
                inputEnd = foundIdx + originalText.length;
            }
        }

        const before = originalValue.substring(0, inputStart);
        const after = originalValue.substring(inputEnd);
        const newValue = before + previewText + after;
        
        setNativeInputValue(activeEl, newValue);
        activeEl.focus();
        activeEl.setSelectionRange(inputStart, inputStart + previewText.length);
        anchorRect = activeEl.getBoundingClientRect();
    }
    // Case 2: ContentEditable (WhatsApp Web, Reddit, Facebook, Notion, etc.)
    else if (activeEl && (activeEl.isContentEditable || activeEl.getAttribute('role') === 'textbox')) {
        targetType = 'contentEditable';
        activeEl.focus();

        let range = null;
        if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
            range = sel.getRangeAt(0);
        } else if (originalText) {
            selectTextInContainer(activeEl, originalText);
            if (sel && sel.rangeCount > 0) {
                range = sel.getRangeAt(0);
            }
        }

        if (range) {
            anchorRect = range.getBoundingClientRect();
        } else {
            anchorRect = activeEl.getBoundingClientRect();
        }

        // Insert rewritten text via execCommand & inputEvent to update WhatsApp / Reddit / Lexical state
        let inserted = false;
        try {
            inserted = document.execCommand('insertText', false, previewText);
        } catch (e) {
            inserted = false;
        }

        if (!inserted) {
            try {
                const ev = new InputEvent('beforeinput', {
                    bubbles: true,
                    cancelable: true,
                    inputType: 'insertText',
                    data: previewText
                });
                activeEl.dispatchEvent(ev);
            } catch (e) {}

            if (sel && sel.rangeCount > 0) {
                const r = sel.getRangeAt(0);
                r.deleteContents();
                const textNode = document.createTextNode(previewText);
                r.insertNode(textNode);
            }
        }

        activeEl.dispatchEvent(new Event('input', { bubbles: true }));
        activeEl.dispatchEvent(new Event('change', { bubbles: true }));

        // Re-calculate anchor rect after text replacement
        if (sel && sel.rangeCount > 0) {
            const newRange = sel.getRangeAt(0);
            const rRect = newRange.getBoundingClientRect();
            if (rRect && rRect.width > 0) {
                anchorRect = rRect;
            }
        }
    }

    // Fallback anchorRect
    if (!anchorRect || (anchorRect.width === 0 && anchorRect.height === 0)) {
        anchorRect = {
            top: window.innerHeight / 2,
            bottom: window.innerHeight / 2 + 40,
            left: window.innerWidth / 2 - 140,
            right: window.innerWidth / 2 + 140,
            height: 40,
            width: 280
        };
    }

    // Inject CSS styles for panel animations
    if (!document.getElementById('--ai-rewriter-preview-styles')) {
        const style = document.createElement('style');
        style.id = '--ai-rewriter-preview-styles';
        style.textContent = `
            @keyframes aiRewriterPanelPop {
                from { opacity: 0; transform: translateY(6px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes aiRewriterPanelFade {
                from { opacity: 1; transform: translateY(0) scale(1); }
                to { opacity: 0; transform: translateY(6px) scale(0.95); }
            }
        `;
        document.head.appendChild(style);
    }

    // Calculate Slim Floating Panel Position
    let panelTop = anchorRect.top + window.scrollY - 54;
    if (panelTop < window.scrollY + 10) {
        panelTop = anchorRect.bottom + window.scrollY + 12;
    }
    let panelLeft = Math.max(16, Math.min(window.innerWidth - 370, anchorRect.left + window.scrollX));

    // Create Slim Floating Action Panel
    const panel = document.createElement('div');
    panel.id = '--ai-rewriter-inline-panel';
    panel.dataset.previewId = previewId;

    Object.assign(panel.style, {
        position: 'absolute',
        top: `${panelTop}px`,
        left: `${panelLeft}px`,
        height: '44px',
        padding: '4px 6px 4px 10px',
        borderRadius: '9999px',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(20px)',
        webkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow: '0 16px 36px -4px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        color: '#ffffff',
        zIndex: '2147483647',
        fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        userSelect: 'none',
        pointerEvents: 'auto',
        animation: 'aiRewriterPanelPop 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
    });

    // Revert changes function: selects previewText and replaces with originalText
    const revertChanges = () => {
        if (reverted) return;
        reverted = true;

        if (targetType === 'input' && targetInput) {
            setNativeInputValue(targetInput, originalValue);
            targetInput.setSelectionRange(inputStart, inputEnd);
            targetInput.focus();
        } else if (targetType === 'contentEditable' && activeEl) {
            activeEl.focus();
            const found = selectTextInContainer(activeEl, previewText);
            if (found) {
                let revertedSuccess = false;
                try {
                    revertedSuccess = document.execCommand('insertText', false, originalText);
                } catch (e) {
                    revertedSuccess = false;
                }
                if (!revertedSuccess) {
                    const curSel = window.getSelection();
                    if (curSel && curSel.rangeCount > 0) {
                        const r = curSel.getRangeAt(0);
                        r.deleteContents();
                        r.insertNode(document.createTextNode(originalText));
                    }
                }
            } else {
                console.warn("Could not find previewText to revert in contentEditable");
            }
            activeEl.dispatchEvent(new Event('input', { bubbles: true }));
            activeEl.dispatchEvent(new Event('change', { bubbles: true }));
        }
    };

    panel._revert = revertChanges;

    // Cleanup & Close UI
    const closeUI = () => {
        panel.style.animation = 'aiRewriterPanelFade 0.15s ease-out forwards';
        setTimeout(() => panel.remove(), 140);
        window.removeEventListener('keydown', keydownHandler);
        document.removeEventListener('mousedown', handleOutsideClick, true);
    };

    // Accept handler
    const onAccept = () => {
        closeUI();
        window.postMessage({ type: 'AI_REWRITER_PREVIEW_INSERT', previewId }, '*');
    };

    // Decline handler
    const onDecline = () => {
        revertChanges();
        closeUI();
        window.postMessage({ type: 'AI_REWRITER_PREVIEW_CANCEL', previewId }, '*');
    };

    // Keyboard navigation
    const keydownHandler = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            onDecline();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            onAccept();
        }
    };
    window.addEventListener('keydown', keydownHandler);

    // Outside click dismiss & revert
    const handleOutsideClick = (e) => {
        if (panel && !panel.contains(e.target)) {
            onDecline();
        }
    };
    setTimeout(() => {
        document.addEventListener('mousedown', handleOutsideClick, true);
    }, 250);

    // Dynamic mode label
    let cleanModeTitle = (modeName || 'Rewrite').split('(')[0].replace(/^Fix\s+/i, '').replace(/\s+Tone$/i, '').trim();
    if (!cleanModeTitle) cleanModeTitle = 'Rewrite';

    // Official Brand Icon Badge
    const brandIconUrl = chrome.runtime.getURL('icons/icon48.png');
    const badge = document.createElement('div');
    badge.style.display = 'flex';
    badge.style.alignItems = 'center';
    badge.style.gap = '8px';
    badge.style.paddingRight = '2px';
    badge.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.3));border:1px solid rgba(255,255,255,0.25);box-shadow:0 0 10px rgba(99,102,241,0.5);flex-shrink:0;overflow:hidden;padding:2px;">
            <img src="${brandIconUrl}" alt="Brand" style="width:100%;height:100%;object-fit:contain;border-radius:50%;">
        </div>
        <span style="font-size:12.5px;font-weight:700;color:#f8fafc;letter-spacing:-0.01em;white-space:nowrap;">${cleanModeTitle}</span>
    `;

    // Accept Button
    const acceptBtn = document.createElement('button');
    Object.assign(acceptBtn.style, {
        background: '#10b981',
        color: '#ffffff',
        border: 'none',
        fontSize: '12.5px',
        fontWeight: '700',
        padding: '6px 14px',
        borderRadius: '9999px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: '0 2px 10px rgba(16, 185, 129, 0.45)',
        transition: 'all 0.15s ease',
        fontFamily: 'inherit'
    });
    acceptBtn.innerHTML = `
        <svg style="width: 13px; height: 13px; flex-shrink: 0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <span style="letter-spacing:-0.01em;">Accept</span>
        <span style="display:inline-flex; align-items:center; justify-content:center; gap:3px; padding: 2px 7px; font-size: 11px; font-weight: 700; background: rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; color: #ffffff; line-height: 1;">
            <svg style="width: 10px; height: 10px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>
            <span>Enter</span>
        </span>
    `;
    acceptBtn.onmouseover = () => {
        acceptBtn.style.background = '#059669';
        acceptBtn.style.transform = 'translateY(-1px)';
    };
    acceptBtn.onmouseout = () => {
        acceptBtn.style.background = '#10b981';
        acceptBtn.style.transform = 'translateY(0)';
    };
    acceptBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onAccept();
    };

    // Decline Button
    const declineBtn = document.createElement('button');
    Object.assign(declineBtn.style, {
        background: 'rgba(244, 63, 94, 0.15)',
        color: '#fb7185',
        border: '1px solid rgba(244, 63, 94, 0.35)',
        fontSize: '12.5px',
        fontWeight: '600',
        padding: '6px 13px',
        borderRadius: '9999px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.15s ease',
        fontFamily: 'inherit'
    });
    declineBtn.innerHTML = `
        <svg style="width: 12px; height: 12px; flex-shrink: 0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        <span style="letter-spacing:-0.01em;">Decline</span>
        <span style="display:inline-flex; align-items:center; justify-content:center; padding: 2px 6px; font-size: 10.5px; font-weight: 700; background: rgba(0,0,0,0.28); border: 1px solid rgba(244,63,94,0.4); border-radius: 4px; color: #fecdd3; line-height: 1;">Esc</span>
    `;
    declineBtn.onmouseover = () => {
        declineBtn.style.background = 'rgba(244, 63, 94, 0.28)';
        declineBtn.style.borderColor = 'rgba(244, 63, 94, 0.6)';
        declineBtn.style.color = '#ffffff';
        declineBtn.style.transform = 'translateY(-1px)';
    };
    declineBtn.onmouseout = () => {
        declineBtn.style.background = 'rgba(244, 63, 94, 0.15)';
        declineBtn.style.borderColor = 'rgba(244, 63, 94, 0.35)';
        declineBtn.style.color = '#fb7185';
        declineBtn.style.transform = 'translateY(0)';
    };
    declineBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onDecline();
    };

    panel.appendChild(badge);
    panel.appendChild(acceptBtn);
    panel.appendChild(declineBtn);

    document.body.appendChild(panel);
    acceptBtn.focus();
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openSettings') {
        chrome.runtime.openOptionsPage();
    }
    
    // Handle preview insert/accept action
    if (message.action === 'previewInsert') {
        const previewData = pendingPreviews.get(message.previewId);
        if (previewData) {
            (async () => {
                try {
                    if (previewData.settings.enableUsageTracking) {
                        await trackUsage(previewData.modeKey, previewData.originalText.length, previewData.previewText.length);
                    }
                    
                    if (previewData.settings.enableUndo) {
                        storeForUndo(previewData.tabId, previewData.frameId, previewData.originalText);
                    }
                    
                    notifyUser(previewData.tabId, "Rewrite accepted", false, 1500);
                    pendingPreviews.delete(message.previewId);
                } catch (error) {
                    console.error("Preview accept failed:", error);
                }
            })();
        }
        sendResponse({ success: true });
        return true;
    }
    
    // Handle preview cancel/decline action
    if (message.action === 'previewCancel') {
        const previewData = pendingPreviews.get(message.previewId);
        if (previewData) {
            notifyUser(previewData.tabId, "Rewrite reverted", false, 1500);
            pendingPreviews.delete(message.previewId);
        }
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
        notifyUser(tab.id, "Cannot use shortcuts on this page", true);
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
            notifyUser(tab.id, "No API key configured - Click to open settings", true, 6000);
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
            notifyUser(tab.id, "Please select text first", true);
            return;
        }
        
        if (!result.isEditable) {
            notifyUser(tab.id, "Please select text in an editable field", true);
            return;
        }
        
        if (result.selectedText.length > settings.maxTextLength) {
            notifyUser(tab.id, `Text too long (max ${settings.maxTextLength} characters)`, true);
            return;
        }

        // Check rate limiting
        if (!checkRateLimit()) {
            notifyUser(tab.id, "Too many requests. Please wait a moment.", true);
            return;
        }

        const modeInfo = { type: 'builtin', key: mode };
        
        // Show progress
        const modeName = BUILT_IN_MODES[mode]?.name || mode;
        notifyUser(tab.id, `Rewriting with AI (${modeName})...`, false, 2500);

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
                
                notifyUser(tab.id, "Text rewritten successfully!", false, 2000);
            }
        } else {
            throw new Error("Empty response from AI");
        }

    } catch (error) {
        console.error(`Keyboard shortcut rewrite failed:`, error);
        const errorMsg = getUserFriendlyError(error);
        notifyUser(tab.id, errorMsg, true);
        
        // Show additional help for common errors
        if (error.message && (error.message.includes('API key') || error.message.includes('401') || error.message.includes('403'))) {
            setTimeout(() => {
                showApiKeyNotification();
            }, 2000);
        }
    }
}