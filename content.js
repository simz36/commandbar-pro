// Content Script for CommandBar Pro
let commandBarContainer = null;
let isCommandBarVisible = false;
let editMode = false;
let isInitialized = false;

let userSettings = {};
let searchTimeout = null;
let searchGeneration = 0;
let autocompleteTimeout = null;
let isDeleting = false;
let lastInputLength = 0;
let isDeletingTimeout = null;
let isInDeletionMode = false;
let isAutocompletingFromTyping = false;
let isSiteExcluded = false;

async function trackUsageLocal(action, details = {}) {
  try {
    await chrome.runtime.sendMessage({
      action: 'track_usage',
      usage_action: action,
      usage_details: details
    });
  } catch (error) {
    // silent
  }
}

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

userSettings = {
  defaultSearchEngine: 'google',
  searchTabs: true,
  searchBookmarks: true,
  searchHistory: true,
  maxResults: 5,
  searchDelay: 50
};

async function loadUserSettings() {
  try {
    const settings = await chrome.storage.sync.get(['defaultSearchEngine', 'searchTabs', 'searchBookmarks', 'searchHistory', 'maxResults', 'searchDelay', 'language', 'shortcutToggleCommandbar', 'shortcutEditCurrentUrl', 'excludedWebsites']);
    userSettings.defaultSearchEngine = settings.defaultSearchEngine || 'google';
    userSettings.searchTabs = settings.searchTabs !== false;
    userSettings.searchBookmarks = settings.searchBookmarks !== false;
    userSettings.searchHistory = settings.searchHistory !== false;
    userSettings.maxResults = settings.maxResults || 5;
    userSettings.searchDelay = settings.searchDelay || 50;
    userSettings.shortcutToggleCommandbar = settings.shortcutToggleCommandbar || null;
    userSettings.shortcutEditCurrentUrl = settings.shortcutEditCurrentUrl || null;
    userSettings.language = settings.language || 'en';
    userSettings.excludedWebsites = settings.excludedWebsites || [];

    isSiteExcluded = isUrlExcluded(window.location.href, userSettings.excludedWebsites);

    if (typeof i18n !== 'undefined' && i18n && typeof i18n.setLanguage === 'function') {
      await i18n.setLanguage(userSettings.language);
    }
  } catch (error) {
    userSettings.defaultSearchEngine = 'google';
    userSettings.searchTabs = true;
    userSettings.searchBookmarks = true;
    userSettings.searchHistory = true;
    userSettings.maxResults = 5;
    userSettings.searchDelay = 50;
    userSettings.language = 'en';
  }
}

function getSearchUrl(query, engine = null) {
  const searchEngine = engine || userSettings.defaultSearchEngine;
  const encodedQuery = encodeURIComponent(query);
  
  switch (searchEngine) {
    case 'bing':
      return `https://www.bing.com/search?q=${encodedQuery}`;
    case 'duckduckgo':
      return `https://duckduckgo.com/?q=${encodedQuery}`;
    case 'yahoo':
      return `https://search.yahoo.com/search?p=${encodedQuery}`;
    case 'perplexity':
      return `https://www.perplexity.ai/?q=${encodedQuery}`;
    case 'google':
    default:
      return `https://www.google.com/search?q=${encodedQuery}`;
  }
}

// macOS detection
function isMacOS() {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

// Get the platform-aware modifier key
function getModifierKey() {
  return isMacOS() ? 'Cmd' : 'Ctrl';
}

// Get platform-aware default shortcut for a command
function getDefaultShortcut(commandId) {
  const mod = isMacOS() ? 'Meta' : 'Ctrl';
  switch (commandId) {
    case 'toggle_commandbar': return `${mod}+K`;
    case 'edit_current_url': return `${mod}+Shift+K`;
    default: return null;
  }
}

// Check if a KeyboardEvent matches a shortcut string
function eventMatchesShortcut(e, shortcutStr) {
  if (!shortcutStr) return false;
  const parts = shortcutStr.split('+');
  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);

  const needsCtrl = modifiers.includes('Ctrl');
  const needsAlt = modifiers.includes('Alt');
  const needsShift = modifiers.includes('Shift');
  const needsMeta = modifiers.includes('Meta');

  // On Mac, Ctrl and Meta are interchangeable for shortcut matching
  const isMac = isMacOS();
  if (needsCtrl || needsMeta) {
    const hasCtrlOrMeta = isMac ? (e.metaKey || e.ctrlKey) : e.ctrlKey;
    if (!hasCtrlOrMeta) return false;
  }
  if (needsAlt && !e.altKey) return false;
  if (needsShift && !e.shiftKey) return false;

  // Ensure no extra modifiers are pressed
  if (!needsCtrl && !needsMeta) {
    if (isMac ? (e.metaKey || e.ctrlKey) : e.ctrlKey) return false;
  }
  if (!needsAlt && e.altKey) return false;
  if (!needsShift && e.shiftKey) return false;

  const pressedKey = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  return pressedKey === key;
}

