// JavaScript for the CommandBar Pro popup

document.addEventListener('DOMContentLoaded', async function() {
  try {
    await i18n.loadLanguage();

    await new Promise(resolve => setTimeout(resolve, 50));

    initializePopup();
    await loadSettings();
    setupEventListeners();

    setTimeout(() => {
      updateInterface();
    }, 1000);

  } catch (error) {
    console.error('Error during popup initialization:', error);
  }
});

function isMacOS() {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

function initializePopup() {
  const animatedElements = document.querySelectorAll('.feature-item, .command-item, .search-type, .setting-item');
  animatedElements.forEach((element, index) => {
    element.style.animationDelay = `${index * 0.05}s`;
  });

  updateKeyboardShortcuts();

  showDailyTip();
}

async function updateKeyboardShortcuts() {
  const isMac = isMacOS();
  const modifierKey = isMac ? 'Cmd' : 'Ctrl';
  const shortcutDisplays = document.querySelectorAll('.shortcut-display');

  // Load custom shortcuts
  let toggleShortcut = null;
  let editShortcut = null;
  try {
    const stored = await chrome.storage.sync.get(['shortcutToggleCommandbar', 'shortcutEditCurrentUrl']);
    toggleShortcut = stored.shortcutToggleCommandbar;
    editShortcut = stored.shortcutEditCurrentUrl;
  } catch (e) { /* ignore */ }

  // Format shortcut for display
  function formatShortcut(str) {
    if (!str) return null;
    return str.split('+').map(p => {
      if (p === 'Meta') return isMac ? 'Cmd' : 'Meta';
      return p;
    }).map(p => `<kbd class="key">${p}</kbd>`).join(' + ');
  }

  if (shortcutDisplays.length >= 1) {
    const toggleDisplay = toggleShortcut
      ? formatShortcut(toggleShortcut)
      : `<kbd class="key">${modifierKey}</kbd> + <kbd class="key">K</kbd>`;
    shortcutDisplays[0].innerHTML = `
      ${toggleDisplay}
      <span class="shortcut-desc" id="popup-open-commandbar">Open Command Bar</span>
    `;
  }

  if (shortcutDisplays.length >= 2) {
    const editDisplay = editShortcut
      ? formatShortcut(editShortcut)
      : `<kbd class="key">${modifierKey}</kbd> + <kbd class="key">Shift</kbd> + <kbd class="key">K</kbd>`;
    shortcutDisplays[1].innerHTML = `
      ${editDisplay}
      <span class="shortcut-desc" id="popup-edit-current-url">Edit current URL</span>
    `;
  }
}

async function loadSettings() {
  try {
    const stored = await chrome.storage.sync.get([
      'language',
      'darkMode',
      'storeUsageStats'
    ]);

    userSettings = {
      language: stored.language || 'en',
      darkMode: stored.darkMode || false,
      storeUsageStats: stored.storeUsageStats || false
    };

    if (userSettings.darkMode) {
      document.body.classList.add('dark-theme');
    }

    if (window.i18n) {
      await window.i18n.setLanguage(userSettings.language);
    }

  } catch (error) {
    console.error('Error loading settings:', error);
    userSettings = {
      language: 'en',
      darkMode: false,
      storeUsageStats: false
    };
  }
}

function setupEventListeners() {
  document.getElementById('test-commandbar').addEventListener('click', testCommandBar);

  document.getElementById('open-options').addEventListener('click', openOptions);

  const checkboxes = document.querySelectorAll('.setting-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', handleSettingChange);
  });

  setupHoverEffects();
}

