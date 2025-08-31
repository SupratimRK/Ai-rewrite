// === ENHANCED CONFIGURATION ===
const CONFIG = {
    API_ENDPOINTS: {
        'gemini-2.5-flash': "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        'gemini-2.5-flash-lite-preview': "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent",
        'gemini-2.0-flash': "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        'gemini-2.0-flash-lite': "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent"
    },
    DEFAULT_MODEL: 'gemini-2.5-flash',
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
    },
    cheeky: {
        name: "Cheeky & Playful",
        description: "Witty and slightly sarcastic",
        icon: "😏",
        category: "fun"
    },
    newby: {
        name: "Beginner-Friendly",
        description: "Simple language for newcomers",
        icon: "🌱",
        category: "fun"
    },
    composer: {
        name: "Compose from Instruction",
        description: "Generate new content from prompts",
        icon: "✨",
        category: "generation"
    },
    translate: {
        name: "Translate to English",
        description: "Convert text to clear English",
        icon: "🌍",
        category: "utility"
    },
    summarize: {
        name: "Summarize Key Points",
        description: "Extract main ideas concisely",
        icon: "📝",
        category: "utility"
    },
    expand: {
        name: "Expand & Elaborate",
        description: "Add more detail and context",
        icon: "🔍",
        category: "structure"
    },
    simplify: {
        name: "Simplify & Clarify",
        description: "Make complex text easier to understand",
        icon: "🔧",
        category: "utility"
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
            'geminiApiKey', 
            'selectedModel', 
            'customModes', 
            'enabledModes',
            'maxTextLength',
            'enableUndo',
            'enableUsageTracking',
            'enableKeyboardShortcuts',
            'darkMode'
        ], (result) => {
            const defaults = {
                selectedModel: result.selectedModel || CONFIG.DEFAULT_MODEL,
                customModes: result.customModes || {},
                enabledModes: result.enabledModes || Object.keys(BUILT_IN_MODES),
                maxTextLength: result.maxTextLength || CONFIG.MAX_TEXT_LENGTH,
                enableUndo: result.enableUndo !== false,
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
        chrome.storage.sync.get(['geminiApiKey'], (result) => {
            if (!result.geminiApiKey) {
                console.log("Gemini API Key not found. User needs to configure.");
                // Show notification to configure API key
                showApiKeyNotification();
            } else {
                console.log("Gemini API Key found.");
            }
            resolve();
        });
    });
}