// Build the Command Bar structure
function createCommandBar() {
  if (commandBarContainer) return;

  // Build the main container
  commandBarContainer = document.createElement('div');
  commandBarContainer.id = 'commandbar-container';
  const modifierKey = getModifierKey();
  
  commandBarContainer.innerHTML = `
    <div class="commandbar-overlay" id="commandbar-overlay">
      <div class="commandbar-modal">
        <div class="commandbar-header">
          <input type="text" 
                 id="commandbar-input" 
                 placeholder="${i18n.t('searchPlaceholder')}"
                 autocomplete="off"
                 spellcheck="false">
          <button id="commandbar-close" class="commandbar-close-btn">✕</button>
        </div>
        <div class="commandbar-content">
          <div class="commandbar-suggestions" id="commandbar-suggestions">
            <div class="commandbar-section">
              <div class="commandbar-section-title">${i18n.t('sections.quickCommands')}</div>
              <div class="commandbar-item" data-action="new-tab">
                <span class="commandbar-icon">🆕</span>
                <span class="commandbar-text">${i18n.t('commands.newTab')}</span>
                <span class="commandbar-shortcut">${modifierKey}+T</span>
              </div>
              <div class="commandbar-item" data-action="new-window">
                <span class="commandbar-icon">🖼️</span>
                <span class="commandbar-text">${i18n.t('commands.newWindow')}</span>
                <span class="commandbar-shortcut">${modifierKey}+N</span>
              </div>
              <div class="commandbar-item" data-action="incognito">
                <span class="commandbar-icon">🕵️</span>
                <span class="commandbar-text">${i18n.t('commands.incognito')}</span>
                <span class="commandbar-shortcut">${modifierKey}+Shift+N</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(commandBarContainer);
  setupEventListeners();
}

// Configure event listeners
function setupEventListeners() {
  const input = document.getElementById('commandbar-input');
  const overlay = document.getElementById('commandbar-overlay');
  const closeBtn = document.getElementById('commandbar-close');
  const suggestions = document.getElementById('commandbar-suggestions');

  // Input events
  input.addEventListener('input', handleInput);
  input.addEventListener('keydown', handleKeyDown);

  // Close events
  closeBtn.addEventListener('click', hideCommandBar);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hideCommandBar();
  });

  // Suggestion clicks
  suggestions.addEventListener('click', handleSuggestionClick);
  
  // Listener para mensajes del background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggle_devtools') {
      // Alternar herramientas de desarrollador usando F12
      const event = new KeyboardEvent('keydown', {
        key: 'F12',
        code: 'F12',
        keyCode: 123,
        which: 123,
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(event);
      sendResponse({ success: true });
    }
  });
}

// Hybrid cache configuration constants
const AUTOCOMPLETE_CACHE_SIZE = 5000; // Max cache size
const AUTOCOMPLETE_CACHE_TRIM_SIZE = 2500; // Trim target size when pruning
const AUTOCOMPLETE_DEBOUNCE_MS = 50; // Debounce window for fast autocomplete

// Variables para autocompletado
let autocompleteSuggestion = '';
let autocompleteData = null;
let lastAutocompleteQuery = ''; // Para evitar autocompletados repetidos
let autocompleteCache = new Map(); // Hybrid result cache (up to 5000 entries)
let isAutocompletePending = false; // Para evitar solapamientos

// Handle input
function handleInput(e) {
  const currentLength = e.target.value.length;
  const wasDeleting = isDeleting;
  isDeleting = currentLength < lastInputLength;
  lastInputLength = currentLength;
  
  // Extend the deletion window to avoid immediate autocomplete
  if (isDeleting) {
    isInDeletionMode = true;
    clearAutocomplete(); // Clear IMMEDIATELY on deletion
    
    if (isDeletingTimeout) {
      clearTimeout(isDeletingTimeout);
    }
    // Stay blocked for 500ms (longer)
    isDeletingTimeout = setTimeout(() => {
      isDeleting = false;
      isInDeletionMode = false;
      isDeletingTimeout = null;
    }, 500);
  }
  
  // CRUCIAL: when text is selected and the user is typing, 
  // means they want to change the suggestion, not accept it
  if (e.target.selectionStart !== e.target.selectionEnd) {
    // Hay texto seleccionado (autocompletado activo)
    clearAutocomplete();
    // Let the natural input flow continue
  }
  
  // If we are mid-autocomplete and the user keeps typing
  if (isAutocompletingFromTyping) {
    isAutocompletingFromTyping = false;
    return;
  }
  
  const rawQuery = e.target.value;
  const query = rawQuery.trim();

  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (query) {
      // Use raw (untrimmed) value so keyword prefixes like "h " are detected
      performSearch(rawQuery);
      
      // Only autocomplete when NOT deleting, not starting with "/", and no keyword prefix
      const parsedForAC = parseKeywordPrefix(rawQuery);
      if (!isDeleting && !isInDeletionMode && !query.startsWith('/') && !parsedForAC.prefix && query.length >= 2) {
        // INSTANT Arc-style autocomplete
        performAutocompleteInstant(query);
      } else {
        // Clear timeout and autocomplete immediately
        if (autocompleteTimeout) {
          clearTimeout(autocompleteTimeout);
          autocompleteTimeout = null;
        }
        clearAutocomplete();
      }
      
      // Show commands when input starts with "/"
      if (query.startsWith('/')) {
        showAllCommands(query.slice(1));
      }
    } else {
      showDefaultSuggestions();
      clearAutocomplete();
    }
  }, userSettings.searchDelay); // Use the user's configuration
}

// Handle autocomplete in the input bar
function handleInputAutocomplete(query, suggestion) {
  const input = document.getElementById('commandbar-input');
  if (!input || !suggestion) return;
  
  // Check whether the query starts the suggestion
  if (suggestion.toLowerCase().startsWith(query.toLowerCase())) {
    // Calcular el texto a autocompletar
    const autocompleteText = suggestion.substring(query.length);
    
    // Establecer el valor completo
    input.value = query + autocompleteText;
    
    // Seleccionar solo la parte autocompletada
    input.setSelectionRange(query.length, suggestion.length);
    
    // Marcar que estamos en modo autocompletado
    isAutocompletingFromTyping = true;
  }
}

// Instant autocomplete using history
async function performAutocompleteInstant(query) {
  if (!query || query.length < 2) {
    clearAutocomplete();
    return;
  }
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'search_history_autocomplete',
      query: query
    });
    
    if (response && response.success && response.suggestion) {
      showArcStyleAutocomplete(query, response.suggestion, response.favicon, response.title);
    } else {
      clearAutocomplete();
    }
  } catch (error) {
    clearAutocomplete();
  }
}

// Run autocomplete
async function performAutocomplete(query) {
  try {
    // Search history for autocomplete
    const response = await chrome.runtime.sendMessage({
      action: 'search_history_autocomplete',
      query: query
    });
    
    if (response.success && response.suggestion) {
      // Autocompletar en la barra de input
      handleInputAutocomplete(query, response.suggestion);
      
      // Show suggestions inside the menu (no floating hint)
      showIntegratedSuggestions(response.favicon, response.title, response.suggestion);
    } else {
      // Clear autocomplete if no suggestions
      clearAutocomplete();
    }
  } catch (error) {
    // Error silencioso para no afectar la experiencia
    clearAutocomplete();
  }
}

// Autocompletado estilo Arc Browser
function showArcStyleAutocomplete(query, suggestion, favicon, title) {
  const input = document.getElementById('commandbar-input');
  if (!input) return;
  
  // Make sure the user is not actively typing
  const currentValue = input.value.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Only proceed if the current input matches the query
  if (!currentValue.startsWith(queryLower)) {
    return; // User kept typing — don't interfere
  }
  
  autocompleteSuggestion = suggestion;
  autocompleteData = { suggestion, favicon, title };
  
  const suggestionLower = suggestion.toLowerCase();
  
  if (suggestionLower.startsWith(queryLower) && suggestion.length > query.length) {
    // CRUCIAL: Solo autocompletar si no hay texto seleccionado y el input coincide exactamente
    if (input.selectionStart === input.selectionEnd && input.value === query) {
      // Fill input with the full suggestion
      isAutocompletingFromTyping = true;
      const cursorPosition = query.length;
      
      // Usar requestAnimationFrame para evitar conflictos con input events
      requestAnimationFrame(() => {
        // Double-check the input hasn't changed
        if (input.value === query) {
          input.value = suggestion;
          // Selecciona solo la parte autocompletada
          input.setSelectionRange(cursorPosition, suggestion.length);
        }
        isAutocompletingFromTyping = false;
      });
    }
    
    // Show visual hint with favicon (always, even without autocomplete)
    showFaviconHint(favicon, title, suggestion);
  }
}

// Show autocomplete suggestion with favicon (menu-only)
function showFaviconHint(favicon, title, url) {
  // Only show the recommendation inside the menu
  showIntegratedSuggestions(favicon, title, url);
}



// Show toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 300px;
  `;
  
  // Colors per type
  const colors = {
    success: '#10b981',
    error: '#ef4444', 
    warning: '#f59e0b',
    info: '#3b82f6'
  };
  
  toast.style.backgroundColor = colors[type] || colors.info;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Entrance animation
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 10);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}