async function testCommandBar() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      const url = tabs[0].url;

      if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') ||
          url.startsWith('edge://') || url.startsWith('about:') ||
          url.includes('chrome.google.com/webstore')) {
        showNotification('⚠️ CommandBar does not work on browser pages. Try on any website.', 'warning');
        return;
      }

      try {
        await chrome.tabs.sendMessage(tabs[0].id, { action: 'toggle_commandbar' });
        window.close();
      } catch (error) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: function() {
              const existingBar = document.getElementById('forced-commandbar');
              if (existingBar) {
                existingBar.remove();
                return;
              }

              const commandBar = document.createElement('div');
              commandBar.id = 'forced-commandbar';
                             commandBar.innerHTML = '<div style="position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; background: rgba(0,0,0,0.7) !important; backdrop-filter: blur(4px) !important; z-index: 999999 !important; display: flex !important; align-items: center !important; justify-content: center !important; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif !important;"><div style="background: white !important; border-radius: 12px !important; box-shadow: 0 20px 40px rgba(0,0,0,0.3) !important; width: 90% !important; max-width: 600px !important; overflow: hidden !important;"><div style="padding: 20px !important; border-bottom: 1px solid #eee !important;"><input type="text" id="forced-input" placeholder="🚀 CommandBar Pro - Type command, search or URL..." style="width: 100% !important; border: none !important; outline: none !important; font-size: 18px !important; padding: 0 !important; background: transparent !important;"></div><div style="padding: 16px !important; color: #666 !important; font-size: 14px !important;"><div style="margin-bottom: 8px !important;">⚡ <strong>Works on any site:</strong></div><div>• Type a URL to navigate</div><div>• Type text to search Google</div><div>• Press Tab to search Perplexity</div><div>• Press Escape to close</div></div></div></div>';
              
              document.body.appendChild(commandBar);
              
              const input = document.getElementById('forced-input');
              input.focus();
              
              function handleKeyDown(e) {
                if (e.key === 'Escape') {
                  commandBar.remove();
                  document.removeEventListener('keydown', handleKeyDown);
                } else if (e.key === 'Enter') {
                  const query = input.value.trim();
                  if (query) {
                    let url;
                    if (query.includes('.') && !query.includes(' ')) {
                      url = query.startsWith('http') ? query : 'https://' + query;
                    } else {
                      url = 'https://www.google.com/search?q=' + encodeURIComponent(query);
                    }
                    window.open(url, '_blank');
                  }
                  commandBar.remove();
                  document.removeEventListener('keydown', handleKeyDown);
                } else if (e.key === 'Tab') {
                  e.preventDefault();
                  const query = input.value.trim();
                  if (query && !query.includes('.')) {
                    const perplexityUrl = 'https://www.perplexity.ai/search?q=' + encodeURIComponent(query);
                    window.open(perplexityUrl, '_blank');
                    commandBar.remove();
                    document.removeEventListener('keydown', handleKeyDown);
                  }
                }
              }
              
              document.addEventListener('keydown', handleKeyDown);
              
              commandBar.addEventListener('click', (e) => {
                if (e.target === commandBar) {
                  commandBar.remove();
                  document.removeEventListener('keydown', handleKeyDown);
                }
              });
            }
          });
          
          window.close();
        } catch (injectionError) {
          // silent
        }
      }
    }
  } catch (error) {
    console.error('Error opening Command Bar:', error);

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tabs[0]?.url || '';

    if (url.includes('perplexity.ai') || url.includes('chatgpt.com') ||
        url.includes('claude.ai') || url.includes('bard.google.com')) {
             showNotification('🔒 This site blocks extensions. Use Cmd+K on other sites.', 'info');
    } else {
      showNotification('⚠️ Reload the page or try another website', 'warning');
    }
  }
}

function openOptions() {
  chrome.runtime.openOptionsPage();
}

async function handleSettingChange(event) {
  const settingName = event.target.id.replace('-', '');
  const isChecked = event.target.checked;

  const settingMap = {
    'darkmode': 'darkMode',
    'storeusagestats': 'storeUsageStats'
  };

  const actualSettingName = settingMap[settingName] || settingName;

  try {
    await chrome.storage.sync.set({ [actualSettingName]: isChecked });

    if (actualSettingName === 'darkMode') {
      if (isChecked) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    }

    showNotification(`Setting ${actualSettingName} updated`, 'success');

    trackUsage('setting_changed');

  } catch (error) {
    console.error('Error saving setting:', error);
    showNotification('Error saving setting', 'error');

    event.target.checked = !isChecked;
  }
}

