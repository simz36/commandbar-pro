// Check if URL matches any excluded pattern
function isUrlExcluded(url, patterns) {
  if (!patterns || patterns.length === 0) return false;
  return patterns.some(pattern => {
    try {
      return new RegExp(pattern).test(url);
    } catch (e) {
      return false;
    }
  });
}

// Service Worker for CommandBar Pro
chrome.runtime.onInstalled.addListener((details) => {
  // Open the options page on install
  if (details.reason === 'install') {
    chrome.runtime.openOptionsPage();
  }
  
  // LOAD ULTRA CACHE on install
  loadUltraCache();
  
  // Re-check ULTRA cache every 5 minutes to ensure it stays loaded and valid
  setInterval(async () => {
    if ((!ULTRA_CACHE.state.isLoaded || !ULTRA_CACHE.state.integrityValid) && !ULTRA_CACHE.state.isLoading) {
      console.log('🔄 Auto-check: ULTRA cache not loaded or invalid, loading...');
      await loadUltraCache();
    }
  }, 5 * 60 * 1000); // 5 minutes
});

// Load ULTRA cache on extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('CommandBar started');
  
  // LOAD ULTRA CACHE on startup
  loadUltraCache();
  
  // Re-check ULTRA cache every 5 minutes to ensure it stays loaded and valid
  setInterval(async () => {
    if ((!ULTRA_CACHE.state.isLoaded || !ULTRA_CACHE.state.integrityValid) && !ULTRA_CACHE.state.isLoading) {
      console.log('🔄 Auto-check: ULTRA cache not loaded or invalid, loading...');
      await loadUltraCache();
    }
  }, 5 * 60 * 1000); // 5 minutes
});

// Auto-update ULTRA cache on page visits
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    updateUltraCache(tab.url, tab.title || '');
  }
});

// Track options-page usage
async function trackOptionsPageOpened() {
  try {
    // Check whether the user has stats enabled
    const { storeUsageStats } = await chrome.storage.sync.get(['storeUsageStats']);
    
    if (storeUsageStats === true) {
      const result = await chrome.storage.local.get(['usage_stats']);
      const stats = result.usage_stats || {};
      const today = new Date().toDateString();
      
      if (!stats[today]) {
        stats[today] = {};
      }
      
      stats[today]['options_page_opened'] = (stats[today]['options_page_opened'] || 0) + 1;
      
      await chrome.storage.local.set({ usage_stats: stats });
    }
  } catch (error) {
    console.error('Error tracking options page:', error);
  }
}

// Generic usage tracking function
async function trackUsage(action, details = {}) {
  try {
    // Check whether the user has stats enabled
    const { storeUsageStats } = await chrome.storage.sync.get(['storeUsageStats']);
    
    if (storeUsageStats === true) {
      const result = await chrome.storage.local.get(['usage_stats']);
      const stats = result.usage_stats || {};
      const today = new Date().toDateString();
      
      if (!stats[today]) {
        stats[today] = {};
      }
      
      // Increment action counter
      stats[today][action] = (stats[today][action] || 0) + 1;
      
      // Add specific details if provided
      if (Object.keys(details).length > 0) {
        const detailsKey = `${action}_details`;
        if (!stats[today][detailsKey]) {
          stats[today][detailsKey] = {};
        }
        
        Object.entries(details).forEach(([key, value]) => {
          stats[today][detailsKey][key] = (stats[today][detailsKey][key] || 0) + 1;
        });
      }
      
      await chrome.storage.local.set({ usage_stats: stats });
    }
  } catch (error) {
    console.error('Error tracking usage:', error);
  }
}