// Clear autocomplete
function clearAutocomplete() {
  // Remove the inline autocomplete section
  const integratedSection = document.querySelector('.commandbar-section[data-type="integrated-autocomplete"]');
  if (integratedSection) {
    integratedSection.remove();
  }
}

// Periodically prune cache (avoid memory leaks)
function cleanAutocompleteCache() {
  if (autocompleteCache.size > AUTOCOMPLETE_CACHE_SIZE) {
    // Keep only the most recent entries to save memory
    const entries = Array.from(autocompleteCache.entries());
    autocompleteCache.clear();
    entries.slice(-AUTOCOMPLETE_CACHE_TRIM_SIZE).forEach(([key, value]) => {
      autocompleteCache.set(key, value);
    });
  }
}

// Handle special keys
function handleKeyDown(e) {
  const suggestions = document.querySelectorAll('.commandbar-item');
  const selected = document.querySelector('.commandbar-item.selected');

  // Handle Cmd/Ctrl+1..9 to select items by number
  const modifierPressed = isMacOS() ? e.metaKey : e.ctrlKey;
  if (modifierPressed && e.key >= '1' && e.key <= '9') {
    const index = parseInt(e.key) - 1;
    const items = document.querySelectorAll('#commandbar-suggestions .commandbar-item');
    if (index < items.length) {
      e.preventDefault();
      executeAction(items[index]);
    }
    return;
  }

  switch (e.key) {
    case 'Escape':
      hideCommandBar();
      break;
      
    case 'Tab':
      e.preventDefault();
      // Si hay autocompletado activo, aceptarlo primero
      if (autocompleteSuggestion && e.target.selectionStart < e.target.value.length) {
        e.target.setSelectionRange(e.target.value.length, e.target.value.length);
        clearAutocomplete();
      }
      break;
      
    case 'Enter':
      e.preventDefault();
      if (selected) {
        executeAction(selected);
      } else {
        const query = e.target.value.trim();
        if (query) {
          // Si hay autocompletado activo, navegar directamente
          if (autocompleteData && query === autocompleteData.suggestion) {
            navigateToUrl(query);
          }
        }
      }
      break;
      
      case 'Backspace':
      case 'Delete':
      case ' ':
      case 'Space':
        // Clear autocomplete al borrar o poner espacio
        clearAutocomplete();
        if (e.key === 'Backspace' || e.key === 'Delete') {
          isDeleting = true;
          isInDeletionMode = true;
          
          // Extend the deletion window to avoid immediate autocomplete
          if (isDeletingTimeout) {
            clearTimeout(isDeletingTimeout);
          }
          isDeletingTimeout = setTimeout(() => {
            isDeleting = false;
            isInDeletionMode = false;
            isDeletingTimeout = null;
          }, 500); // Longer delay for a clean deletion
        }
        break;
        
      default:
        // For any printable key, if a selection is active, clear autocomplete
        if (e.target && e.target.selectionStart !== e.target.selectionEnd && 
            e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          // The user is overwriting a selection — clear autocomplete
          clearAutocomplete();
        }
        break;
      
    case 'ArrowDown':
      e.preventDefault();
      navigateSuggestions('down');
      break;
      
    case 'ArrowUp':
      e.preventDefault();
      navigateSuggestions('up');
      break;
      
    case 'ArrowRight':
      // Aceptar autocompletado con flecha derecha
      if (autocompleteSuggestion && e.target.selectionStart < e.target.value.length) {
        e.preventDefault();
        e.target.setSelectionRange(e.target.value.length, e.target.value.length);
        clearAutocomplete();
      }
      break;
  }
}

// Navigate suggestions with the keyboard
function navigateSuggestions(direction) {
  const suggestions = document.querySelectorAll('.commandbar-item');
  const selected = document.querySelector('.commandbar-item.selected');
  
  if (suggestions.length === 0) return;
  
  let index = -1;
  if (selected) {
    selected.classList.remove('selected');
    index = Array.from(suggestions).indexOf(selected);
  }
  
  if (direction === 'down') {
    index = (index + 1) % suggestions.length;
  } else {
    index = index <= 0 ? suggestions.length - 1 : index - 1;
  }
  
  suggestions[index].classList.add('selected');
  suggestions[index].scrollIntoView({ block: 'nearest' });
}

// Parse keyword prefix (e.g. "b query" -> bookmarks, "h query" -> history, "t query" -> tabs)
function parseKeywordPrefix(query) {
  const match = query.match(/^([bht]) (.*)/);
  if (match) {
    return { prefix: match[1], query: match[2] };
  }
  return { prefix: null, query };
}

// Run search
async function performSearch(query) {
  const suggestions = document.getElementById('commandbar-suggestions');

  // Check for keyword prefix (needs untrimmed input to detect "h " / "b ")
  const parsed = parseKeywordPrefix(query);

  // Trim for normal (non-prefix) searches
  query = parsed.prefix ? query : query.trim();

  // Track searches (only if enabled)
  trackUsageLocal('search_performed', {
    type: isURL(query) ? 'url' : query.startsWith('/') ? 'command' : parsed.prefix ? `keyword:${parsed.prefix}` : 'text',
    length: query.length
  });

  // If keyword prefix is active, go directly to filtered search
  if (parsed.prefix) {
    showSearchSuggestions(parsed.query.trim(), parsed.prefix);
    return;
  }

  // Detect search type
  if (isURL(query)) {
    showURLSuggestions(query);
  } else if (query.startsWith('/')) {
    showCommandSuggestions(query.slice(1));
  } else {
    showSearchSuggestions(query);
  }
}

// Check whether the value is a URL
function isURL(text) {
  const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  return urlPattern.test(text) || text.includes('.');
}

// Show URL suggestions
function showURLSuggestions(url) {
  const suggestions = document.getElementById('commandbar-suggestions');
  const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
  
  suggestions.innerHTML = `
    <div class="commandbar-section">
      <div class="commandbar-section-title">${i18n.t('sections.navigation')}</div>
      <div class="commandbar-item" data-action="open-url" data-url="${cleanUrl}">
        <span class="commandbar-icon">🌐</span>
        <span class="commandbar-text">${i18n.t('search.goToUrl', { url: cleanUrl })}</span>
      </div>
      <div class="commandbar-item" data-action="open-new-tab" data-url="${cleanUrl}">
        <span class="commandbar-icon">🆕</span>
        <span class="commandbar-text">${i18n.t('search.openInNewTab')}</span>
      </div>
    </div>
  `;
  
  // Search existing tabs only if enabled
  if (userSettings.searchTabs) {
    searchInTabs(url);
  }
}