function setupHoverEffects() {
  const interactiveElements = document.querySelectorAll('.feature-item, .command-item, .search-type, .action-btn');

  interactiveElements.forEach(element => {
    element.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
    });

    element.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });

  const primaryBtn = document.querySelector('.action-btn.primary');
  primaryBtn.addEventListener('click', function() {
    this.style.transform = 'scale(0.95)';
    setTimeout(() => {
      this.style.transform = 'scale(1)';
    }, 100);
  });
}

function showDailyTip() {
  const tips = [
    'Use "/" at the beginning for specific commands',
    'Type a URL for direct navigation',
    'Find tabs by typing part of the title',
    'Quickly access bookmarks with search',
    'Use Cmd+K (Mac) or Ctrl+K on any web page',
    'Switch between tabs with smart search',
    'Pin important tabs with /pin',
    'Quickly duplicate tabs with /duplicate'
  ];

  const today = new Date().getDay();
  const tipIndex = today % tips.length;
  const selectedTip = tips[tipIndex];

  const tipElements = document.querySelectorAll('.tip-text');
  if (tipElements.length > 0) {
    tipElements[0].textContent = `Tip of the day: ${selectedTip}`;
  }
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <span class="notification-icon">${getNotificationIcon(type)}</span>
    <span class="notification-text">${message}</span>
  `;

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${getNotificationColor(type)};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
    max-width: 300px;
  `;
  
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

function getNotificationIcon(type) {
  switch (type) {
    case 'success': return '✅';
    case 'error': return '❌';
    case 'warning': return '⚠️';
    default: return 'ℹ️';
  }
}

function getNotificationColor(type) {
  switch (type) {
    case 'success': return '#28a745';
    case 'error': return '#dc3545';
    case 'warning': return '#ffc107';
    default: return '#007bff';
  }
}



function updateElementText(elementId, translationKey, replacements = {}) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = i18n.t(translationKey, replacements);
  } else {
    console.warn(`Element with ID '${elementId}' not found in popup`);
  }
}

function updateInterface() {
  if (!window.i18n || typeof window.i18n.t !== 'function') {
    return;
  }

  try {
    updateElementText('popup-app-name', 'appName');
    updateElementText('popup-version', 'popup.version');
    
    // Keyboard shortcuts section
    updateElementText('popup-keyboard-shortcuts', 'popup.keyboardShortcuts');
    updateElementText('popup-open-commandbar', 'popup.openCommandBar');
    
    // Features section
    updateElementText('popup-features', 'popup.features');
    
    // Feature items
    updateElementText('popup-universal-search', 'popup.featureItems.universalSearch');
    updateElementText('popup-quick-navigation', 'popup.featureItems.quickNavigation');
    updateElementText('popup-tab-management', 'popup.featureItems.tabManagement');
    updateElementText('popup-bookmark-access', 'popup.featureItems.bookmarkAccess');
    updateElementText('popup-history-search', 'popup.featureItems.historySearch');
    updateElementText('popup-quick-commands', 'popup.featureItems.quickCommands');
    
    // Commands section
    updateElementText('popup-available-commands', 'popup.availableCommands');
    
    // Search types section
    updateElementText('popup-search-types', 'popup.searchTypes');
    updateElementText('popup-web-search-title', 'popup.searchTypeItems.webSearch.title');
    updateElementText('popup-web-search-desc', 'popup.searchTypeItems.webSearch.desc');
    updateElementText('popup-direct-nav-title', 'popup.searchTypeItems.directNavigation.title');
    updateElementText('popup-direct-nav-desc', 'popup.searchTypeItems.directNavigation.desc');
    updateElementText('popup-open-tabs-title', 'popup.searchTypeItems.openTabs.title');
    updateElementText('popup-open-tabs-desc', 'popup.searchTypeItems.openTabs.desc');
    updateElementText('popup-bookmarks-title', 'popup.searchTypeItems.bookmarks.title');
    updateElementText('popup-bookmarks-desc', 'popup.searchTypeItems.bookmarks.desc');
    updateElementText('popup-history-title', 'popup.searchTypeItems.history.title');
    updateElementText('popup-history-desc', 'popup.searchTypeItems.history.desc');
    
    // Configuration section
    updateElementText('popup-configuration', 'popup.configuration');
    updateElementText('popup-dark-theme', 'popup.settings.darkTheme');
    
    updateElementText('popup-try-commandbar', 'popup.tryCommandBar');
    updateElementText('popup-advanced-settings', 'popup.advancedSettings');

    // Tips section
    updateElementText('popup-tip-slash', 'popup.tips.useSlash');
    updateElementText('popup-tip-url', 'popup.tips.directUrl');
    
    // Keyboard shortcuts
    updateElementText('popup-developer-mode', 'popup.developerMode');
    
    // Commands section
    updateElementText('popup-cmd-new-tab', 'popup.commands.newTab');
    updateElementText('popup-cmd-new-tab-desc', 'popup.commands.newTabDesc');
    updateElementText('popup-cmd-pin', 'popup.commands.pin');
    updateElementText('popup-cmd-pin-desc', 'popup.commands.pinDesc');
    updateElementText('popup-cmd-close', 'popup.commands.close');
    updateElementText('popup-cmd-close-desc', 'popup.commands.closeDesc');
    updateElementText('popup-cmd-duplicate', 'popup.commands.duplicate');
    updateElementText('popup-cmd-duplicate-desc', 'popup.commands.duplicateDesc');
    updateElementText('popup-cmd-bookmarks', 'popup.commands.bookmarks');
    updateElementText('popup-cmd-bookmarks-desc', 'popup.commands.bookmarksDesc');
    updateElementText('popup-cmd-history', 'popup.commands.history');
    updateElementText('popup-cmd-history-desc', 'popup.commands.historyDesc');
    
  } catch (error) {
    console.error('Error updating interface:', error);
  }
}