// Show notification when API key is not configured
function showApiKeyNotification() {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'AI Text Rewriter - Setup Required',
        message: 'Please configure your Gemini API key in the extension settings to start rewriting text.',
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
            'geminiApiKey',
            'selectedModel',
            'customModes',
            'enabledModes',
            'maxTextLength',
            'enableUndo',
            'enableUsageTracking',
            'enableKeyboardShortcuts'
        ], (result) => {
            resolve({
                geminiApiKey: result.geminiApiKey || '',
                selectedModel: result.selectedModel || CONFIG.DEFAULT_MODEL,
                customModes: result.customModes || {},
                enabledModes: result.enabledModes || Object.keys(BUILT_IN_MODES),
                maxTextLength: result.maxTextLength || CONFIG.MAX_TEXT_LENGTH,
                enableUndo: result.enableUndo !== false,
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
        const isComposer = info.menuItemId.includes('composer');
        const message = isComposer 
            ? "Please select an instruction first (e.g., 'write email asking for update')"
            : "Please select text to rewrite";
        notifyUser(tab.id, `⚠️ ${message}`, true);
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
        // Validate API key first
        if (!settings.geminiApiKey || settings.geminiApiKey.trim() === '') {
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
        const resultText = await callGeminiApiWithRetry(
            settings.geminiApiKey,
            info.selectionText,
            modeInfo,
            settings
        );

        if (resultText && resultText.trim()) {
            await injectTextIntoPage(tab.id, info.frameId || 0, resultText);
            
            if (settings.enableUsageTracking) {
                await trackUsage(modeInfo.key, info.selectionText.length, resultText.length);
            }
            
            notifyUser(tab.id, "✅ Text rewritten successfully!", false, 2000);
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

async function callGeminiApiWithRetry(apiKey, text, modeInfo, settings) {
    // Validate API key
    if (!apiKey || apiKey.trim() === '') {
        throw new Error('API key not configured - Please add your Gemini API key in settings');
    }
    
    // Basic API key format validation
    if (!apiKey.startsWith('AIza') || apiKey.length < 35) {
        throw new Error('Invalid API key format - Please check your Gemini API key in settings');
    }
    
    let lastError;
    
    for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
        try {
            console.log(`API call attempt ${attempt}/${CONFIG.MAX_RETRIES}`);
            
            const result = await callGeminiApiEnhanced(apiKey, text, modeInfo, settings);
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

async function callGeminiApiEnhanced(apiKey, text, modeInfo, settings) {
    const model = settings.selectedModel || CONFIG.DEFAULT_MODEL;
    const endpoint = CONFIG.API_ENDPOINTS[model];
    
    if (!endpoint) {
        throw new Error(`Unsupported model: ${model}`);
    }

    const prompt = await generatePrompt(text, modeInfo, settings);
    
    const requestBody = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            maxOutputTokens: 4096,
            temperature: getTemperatureForMode(modeInfo.key),
            topP: 0.8,
            topK: 40
        },
        safetySettings: [
            {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_HATE_SPEECH", 
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
        ]
    };

    console.log(`Sending request to Gemini (${model})...`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

    try {
        const response = await fetch(`${endpoint}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
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
        
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            let resultText = data.candidates[0].content.parts[0].text.trim();
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
    const baseInstruction = `IMPORTANT: Respond with ONLY the final text result. No explanations, no markdown formatting, no bullet points, no preambles, no quotes around the result. Just the direct text output.`;

    if (modeInfo.type === 'custom') {
        const customMode = settings.customModes[modeInfo.key];
        return `${customMode.prompt}\n\n${baseInstruction}\n\nInput text:\n"${text}"\n\nOutput:`;
    }

    // Enhanced built-in prompts with better context awareness
    const prompts = {
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
        
        marketing: `Rewrite this text as engaging marketing copy. Use persuasive language, highlight benefits, create urgency or excitement, and make it compelling for the target audience while maintaining authenticity.`,
        
        cheeky: `Rewrite this text with a playful, cheeky, and slightly sarcastic tone. Add wit and humor while keeping it appropriately irreverent. Make it entertaining while preserving the essential message.`,
        
        newby: `Rewrite this text as if written by someone new to the topic. Use simpler language, show enthusiasm and curiosity, and include the perspective of someone learning about the subject for the first time.`,
        
        composer: `Generate new content based on this instruction. Create original text that fulfills the request clearly and completely. If it's a request like "write email about...", create the full email content. If it's "ideas for...", provide a well-structured list.`,
        
        translate: `Translate this text to clear, natural English. If it's already in English, improve the clarity, natural flow, and readability while preserving the original meaning and intent.`,
        
        summarize: `Create a concise summary of this text. Extract the key points, main ideas, and essential information, presenting them clearly and briefly while maintaining the logical structure.`,
        
        expand: `Expand and elaborate on this text. Add more detail, context, examples, and explanations to make it more comprehensive and thorough while maintaining the original focus and direction.`,
        
        simplify: `Simplify this text to make it easier to understand. Use plain language, shorter sentences, common words, and clear explanations while preserving all the important information and meaning.`
    };

    const modePrompt = prompts[modeInfo.key] || prompts.humanize;
    return `${modePrompt}\n\n${baseInstruction}\n\nInput text:\n"${text}"\n\nOutput:`;
}

function getTemperatureForMode(mode) {
    const temperatures = {
        grammar: 0.7,
        professional: 0.8,
        technical: 0.8,
        academic: 0.8,
        polite: 0.9,
        translate: 0.9,
        summarize: 0.9,
        simplify: 0.9,
        humanize: 1.0,
        casual: 1.0,
        confident: 1.0,
        empathetic: 1.0,
        persuasive: 1.1,
        concise: 1.0,
        detailed: 1.0,
        expand: 1.1,
        marketing: 1.2,
        composer: 1.2,
        creative: 1.4,
        cheeky: 1.3,
        newby: 1.2
    };
    return temperatures[mode] || 1.2;
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
    if (!['composer', 'summarize', 'detailed'].includes(mode)) {
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

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openSettings') {
        chrome.runtime.openOptionsPage();
    }
});

// === KEYBOARD SHORTCUTS ===
chrome.commands.onCommand.addListener(async (command) => {
    const settings = await getSettings();
    
    if (!settings.enableKeyboardShortcuts) {
        return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!isValidTab(tab)) {
        return;
    }

    switch (command) {
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
    }
});

async function executeShortcutRewrite(tab, mode) {
    try {
        // Get settings first to check API key
        const settings = await getSettings();
        
        // Validate API key first
        if (!settings.geminiApiKey || settings.geminiApiKey.trim() === '') {
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
        const resultText = await callGeminiApiWithRetry(
            settings.geminiApiKey,
            result.selectedText,
            modeInfo,
            settings
        );

        if (resultText && resultText.trim()) {
            await injectTextIntoPage(tab.id, 0, resultText);
            
            if (settings.enableUsageTracking) {
                await trackUsage(mode, result.selectedText.length, resultText.length);
            }
            
            notifyUser(tab.id, "✅ Text rewritten successfully!", false, 2000);
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