// Show all available commands
function showAllCommands(filter = '') {
  const suggestions = document.getElementById('commandbar-suggestions');
  const modifierKey = getModifierKey();
  
  const commands = [
    { name: i18n.t('commands.newTab').toLowerCase(), icon: '🆕', action: 'new-tab', desc: i18n.t('commandDescs.newTab'), shortcut: `${modifierKey}+T` },
    { name: i18n.t('commands.newWindow').toLowerCase(), icon: '🖼️', action: 'new-window', desc: i18n.t('commandDescs.newWindow'), shortcut: `${modifierKey}+N` },
    { name: i18n.t('commands.incognito').toLowerCase(), icon: '🕵️', action: 'incognito', desc: i18n.t('commandDescs.incognito'), shortcut: `${modifierKey}+Shift+N` },
    { name: i18n.t('commands.pinTab').toLowerCase(), icon: '📌', action: 'pin-tab', desc: i18n.t('commandDescs.pinTab') },
    { name: i18n.t('commands.closeTab').toLowerCase(), icon: '❌', action: 'close-tab', desc: i18n.t('commandDescs.closeTab'), shortcut: `${modifierKey}+W` },
    { name: i18n.t('commands.duplicateTab').toLowerCase(), icon: '📄', action: 'duplicate-tab', desc: i18n.t('commandDescs.duplicateTab') },
    { name: i18n.t('commands.reload').toLowerCase(), icon: '🔄', action: 'reload', desc: i18n.t('commandDescs.reload'), shortcut: `${modifierKey}+R` },
    { name: i18n.t('commands.bookmarks').toLowerCase(), icon: '🔖', action: 'show-bookmarks', desc: i18n.t('commandDescs.bookmarks'), shortcut: `${modifierKey}+Shift+O` },
    { name: i18n.t('commands.history').toLowerCase(), icon: '📚', action: 'show-history', desc: i18n.t('commandDescs.history'), shortcut: `${modifierKey}+H` },
    { name: i18n.t('commands.downloads').toLowerCase(), icon: '⬇️', action: 'show-downloads', desc: i18n.t('commandDescs.downloads'), shortcut: `${modifierKey}+J` },
    { name: i18n.t('commands.settings').toLowerCase(), icon: '⚙️', action: 'show-settings', desc: i18n.t('commandDescs.settings') },
    { name: i18n.t('commands.extensions').toLowerCase(), icon: '🧩', action: 'show-extensions', desc: i18n.t('commandDescs.extensions') },
    { name: i18n.t('commands.readerMode').toLowerCase(), icon: '📖', action: 'reader-mode', desc: i18n.t('commandDescs.readerMode') },
    { name: i18n.t('commands.developerMode').toLowerCase(), icon: '🔧', action: 'developer-mode', desc: i18n.t('commandDescs.developerMode'), shortcut: `${modifierKey}+Shift+I` }
  ];
  
  // Filtrar comandos si hay filtro
  const filtered = filter 
    ? commands.filter(cmd => 
        cmd.name.toLowerCase().includes(filter.toLowerCase()) ||
        cmd.desc.toLowerCase().includes(filter.toLowerCase())
      )
    : commands;
  
  let html = `<div class="commandbar-section"><div class="commandbar-section-title">${i18n.t('sections.availableCommands')}</div>`;
  
  if (filtered.length === 0) {
    html += `<div class="commandbar-no-results">${i18n.t('search.noResults')}</div>`;
  } else {
    filtered.forEach(cmd => {
      const shortcut = cmd.shortcut ? `<span class="commandbar-shortcut">${cmd.shortcut}</span>` : '';
      html += `
        <div class="commandbar-item" data-action="${cmd.action}">
          <span class="commandbar-icon">${cmd.icon}</span>
          <span class="commandbar-text">${cmd.desc}</span>
          ${shortcut}
        </div>
      `;
    });
  }
  
  html += '</div>';
  suggestions.innerHTML = html;
}

// Show command suggestions (legacy)
function showCommandSuggestions(command) {
  showAllCommands(command);
}

// Show search suggestions
async function showSearchSuggestions(query, keywordPrefix = null) {
  const input = document.getElementById('commandbar-input');
  const suggestionsContainer = document.getElementById('commandbar-suggestions');

  if (!input || !suggestionsContainer) return;

  // Clear previous suggestions
  suggestionsContainer.innerHTML = '';

  let hasResults = false;
  const currentGeneration = ++searchGeneration;

  try {
    // Determine which sources to search per settings
    const searchPromises = [];

    if (keywordPrefix === 't') {
      // Keyword: tabs only
      searchPromises.push(searchInTabs(query));
    } else if (keywordPrefix === 'b') {
      // Keyword: bookmarks only
      searchPromises.push(searchInBookmarks(query));
    } else if (keywordPrefix === 'h') {
      // Keyword: history only
      searchPromises.push(searchInHistory(query));
    } else {
      // Default: search all enabled sources
      if (userSettings.searchTabs) {
        searchPromises.push(searchInTabs(query));
      }

      if (userSettings.searchBookmarks) {
        searchPromises.push(searchInBookmarks(query));
      }

      if (userSettings.searchHistory) {
        searchPromises.push(searchInHistory(query));
      }
    }

    // Run searches in parallel
    const results = await Promise.all(searchPromises);

    // Discard results if a newer search has started
    if (currentGeneration !== searchGeneration) return;

    // Append results in order
    // Show more results when keyword-filtering to a single source
    const keywordMaxItems = keywordPrefix ? 10 : undefined;

    results.forEach(result => {
      if (result) {
        hasResults = true;
        if (result.type === 'tabs') appendTabResults(result.data);
        else if (result.type === 'bookmarks') appendBookmarkResults(result.data, keywordMaxItems);
        else if (result.type === 'history') appendHistoryResults(result.data, keywordMaxItems);
      }
    });
    
  } catch (error) {
    console.error('Error in search suggestions:', error);
  }
  
  // Si no hay resultados, mostrar mensaje
  if (!hasResults) {
    suggestionsContainer.innerHTML = `
      <div class="commandbar-no-results">
        <span>${i18n.t('search.noResults')}</span>
      </div>
    `;
  }

  // Add Cmd/Ctrl+N shortcut badges to the first 9 items
  addShortcutBadges();
}

// Add Cmd/Ctrl+N shortcut badges to the first 9 result items
function addShortcutBadges() {
  const items = document.querySelectorAll('#commandbar-suggestions .commandbar-item');
  const modifierKey = getModifierKey();
  items.forEach((item, index) => {
    if (index >= 9) return;
    // Remove any existing shortcut badge before adding
    const existing = item.querySelector('.commandbar-shortcut');
    if (existing) existing.remove();
    const badge = document.createElement('span');
    badge.className = 'commandbar-shortcut';
    badge.textContent = `${modifierKey}+${index + 1}`;
    item.appendChild(badge);
  });
}

// Search tabs
async function searchInTabs(query) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'search_tabs',
      query: query
    });
    
    if (response.success && response.tabs.length > 0) {
      return { type: 'tabs', data: response.tabs };
    }
    return null;
  } catch (error) {
    console.error('Error searching tabs:', error);
    return null;
  }
}

// Search bookmarks
async function searchInBookmarks(query) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'search_bookmarks',
      query: query
    });
    
    if (response.success && response.bookmarks.length > 0) {
      return { type: 'bookmarks', data: response.bookmarks };
    }
    return null;
  } catch (error) {
    console.error('Error buscando en bookmarks:', error);
    return null;
  }
}