// Inject animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  .dark-theme {
    background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  }
  
  .dark-theme .popup-container {
    background: #1e1e1e;
    color: #e0e0e0;
  }
  
  .dark-theme .popup-content {
    background: #1e1e1e;
  }
  
  .dark-theme .feature-section h2 {
    color: #e0e0e0;
    border-bottom-color: #404040;
  }
  
  .dark-theme .feature-item,
  .dark-theme .command-item,
  .dark-theme .search-type,
  .dark-theme .setting-item {
    background: #2d2d2d;
    border-color: #404040;
    color: #e0e0e0;
  }
  
  .dark-theme .feature-item:hover,
  .dark-theme .command-item:hover,
  .dark-theme .search-type:hover,
  .dark-theme .setting-item:hover {
    background: #3d3d3d;
    border-color: #555;
  }
  
  .dark-theme .feature-text,
  .dark-theme .command-name,
  .dark-theme .command-desc,
  .dark-theme .search-title,
  .dark-theme .search-desc {
    color: #e0e0e0;
  }
  
  .dark-theme .feature-icon,
  .dark-theme .search-icon {
    filter: brightness(1.2);
  }
  
  .dark-theme .command-prefix {
    background: #667eea;
    color: white;
  }
  
  .dark-theme .popup-footer {
    background: #2d2d2d;
    border-top-color: #404040;
  }
  
  .dark-theme .action-btn.secondary {
    background: #404040;
    color: #e0e0e0;
    border-color: #555;
  }
  
  .dark-theme .popup-tips {
    background: rgba(45, 45, 45, 0.5);
    border-top-color: rgba(64, 64, 64, 0.5);
  }
  
  .dark-theme .tip-text {
    color: #bbb;
  }
`;
document.head.appendChild(style);

// Keyboard navigation
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    window.close();
  } else if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault();
    testCommandBar();
  }
});

function trackUsage(action) {
  try {
    chrome.runtime.sendMessage({
      action: 'track_usage',
      usage_action: action,
      usage_details: { source: 'popup' }
    });
  } catch (error) {
    // silent
  }
}

// Track popup open
trackUsage('popup_opened'); 