// Forced injection helper for problematic sites
async function forceInjectCommandBar(tabId, action = 'toggle_commandbar', currentUrl = null) {
  try {
    
    // Verify the tab is accessible
    const tab = await chrome.tabs.get(tabId);
    
    // Check if URL is in excluded websites list
    const { excludedWebsites } = await chrome.storage.sync.get(['excludedWebsites']);
    if (tab.url && isUrlExcluded(tab.url, excludedWebsites)) {
      return false;
    }

    // NEW LOGIC: allow injection on our own extension pages
    const isOurExtensionPage = tab.url?.includes(chrome.runtime.id) && tab.url?.includes('new_tab.html');
    
    // If it's our page, no injection needed — it's self-sufficient
    if (isOurExtensionPage) {
      return true; // Report success since the page handles itself
    }
    
    // Skip injection on Chrome internal pages (EXCEPT ours)
    if ((tab.url?.startsWith('chrome://') || 
         tab.url?.startsWith('chrome-extension://') || 
         tab.url?.startsWith('edge://') ||
         tab.url?.startsWith('devtools://')) && !isOurExtensionPage) {
      return false;
    }
    
    
    // STEP 1: Inject i18n.js first
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['i18n.js']
      });
    } catch (error) {
      console.error('Error injecting i18n.js:', error.message);
    }
    
    // STEP 2: Inject styles.css
    try {
      await chrome.scripting.insertCSS({
        target: { tabId: tabId },
        files: ['styles.css']
      });
    } catch (error) {
      console.error('Error injecting styles.css:', error.message);
    }
    
    // STEP 3: Inject the full content.js
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
    } catch (error) {
      console.error('Error injecting content.js:', error.message);
    }
    
    // STEP 4: Wait briefly and activate CommandBar
    setTimeout(async () => {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: function(action, currentUrl) {
            
            // Verify CommandBar functions are available
            if (typeof showCommandBar === 'function') {
              
              if (action === 'edit_current_url' && currentUrl) {
                // Clean URL for edit mode
                const cleanUrl = currentUrl.replace(/^https?:\/\/(www\.)?/, '').split('?')[0];
                showCommandBar(cleanUrl);
              } else {
                showCommandBar();
              }
              
            } else if (typeof toggleCommandBar === 'function') {
              toggleCommandBar();
            } else {
              
              // Fallback: build an improved basic version only if no other option
              
              // Check whether CommandBar already exists
              const existingBar = document.getElementById('commandbar-container') || document.getElementById('perplexity-commandbar');
              if (existingBar) {
                existingBar.remove();
              }
              
              const commandBar = document.createElement('div');
              commandBar.id = 'commandbar-container';
              commandBar.innerHTML = `
                <div style="
                  position: fixed;
                  top: 0; left: 0; right: 0; bottom: 0;
                  background: rgba(0,0,0,0.4);
                  backdrop-filter: blur(8px);
                  z-index: 999999;
                  display: flex;
                  align-items: flex-start;
                  justify-content: center;
                  padding-top: 10vh;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                ">
                  <div style="
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 32px 64px rgba(0,0,0,0.12);
                    width: 90%;
                    max-width: 640px;
                    overflow: hidden;
                    border: 1px solid rgba(0,0,0,0.1);
                  ">
                    <div style="
                      padding: 24px;
                      border-bottom: 1px solid #f0f0f0;
                      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
                    ">
                      <input type="text" 
                             id="commandbar-input" 
                             placeholder="${action === 'edit_current_url' ? 'Edit current URL...' : 'Type command, search or URL...'}"
                             value="${action === 'edit_current_url' && currentUrl ? currentUrl.replace(/^https?:\/\/(www\.)?/, '').split('?')[0] : ''}"
                             style="
                               width: 100%;
                               border: none;
                               outline: none;
                               font-size: 20px;
                               padding: 0;
                               background: transparent;
                               color: #1a1a1a;
                             ">
                    </div>
                    <div style="
                      padding: 20px;
                      color: #666;
                      font-size: 14px;
                      background: white;
                    ">
                      <div style="margin-bottom: 12px; font-weight: 600; color: #f59e0b;">⚠️ Basic compatibility mode</div>
                      <div style="margin-bottom: 12px; font-weight: 600;">⚡ Available actions:</div>
                      <div style="display: grid; gap: 6px;">
                        <div>🌐 <strong>URLs:</strong> google.com, youtube.com, github.com</div>
                        <div>🔍 <strong>Searches:</strong> pasta recipes, technology news</div>
                        <div>⌨️ <strong>Commands:</strong> /new, /bookmarks, /history, /settings</div>
                      </div>
                      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #f0f0f0; font-size: 12px; color: #888;">
                        Press <kbd style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-family: monospace;">Escape</kbd> to close
                      </div>
                    </div>
                  </div>
                </div>
              `;
              
              document.body.appendChild(commandBar);
              
              // Focus the input
              const input = document.getElementById('commandbar-input');
              if (input) {
                input.focus();
                if (action === 'edit_current_url') {
                  input.select();
                }
              }
              
              // Handle basic events
              function handleKeyDown(e) {
                if (e.key === 'Escape') {
                  commandBar.remove();
                  document.removeEventListener('keydown', handleKeyDown);
                } else if (e.key === 'Enter') {
                  const query = input.value.trim();
                  if (query) {
                    handleQuery(query, action === 'edit_current_url');
                    commandBar.remove();
                    document.removeEventListener('keydown', handleKeyDown);
                  }
                }
              }
              
              function handleQuery(query, editMode = false) {
                let url;
                
                // Detect if it's a URL
                if (query.includes('.') && !query.includes(' ')) {
                  url = query.startsWith('http') ? query : 'https://' + query;
                } else if (query.startsWith('/')) {
                  // Basic commands
                  switch (query.toLowerCase()) {
                    case '/nueva':
                    case '/new':
                      url = 'chrome://newtab/';
                      break;
                    case '/marcadores':
                    case '/bookmarks':
                      url = 'chrome://bookmarks/';
                      break;
                    case '/historial':
                    case '/history':
                      url = 'chrome://history/';
                      break;
                    case '/configuracion':
                    case '/settings':
                      url = 'chrome://settings/';
                      break;
                    default:
                      url = 'https://www.google.com/search?q=' + encodeURIComponent(query);
                  }
                } else {
                  // Web search
                  url = 'https://www.google.com/search?q=' + encodeURIComponent(query);
                }
                
                if (editMode) {
                  window.location.href = url;
                } else {
                  window.open(url, '_blank');
                }
              }
              
              document.addEventListener('keydown', handleKeyDown);
              
              // Cerrar al hacer clic fuera
              commandBar.addEventListener('click', (e) => {
                if (e.target === commandBar) {
                  commandBar.remove();
                  document.removeEventListener('keydown', handleKeyDown);
                }
              });
            }
          },
          args: [action, currentUrl]
        });
        
      } catch (activationError) {
        console.error('Error activating CommandBar after injection:', activationError);
      }
    }, 300); // Dar tiempo para que los scripts se inicialicen
    
    return true;
    
  } catch (error) {
    console.error('Error during forced injection:', error);
    return false;
  }
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'track_usage':
      trackUsage(message.usage_action, message.usage_details);
      sendResponse({ success: true });
      return true;
      
    case 'search_tabs':
      searchTabs(message.query, sendResponse);
      return true;
    
    case 'search_bookmarks':
      searchBookmarks(message.query, sendResponse);
      return true;
    
    case 'search_history':
      searchHistory(message.query, sendResponse);
      return true;
    
    case 'create_tab':
      createTab(message.url, message.active, sendResponse, message.fromCommandBar);
      return true;
    
    case 'create_window':
      createWindow(message.url, sendResponse);
      return true;
    
    case 'create_incognito_window':
      createIncognitoWindow(message.url, sendResponse);
      return true;
    
    case 'reload_tab':
      reloadTab(message.tabId, sendResponse);
      return true;
    
    case 'toggle_devtools':
      toggleDevTools(sendResponse);
      return true;
    
    case 'get_current_tab':
      getCurrentTab(sendResponse);
      return true;
    
    case 'switch_tab':
      switchToTab(message.tabId, sendResponse);
      return true;
    
    case 'close_tab':
      closeTab(message.tabId, sendResponse);
      return true;
    
    case 'pin_tab':
      pinTab(message.tabId, sendResponse);
      return true;
    
    case 'duplicate_tab':
      duplicateTab(message.tabId, sendResponse);
      return true;
    
    case 'get_all_tabs':
      getAllTabs(sendResponse);
      return true;
    
    case 'search_history_autocomplete':
      // Use ULTRA cache when available, fallback to legacy
      if (ULTRA_CACHE.state.isLoaded) {
        searchUltraCache(message.query, sendResponse);
      } else {
        searchHistoryForAutocomplete(message.query, sendResponse);
      }
      return true;
      
    case 'load_ultra_cache':
      loadUltraCache(message.forceRebuild || false, (progress) => {
        // Enviar progreso al content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { 
              action: 'ultra_cache_progress', 
              progress: progress 
            }).catch(() => {}); // Ignore errors if the tab is unavailable
          }
        });
      }).then(sendResponse);
      return true;
      
    case 'get_ultra_cache_info':
      // Validate integrity before sending info
      const integrity = validateUltraCacheIntegrity();
      
      // Debug: log detailed info to the console
      console.log('🔍 Debug Cache ULTRA Info:', {
        state: ULTRA_CACHE.state,
        memory: {
          historySize: ULTRA_CACHE.memory.history.size,
          domainsSize: ULTRA_CACHE.memory.domains.size,
          wordsSize: ULTRA_CACHE.memory.words.size,
          faviconsSize: ULTRA_CACHE.memory.favicons.size
        },
        integrity: integrity,
        config: ULTRA_CACHE.config
      });
      
      sendResponse({ 
        success: true, 
        cacheInfo: {
          ...ULTRA_CACHE.state,
          integrityValid: integrity.valid,
          loadQuality: ULTRA_CACHE.state.loadQuality,
          integrityDetails: integrity
        },
        config: ULTRA_CACHE.config
      });
      return true;
      
    case 'clear_ultra_cache':
      ULTRA_CACHE.memory.history.clear();
      ULTRA_CACHE.memory.favicons.clear();
      ULTRA_CACHE.memory.domains.clear();
      ULTRA_CACHE.memory.words.clear();
      ULTRA_CACHE.state.isLoaded = false;
      ULTRA_CACHE.state.totalUrls = 0;
      ULTRA_CACHE.state.totalDomains = 0;
      ULTRA_CACHE.state.totalFavicons = 0;
      chrome.storage.local.remove([
        'ultra_cache_history',
        'ultra_cache_favicons',
        'ultra_cache_state',
        'ultra_cache_config'
      ]).then(() => {
        sendResponse({ success: true, message: 'Cache ULTRA limpiado' });
      });
      return true;
      
    case 'rebuild_global_cache':
      // This legacy function is unused; redirect to ULTRA cache
      loadUltraCache(true, (progress) => {
        // Enviar progreso al content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { 
              action: 'cache_progress', 
              progress: progress 
            }).catch(() => {}); // Ignore errors if the tab is unavailable
          }
        });
      }).then(sendResponse);
      return true;
      
    case 'get_cache_info':
      getGlobalCacheInfo().then(sendResponse);
      return true;
      
    case 'get_top_domains':
      getTopDomains(message.limit || 20).then(sendResponse);
      return true;
      
    case 'clear_global_cache':
      clearGlobalCache().then(sendResponse);
      return true;
      
    case 'request_commandbar_open':
      // Direct request from our extension page
      if (sender.tab?.id) {
        setTimeout(async () => {
          try {
            await chrome.tabs.sendMessage(sender.tab.id, { action: 'toggle_commandbar' });
          } catch (error) {
            await forceInjectCommandBar(sender.tab.id, 'toggle_commandbar');
          }
        }, 100);
      }
      sendResponse({ success: true });
      return true;
  }
});