// Search history
async function searchInHistory(query) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'search_history',
      query: query
    });
    
    if (response.success && response.history.length > 0) {
      return { type: 'history', data: response.history };
    }
    return null;
  } catch (error) {
    console.error('[CommandBar] Error buscando en historial:', error);
    return null;
  }
}

// Add tab results
function appendTabResults(tabs) {
  const suggestions = document.getElementById('commandbar-suggestions');
  
  let html = `<div class="commandbar-section"><div class="commandbar-section-title">${i18n.t('sections.openTabs')}</div>`;
  tabs.slice(0, 3).forEach(tab => {
    const favicon = tab.favIconUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="%23666" d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8z"/></svg>';
    html += `
      <div class="commandbar-item" data-action="switch-tab" data-tab-id="${tab.id}">
        <img class="commandbar-favicon" src="${favicon}" alt="">
        <span class="commandbar-text">${tab.title}</span>
        <span class="commandbar-url">${new URL(tab.url).hostname}</span>
      </div>
    `;
  });
  html += '</div>';
  
  suggestions.innerHTML += html;
}

// Add bookmark results
function appendBookmarkResults(bookmarks, maxItems = 2) {
  const suggestions = document.getElementById('commandbar-suggestions');

  let html = `<div class="commandbar-section"><div class="commandbar-section-title">${i18n.t('sections.bookmarks')}</div>`;
  bookmarks.slice(0, maxItems).forEach(bookmark => {
    if (bookmark.url) {
      html += `
        <div class="commandbar-item" data-action="open-bookmark" data-url="${bookmark.url}">
          <span class="commandbar-icon">🔖</span>
          <span class="commandbar-text">${bookmark.title}</span>
          <span class="commandbar-url">${new URL(bookmark.url).hostname}</span>
        </div>
      `;
    }
  });
  html += '</div>';
  
  suggestions.innerHTML += html;
}

// Add history results
function appendHistoryResults(history, maxItems = 4) {
  const suggestions = document.getElementById('commandbar-suggestions');

  let html = `<div class="commandbar-section"><div class="commandbar-section-title">${i18n.t('sections.history')}</div>`;
  history.slice(0, maxItems).forEach(item => {
    const hostname = new URL(item.url).hostname;
    html += `
      <div class="commandbar-item" data-action="open-history" data-url="${item.url}">
        <img class="commandbar-favicon" src="${item.favicon}" alt="" onerror="this.style.display='none'">
        <span class="commandbar-text">${item.title}</span>
        <span class="commandbar-url">${hostname}</span>
      </div>
    `;
  });
  html += '</div>';
  
  suggestions.innerHTML += html;
}

// Show default suggestions
function showDefaultSuggestions() {
  const suggestions = document.getElementById('commandbar-suggestions');
  const modifierKey = getModifierKey();
  
  suggestions.innerHTML = `
    <div class="commandbar-section">
      <div class="commandbar-section-title">${i18n.t('sections.quickCommands')}</div>
      <div class="commandbar-item" data-action="new-tab">
        <span class="commandbar-icon">🆕</span>
        <span class="commandbar-text">${i18n.t('commands.newTab')}</span>
        <span class="commandbar-shortcut">${modifierKey}+T</span>
      </div>
      <div class="commandbar-item" data-action="new-window">
        <span class="commandbar-icon">🖼️</span>
        <span class="commandbar-text">${i18n.t('commands.newWindow')}</span>
        <span class="commandbar-shortcut">${modifierKey}+N</span>
      </div>
      <div class="commandbar-item" data-action="incognito">
        <span class="commandbar-icon">🕵️</span>
        <span class="commandbar-text">${i18n.t('commands.incognito')}</span>
        <span class="commandbar-shortcut">${modifierKey}+Shift+N</span>
      </div>
      <div class="commandbar-item" data-action="pin-tab">
        <span class="commandbar-icon">📌</span>
        <span class="commandbar-text">${i18n.t('commands.pinTab')}</span>
      </div>
      <div class="commandbar-item" data-action="reload">
        <span class="commandbar-icon">🔄</span>
        <span class="commandbar-text">${i18n.t('commands.reload')}</span>
        <span class="commandbar-shortcut">${modifierKey}+R</span>
      </div>
    </div>
    <div class="commandbar-section">
      <div class="commandbar-section-title">${i18n.t('sections.quickAccess')}</div>
      <div class="commandbar-item" data-action="show-bookmarks">
        <span class="commandbar-icon">🔖</span>
        <span class="commandbar-text">${i18n.t('commands.bookmarks')}</span>
      </div>
      <div class="commandbar-item" data-action="show-history">
        <span class="commandbar-icon">📚</span>
        <span class="commandbar-text">${i18n.t('commands.history')}</span>
      </div>
      <div class="commandbar-item" data-action="show-downloads">
        <span class="commandbar-icon">⬇️</span>
        <span class="commandbar-text">${i18n.t('commands.downloads')}</span>
      </div>
    </div>
  `;
}

// Handle suggestion clicks
function handleSuggestionClick(e) {
  if (e.target.closest('.commandbar-item')) {
    executeAction(e.target.closest('.commandbar-item'));
  }
}

async function executeAction(item) {
  if (!item) return;
  
  const action = item.dataset.action;
  
  trackUsageLocal('command_executed', { command: action });
  
  switch (action) {
    case 'new-tab':
      await chrome.runtime.sendMessage({ action: 'create_tab', url: 'chrome://newtab/' });
      break;
      
    case 'new-window':
      await chrome.runtime.sendMessage({ action: 'create_window', url: 'chrome://newtab/' });
      break;
      
    case 'incognito':
      await chrome.runtime.sendMessage({ action: 'create_incognito_window', url: 'chrome://newtab/' });
      break;
      
    case 'pin-tab':
      const currentTabId = await getCurrentTabId();
      if (currentTabId) {
        try {
          await chrome.runtime.sendMessage({ action: 'pin_tab', tabId: currentTabId });
          showToast('Tab pinned', 'success');
        } catch (error) {
          console.error('Error pinning tab:', error);
          showToast('Error pinning tab', 'error');
        }
      }
      break;
      
    case 'close-tab':
      const currentTabId2 = await getCurrentTabId();
      if (currentTabId2) {
        try {
          await chrome.runtime.sendMessage({ action: 'close_tab', tabId: currentTabId2 });
          showToast('Tab closed', 'success');
        } catch (error) {
          console.error('Error closing tab:', error);
          showToast('Error closing tab', 'error');
        }
      }
      break;
      
    case 'duplicate-tab':
      const currentTabId3 = await getCurrentTabId();
      if (currentTabId3) {
        try {
          await chrome.runtime.sendMessage({ action: 'duplicate_tab', tabId: currentTabId3 });
          showToast('Tab duplicated', 'success');
        } catch (error) {
          console.error('Error duplicating tab:', error);
          showToast('Error duplicating tab', 'error');
        }
      }
      break;
      
    case 'reload':
      const currentTabId4 = await getCurrentTabId();
      if (currentTabId4) {
        try {
          await chrome.runtime.sendMessage({ action: 'reload_tab', tabId: currentTabId4 });
          showToast('Tab reloaded', 'success');
        } catch (error) {
          console.error('Error reloading tab:', error);
          showToast('Error reloading tab', 'error');
        }
      }
      break;
      
    case 'switch-tab':
      const tabId = parseInt(item.dataset.tabId);
      await chrome.runtime.sendMessage({ action: 'switch_tab', tabId });
      break;
      
    case 'close-target-tab':
      const targetTabId = parseInt(item.dataset.tabId);
      await chrome.runtime.sendMessage({ action: 'close_tab', tabId: targetTabId });
      break;
      
    case 'open-bookmark':
    case 'open-history':
      if (isOurExtensionPage()) {
        // On our extension page, navigate in the same tab
        window.location.href = item.dataset.url;
      } else {
        // On other pages, open in new tab (MARKED AS FROM COMMANDBAR)
        await chrome.runtime.sendMessage({
          action: 'create_tab',
          url: item.dataset.url,
          active: true,
          fromCommandBar: true // Marcar que viene de CommandBar para evitar auto-open
        });
      }
      break;
      
    case 'open-bookmark-background':
      await chrome.runtime.sendMessage({
        action: 'create_tab',
        url: item.dataset.url,
        active: false,
        fromCommandBar: true // Marcar que viene de CommandBar para evitar auto-open
      });
      break;
      
    case 'open-new-tab':
      await chrome.runtime.sendMessage({
        action: 'create_tab',
        url: item.dataset.url,
        active: false,
        fromCommandBar: true // Marcar que viene de CommandBar para evitar auto-open
      });
      break;
      
    case 'google-search':
      if (isOurExtensionPage()) {
        window.location.href = `https://www.google.com/search?q=${encodeURIComponent(item.dataset.query)}`;
      } else {
        await chrome.runtime.sendMessage({
          action: 'create_tab',
          url: `https://www.google.com/search?q=${encodeURIComponent(item.dataset.query)}`,
          fromCommandBar: true // Marcar que viene de CommandBar para evitar auto-open
        });
      }
      break;
      
    case 'bing-search':
      if (isOurExtensionPage()) {
        window.location.href = `https://www.bing.com/search?q=${encodeURIComponent(item.dataset.query)}`;
      } else {
        await chrome.runtime.sendMessage({
          action: 'create_tab',
          url: `https://www.bing.com/search?q=${encodeURIComponent(item.dataset.query)}`,
          fromCommandBar: true // Marcar que viene de CommandBar para evitar auto-open
        });
      }
      break;
      
    case 'duckduckgo-search':
      if (isOurExtensionPage()) {
        window.location.href = `https://duckduckgo.com/?q=${encodeURIComponent(item.dataset.query)}`;
      } else {
        await chrome.runtime.sendMessage({
          action: 'create_tab',
          url: `https://duckduckgo.com/?q=${encodeURIComponent(item.dataset.query)}`,
          fromCommandBar: true // Marcar que viene de CommandBar para evitar auto-open
        });
      }
      break;
      
    case 'yahoo-search':
      if (isOurExtensionPage()) {
        window.location.href = `https://search.yahoo.com/search?p=${encodeURIComponent(item.dataset.query)}`;
      } else {
        await chrome.runtime.sendMessage({
          action: 'create_tab',
          url: `https://search.yahoo.com/search?p=${encodeURIComponent(item.dataset.query)}`,
          fromCommandBar: true // Marcar que viene de CommandBar para evitar auto-open
        });
      }
      break;
      
    case 'perplexity-search':
      if (isOurExtensionPage()) {
        window.location.href = `https://www.perplexity.ai/search?q=${encodeURIComponent(item.dataset.query)}`;
      } else {
        await chrome.runtime.sendMessage({
          action: 'create_tab',
          url: `https://www.perplexity.ai/search?q=${encodeURIComponent(item.dataset.query)}`,
          fromCommandBar: true // Marcar que viene de CommandBar para evitar auto-open
        });
      }
      break;
      
    case 'show-bookmarks':
      if (isOurExtensionPage()) {
        window.location.href = 'chrome://bookmarks/';
      } else {
        await chrome.runtime.sendMessage({
          action: 'create_tab',
          url: 'chrome://bookmarks/',
          fromCommandBar: true // Marcar que viene de CommandBar para evitar auto-open
        });
      }
      break;
      
    case 'show-history':
      if (isOurExtensionPage()) {
        window.location.href = 'chrome://history/';
      } else {
        await chrome.runtime.sendMessage({
          action: 'create_tab',
          url: 'chrome://history/',
          fromCommandBar: true // Marcar que viene de CommandBar para evitar auto-open
        });
      }
      break;
      
    case 'show-downloads':
      if (isOurExtensionPage()) {
        window.location.href = 'chrome://downloads/';
      } else {
        await chrome.runtime.sendMessage({
          action: 'create_tab',
          url: 'chrome://downloads/',
          fromCommandBar: true // Marcar que viene de CommandBar para evitar auto-open
        });
      }
      break;
      
    case 'show-settings':
      if (isOurExtensionPage()) {
        window.location.href = 'chrome://settings/';
      } else {
        await chrome.runtime.sendMessage({
          action: 'create_tab',
          url: 'chrome://settings/',
          fromCommandBar: true // Marcar que viene de CommandBar para evitar auto-open
        });
      }
      break;
      
    case 'show-extensions':
      if (isOurExtensionPage()) {
        window.location.href = 'chrome://extensions/';
      } else {
        await chrome.runtime.sendMessage({
          action: 'create_tab',
          url: 'chrome://extensions/',
          fromCommandBar: true // Marcar que viene de CommandBar para evitar auto-open
        });
      }
      break;
      
    case 'reader-mode':
      // Intentar activar modo lectura (experimental)
      try {
        if (document.body.style.filter && document.body.style.filter !== '') {
          document.body.style.filter = '';
          showToast('Modo lectura desactivado', 'info');
        } else {
          document.body.style.filter = 'contrast(1.2) brightness(0.9) saturate(0.8)';
          showToast('Modo lectura activado', 'info');
        }
      } catch (error) {
        console.error('Error toggling reader mode:', error);
        showToast('Error al cambiar modo lectura', 'error');
      }
      break;
      
    case 'developer-mode':
      try {
        // Intentar abrir las herramientas de desarrollador usando F12
        const event = new KeyboardEvent('keydown', {
          key: 'F12',
          code: 'F12',
          keyCode: 123,
          which: 123,
          bubbles: true,
          cancelable: true
        });
        document.dispatchEvent(event);
        showToast('Herramientas de desarrollador', 'info');
      } catch (error) {
        console.error('Error toggling developer tools:', error);
        showToast('Error al abrir herramientas de desarrollador', 'error');
      }
      break;

  }
  
  hideCommandBar();
}

// Check if we're on our extension page
function isOurExtensionPage() {
  return window.location.href.includes('new_tab.html');
}