// Search tabs
async function searchTabs(query, sendResponse) {
  try {
    const tabs = await chrome.tabs.query({});
    const filteredTabs = tabs.filter(tab => 
      tab.title.toLowerCase().includes(query.toLowerCase()) ||
      tab.url.toLowerCase().includes(query.toLowerCase())
    );
    sendResponse({ success: true, tabs: filteredTabs });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Search bookmarks
async function searchBookmarks(query, sendResponse) {
  try {
    const bookmarks = await chrome.bookmarks.search(query);
    sendResponse({ success: true, bookmarks });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Search history
async function searchHistory(query, sendResponse) {
  try {
    const history = await chrome.history.search({
      text: query,
      maxResults: 500,
      startTime: 0
    });
    const seen = new Set();
    const deduped = history.filter(item => {
      if (seen.has(item.title)) return false;
      seen.add(item.title);
      return true;
    }).slice(0, 20);
    const historyWithFavicons = await Promise.all(deduped.map(async item => {
      try {
        const domain = new URL(item.url).hostname;
        const cached = getCachedFavicon(domain);
        const favicon = cached || await cacheFavicon(domain) || '';
        return { ...item, favicon };
      } catch {
        return { ...item, favicon: '' };
      }
    }));
    sendResponse({ success: true, history: historyWithFavicons });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Create a new tab
async function createTab(url, active = true, sendResponse, fromCommandBar = false) {
  try {
    const tab = await chrome.tabs.create({ url, active });
    
    // If the tab was created by CommandBar, mark it to avoid auto-open
    if (fromCommandBar) {
      commandBarCreatedTabs.add(tab.id);
      
      // Clear the mark after 10 seconds (enough time for the tab to load)
      setTimeout(() => {
        commandBarCreatedTabs.delete(tab.id);
      }, 10000);
    }
    
    sendResponse({ success: true, tab });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Create a new window
async function createWindow(url, sendResponse) {
  try {
    const window = await chrome.windows.create({ url });
    sendResponse({ success: true, window });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Create a new window de incognito
async function createIncognitoWindow(url, sendResponse) {
  try {
    const window = await chrome.windows.create({ 
      url, 
      incognito: true 
    });
    sendResponse({ success: true, window });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Reload tab
async function reloadTab(tabId, sendResponse) {
  try {
    await chrome.tabs.reload(tabId);
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Alternar herramientas de desarrollador
async function toggleDevTools(sendResponse) {
  try {
    const currentTab = await chrome.tabs.query({ active: true, currentWindow: true });
    if (currentTab[0]) {
      await chrome.tabs.sendMessage(currentTab[0].id, { action: 'toggle_devtools' });
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'No active tab found' });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Get the current tab
async function getCurrentTab(sendResponse) {
  try {
    const currentTab = await chrome.tabs.query({ active: true, currentWindow: true });
    if (currentTab[0]) {
      sendResponse({ success: true, tabId: currentTab[0].id });
    } else {
      sendResponse({ success: false, error: 'No active tab found' });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Switch to tab
async function switchToTab(tabId, sendResponse) {
  try {
    await chrome.tabs.update(tabId, { active: true });
    const tab = await chrome.tabs.get(tabId);
    await chrome.windows.update(tab.windowId, { focused: true });
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Close tab
async function closeTab(tabId, sendResponse) {
  try {
    await chrome.tabs.remove(tabId);
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Pin/unpin tab
async function pinTab(tabId, sendResponse) {
  try {
    const tab = await chrome.tabs.get(tabId);
    await chrome.tabs.update(tabId, { pinned: !tab.pinned });
    sendResponse({ success: true, pinned: !tab.pinned });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Duplicate tab
async function duplicateTab(tabId, sendResponse) {
  try {
    const tab = await chrome.tabs.duplicate(tabId);
    sendResponse({ success: true, tab });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Get all tabs
async function getAllTabs(sendResponse) {
  try {
    const tabs = await chrome.tabs.query({});
    sendResponse({ success: true, tabs });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// CACHE ULTRA - Sistema de cache permanente y completo
const ULTRA_CACHE = {
  // In-memory cache for fast access
  memory: {
    history: new Map(),
    favicons: new Map(),
    domains: new Map(),
    words: new Map()
  },
  
  // Estado del cache
  state: {
    isLoaded: false,
    isLoading: false,
    lastUpdate: 0,
    totalUrls: 0,
    totalDomains: 0,
    totalFavicons: 0,
    memoryUsage: 0,
    integrityValid: false,     // New: integrity validation
    loadQuality: 'none'        // Nueva: calidad de carga (none, partial, full)
  },
  
  // Configuration
  config: {
    maxHistoryResults: 100000, // 100,000 URLs max
    faviconCacheSize: 1000,    // 1,000 favicons max
    autoUpdate: true,          // Auto-update
    persistent: true,          // Cache persistente
    minUrlsForValidCache: 100,  // Reduced: minimum URLs for a valid cache (more lenient)
    maxStorageSize: 50 * 1024 * 1024 // New: 50MB storage limit
  }
};

// Constantes para compatibilidad (ya no se usan, pero mantener por si acaso)
const MAX_HISTORY_RESULTS = 1000; // Max history entries to query

// Validate ULTRA cache integrity
function validateUltraCacheIntegrity() {
  try {
    const historySize = ULTRA_CACHE.memory.history.size;
    const domainsSize = ULTRA_CACHE.memory.domains.size;
    const wordsSize = ULTRA_CACHE.memory.words.size;
    const faviconsSize = ULTRA_CACHE.memory.favicons.size;
    
    // Check minimum URL count (more lenient)
    const hasMinUrls = historySize >= Math.min(ULTRA_CACHE.config.minUrlsForValidCache, 100); // At least 100 URLs
    
    // Ensure indexes are built (more lenient)
    const hasIndexes = domainsSize > 0; // Solo requiere dominios, no palabras
    
    // Ensure no corrupt data (more lenient)
    const hasValidData = historySize > 0; // Solo requiere que haya datos
    
    // Determinar calidad de carga
    let loadQuality = 'none';
    if (historySize >= ULTRA_CACHE.config.maxHistoryResults * 0.8) {
      loadQuality = 'full';
    } else if (historySize >= ULTRA_CACHE.config.minUrlsForValidCache) {
      loadQuality = 'partial';
    } else if (historySize >= 100) {
      loadQuality = 'minimal'; // New category for small but valid caches
    }
    
    // More lenient validation: accept caches with at least 100 URLs and indexed domains
    const integrityValid = hasMinUrls && hasIndexes && hasValidData;
    
    // Actualizar estado
    ULTRA_CACHE.state.integrityValid = integrityValid;
    ULTRA_CACHE.state.loadQuality = loadQuality;
    
    console.log(`🔍 ULTRA integrity validation:`, {
      historySize,
      domainsSize,
      wordsSize,
      faviconsSize,
      hasMinUrls: `${hasMinUrls} (${historySize} >= ${Math.min(ULTRA_CACHE.config.minUrlsForValidCache, 100)})`,
      hasIndexes: `${hasIndexes} (domains: ${domainsSize}, words: ${wordsSize})`,
      hasValidData: `${hasValidData} (history > 0)`,
      integrityValid,
      loadQuality,
      stateTotalUrls: ULTRA_CACHE.state.totalUrls,
      stateTotalDomains: ULTRA_CACHE.state.totalDomains
    });
    
    return {
      valid: integrityValid,
      quality: loadQuality,
      stats: {
        historySize,
        domainsSize,
        wordsSize,
        faviconsSize
      },
      details: {
        hasMinUrls,
        hasIndexes,
        hasValidData,
        minRequired: Math.min(ULTRA_CACHE.config.minUrlsForValidCache, 100)
      }
    };
    
  } catch (error) {
    console.error('❌ Error validating ULTRA cache integrity:', error);
    ULTRA_CACHE.state.integrityValid = false;
    ULTRA_CACHE.state.loadQuality = 'none';
    return { valid: false, quality: 'none', error: error.message };
  }
}

// CARGAR CACHE ULTRA desde storage persistente
async function loadUltraCacheFromStorage() {
  try {
    console.log('🔄 Loading ULTRA cache from storage...');
    
    const result = await chrome.storage.local.get([
      'ultra_cache_history',
      'ultra_cache_favicons', 
      'ultra_cache_state',
      'ultra_cache_config'
    ]);
    
    // Load configuration
    if (result.ultra_cache_config) {
      Object.assign(ULTRA_CACHE.config, result.ultra_cache_config);
    }
    
    // Load state
    if (result.ultra_cache_state) {
      Object.assign(ULTRA_CACHE.state, result.ultra_cache_state);
    }
    
    // Load history
    if (result.ultra_cache_history) {
      ULTRA_CACHE.memory.history = new Map(result.ultra_cache_history);
      console.log(`📊 ULTRA cache loaded: ${ULTRA_CACHE.memory.history.size} URLs`);
    }
    
    // Load favicons
    if (result.ultra_cache_favicons) {
      ULTRA_CACHE.memory.favicons = new Map(result.ultra_cache_favicons);
      console.log(`🎨 Favicons loaded: ${ULTRA_CACHE.memory.favicons.size}`);
    }
    
    // Rebuild indexes
    rebuildUltraCacheIndexes();
    
    // VALIDATE INTEGRITY of the loaded cache
    const integrity = validateUltraCacheIntegrity();
    
    if (integrity.valid) {
      ULTRA_CACHE.state.isLoaded = true;
      console.log(`✅ ULTRA cache loaded from storage (${integrity.quality} quality)`);
      return true;
    } else {
      console.warn(`⚠️ ULTRA cache loaded but integrity invalid:`, integrity);
      ULTRA_CACHE.state.isLoaded = false;
      ULTRA_CACHE.state.integrityValid = false;
      return false; // Forzar recarga completa
    }
    
  } catch (error) {
    console.error('❌ Error loading ULTRA cache:', error);
    ULTRA_CACHE.state.isLoaded = false;
    ULTRA_CACHE.state.integrityValid = false;
    return false;
  }
}

// GUARDAR CACHE ULTRA en storage persistente
async function saveUltraCacheToStorage() {
  try {
    const data = {
      ultra_cache_history: Array.from(ULTRA_CACHE.memory.history.entries()),
      ultra_cache_favicons: Array.from(ULTRA_CACHE.memory.favicons.entries()),
      ultra_cache_state: ULTRA_CACHE.state,
      ultra_cache_config: ULTRA_CACHE.config
    };
    
    await chrome.storage.local.set(data);
    console.log('💾 Cache ULTRA guardado en storage');
    
  } catch (error) {
    console.error('❌ Error saving ULTRA cache:', error);
  }
}

// CACHEAR FAVICON de un dominio
async function cacheFavicon(domain) {
  try {
    // Check whether already cached
    if (ULTRA_CACHE.memory.favicons.has(domain)) {
      return ULTRA_CACHE.memory.favicons.get(domain);
    }
    
    // Trim favicon cache if it's too large
    if (ULTRA_CACHE.memory.favicons.size >= ULTRA_CACHE.config.faviconCacheSize) {
      const entries = Array.from(ULTRA_CACHE.memory.favicons.entries());
      const oldestEntries = entries.slice(0, 100); // Drop the 100 oldest
      oldestEntries.forEach(([key]) => ULTRA_CACHE.memory.favicons.delete(key));
    }
    
    // URL del favicon
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    
    // Descargar favicon
    const response = await fetch(faviconUrl);
    if (response.ok) {
      const blob = await response.blob();
      const reader = new FileReader();
      
      return new Promise((resolve) => {
        reader.onload = () => {
          const base64 = reader.result;
          
          // Save to cache
          ULTRA_CACHE.memory.favicons.set(domain, {
            url: faviconUrl,
            data: base64,
            timestamp: Date.now()
          });
          
          ULTRA_CACHE.state.totalFavicons = ULTRA_CACHE.memory.favicons.size;
          
          // Save to storage (async)
          saveUltraCacheToStorage();
          
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      });
    }
    
    return null;
    
  } catch (error) {
    console.warn(`Error cacheando favicon para ${domain}:`, error);
    return null;
  }
}

// OBTENER FAVICON cacheado
function getCachedFavicon(domain) {
  const cached = ULTRA_CACHE.memory.favicons.get(domain);
  if (cached) {
    return cached.data;
  }
  
  // If not cached, start background caching
  cacheFavicon(domain);
  return null;
}

// REBUILD ULTRA cache INDEXES
function rebuildUltraCacheIndexes() {
  ULTRA_CACHE.memory.domains.clear();
  ULTRA_CACHE.memory.words.clear();
  
  let domainCount = 0;
  let wordCount = 0;
  
  for (const [url, item] of ULTRA_CACHE.memory.history) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      
      // Indexar por dominio
      if (!ULTRA_CACHE.memory.domains.has(domain)) {
        ULTRA_CACHE.memory.domains.set(domain, []);
        domainCount++;
      }
      ULTRA_CACHE.memory.domains.get(domain).push(item);
      
      // Index by title words
      const titleWords = item.title.toLowerCase().split(/\s+/);
      titleWords.forEach(word => {
        if (word.length > 2 && word.length < 20) {
          if (!ULTRA_CACHE.memory.words.has(word)) {
            ULTRA_CACHE.memory.words.set(word, []);
            wordCount++;
          }
          ULTRA_CACHE.memory.words.get(word).push(item);
        }
      });
      
    } catch (e) {
      // Ignorar URLs malformadas
    }
  }
  
  ULTRA_CACHE.state.totalDomains = domainCount;
  console.log(`🔍 Indexes rebuilt: ${domainCount} domains, ${wordCount} words`);
  
  // Validate integrity after rebuilding indexes
  validateUltraCacheIntegrity();
}

// LOAD ULTRA CACHE — main function
async function loadUltraCache(forceRebuild = false, progressCallback = null) {
  // ALWAYS try to load if not loaded, even when loading
  if (ULTRA_CACHE.state.isLoaded && !forceRebuild) {
    return { success: true, message: 'ULTRA cache already loaded' };
  }
  
  // If loading, wait briefly and re-check
  if (ULTRA_CACHE.state.isLoading) {
    console.log('⏳ ULTRA cache already loading, waiting...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check whether it loaded while we were waiting
    if (ULTRA_CACHE.state.isLoaded) {
      return { success: true, message: 'ULTRA cache loaded while waiting' };
    }
  }
  
  ULTRA_CACHE.state.isLoading = true;
  
  try {
    if (progressCallback) progressCallback('🔄 Iniciando carga del cache ULTRA...');
    console.log('🔄 Loading ULTRA cache...');
    
    // Intentar cargar desde storage primero
    if (!forceRebuild) {
      const loaded = await loadUltraCacheFromStorage();
      if (loaded && ULTRA_CACHE.state.integrityValid) {
        const quality = ULTRA_CACHE.state.loadQuality;
        const message = quality === 'full' ? 'ULTRA cache loaded from storage (full)' :
                       quality === 'partial' ? 'ULTRA cache loaded from storage (partial)' :
                       'ULTRA cache loaded from storage';
        
        if (progressCallback) progressCallback(`✅ ${message}`);
        ULTRA_CACHE.state.isLoading = false;
        return { success: true, message, quality };
      } else if (loaded && !ULTRA_CACHE.state.integrityValid) {
        console.log('🔄 Cache loaded but integrity invalid, rebuilding...');
        if (progressCallback) progressCallback('🔄 Cache corrupto, reconstruyendo...');
      }
    }
    
    // Clear cache on forced rebuild
    if (forceRebuild) {
      ULTRA_CACHE.memory.history.clear();
      ULTRA_CACHE.memory.favicons.clear();
      ULTRA_CACHE.state.isLoaded = false;
      if (progressCallback) progressCallback('🧹 Cache cleared, starting rebuild...');
    }
    
    // Load ALL available history
    if (progressCallback) progressCallback('📚 Consultando historial completo de Chrome...');
    const history = await chrome.history.search({
      text: '', // Search everything
      maxResults: ULTRA_CACHE.config.maxHistoryResults // 100,000 URLs
    });
    
    if (progressCallback) progressCallback(`📊 Encontradas ${history.length} URLs en el historial`);
    console.log(`📊 Cache ULTRA: ${history.length} URLs encontradas`);
    
    let processedCount = 0;
    let faviconCount = 0;
    
    // Procesar cada URL del historial
    for (let i = 0; i < history.length; i++) {
      const item = history[i];
      
      try {
        const url = item.url;
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace('www.', '');
        
        // Save to history cache
        ULTRA_CACHE.memory.history.set(url, {
          url: url,
          title: item.title,
          lastVisitTime: item.lastVisitTime,
          visitCount: item.visitCount,
          domain: domain
        });
        
        // Cachear favicon en background
        if (!ULTRA_CACHE.memory.favicons.has(domain)) {
          cacheFavicon(domain).then(() => {
            faviconCount++;
          });
        }
        
        processedCount++;
        
        // Reportar progreso cada 1000 items
        if (i % 1000 === 0 && progressCallback) {
          progressCallback(`⚡ Procesando... ${processedCount}/${history.length} URLs`);
        }
        
      } catch (e) {
        console.warn('URL malformada ignorada:', item.url);
      }
    }
    
    // Rebuild indexes
    if (progressCallback) progressCallback('🔍 Rebuilding indexes...');
    rebuildUltraCacheIndexes();
    
    // Actualizar estado
    ULTRA_CACHE.state.lastUpdate = Date.now();
    ULTRA_CACHE.state.totalUrls = processedCount;
    ULTRA_CACHE.state.memoryUsage = ULTRA_CACHE.memory.history.size * 0.001; // Estimate in MB
    
    // VALIDATE INTEGRITY before marking loaded
    const integrity = validateUltraCacheIntegrity();
    
    if (integrity.valid) {
      ULTRA_CACHE.state.isLoaded = true;
      
      // Save to storage
      if (progressCallback) progressCallback('💾 Guardando cache en storage...');
      await saveUltraCacheToStorage();
      
      const quality = ULTRA_CACHE.state.loadQuality;
      const qualityText = quality === 'full' ? ' (completo)' : quality === 'partial' ? ' (parcial)' : '';
      
      if (progressCallback) {
        progressCallback(`✅ ULTRA cache loaded successfully${qualityText}!\n📊 ${processedCount} URLs processed\n🌐 ${ULTRA_CACHE.state.totalDomains} unique domains\n🎨 Cached favicons: ${ULTRA_CACHE.memory.favicons.size}`);
      }
      
      console.log(`✅ ULTRA cache loaded successfully (${quality})`, ULTRA_CACHE.state);
      
      return { success: true, stats: ULTRA_CACHE.state, quality };
    } else {
      console.error('❌ ULTRA cache loaded but integrity invalid:', integrity);
      ULTRA_CACHE.state.isLoaded = false;
      ULTRA_CACHE.state.integrityValid = false;
      
      const errorDetails = `Invalid integrity: URLs=${integrity.stats.historySize}, Domains=${integrity.stats.domainsSize}, Minimum required=${integrity.details.minRequired}`;
      
      if (progressCallback) {
        progressCallback(`❌ Error: Cache loaded but integrity invalid\n📊 ${processedCount} URLs processed\n🔍 ${errorDetails}`);
      }
      
      return { success: false, error: errorDetails, stats: ULTRA_CACHE.state, integrity };
    }
    
  } catch (error) {
    console.error('❌ Error loading ULTRA cache:', error);
    if (progressCallback) progressCallback(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  } finally {
    ULTRA_CACHE.state.isLoading = false;
  }
}

// Legacy function removed — ULTRA cache is used exclusively now

// UPDATE ULTRA CACHE on new page visits
async function updateUltraCache(url, title) {
  if (!ULTRA_CACHE.state.isLoaded) {
    return; // Don't update when not loaded
  }
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    // Check if already in cache
    const existingItem = ULTRA_CACHE.memory.history.get(url);
    
    if (existingItem) {
      // Actualizar item existente
      existingItem.lastVisitTime = Date.now();
      existingItem.visitCount = (existingItem.visitCount || 0) + 1;
      existingItem.title = title;
    } else {
      // Add new entry to cache
      const newItem = {
        url: url,
        title: title,
        lastVisitTime: Date.now(),
        visitCount: 1,
        domain: domain
      };
      
      ULTRA_CACHE.memory.history.set(url, newItem);
      
      // Update indexes
      if (!ULTRA_CACHE.memory.domains.has(domain)) {
        ULTRA_CACHE.memory.domains.set(domain, []);
        ULTRA_CACHE.state.totalDomains++;
      }
      ULTRA_CACHE.memory.domains.get(domain).push(newItem);
      
      // Index by title keywords
      const titleWords = title.toLowerCase().split(/\s+/);
      titleWords.forEach(word => {
        if (word.length > 2 && word.length < 20) {
          if (!ULTRA_CACHE.memory.words.has(word)) {
            ULTRA_CACHE.memory.words.set(word, []);
          }
          ULTRA_CACHE.memory.words.get(word).push(newItem);
        }
      });
      
      // Cachear favicon en background
      if (!ULTRA_CACHE.memory.favicons.has(domain)) {
        cacheFavicon(domain);
      }
      
      ULTRA_CACHE.state.totalUrls++;
      ULTRA_CACHE.state.lastUpdate = Date.now();
      
      // Validate integrity after updating
      validateUltraCacheIntegrity();
      
      console.log(`📝 Cache ULTRA actualizado: ${domain}`);
    }
    
    // Save to storage every 10 updates
    if (ULTRA_CACHE.state.totalUrls % 10 === 0) {
      saveUltraCacheToStorage();
    }
    
  } catch (error) {
    console.error('Error actualizando cache ULTRA:', error);
  }
}

// UPDATE GLOBAL CACHE on new page visits (LEGACY)
async function updateGlobalHistoryCache(url, title) {
  if (!isGlobalCacheLoaded) {
    return; // Don't update when not loaded
  }
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    // Look up in the cache
    const existingItems = globalHistoryCache.get(domain) || [];
    const existingUrl = existingItems.find(item => item.url === url);
    
    if (!existingUrl) {
      // Add new entry to cache
      const newItem = {
        url: url,
        title: title,
        lastVisitTime: Date.now(),
        visitCount: 1
      };
      
      existingItems.push(newItem);
      globalHistoryCache.set(domain, existingItems);
      
      // Also index by title keywords
      const titleWords = title.toLowerCase().split(/\s+/);
      titleWords.forEach(word => {
        if (word.length > 2) {
          if (!globalHistoryCache.has(word)) {
            globalHistoryCache.set(word, []);
          }
          globalHistoryCache.get(word).push(newItem);
        }
      });
      
      console.log(`📝 Cache global actualizado: ${domain}`);
    }
  } catch (error) {
    console.error('Error actualizando cache global:', error);
  }
}

// GET GLOBAL CACHE INFO
async function getGlobalCacheInfo() {
  try {
    const stats = await chrome.storage.local.get(['globalCacheStats', 'globalCacheLoaded', 'globalCacheTimestamp']);
    
    const cacheInfo = {
      isLoaded: isGlobalCacheLoaded,
      isLoading: globalCacheLoading,
      cacheSize: globalHistoryCache.size,
      stats: stats.globalCacheStats || null,
      lastLoaded: stats.globalCacheTimestamp || null,
      memoryUsage: globalHistoryCache.size * 0.001 // Approximate estimate in MB
    };
    
    return { success: true, cacheInfo };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// GET MOST FREQUENT DOMAINS
async function getTopDomains(limit = 20) {
  try {
    const domains = [];
    
    for (const [domain, items] of globalHistoryCache.entries()) {
      if (domain.includes('.') && !domain.includes(' ')) { // Solo dominios reales
        domains.push({
          domain: domain,
          count: items.length,
          lastVisit: Math.max(...items.map(item => item.lastVisitTime || 0))
        });
      }
    }
    
    // Ordenar por frecuencia y recencia
    domains.sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      return b.lastVisit - a.lastVisit;
    });
    
    return { success: true, domains: domains.slice(0, limit) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// LIMPIAR CACHE GLOBAL
async function clearGlobalCache() {
  try {
    globalHistoryCache.clear();
    isGlobalCacheLoaded = false;
    
    await chrome.storage.local.remove(['globalCacheStats', 'globalCacheLoaded', 'globalCacheTimestamp']);
    
    return { success: true, message: 'Cache global limpiada' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ULTRA SEARCH — main search function
async function searchUltraCache(query, sendResponse) {
  try {
    // Load ULTRA cache if not loaded or integrity invalid
    if (!ULTRA_CACHE.state.isLoaded || !ULTRA_CACHE.state.integrityValid) {
      console.log('🔄 ULTRA cache not loaded or integrity invalid, loading automatically...');
      await loadUltraCache();
      
      // Re-check after loading
      if (!ULTRA_CACHE.state.isLoaded || !ULTRA_CACHE.state.integrityValid) {
        const integrity = validateUltraCacheIntegrity();
        const errorMsg = `ULTRA cache unavailable: URLs=${integrity.stats.historySize}, Domains=${integrity.stats.domainsSize}, Valid=${integrity.valid}`;
        console.error('❌ ULTRA cache could not be loaded or validated:', errorMsg);
        sendResponse({ success: false, error: errorMsg, integrity });
        return;
      }
    }
    
    const queryLower = query.toLowerCase();
    let relevantUrls = [];
    
    // Enhanced search for short queries (1-2 chars)
    if (query.length <= 2) {
      // For short queries, search more broadly
      
      // 1. Search by exact domain
      if (ULTRA_CACHE.memory.domains.has(queryLower)) {
        relevantUrls.push(...ULTRA_CACHE.memory.domains.get(queryLower));
      }
      
      // 2. Search by domains starting with the query (high priority)
      for (const [domain, items] of ULTRA_CACHE.memory.domains.entries()) {
        if (domain.startsWith(queryLower) && domain !== queryLower) {
          relevantUrls.push(...items);
        }
      }
      
      // 3. Search by domains containing the query (for 2-char queries)
      if (query.length === 2) {
        for (const [domain, items] of ULTRA_CACHE.memory.domains.entries()) {
          if (domain.includes(queryLower) && !domain.startsWith(queryLower)) {
            relevantUrls.push(...items);
          }
        }
      }
      
      // 4. Search by title keywords (only 2+ char words)
      for (const [word, items] of ULTRA_CACHE.memory.words.entries()) {
        if (word.startsWith(queryLower) && word.length >= 2) {
          relevantUrls.push(...items);
        }
      }
      
    } else {
      // For longer queries, use normal logic
      
      // Search by exact domain
      if (ULTRA_CACHE.memory.domains.has(queryLower)) {
        relevantUrls.push(...ULTRA_CACHE.memory.domains.get(queryLower));
      }
      
      // Search by domains starting with the query
      for (const [domain, items] of ULTRA_CACHE.memory.domains.entries()) {
        if (domain.startsWith(queryLower) && domain !== queryLower) {
          relevantUrls.push(...items);
        }
      }
      
      // Search by title keywords
      for (const [word, items] of ULTRA_CACHE.memory.words.entries()) {
        if (word.startsWith(queryLower) && word.length > 2) {
          relevantUrls.push(...items);
        }
      }
    }
    
    // Eliminar duplicados
    const seen = new Set();
    relevantUrls = relevantUrls.filter(item => {
      if (seen.has(item.url)) {
        return false;
      }
      seen.add(item.url);
      return true;
    });
    
    // Ordenar por relevancia con algoritmo mejorado para queries cortas
    relevantUrls.sort((a, b) => {
      const queryLower = query.toLowerCase();
      
      // Top priority: exact domain match
      const domainA = a.domain || '';
      const domainB = b.domain || '';
      const exactMatchA = domainA.startsWith(queryLower);
      const exactMatchB = domainB.startsWith(queryLower);
      
      if (exactMatchA && !exactMatchB) return -1;
      if (!exactMatchA && exactMatchB) return 1;
      
      // Para queries cortas, priorizar recencia sobre frecuencia
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      const recencyScoreA = Math.max(0, 1 - ((now - a.lastVisitTime) / (30 * dayInMs)));
      const recencyScoreB = Math.max(0, 1 - ((now - b.lastVisitTime) / (30 * dayInMs)));
      
      const freqScoreA = Math.log(a.visitCount + 1);
      const freqScoreB = Math.log(b.visitCount + 1);
      
      let scoreA, scoreB;
      
      if (query.length <= 2) {
        // Para queries cortas: 60% recencia, 40% frecuencia
        scoreA = (recencyScoreA * 0.6) + (freqScoreA * 0.4);
        scoreB = (recencyScoreB * 0.6) + (freqScoreB * 0.4);
      } else {
        // Para queries largas: 30% recencia, 70% frecuencia
        scoreA = (freqScoreA * 0.7) + (recencyScoreA * 0.3);
        scoreB = (freqScoreB * 0.7) + (recencyScoreB * 0.3);
      }
      
      return scoreB - scoreA;
    });
    
    if (relevantUrls.length > 0) {
      const bestMatch = relevantUrls[0];
      let suggestion = '';
      
      // Determinar la mejor sugerencia
      const domain = bestMatch.domain || '';
      const queryLower = query.toLowerCase();
      
      if (domain.startsWith(queryLower)) {
        suggestion = domain;
      } else {
        suggestion = domain;
      }
      
      // Get cached favicon
      const favicon = getCachedFavicon(domain);
      
      const response = { 
        success: true, 
        suggestion: suggestion,
        visitCount: bestMatch.visitCount,
        lastVisit: bestMatch.lastVisitTime,
        title: bestMatch.title,
        favicon: favicon,
        cacheSource: 'ULTRA'
      };
      
      console.log(`🔍 Cache ULTRA: ${relevantUrls.length} resultados para "${query}"`);
      sendResponse(response);
    } else {
      sendResponse({ success: true, suggestion: null, cacheSource: 'ULTRA' });
    }
    
  } catch (error) {
    console.error('Error in ULTRA search:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Search history para autocompletado inteligente (CON CACHE GLOBAL) - LEGACY
async function searchHistoryForAutocomplete(query, sendResponse) {
  try {
    // USAR EXCLUSIVAMENTE CACHE ULTRA - SIEMPRE CARGADO Y PERMANENTE
    if (!ULTRA_CACHE.state.isLoaded || !ULTRA_CACHE.state.integrityValid) {
      console.log('🔄 ULTRA cache not loaded or integrity invalid, loading automatically...');
      await loadUltraCache();
    }
    
    // Use the already-optimized searchUltraCache
    await searchUltraCache(query, sendResponse);
    return;
    
    // searchUltraCache handles all search and response logic
    // No additional code needed here
  } catch (error) {
    console.error('Error en autocompletado:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Set to track tabs we created (avoid loops)
let extensionCreatedTabs = new Set();

// Set to track tabs created by CommandBar for navigation (avoid unnecessary auto-open)
let commandBarCreatedTabs = new Set();

// Check whether a tab is a valid empty new tab
function isValidNewTab(tab) {
  
  // URLs we consider "empty new tabs"
  const newTabUrls = [
    'chrome://newtab/',
    'chrome://new-tab-page/',
    'about:blank',
    'chrome://welcome/',
    'edge://newtab/'
  ];
  
  // NEW LOGIC: also consider our extension pages valid
  const isOurExtensionPage = tab.url?.includes(chrome.runtime.id) && tab.url?.includes('new_tab.html');
  
  // Verify it's a valid new-tab URL
  const isNewTabUrl = newTabUrls.some(url => tab.url?.startsWith(url)) || !tab.url || tab.url === '' || isOurExtensionPage;
  
  // Make sure it's not a special tab (EXCEPT our pages)
  const isSpecialTab = tab.url?.startsWith('chrome://') && 
                      !tab.url.includes('newtab') && 
                      !tab.url.includes('new-tab-page') &&
                      !tab.url.includes('welcome');
  
  // Extension pages are valid ONLY if they are ours
  const isExtensionTab = tab.url?.startsWith('chrome-extension://') && !isOurExtensionPage;
  
  const isDevToolsTab = tab.url?.startsWith('devtools://');
  
  const result = isNewTabUrl && !isSpecialTab && !isExtensionTab && !isDevToolsTab;
  
  return result;
}

// Auto-open CommandBar in a new tab
async function autoOpenCommandBarInNewTab(tabId, delay = 100) {
  try {
    
    // Verify the tab still exists and is active
    const tab = await chrome.tabs.get(tabId);
    if (!tab || !tab.active) {
      return; // Don't open if the tab is no longer active
    }
    
    // Verify it is still a valid new tab
    if (!isValidNewTab(tab)) {
      return; // The user already navigated away
    }
    
    
    // Esperar el delay configurado
    setTimeout(async () => {
      try {
        
        // Re-check that the tab is still valid
        const currentTab = await chrome.tabs.get(tabId);
        if (!currentTab || !currentTab.active || !isValidNewTab(currentTab)) {
          return;
        }
        
        
        // OPTIMIZATION: if it is our extension page, use simplified logic
        const isOurExtensionPage = currentTab.url?.includes(chrome.runtime.id) && currentTab.url?.includes('new_tab.html');
        
        if (isOurExtensionPage) {
          return; // Do nothing — the page handles itself
        }
        
        // Check whether it is a chrome:// page that doesn't allow content scripts
        const isChromeInternalPage = currentTab.url?.startsWith('chrome://') || 
                                   currentTab.url?.startsWith('chrome-extension://') ||
                                   currentTab.url?.startsWith('edge://');
        
        if (isChromeInternalPage) {
          
          // ALTERNATE METHOD: create a new tab with the extension page
          try {
            // Use the extension's HTML page instead of about:blank
            const extensionUrl = chrome.runtime.getURL('new_tab.html');
            const newTab = await chrome.tabs.create({ 
              url: extensionUrl, 
              active: true 
            });
            
            // IMPORTANT: mark this tab as created by us to avoid loops
            extensionCreatedTabs.add(newTab.id);
            
            // Close the original chrome:// tab
            await chrome.tabs.remove(tabId);
            
            // Wait briefly for the extension page to load
            setTimeout(async () => {
              try {
                await chrome.tabs.sendMessage(newTab.id, { action: 'toggle_commandbar' });
              } catch (error) {
                console.error('❌ Content script not yet available, trying injection...');
                const injected = await forceInjectCommandBar(newTab.id, 'toggle_commandbar');
                if (injected) {
                  // Silent success
                } else {
                  console.error('❌ Injection also failed on extension page — very unusual, retrying...');
                  
                  // Last resort: wait longer and retry
                  setTimeout(async () => {
                    try {
                      const finalInjected = await forceInjectCommandBar(newTab.id, 'toggle_commandbar');
                      if (finalInjected) {
                        // Silent success en reintento
                      } else {
                        console.error('❌ All attempts failed for extension page');
                      }
                    } catch (finalError) {
                      console.error('❌ Error en reintento final:', finalError);
                    }
                  }, 1000);
                }
                
                // Clear the mark after some time
                setTimeout(() => {
                  extensionCreatedTabs.delete(newTab.id);
                }, 5000);
              }
            }, 50); // Shorter delay for a faster transition
            
          } catch (error) {
            console.error('❌ Error creating alternative extension tab:', error);
          }
          
        } else {
          // Normal method for regular pages
          try {
            await chrome.tabs.sendMessage(tabId, { action: 'toggle_commandbar' });
          } catch (error) {
            // If the content script fails, try forced injection
            console.error('❌ Content script failed, trying forced injection:', error.message);
            const injected = await forceInjectCommandBar(tabId, 'toggle_commandbar');
            if (injected) {
              // Silent success
            } else {
              console.error('❌ Forced injection also failed');
            }
          }
        }
        
      } catch (error) {
        // The tab no longer exists or another error occurred
        console.error('❌ Error during post-delay execution:', error);
      }
    }, delay);
    
  } catch (error) {
    console.error('❌ Error checking new tab:', error);
  }
}

// Listener for newly created tabs
chrome.tabs.onCreated.addListener(async (tab) => {
  try {
    
    // PREVENT LOOP: if this tab was created by us, skip auto-open
    if (extensionCreatedTabs.has(tab.id)) {
      return;
    }
    
    // PREVENT UNNECESSARY AUTO-OPEN: if this tab was created by CommandBar for navigation, skip auto-open
    if (commandBarCreatedTabs.has(tab.id)) {
      return;
    }
    
    // Check whether the experimental feature is enabled
    let { autoOpenNewTab, autoOpenDelay } = await chrome.storage.sync.get(['autoOpenNewTab', 'autoOpenDelay']);
    
    // FIX: If values are undefined, use defaults and persist
    if (autoOpenNewTab === undefined || autoOpenDelay === undefined) {
      
      // Establecer valores por defecto
      autoOpenNewTab = autoOpenNewTab !== undefined ? autoOpenNewTab : false;
      autoOpenDelay = autoOpenDelay !== undefined ? autoOpenDelay : 100;
      
      // Save to storage para futuras referencias
      await chrome.storage.sync.set({ autoOpenNewTab, autoOpenDelay });
    }
    
    if (!autoOpenNewTab) {
      return; // Feature disabled
    }
    
    // Verify it is a valid new tab
    const isValid = isValidNewTab(tab);
    
    if (!isValid) {
      return; // Not an empty new tab
    }
    
    // Only open if the tab is active (is the current tab)
    if (!tab.active) {
      return; // Don't interfere with background tabs
    }
    
    // Auto-abrir CommandBar con el delay configurado
    const delay = autoOpenDelay || 100;
    await autoOpenCommandBarInNewTab(tab.id, delay);
    
  } catch (error) {
    console.error('❌ Error in new-tab auto-open:', error);
  }
});

// Track options-page usage (ejecutar al cargar)
trackOptionsPageOpened(); 