// Navegar directamente a URL
async function navigateToUrl(url) {
  const finalUrl = url.startsWith('http') ? url : `https://${url}`;
  
  if (editMode || isOurExtensionPage()) {
    // In edit mode OR on our extension page, navigate in the same tab
    window.location.href = finalUrl;
  } else {
    // In normal mode on other pages, open in new tab (MARKED AS FROM COMMANDBAR)
    await chrome.runtime.sendMessage({
      action: 'create_tab',
      url: finalUrl,
      active: true,
      fromCommandBar: true // Marcar que viene de CommandBar para evitar auto-open
    });
  }
  hideCommandBar();
}

// Search Perplexity
async function searchInPerplexity(query) {
  if (editMode || isOurExtensionPage()) {
    // In edit mode OR on our extension page, search in the same tab
    window.location.href = `https://www.perplexity.ai/search?q=${encodeURIComponent(query)}`;
  } else {
    // In normal mode on other pages, open in new tab (MARKED AS FROM COMMANDBAR)
    await chrome.runtime.sendMessage({
      action: 'create_tab',
      url: `https://www.perplexity.ai/search?q=${encodeURIComponent(query)}`,
      fromCommandBar: true // Marcar que viene de CommandBar para evitar auto-open
    });
  }
  hideCommandBar();
}

// Run direct search
async function executeSearch(query) {
  if (isURL(query)) {
    await navigateToUrl(query);
  } else {
    const searchUrl = getSearchUrl(query);
    
    if (editMode || isOurExtensionPage()) {
      // In edit mode OR on our extension page, search in the same tab
      window.location.href = searchUrl;
    } else {
      // In normal mode on other pages, open in new tab (MARKED AS FROM COMMANDBAR)
      await chrome.runtime.sendMessage({
        action: 'create_tab',
        url: searchUrl,
        fromCommandBar: true // Marcar que viene de CommandBar para evitar auto-open
      });
    }
    hideCommandBar();
  }
}

// Run a Perplexity-specific search
async function executePerplexitySearch(query) {
  if (isURL(query)) {
    await navigateToUrl(query);
  } else {
    const perplexityUrl = getSearchUrl(query, 'perplexity');
    
    if (editMode || isOurExtensionPage()) {
      // In edit mode OR on our extension page, search in the same tab
      window.location.href = perplexityUrl;
    } else {
      // In normal mode on other pages, open in new tab
      await chrome.runtime.sendMessage({
        action: 'create_tab',
        url: perplexityUrl,
        fromCommandBar: true // Marcar que viene de CommandBar para evitar auto-open
      });
    }
    hideCommandBar();
  }
}

// Get current tab ID
async function getCurrentTabId() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'get_current_tab' }, (response) => {
      if (response && response.success) {
        resolve(response.tabId);
      } else {
        console.error('Error getting current tab ID:', response?.error);
        resolve(null);
      }
    });
  });
}

// Show Command Bar
function showCommandBar(prefillUrl = null) {
  if (isSiteExcluded) return;

  if (!commandBarContainer) {
    createCommandBar();
  }
  
  // Trackear apertura de CommandBar
  trackUsageLocal('commandbar_opened', { 
    method: prefillUrl ? 'edit_mode' : 'normal',
    prefilled: !!prefillUrl 
  });
  
  commandBarContainer.style.display = 'block';
  isCommandBarVisible = true;
  
  // Focus en el input
  setTimeout(() => {
    const input = document.getElementById('commandbar-input');
    if (!input) {
      console.error('❌ commandbar-input not found');
      return;
    }
    
    input.focus();
    
    if (prefillUrl) {
      // Edit mode: pre-fill with current URL
      editMode = true;
      input.value = prefillUrl;
      input.select(); // Seleccionar todo el texto
      input.placeholder = i18n.t('editUrlPlaceholder');
      
      // Show edit-mode hint
      showEditModeHint();
    } else {
      // Modo normal
      editMode = false;
      input.select();
      input.placeholder = i18n.t('searchPlaceholder');
      showDefaultSuggestions();
    }
  }, 50);
}

// Ocultar Command Bar
function hideCommandBar() {
  if (commandBarContainer) {
    commandBarContainer.style.display = 'none';
    isCommandBarVisible = false;
    editMode = false;
    
    // Clear input
    const input = document.getElementById('commandbar-input');
    input.value = '';
    
    // Clear autocomplete
    clearAutocomplete();
    
    // Periodically prune cache to avoid memory leaks
    cleanAutocompleteCache();
    
    // Clear edit-mode hint
    clearEditModeHint();
    
    // Clear selection
    const selected = document.querySelector('.commandbar-item.selected');
    if (selected) {
      selected.classList.remove('selected');
    }
  }
}

// Toggle Command Bar
function toggleCommandBar() {
  if (isCommandBarVisible) {
    hideCommandBar();
  } else {
    showCommandBar();
  }
}

// Show edit-mode hint
function showEditModeHint() {
  clearEditModeHint(); // Clear previous hint
  
  const header = document.querySelector('.commandbar-header');
  if (!header) return;
  
  const hintEl = document.createElement('div');
  hintEl.id = 'commandbar-edit-hint';
  hintEl.className = 'commandbar-edit-hint';
  hintEl.innerHTML = `
    <span class="edit-hint-icon">✏️</span>
    <span class="edit-hint-text">${i18n.t('hints.editMode')}</span>
  `;
  
  header.appendChild(hintEl);
}

// Clear edit-mode hint
function clearEditModeHint() {
  const editHint = document.getElementById('commandbar-edit-hint');
  if (editHint) {
    editHint.remove();
  }
}

// Show inline suggestions in the menu (independent of bar autocomplete)
function showIntegratedSuggestions(favicon, title, url) {
  const suggestionsContainer = document.getElementById('commandbar-suggestions');
  if (!suggestionsContainer) return;
  
  // Internal helper to create the inline suggestion
  function createIntegratedSuggestion() {
    // Check whether an inline autocomplete section already exists
    let existingSection = suggestionsContainer.querySelector('.commandbar-section[data-type="integrated-autocomplete"]');
    
    if (!existingSection) {
      // Create a new inline autocomplete section
      existingSection = document.createElement('div');
      existingSection.className = 'commandbar-section';
      existingSection.setAttribute('data-type', 'integrated-autocomplete');
      
      // Use translation with a robust fallback
      let sectionTitle = 'Autocompletado'; // Fallback por defecto
      try {
        if (typeof i18n !== 'undefined' && i18n && typeof i18n.t === 'function') {
          const translated = i18n.t('sections.autocomplete');
          if (translated && translated !== 'sections.autocomplete') {
            sectionTitle = translated;
          }
        }
      } catch (error) {
        // Error silencioso, usar fallback
      }
      
      existingSection.innerHTML = `
        <div class="commandbar-section-title">${sectionTitle}</div>
      `;
      
      // Insert at the start of the suggestions container
      suggestionsContainer.insertBefore(existingSection, suggestionsContainer.firstChild);
    }
    
    // Clear previous section content
    let sectionTitle = 'Autocompletado'; // Fallback por defecto
    try {
      if (typeof i18n !== 'undefined' && i18n && typeof i18n.t === 'function') {
        const translated = i18n.t('sections.autocomplete');
        if (translated && translated !== 'sections.autocomplete') {
          sectionTitle = translated;
        }
      }
    } catch (error) {
      // Error silencioso, usar fallback
    }
    
    existingSection.innerHTML = `
      <div class="commandbar-section-title">${sectionTitle}</div>
    `;
    
    // Create the inline autocomplete element
    const autocompleteItem = document.createElement('div');
    autocompleteItem.className = 'commandbar-item commandbar-autocomplete-item';
    autocompleteItem.dataset.action = 'navigate';
    autocompleteItem.dataset.url = url;
    
    // Use translation with a robust fallback
    let actionText = 'Abrir'; // Fallback por defecto
    try {
      if (typeof i18n !== 'undefined' && i18n && typeof i18n.t === 'function') {
        const translated = i18n.t('actions.open');
        if (translated && translated !== 'actions.open') {
          actionText = translated;
        }
      }
    } catch (error) {
      // Error silencioso, usar fallback
    }
    
    autocompleteItem.innerHTML = `
      <span class="commandbar-favicon">
        <img src="${favicon}" alt="" onerror="this.style.display='none'">
      </span>
      <div class="commandbar-text">
        <div class="commandbar-title">${title}</div>
        <div class="commandbar-url">${url}</div>
      </div>
      <span class="commandbar-shortcut">${actionText}</span>
    `;
    
    // Attach click handler
    autocompleteItem.addEventListener('click', () => {
      navigateToUrl(url);
    });
    
    // Append to the section
    existingSection.appendChild(autocompleteItem);
  }
  
  // Intentar crear inmediatamente, si falla, esperar un poco
  try {
    createIntegratedSuggestion();
  } catch (error) {
    // Si hay error, esperar un poco y reintentar
    setTimeout(() => {
      try {
        createIntegratedSuggestion();
      } catch (retryError) {
        // If it still fails, build with default fallbacks
        createIntegratedSuggestion();
      }
    }, 100);
  }
}

// Escuchar mensajes del background script
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  
  if (message.action === 'toggle_commandbar') {
    if (isSiteExcluded) return;
    toggleCommandBar();
  } else if (message.action === 'edit_current_url') {
    if (isSiteExcluded) return;
    // Convert full URL to a simple form for editing
    let cleanUrl = message.currentUrl;
    try {
      const url = new URL(cleanUrl);
      // Show domain + path when not the root
      cleanUrl = url.hostname.replace('www.', '') + (url.pathname !== '/' ? url.pathname : '') + url.search;
    } catch (e) {
      // If not a valid URL, use as-is
    }
    showCommandBar(cleanUrl);
  } else if (message.action === 'settings_updated') {
    // Update local settings
    if (message.settings) {
      if (message.settings.defaultSearchEngine !== undefined) {
        userSettings.defaultSearchEngine = message.settings.defaultSearchEngine;
      }
      if (message.settings.searchTabs !== undefined) {
        userSettings.searchTabs = message.settings.searchTabs;
      }
      if (message.settings.searchBookmarks !== undefined) {
        userSettings.searchBookmarks = message.settings.searchBookmarks;
      }
      if (message.settings.searchHistory !== undefined) {
        userSettings.searchHistory = message.settings.searchHistory;
      }
      if (message.settings.maxResults !== undefined) {
        userSettings.maxResults = message.settings.maxResults;
      }
      if (message.settings.searchDelay !== undefined) {
        userSettings.searchDelay = message.settings.searchDelay;
      }
      if (message.settings.shortcutToggleCommandbar !== undefined) {
        userSettings.shortcutToggleCommandbar = message.settings.shortcutToggleCommandbar;
      }
      if (message.settings.shortcutEditCurrentUrl !== undefined) {
        userSettings.shortcutEditCurrentUrl = message.settings.shortcutEditCurrentUrl;
      }
      if (message.settings.excludedWebsites !== undefined) {
        userSettings.excludedWebsites = message.settings.excludedWebsites;
        isSiteExcluded = isUrlExcluded(window.location.href, userSettings.excludedWebsites);
        // If site became excluded while CommandBar is visible, hide it
        if (isSiteExcluded && isCommandBarVisible) {
          hideCommandBar();
        }
      }
    }
    
    // Update language setting
    if (message.settings && message.settings.language) {
      await i18n.setLanguage(message.settings.language);
      
      // If CommandBar is visible, refresh it
      if (isCommandBarVisible) {
        const input = document.getElementById('commandbar-input');
        const currentValue = input ? input.value : '';
        
        // Recrear CommandBar con nuevo idioma
        if (commandBarContainer) {
          commandBarContainer.remove();
          commandBarContainer = null;
        }
        
        createCommandBar();
        showCommandBar();
        
        // Restore the input value if there was one
        if (currentValue && input) {
          setTimeout(() => {
            const newInput = document.getElementById('commandbar-input');
            if (newInput) {
              newInput.value = currentValue;
              newInput.focus();
            }
          }, 50);
        }
      }
    }
  }
});

// Intercept keyboard shortcuts for CommandBar
document.addEventListener('keydown', (e) => {
  // Release all shortcuts when site is excluded
  if (isSiteExcluded) return;

  const toggleShortcut = userSettings.shortcutToggleCommandbar || getDefaultShortcut('toggle_commandbar');
  const editShortcut = userSettings.shortcutEditCurrentUrl || getDefaultShortcut('edit_current_url');

  if (e.key === 'Escape' && isCommandBarVisible) {
    e.preventDefault();
    e.stopPropagation();
    hideCommandBar();
  } else if (eventMatchesShortcut(e, toggleShortcut)) {
    e.preventDefault();
    e.stopPropagation();
    toggleCommandBar();
  } else if (eventMatchesShortcut(e, editShortcut)) {
    e.preventDefault();
    e.stopPropagation();
    const cleanUrl = window.location.hostname.replace('www.', '') +
      (window.location.pathname !== '/' ? window.location.pathname : '') + window.location.search;
    showCommandBar(cleanUrl);
  }
}, true);

// Main initialization
async function initializeContentScript() {
  try {
    // Skip if already initialized
    if (isInitialized) {
      return;
    }
    
    // Skip if we are on a page we cannot run on
    if (!window.chrome || !chrome.storage) {
      return; // Salir silenciosamente si no hay APIs disponibles
    }
    
    // Load user settings
    await loadUserSettings();
    
    // Wait a bit longer to ensure i18n is fully loaded
    if (typeof i18n !== 'undefined' && i18n && typeof i18n.setLanguage === 'function') {
      // Verify the language is loaded correctly
      const currentLanguage = i18n.getCurrentLanguage();
      if (currentLanguage !== userSettings.language) {
        await i18n.setLanguage(userSettings.language);
      }
    }
    
    // Marcar como inicializado
    isInitialized = true;
    
  } catch (error) {
    // Silent error to avoid console spam on problematic pages
    // Only log critical errors that really need attention
    if (error.message && !error.message.includes('Extension context invalidated')) {
      console.error('CommandBar initialization failed:', error.message);
    }
  }
}

// Initialize when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
  // Usar setTimeout para evitar errores de timing
  setTimeout(initializeContentScript, 0);
} 