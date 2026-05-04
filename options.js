// JavaScript for the CommandBar Pro options page

document.addEventListener('DOMContentLoaded', async function() {
    try {
      await loadSettings();

      if (typeof window.i18n === 'undefined' && typeof i18n !== 'undefined') {
        window.i18n = i18n;
      }

      const currentLanguage = currentSettings.language || 'en';

      let initAttempts = 0;
      const maxInitAttempts = 20;

      while (initAttempts < maxInitAttempts) {
        try {
          if (typeof window.i18n === 'undefined' && typeof i18n === 'undefined') {
      await new Promise(resolve => setTimeout(resolve, 100));
            initAttempts++;
            continue;
          }

          const i18nInstance = window.i18n || i18n;

          if (typeof i18nInstance.setLanguage === 'function') {
            await i18nInstance.setLanguage(currentLanguage);
          } else if (typeof i18nInstance.loadLanguage === 'function') {
            await i18nInstance.loadLanguage();
          }

          const testTranslation = i18nInstance.t('options.title');
          if (testTranslation && testTranslation !== 'options.title') {
            break;
          } else {
            await new Promise(resolve => setTimeout(resolve, 150));
            initAttempts++;
          }
        } catch (error) {
          await new Promise(resolve => setTimeout(resolve, 150));
          initAttempts++;
        }
      }

      if (initAttempts >= maxInitAttempts) {
        console.error('i18n failed to initialize after all attempts');
      }

       initializeOptions();

       initializeCacheSection();

       initShortcutRecorders();

      setTimeout(() => {
        updateInterface();

        setTimeout(() => {
          const finalCheck = document.getElementById('page-title')?.textContent;
          const experimentalCheck = document.getElementById('experimental-title')?.textContent;

          if (finalCheck && finalCheck.includes('options.')) {
            updateInterface();
          }

          if (experimentalCheck && experimentalCheck.includes('options.')) {
            setTimeout(() => {
              const i18nInstance = window.i18n || i18n;
              if (i18nInstance && typeof i18nInstance.t === 'function') {
                // experimental section uses hardcoded English
              }
            }, 1000);
          }
        }, 500);
      }, 200);

      setupEventListeners();

    } catch (error) {
      console.error('Error during initialization:', error);
      try {
        await loadSettings();
        setupEventListeners();
      } catch (fallbackError) {
        console.error('Fallback initialization failed:', fallbackError);
      }
    }
  });

  const defaultSettings = {
    theme: 'auto',
    animationSpeed: 'normal',
    maxResults: 5,
    searchTabs: true,
    searchBookmarks: true,
    searchHistory: true,
    searchDelay: 50,
    defaultSearchEngine: 'google',
    preventSiteShortcuts: true,
    storeUsageStats: false,
    language: 'en',

    autoOpenNewTab: false,
    autoOpenDelay: 100,

    // Custom keyboard shortcuts (null = use manifest default)
    shortcutToggleCommandbar: null,
    shortcutEditCurrentUrl: null,

    // Excluded websites (array of regex pattern strings)
    excludedWebsites: []
  };
  
  let currentSettings = { ...defaultSettings };
  
  // macOS detection
  function isMacOS() {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  }
  
  // Initialize options
  function initializeOptions() {
    // Configure the range slider with dynamic value
    const searchDelayRange = document.getElementById('search-delay');
    const searchDelayValue = document.getElementById('search-delay-value');
    
    searchDelayRange.addEventListener('input', function() {
      const value = parseInt(this.value);
      const isRecommended = value === 50;
      let recommendedText = '';
      
      // Resolve the i18n instance robustly
      const i18nInstance = window.i18n || i18n;
      if (isRecommended && i18nInstance && typeof i18nInstance.t === 'function') {
        try {
          recommendedText = ` (${i18nInstance.t('options.searchSettings.searchDelayRecommended')})`;
        } catch (error) {
          recommendedText = ' (Recommended)';
        }
      }
      
      searchDelayValue.textContent = `${value}ms${recommendedText}`;
    });
    
    // Configure the auto-open delay range slider
    const autoOpenDelayRange = document.getElementById('auto-open-delay');
    const autoOpenDelayValue = document.getElementById('auto-open-delay-value');
    
    if (autoOpenDelayRange && autoOpenDelayValue) {
      autoOpenDelayRange.addEventListener('input', function() {
        const value = parseInt(this.value);
        autoOpenDelayValue.textContent = `${value}ms`;
      });
    }
    
    // Update keyboard shortcuts for the platform
    updateKeyboardShortcuts();
    
    // Stagger entrance animations
    const sections = document.querySelectorAll('.option-section');
    sections.forEach((section, index) => {
      section.style.animationDelay = `${index * 0.1}s`;
      section.style.animation = 'fadeInUp 0.6s ease-out both';
    });
  }
  
  // Update keyboard shortcuts for the platform
  function updateKeyboardShortcuts() {
    // Shortcut displays are now handled by updateShortcutDisplays()
    if (typeof updateShortcutDisplays === 'function') {
      updateShortcutDisplays();
    }
  }
  
  async function loadSettings() {
    try {
      const stored = await chrome.storage.sync.get(Object.keys(defaultSettings));

      currentSettings = { ...defaultSettings, ...stored };

      if (currentSettings.language) {
        await i18n.setLanguage(currentSettings.language);
      }

      if (Object.keys(stored).length === 0 || stored.autoOpenNewTab === undefined) {
        await chrome.storage.sync.set(currentSettings);

        const verification = await chrome.storage.sync.get(Object.keys(defaultSettings));
      }

      applySettingsToUI();
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }



  function applySettingsToUI() {
    const i18nInstance = window.i18n || i18n;

    document.getElementById('theme-select').value = currentSettings.theme;
    document.getElementById('animation-speed').value = currentSettings.animationSpeed;
    document.getElementById('default-search-engine').value = currentSettings.defaultSearchEngine;

    document.getElementById('max-results').value = currentSettings.maxResults;
    document.getElementById('search-delay').value = currentSettings.searchDelay;

    const isRecommended = currentSettings.searchDelay === 50;
    let recommendedText = '';
    if (isRecommended && i18nInstance && typeof i18nInstance.t === 'function') {
      try {
        recommendedText = ` (${i18nInstance.t('options.searchSettings.searchDelayRecommended')})`;
      } catch (error) {
        recommendedText = ' (Recommended)';
      }
    }
    document.getElementById('search-delay-value').textContent = `${currentSettings.searchDelay}ms${recommendedText}`;

    const autoOpenDelayInput = document.getElementById('auto-open-delay');
    const autoOpenDelayValue = document.getElementById('auto-open-delay-value');
    if (autoOpenDelayInput && autoOpenDelayValue) {
      autoOpenDelayInput.value = currentSettings.autoOpenDelay;
      autoOpenDelayValue.textContent = `${currentSettings.autoOpenDelay}ms`;
    }
    
    // Checkboxes
    const checkboxMappings = {
      'search-tabs': 'searchTabs',
      'search-bookmarks': 'searchBookmarks',
      'search-history': 'searchHistory',
      'prevent-site-shortcuts': 'preventSiteShortcuts',
      'store-usage-stats': 'storeUsageStats',
      'auto-open-new-tab': 'autoOpenNewTab'
    };
    
    Object.entries(checkboxMappings).forEach(([elementId, settingKey]) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.checked = currentSettings[settingKey];
      }
    });

    // Update shortcut recorder displays
    updateShortcutDisplays();

    // Excluded websites list
    renderExcludedWebsitesList();
  }

  // Configure event listeners
  function setupEventListeners() {
    // Save button
    document.getElementById('save-options').addEventListener('click', saveSettings);
    
    // Botones de limpieza
    document.getElementById('clear-cache').addEventListener('click', () => showConfirmModal(
      i18n.t('options.confirmations.clearCache.title'),
      i18n.t('options.confirmations.clearCache.message'),
      clearCache
    ));
    
    document.getElementById('clear-stats').addEventListener('click', () => showConfirmModal(
      i18n.t('options.confirmations.clearStats.title'),
      i18n.t('options.confirmations.clearStats.message'),
      clearStats
    ));
    
    document.getElementById('reset-all').addEventListener('click', () => showConfirmModal(
      i18n.t('options.confirmations.resetAll.title'),
      i18n.t('options.confirmations.resetAll.message'),
      resetAllSettings
    ));
    
    document.getElementById('export-settings').addEventListener('click', exportSettings);
    document.getElementById('import-settings').addEventListener('click', importSettings);

    document.getElementById('view-stats').addEventListener('click', toggleStatsPanel);
    document.getElementById('refresh-stats').addEventListener('click', refreshStats);

    document.getElementById('test-auto-open')?.addEventListener('click', testAutoOpen);
    document.getElementById('check-config')?.addEventListener('click', checkExperimentalConfig);
    document.getElementById('force-save')?.addEventListener('click', forceSaveSettings);

    document.getElementById('view-changelog').addEventListener('click', viewChangelog);
    document.getElementById('report-bug').addEventListener('click', reportBug);
    document.getElementById('view-source').addEventListener('click', viewSource);

    setupExcludedWebsitesListeners();

    document.getElementById('modal-close').addEventListener('click', hideModal);
    document.getElementById('modal-cancel').addEventListener('click', hideModal);
    document.getElementById('modal-overlay').addEventListener('click', function(e) {
      if (e.target === this) hideModal();
    });

    setupRealTimeUpdates();

    document.addEventListener('keydown', handleKeyboard);
  }

  function setupRealTimeUpdates() {
    const selects = ['theme-select', 'animation-speed', 'default-search-engine'];
    selects.forEach(id => {
      document.getElementById(id).addEventListener('change', async function() {
        const settingKey = getSettingKeyFromElementId(id);
        if (settingKey) {
          currentSettings[settingKey] = this.value;

          if (id === 'theme-select') {
            applyThemeChange(this.value);
          }

          await saveSettings(false);
        }
      });
    });
    
    // Number inputs
    document.getElementById('max-results').addEventListener('input', async function() {
      currentSettings.maxResults = parseInt(this.value);
      await saveSettings(false);
    });
    
    // Range inputs
    document.getElementById('search-delay').addEventListener('input', async function() {
      currentSettings.searchDelay = parseInt(this.value);
      await saveSettings(false);
    });
    
    // Range input experimental
    const autoOpenDelayInput = document.getElementById('auto-open-delay');
    if (autoOpenDelayInput) {
      autoOpenDelayInput.addEventListener('input', async function() {
        currentSettings.autoOpenDelay = parseInt(this.value);
        await saveSettings(false);
      });
    }
    
    // Checkboxes
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', async function() {
        const settingKey = getSettingKeyFromElementId(this.id);
        
        if (settingKey) {
          currentSettings[settingKey] = this.checked;
          
          await saveSettings(false);
        }
      });
    });
  }
  
  // Render the excluded websites list
  function renderExcludedWebsitesList() {
    const listEl = document.getElementById('excluded-websites-list');
    if (!listEl) return;

    const patterns = currentSettings.excludedWebsites || [];
    if (patterns.length === 0) {
      const i18nInstance = window.i18n || i18n;
      const noPatterns = (i18nInstance && typeof i18nInstance.t === 'function')
        ? i18nInstance.t('options.excludedWebsites.noPatterns')
        : 'No patterns configured';
      listEl.innerHTML = `<p class="excluded-websites-empty">${noPatterns}</p>`;
      return;
    }

    listEl.innerHTML = patterns.map((pattern, index) => `
      <div class="excluded-website-item" data-index="${index}">
        <code class="excluded-website-pattern">${pattern.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>
        <button class="excluded-website-remove" data-index="${index}" type="button">&times;</button>
      </div>
    `).join('');

    // Add remove handlers
    listEl.querySelectorAll('.excluded-website-remove').forEach(btn => {
      btn.addEventListener('click', async function() {
        const idx = parseInt(this.dataset.index);
        currentSettings.excludedWebsites.splice(idx, 1);
        renderExcludedWebsitesList();
        await saveSettings(false);
        const i18nInstance = window.i18n || i18n;
        const msg = (i18nInstance && typeof i18nInstance.t === 'function')
          ? i18nInstance.t('options.excludedWebsites.patternRemoved')
          : 'Pattern removed';
        showToast(msg, 'success');
      });
    });
  }

  // Setup excluded websites add button
  function setupExcludedWebsitesListeners() {
    const input = document.getElementById('excluded-website-input');
    const addBtn = document.getElementById('add-excluded-website');
    if (!input || !addBtn) return;

    async function addPattern() {
      const pattern = input.value.trim();
      if (!pattern) return;

      const i18nInstance = window.i18n || i18n;

      // Validate regex
      try {
        new RegExp(pattern);
      } catch (e) {
        const msg = (i18nInstance && typeof i18nInstance.t === 'function')
          ? i18nInstance.t('options.excludedWebsites.invalidRegex')
          : 'Invalid regex pattern';
        showToast(msg, 'error');
        return;
      }

      // Check for duplicates
      if (!currentSettings.excludedWebsites) {
        currentSettings.excludedWebsites = [];
      }
      if (currentSettings.excludedWebsites.includes(pattern)) {
        const msg = (i18nInstance && typeof i18nInstance.t === 'function')
          ? i18nInstance.t('options.excludedWebsites.duplicatePattern')
          : 'Pattern already exists';
        showToast(msg, 'error');
        return;
      }

      currentSettings.excludedWebsites.push(pattern);
      input.value = '';
      renderExcludedWebsitesList();
      await saveSettings(false);
      const msg = (i18nInstance && typeof i18nInstance.t === 'function')
        ? i18nInstance.t('options.excludedWebsites.patternAdded')
        : 'Pattern added';
      showToast(msg, 'success');
    }

    addBtn.addEventListener('click', addPattern);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addPattern();
      }
    });
  }

  // Map element ID to settings key
  function getSettingKeyFromElementId(elementId) {
    const mappings = {
      'theme-select': 'theme',
      'animation-speed': 'animationSpeed',
      'max-results': 'maxResults',
      'search-tabs': 'searchTabs',
      'search-bookmarks': 'searchBookmarks',
      'search-history': 'searchHistory',
      'search-delay': 'searchDelay',
      'default-search-engine': 'defaultSearchEngine',
      'prevent-site-shortcuts': 'preventSiteShortcuts',
      'store-usage-stats': 'storeUsageStats',
      'auto-open-new-tab': 'autoOpenNewTab',
      'auto-open-delay': 'autoOpenDelay',
      'shortcut-input-toggle': 'shortcutToggleCommandbar',
      'shortcut-input-edit': 'shortcutEditCurrentUrl'
    };
    
    return mappings[elementId];
  }
  
  function applyThemeChange(theme) {
    const body = document.body;
    body.className = body.className.replace(/theme-\w+/g, '');

    if (theme !== 'auto') {
      body.classList.add(`theme-${theme}`);
    }

    showToast(i18n.t('options.messages.themeChanged', { theme }), 'success');
  }

  function updateElementText(elementId, translationKey, replacements = {}, i18nInstance = window.i18n || i18n) {
    const element = document.getElementById(elementId);
    if (element && i18nInstance && typeof i18nInstance.t === 'function') {
      try {
        const translation = i18nInstance.t(translationKey, replacements);
        if (translation && translation !== translationKey) {
          element.textContent = translation;
        }
      } catch (error) {
        console.warn(`Error translating ${translationKey}:`, error);
      }
    }
    // Silently skip missing elements as they may be context-specific
  }

  function updateInterface() {
    const i18nInstance = window.i18n || i18n;
    if (typeof i18nInstance === 'undefined' || typeof i18nInstance.t !== 'function') {
      console.error('❌ i18n not available in updateInterface');
      return;
    }

    const testTranslation = i18nInstance.t('options.title');
    if (!testTranslation || testTranslation === 'options.title') {
      console.warn('⚠️ Translations not ready yet, deferring updateInterface...');
      setTimeout(() => updateInterface(), 200);
      return;
    }

    document.documentElement.lang = i18nInstance.getCurrentLanguage();

    updateElementText('page-title', 'options.title', {}, i18nInstance);

    updateElementText('options-app-name', 'appName', {}, i18nInstance);
    updateElementText('options-subtitle', 'options.subtitle', {}, i18nInstance);

    updateElementText('general-settings-title', 'options.generalSettings', {}, i18nInstance);
    document.getElementById('interface-theme-label').textContent = i18nInstance.t('options.general.interfaceTheme');
    document.getElementById('interface-theme-desc').textContent = i18nInstance.t('options.general.interfaceThemeDesc');
    document.getElementById('animation-speed-label').textContent = i18nInstance.t('options.general.animationSpeed');
    document.getElementById('animation-speed-desc').textContent = i18nInstance.t('options.general.animationSpeedDesc');
    document.getElementById('max-results-label').textContent = i18nInstance.t('options.general.maxResults');
    document.getElementById('max-results-desc').textContent = i18nInstance.t('options.general.maxResultsDesc');
    
    // Opciones de tema
    document.getElementById('theme-auto').textContent = i18nInstance.t('options.general.themeOptions.auto');
    document.getElementById('theme-light').textContent = i18nInstance.t('options.general.themeOptions.light');
    document.getElementById('theme-dark').textContent = i18nInstance.t('options.general.themeOptions.dark');
    
    // Animation options
    document.getElementById('animation-slow').textContent = i18nInstance.t('options.general.animationOptions.slow');
    document.getElementById('animation-normal').textContent = i18nInstance.t('options.general.animationOptions.normal');
    document.getElementById('animation-fast').textContent = i18nInstance.t('options.general.animationOptions.fast');
    document.getElementById('animation-none').textContent = i18nInstance.t('options.general.animationOptions.none');
    
    // Search and Results
    updateElementText('search-settings-title', 'options.searchAndResults', {}, i18nInstance);
    document.getElementById('search-sources-label').textContent = i18nInstance.t('options.searchSettings.searchSources');
    document.getElementById('search-sources-desc').textContent = i18nInstance.t('options.searchSettings.searchSourcesDesc');
    document.getElementById('search-tabs-label').textContent = i18nInstance.t('options.searchSettings.sources.openTabs');
    document.getElementById('search-bookmarks-label').textContent = i18nInstance.t('options.searchSettings.sources.bookmarks');
    document.getElementById('search-history-label').textContent = i18nInstance.t('options.searchSettings.sources.history');
    document.getElementById('search-delay-label').textContent = i18nInstance.t('options.searchSettings.searchDelay');
    document.getElementById('search-delay-desc').textContent = i18nInstance.t('options.searchSettings.searchDelayDesc');
    document.getElementById('default-search-engine-label').textContent = i18nInstance.t('options.searchSettings.defaultSearchEngine');
    document.getElementById('default-search-engine-desc').textContent = i18nInstance.t('options.searchSettings.defaultSearchEngineDesc');
    
    // Search engines
    document.getElementById('engine-google').textContent = i18nInstance.t('options.searchSettings.engines.google');
    document.getElementById('engine-bing').textContent = i18nInstance.t('options.searchSettings.engines.bing');
    document.getElementById('engine-duckduckgo').textContent = i18nInstance.t('options.searchSettings.engines.duckduckgo');
    document.getElementById('engine-yahoo').textContent = i18nInstance.t('options.searchSettings.engines.yahoo');
    
    // Keyboard Shortcuts
    updateElementText('keyboard-shortcuts-title', 'options.keyboardShortcuts', {}, i18nInstance);
    updateElementText('main-shortcuts-label', 'options.keyboard.mainShortcuts', {}, i18nInstance);
    updateElementText('main-shortcuts-desc', 'options.keyboard.mainShortcutsDesc', {}, i18nInstance);
    updateElementText('open-commandbar-shortcut', 'options.keyboard.openCommandBar', {}, i18nInstance);
    updateElementText('edit-url-shortcut', 'options.keyboard.developerMode', {}, i18nInstance);
    updateElementText('additional-config-label', 'options.keyboard.additionalConfig', {}, i18nInstance);
    updateElementText('additional-config-desc', 'options.keyboard.additionalConfigDesc', {}, i18nInstance);
    updateElementText('prevent-site-shortcuts-label', 'options.keyboard.preventSiteShortcuts', {}, i18nInstance);
    updateElementText('open-commandbar-shortcut', 'options.keyboard.openCommandBar', {}, i18nInstance);
    updateElementText('edit-url-shortcut', 'options.keyboard.editCurrentUrl', {}, i18nInstance);
    updateElementText('shortcut-change-toggle', 'options.keyboard.changeShortcut', {}, i18nInstance);
    updateElementText('shortcut-change-edit', 'options.keyboard.changeShortcut', {}, i18nInstance);
    updateElementText('shortcut-reset-toggle', 'options.keyboard.resetShortcut', {}, i18nInstance);
    updateElementText('shortcut-reset-edit', 'options.keyboard.resetShortcut', {}, i18nInstance);
    
    // Privacidad y Datos
    updateElementText('privacy-title', 'options.privacyAndData', {}, i18nInstance);
    updateElementText('data-collection-label', 'options.privacy.dataCollection', {}, i18nInstance);
    updateElementText('data-collection-desc', 'options.privacy.dataCollectionDesc', {}, i18nInstance);
    updateElementText('usage-stats-label', 'options.privacy.usageStats', {}, i18nInstance);
    updateElementText('stats-viewer-label', 'options.privacy.statsViewer', {}, i18nInstance);
    updateElementText('stats-viewer-desc', 'options.privacy.statsViewerDesc', {}, i18nInstance);
    updateElementText('view-stats-text', 'options.privacy.viewStats', {}, i18nInstance);
    updateElementText('refresh-stats-text', 'options.privacy.refreshStats', {}, i18nInstance);
    updateElementText('data-cleanup-label', 'options.privacy.dataCleanup', {}, i18nInstance);
    updateElementText('data-cleanup-desc', 'options.privacy.dataCleanupDesc', {}, i18nInstance);
    updateElementText('clear-cache-text', 'options.privacy.actions.clearCache', {}, i18nInstance);
    updateElementText('clear-stats-text', 'options.privacy.actions.clearStats', {}, i18nInstance);
    updateElementText('reset-all-text', 'options.privacy.actions.resetAll', {}, i18nInstance);
    
    // Retry privacy translations if they fail
    setTimeout(() => {
      const clearCacheText = document.getElementById('clear-cache-text');
      const clearStatsText = document.getElementById('clear-stats-text');
      const resetAllText = document.getElementById('reset-all-text');
      
      if (clearCacheText && clearCacheText.textContent.includes('options.privacy.actions.clearCache')) {
        updateElementText('clear-cache-text', 'options.privacy.actions.clearCache', {}, i18nInstance);
      }
      if (clearStatsText && clearStatsText.textContent.includes('options.privacy.actions.clearStats')) {
        updateElementText('clear-stats-text', 'options.privacy.actions.clearStats', {}, i18nInstance);
      }
      if (resetAllText && resetAllText.textContent.includes('options.privacy.actions.resetAll')) {
        updateElementText('reset-all-text', 'options.privacy.actions.resetAll', {}, i18nInstance);
      }
    }, 1000);
    
    // Experimental section is hardcoded English in the HTML

    document.getElementById('footer-version').textContent = i18nInstance.t('options.footer.version');
    document.querySelectorAll('.footer-link')[0].textContent = i18nInstance.t('options.footer.changelog');
    document.querySelectorAll('.footer-link')[1].textContent = i18nInstance.t('options.footer.reportBug');
    document.querySelectorAll('.footer-link')[2].textContent = i18nInstance.t('options.footer.viewSource');
    document.getElementById('export-settings-text').textContent = i18nInstance.t('options.buttons.exportSettings');
    document.getElementById('import-settings-text').textContent = i18nInstance.t('options.buttons.importSettings');
    document.getElementById('save-changes-text').textContent = i18nInstance.t('options.buttons.saveChanges');
    
    // Modal y botones
    document.getElementById('modal-cancel-text').textContent = i18nInstance.t('options.buttons.cancel');
    document.getElementById('modal-confirm-text').textContent = i18nInstance.t('options.buttons.confirm');
    
    // Update keyboard shortcuts for the platform
    updateKeyboardShortcuts();
    
    // Retry agresivo para traducciones de privacidad
    setTimeout(() => {
      const privacyElements = [
        { id: 'clear-cache-text', key: 'options.privacy.actions.clearCache' },
        { id: 'clear-stats-text', key: 'options.privacy.actions.clearStats' },
        { id: 'reset-all-text', key: 'options.privacy.actions.resetAll' }
      ];
      
      privacyElements.forEach(({ id, key }) => {
        const element = document.getElementById(id);
        if (element) {
          const currentText = element.textContent;
          const translation = i18nInstance.t(key);
          if (translation && translation !== key && currentText !== translation) {
            element.textContent = translation;
          }
        }
      });
    }, 500);
    
    // Additional retry after 2 seconds
    setTimeout(() => {
      const privacyElements = [
        { id: 'clear-cache-text', key: 'options.privacy.actions.clearCache' },
        { id: 'clear-stats-text', key: 'options.privacy.actions.clearStats' },
        { id: 'reset-all-text', key: 'options.privacy.actions.resetAll' }
      ];
      
      privacyElements.forEach(({ id, key }) => {
        const element = document.getElementById(id);
        if (element) {
          const currentText = element.textContent;
          const translation = i18nInstance.t(key);
          if (translation && translation !== key && currentText !== translation) {
            element.textContent = translation;
          }
        }
      });
    }, 2000);
    
  }
  
  // Save settings
  async function saveSettings(showNotification = true) {
    try {
      await chrome.storage.sync.set(currentSettings);
      
      // Verify the save succeeded
      const verification = await chrome.storage.sync.get(['autoOpenNewTab', 'autoOpenDelay']);
      
      // Notify content scripts of changes
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'settings_updated',
            settings: {
              language: currentSettings.language,
              defaultSearchEngine: currentSettings.defaultSearchEngine,
              searchTabs: currentSettings.searchTabs,
              searchBookmarks: currentSettings.searchBookmarks,
              searchHistory: currentSettings.searchHistory,
              maxResults: currentSettings.maxResults,
              searchDelay: currentSettings.searchDelay,
              autoOpenNewTab: currentSettings.autoOpenNewTab,
              autoOpenDelay: currentSettings.autoOpenDelay,
              shortcutToggleCommandbar: currentSettings.shortcutToggleCommandbar,
              shortcutEditCurrentUrl: currentSettings.shortcutEditCurrentUrl,
              excludedWebsites: currentSettings.excludedWebsites
            }
          }).catch(() => {
            // Ignore errors from tabs that cannot receive messages
          });
        });
      });
      
      if (showNotification) {
      showToast(i18n.t('options.messages.settingsSaved'), 'success');
      
      // Button visual effect
      const saveButton = document.getElementById('save-options');
        if (saveButton) {
      saveButton.style.transform = 'scale(0.95)';
      setTimeout(() => {
        saveButton.style.transform = 'scale(1)';
      }, 150);
        }
      }
      
    } catch (error) {
      console.error('Error saving settings:', error);
      if (showNotification) {
      showToast(i18n.t('options.messages.errors.savingSettings'), 'error');
      }
    }
  }
  
  // Clear cache
  async function clearCache() {
    try {
      await chrome.storage.local.clear();
      showToast(i18n.t('options.messages.cacheCleared'), 'success');
    } catch (error) {
      console.error('Error clearing cache:', error);
      showToast(i18n.t('options.messages.errors.clearingCache'), 'error');
    }
  }
  
  // Clear statistics
  async function clearStats() {
    try {
      await chrome.storage.local.remove(['usage_stats', 'performance_metrics']);
      showToast(i18n.t('options.messages.statsCleared'), 'success');
    } catch (error) {
      console.error('Error clearing statistics:', error);
      showToast(i18n.t('options.messages.errors.clearingStats'), 'error');
    }
  }
  
  // Reset all settings
  async function resetAllSettings() {
    try {
      await chrome.storage.sync.clear();
      await chrome.storage.local.clear();
      
      currentSettings = { ...defaultSettings };
      applySettingsToUI();
      
      showToast(i18n.t('options.messages.settingsReset'), 'success');
    } catch (error) {
      console.error('Error resetting settings:', error);
      showToast(i18n.t('options.messages.errors.resettingSettings'), 'error');
    }
  }
  
  // Export settings
  function exportSettings() {
    const dataStr = JSON.stringify(currentSettings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `commandbar-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showToast(i18n.t('options.messages.settingsExported'), 'success');
  }
  
  // Import settings
  function importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const importedSettings = JSON.parse(e.target.result);
          
          // Validate settings
          const validSettings = {};
          Object.keys(defaultSettings).forEach(key => {
            if (importedSettings.hasOwnProperty(key)) {
              validSettings[key] = importedSettings[key];
            }
          });
          
          currentSettings = { ...defaultSettings, ...validSettings };
          applySettingsToUI();
          
          showToast(i18n.t('options.messages.settingsImported'), 'success');
        } catch (error) {
          console.error('Error importing settings:', error);
          showToast(i18n.t('options.messages.invalidFile'), 'error');
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  }
  
  // Show confirmation modal
  function showConfirmModal(title, message, onConfirm) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    
    // Actualizar textos de botones con traducciones actuales
    document.getElementById('modal-cancel-text').textContent = i18n.t('options.buttons.cancel');
    document.getElementById('modal-confirm-text').textContent = i18n.t('options.buttons.confirm');
    
    document.getElementById('modal-overlay').style.display = 'flex';
    
    // Configure the confirm button
    const confirmButton = document.getElementById('modal-confirm');
    const cancelButton = document.getElementById('modal-cancel');
    const closeButton = document.getElementById('modal-close');
    
    confirmButton.onclick = function() {
      onConfirm();
      hideModal();
    };
    
    cancelButton.onclick = hideModal;
    closeButton.onclick = hideModal;
  }
  
  // Ocultar modal
  function hideModal() {
    document.getElementById('modal-overlay').style.display = 'none';
  }
  
  // Show toast
  function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toast-icon');
    const messageEl = document.getElementById('toast-message');
    
    // Icons per type
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    // Colores por tipo
    const colors = {
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      info: '#007bff'
    };
    
    icon.textContent = icons[type] || icons.info;
    messageEl.textContent = message;
    toast.style.background = colors[type] || colors.info;
    toast.style.display = 'flex';
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
      toast.style.display = 'none';
    }, 4000);
  }
  
  // Handle keyboard
  function handleKeyboard(e) {
    // Ctrl+S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveSettings();
    }
    
    // Escape para cerrar modal
    if (e.key === 'Escape') {
      hideModal();
    }
  }
  
  // Enlaces del footer
  function viewChangelog() {
    window.open('https://github.com/kennysamuerto/commandbar-pro/blob/main/CHANGELOG.md', '_blank');
  }
  
  function reportBug() {
    window.open('https://github.com/kennysamuerto/commandbar-pro/issues/new', '_blank');
  }
  
  function viewSource() {
    window.open('https://github.com/kennysamuerto/commandbar-pro', '_blank');
  }
  
  // Toggle the stats panel
  async function toggleStatsPanel() {
    const panel = document.getElementById('stats-panel');
    const button = document.getElementById('view-stats');
    
    if (panel.style.display === 'none') {
      panel.style.display = 'block';
      button.querySelector('span:last-child').textContent = i18n.t('options.buttons.cancel');
      await loadAndDisplayStats();
    } else {
      panel.style.display = 'none';
      button.querySelector('span:last-child').textContent = i18n.t('options.privacy.viewStats');
    }
  }
  
  // Refresh statistics
  async function refreshStats() {
    await loadAndDisplayStats();
    showToast(i18n.t('options.privacy.refreshStats') + ' ✓', 'success');
  }
  
  // Load and display statistics
  async function loadAndDisplayStats() {
    const loading = document.getElementById('stats-loading');
    const dataDiv = document.getElementById('stats-data');
    
    loading.style.display = 'block';
    dataDiv.style.display = 'none';
    
    try {
      // Check whether the user enabled stats
      const { storeUsageStats } = await chrome.storage.sync.get(['storeUsageStats']);
      
      if (!storeUsageStats) {
        dataDiv.innerHTML = `
          <div style="text-align: center; color: #6c757d; padding: 20px;">
            <span style="font-size: 24px;">📊</span>
            <p>${i18n.t('options.privacy.statsEmpty')}</p>
          </div>
        `;
        loading.style.display = 'none';
        dataDiv.style.display = 'block';
        return;
      }
      
      // Load statistics from storage
      const result = await chrome.storage.local.get(['usage_stats']);
      const stats = result.usage_stats || {};
      
      if (Object.keys(stats).length === 0) {
        dataDiv.innerHTML = `
          <div style="text-align: center; color: #6c757d; padding: 20px;">
            <span style="font-size: 24px;">📊</span>
            <p>${i18n.t('options.privacy.noStats')}</p>
          </div>
        `;
        loading.style.display = 'none';
        dataDiv.style.display = 'block';
        return;
      }
      
      // Process statistics
      const processedStats = processStatsData(stats);
      
      // Generar HTML
      dataDiv.innerHTML = generateStatsHTML(processedStats);
      
      loading.style.display = 'none';
      dataDiv.style.display = 'block';
      
    } catch (error) {
      console.error('Error loading stats:', error);
      dataDiv.innerHTML = `
        <div style="text-align: center; color: #dc3545; padding: 20px;">
          <span style="font-size: 24px;">❌</span>
          <p>Error loading statistics</p>
        </div>
      `;
      loading.style.display = 'none';
      dataDiv.style.display = 'block';
    }
  }
  
  // Process statistics data
  function processStatsData(stats) {
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();
    
    // Initialize counters
    const processed = {
      today: {},
      yesterday: {},
      last7days: {},
      last30days: {},
      total: {}
    };
    
    // Process each day
    Object.entries(stats).forEach(([date, dayStats]) => {
      const dayDate = new Date(date);
      const daysDiff = Math.floor((now - dayDate) / (24 * 60 * 60 * 1000));
      
      Object.entries(dayStats).forEach(([action, count]) => {
        // Only process top-level metrics (skip details)
        if (!action.endsWith('_details')) {
          // Total
          processed.total[action] = (processed.total[action] || 0) + count;
          
          // Hoy
          if (date === today) {
            processed.today[action] = count;
          }
          
          // Ayer
          if (date === yesterday) {
            processed.yesterday[action] = count;
          }
          
          // Last 7 days
          if (daysDiff <= 7) {
            processed.last7days[action] = (processed.last7days[action] || 0) + count;
          }
          
          // Last 30 days
          if (daysDiff <= 30) {
            processed.last30days[action] = (processed.last30days[action] || 0) + count;
          }
        }
      });
    });
    
    return processed;
  }
  
  // Generate stats HTML
  function generateStatsHTML(stats) {
    const periods = [
      { key: 'today', label: i18n.t('options.privacy.statsLabels.today') },
      { key: 'yesterday', label: i18n.t('options.privacy.statsLabels.yesterday') },
      { key: 'last7days', label: i18n.t('options.privacy.statsLabels.last7days') },
      { key: 'last30days', label: i18n.t('options.privacy.statsLabels.last30days') },
      { key: 'total', label: i18n.t('options.privacy.statsLabels.total') }
    ];
    
    let html = '<div style="display: grid; gap: 15px;">';
    
    periods.forEach(period => {
      const periodStats = stats[period.key];
      if (Object.keys(periodStats).length > 0) {
        html += `
          <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6;">
            <h4 style="margin: 0 0 10px 0; color: #495057; font-size: 14px; font-weight: 600;">
              ${period.label}
            </h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
        `;
        
        Object.entries(periodStats).forEach(([action, count]) => {
          const label = i18n.t(`options.privacy.statsLabels.${action}`) || action;
          html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background: #f8f9fa; border-radius: 4px;">
              <span style="font-size: 13px; color: #6c757d;">${label}</span>
              <span style="font-size: 13px; font-weight: 600; color: #007bff;">${count}</span>
            </div>
          `;
        });
        
        html += '</div></div>';
      }
    });
    
    html += '</div>';
    
    return html;
  }
  
  // Inject animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .theme-light {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%) !important;
    }
    
    .theme-dark {
      background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%) !important;
      color: #e0e0e0 !important;
    }
    
    .theme-dark .options-container {
      background: #1e1e1e !important;
    }
    
    .theme-dark .option-section {
      background: #2d2d2d !important;
      border-color: #404040 !important;
    }
  `;
  document.head.appendChild(style);
  
     // Track options page usage (run on load)
   chrome.storage.local.get(['usage_stats'], (result) => {
     const stats = result.usage_stats || {};
     const today = new Date().toDateString();
     
     if (!stats[today]) {
       stats[today] = {};
     }
     
     stats[today]['options_page_opened'] = (stats[today]['options_page_opened'] || 0) + 1;
     
     chrome.storage.local.set({ usage_stats: stats });
   });
   
   // ===== ULTRA CACHE MANAGEMENT =====
   
   // Initialize ULTRA cache section
   async function initializeCacheSection() {
     try {
       // Load initial ULTRA cache info
       await updateUltraCacheInfo();
       
       // Configure event listeners para cache ULTRA
       setupUltraCacheEventListeners();
       
     } catch (error) {
       console.error('Error initializing ULTRA cache section:', error);
     }
   }
   
   // Configure event listeners para cache ULTRA
   function setupUltraCacheEventListeners() {
     // Load ULTRA cache button
     const rebuildCacheBtn = document.getElementById('rebuild-cache');
     if (rebuildCacheBtn) {
       rebuildCacheBtn.addEventListener('click', handleLoadUltraCache);
     }
     
     // Clear cache button
     const clearCacheBtn = document.getElementById('clear-cache');
     if (clearCacheBtn) {
       clearCacheBtn.addEventListener('click', handleClearUltraCache);
     }
     
     // View top domains button
     const viewTopDomainsBtn = document.getElementById('view-top-domains');
     if (viewTopDomainsBtn) {
       viewTopDomainsBtn.addEventListener('click', handleViewTopDomains);
     }
     
     // Statistics button
     const cacheStatsBtn = document.getElementById('cache-stats');
     if (cacheStatsBtn) {
       cacheStatsBtn.addEventListener('click', handleShowCacheStats);
     }
   }
   
   // Update ULTRA cache info
   async function updateUltraCacheInfo() {
     try {
       const response = await chrome.runtime.sendMessage({ action: 'get_ultra_cache_info' });
       
       if (response.success && response.cacheInfo) {
         const info = response.cacheInfo;
         
         const stateElement = document.getElementById('cache-state');
         if (stateElement) {
           if (info.isLoaded && info.integrityValid) {
             const quality = info.loadQuality || 'unknown';
             const qualityText = quality === 'full' ? ' (Full)' :
                               quality === 'partial' ? ' (Partial)' :
                               quality === 'minimal' ? ' (Minimal)' : '';
             stateElement.textContent = `✅ Loaded${qualityText}`;
             stateElement.style.color = '#28a745';
           } else if (info.isLoaded && !info.integrityValid) {
             const integrityDetails = info.integrityDetails;
             const details = integrityDetails ? ` (${integrityDetails.stats.historySize} URLs, ${integrityDetails.stats.domainsSize} domains)` : '';
             stateElement.textContent = `⚠️ Loaded (Invalid)${details}`;
             stateElement.style.color = '#ffc107';
           } else {
             stateElement.textContent = '❌ Not loaded';
             stateElement.style.color = '#dc3545';
           }
         }

         const urlsElement = document.getElementById('cache-urls');
         if (urlsElement) {
           urlsElement.textContent = info.totalUrls?.toLocaleString() || '0';
         }
         
         const domainsElement = document.getElementById('cache-domains');
         if (domainsElement) {
           domainsElement.textContent = info.totalDomains?.toLocaleString() || '0';
         }
         
         const faviconsElement = document.getElementById('cache-favicons');
         if (faviconsElement) {
           faviconsElement.textContent = info.totalFavicons?.toLocaleString() || '0';
         }
         
         const memoryElement = document.getElementById('cache-memory');
         if (memoryElement) {
           memoryElement.textContent = `${info.memoryUsage?.toFixed(2) || '0'} MB`;
         }
         
         const lastUpdateElement = document.getElementById('cache-last-update');
         if (lastUpdateElement) {
           if (info.lastUpdate) {
             const date = new Date(info.lastUpdate);
             lastUpdateElement.textContent = date.toLocaleString();
           } else {
             lastUpdateElement.textContent = 'Never';
           }
         }

         const autoUpdateElement = document.getElementById('cache-auto-update');
         if (autoUpdateElement) {
           autoUpdateElement.textContent = '✅ Active';
           autoUpdateElement.style.color = '#28a745';
         }

       } else {
         console.error('Error fetching ULTRA cache info:', response.error);
       }

     } catch (error) {
       console.error('Error updating ULTRA cache info:', error);
     }
   }

   async function handleLoadUltraCache() {
     try {
       const rebuildBtn = document.getElementById('rebuild-cache');
       const progressContainer = document.getElementById('cache-progress-container');
       const progressText = document.getElementById('progress-text');
       const progressFill = document.getElementById('progress-fill');
       
       if (rebuildBtn) {
         rebuildBtn.disabled = true;
         rebuildBtn.innerHTML = '<span class="button-icon">⚡</span><span>Loading ULTRA...</span>';
       }

       if (progressContainer) {
         progressContainer.style.display = 'block';
       }

       const progressListener = (message) => {
         if (message.action === 'ultra_cache_progress') {
           if (progressText) progressText.textContent = message.progress;

           if (message.progress.includes('Processing...')) {
             const match = message.progress.match(/(\d+)\/(\d+)/);
             if (match && progressFill) {
               const current = parseInt(match[1]);
               const total = parseInt(match[2]);
               const percentage = (current / total) * 100;
               progressFill.style.width = `${percentage}%`;
             }
           }
         }
       };

       chrome.runtime.onMessage.addListener(progressListener);

       const response = await chrome.runtime.sendMessage({ action: 'load_ultra_cache' });

       chrome.runtime.onMessage.removeListener(progressListener);

       if (response.success) {
         showToast('✅ ULTRA cache loaded successfully', 'success');
         if (progressText) progressText.textContent = '✅ ULTRA load complete';
         if (progressFill) progressFill.style.width = '100%';
       } else {
         showToast(`❌ Error: ${response.error}`, 'error');
         if (progressText) progressText.textContent = `❌ Error: ${response.error}`;
       }

       await updateUltraCacheInfo();

       setTimeout(() => {
         if (rebuildBtn) {
           rebuildBtn.disabled = false;
           rebuildBtn.innerHTML = '<span class="button-icon">⚡</span><span id="rebuild-cache-text">Load ULTRA Cache</span>';
         }
         if (progressContainer) {
           progressContainer.style.display = 'none';
         }
       }, 2000);

     } catch (error) {
       console.error('Error loading ULTRA cache:', error);
       showToast('❌ Error loading ULTRA cache', 'error');
     }
   }

   async function handleClearUltraCache() {
     try {
       const confirmed = await showConfirmModal(
         'Clear ULTRA Cache',
         'Are you sure you want to clear the ULTRA cache? This will remove all history data and cached favicons.',
         async () => {
           const response = await chrome.runtime.sendMessage({ action: 'clear_ultra_cache' });

           if (response.success) {
             showToast('✅ ULTRA cache cleared successfully', 'success');
             await updateUltraCacheInfo();
           } else {
             showToast(`❌ Error: ${response.error}`, 'error');
           }
         }
       );

     } catch (error) {
       console.error('Error clearing ULTRA cache:', error);
       showToast('❌ Error clearing ULTRA cache', 'error');
     }
   }

   async function handleViewTopDomains() {
     try {
       const container = document.getElementById('top-domains-container');
       const list = document.getElementById('top-domains-list');

       if (container) container.style.display = 'block';

       if (list) {
         list.innerHTML = '<div style="text-align: center; padding: 2rem; color: #6c757d;">Loading domains...</div>';
       }

       const response = await chrome.runtime.sendMessage({ action: 'get_top_domains', limit: 20 });

       if (response.success && response.domains && list) {
         const domainsHTML = response.domains.map(domain => {
           const lastVisit = new Date(domain.lastVisit).toLocaleDateString();
           return `
             <div class="domain-item">
               <div class="domain-info">
                 <div class="domain-name">${domain.domain}</div>
                 <div class="domain-stats">Last visit: ${lastVisit}</div>
               </div>
               <div class="domain-count">${domain.count} visits</div>
             </div>
           `;
         }).join('');

         list.innerHTML = domainsHTML || '<div style="text-align: center; padding: 2rem; color: #6c757d;">No domains to show</div>';

       } else if (list) {
         list.innerHTML = '<div style="text-align: center; padding: 2rem; color: #dc3545;">Error loading domains</div>';
       }

     } catch (error) {
       console.error('Error loading top domains:', error);
       const list = document.getElementById('top-domains-list');
       if (list) {
         list.innerHTML = '<div style="text-align: center; padding: 2rem; color: #dc3545;">Error loading domains</div>';
       }
     }
   }

   async function handleShowCacheStats() {
     try {
       const container = document.getElementById('cache-stats-container');
       const content = document.getElementById('cache-stats-content');

       if (container) container.style.display = 'block';

       if (content) {
         content.innerHTML = '<div style="text-align: center; padding: 2rem; color: #6c757d;">Loading statistics...</div>';
       }

       const response = await chrome.runtime.sendMessage({ action: 'get_ultra_cache_info' });

       if (response.success && response.cacheInfo && content) {
         const info = response.cacheInfo;
         const config = response.config;

         const statsHTML = `
           <div style="display: grid; gap: 1rem;">
             <div style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid #e9ecef;">
               <h4 style="margin: 0 0 0.5rem 0; color: #495057;">📊 General Statistics</h4>
               <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem;">
                 <div><strong>Total URLs:</strong> ${info.totalUrls?.toLocaleString() || '0'}</div>
                 <div><strong>Unique domains:</strong> ${info.totalDomains?.toLocaleString() || '0'}</div>
                 <div><strong>Cached favicons:</strong> ${info.totalFavicons?.toLocaleString() || '0'}</div>
                 <div><strong>Memory usage:</strong> ${info.memoryUsage?.toFixed(2) || '0'} MB</div>
               </div>
             </div>

             <div style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid #e9ecef;">
               <h4 style="margin: 0 0 0.5rem 0; color: #495057;">⚙️ Settings</h4>
               <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem;">
                 <div><strong>Max URLs:</strong> ${config?.maxHistoryResults?.toLocaleString() || '100,000'}</div>
                 <div><strong>Max favicons:</strong> ${config?.faviconCacheSize?.toLocaleString() || '1,000'}</div>
                 <div><strong>Auto-update:</strong> ${config?.autoUpdate ? '✅ Active' : '❌ Inactive'}</div>
                 <div><strong>Persistent cache:</strong> ${config?.persistent ? '✅ Active' : '❌ Inactive'}</div>
               </div>
             </div>
           </div>
         `;

         content.innerHTML = statsHTML;

       } else if (content) {
         content.innerHTML = '<div style="text-align: center; padding: 2rem; color: #dc3545;">Error loading statistics</div>';
       }

     } catch (error) {
       console.error('Error loading cache statistics:', error);
       const content = document.getElementById('cache-stats-content');
       if (content) {
         content.innerHTML = '<div style="text-align: center; padding: 2rem; color: #dc3545;">Error loading statistics</div>';
       }
     }
   }

   // ===== CUSTOM KEYBOARD SHORTCUTS =====

   // Reserved browser shortcuts that cannot be overridden
   const RESERVED_SHORTCUTS = [
     'Ctrl+T', 'Ctrl+W', 'Ctrl+N', 'Ctrl+Tab', 'Ctrl+Shift+T', 'Ctrl+Q',
     'Ctrl+L', 'Ctrl+D', 'Ctrl+H', 'Ctrl+J', 'Ctrl+P', 'Ctrl+S',
     'Ctrl+Shift+N', 'Ctrl+Shift+Tab', 'Ctrl+F4', 'Ctrl+Shift+Q',
     'Meta+T', 'Meta+W', 'Meta+N', 'Meta+Tab', 'Meta+Shift+T', 'Meta+Q',
     'Meta+L', 'Meta+D', 'Meta+H', 'Meta+J', 'Meta+P', 'Meta+S',
     'Meta+Shift+N'
   ];

   // Parse a KeyboardEvent into a normalized shortcut string
   function parseKeyEventToShortcut(e) {
     const modifiers = [];
     if (e.ctrlKey) modifiers.push('Ctrl');
     if (e.altKey) modifiers.push('Alt');
     if (e.shiftKey) modifiers.push('Shift');
     if (e.metaKey) modifiers.push('Meta');

     const key = e.key;
     if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
       return null; // Only modifiers pressed
     }

     const normalizedKey = key.length === 1 ? key.toUpperCase() : key;
     return [...modifiers, normalizedKey].join('+');
   }

   // Get platform-aware default shortcut
   function getDefaultShortcut(commandId) {
     const mod = isMacOS() ? 'Meta' : 'Ctrl';
     switch (commandId) {
       case 'toggle': return `${mod}+K`;
       case 'edit': return `${mod}+Shift+K`;
       default: return null;
     }
   }

   // Get the setting key for a command ID
   function getShortcutSettingKey(commandId) {
     return commandId === 'toggle' ? 'shortcutToggleCommandbar' : 'shortcutEditCurrentUrl';
   }

   // Get the other command's ID
   function getOtherCommandId(commandId) {
     return commandId === 'toggle' ? 'edit' : 'toggle';
   }

   // Validate a shortcut string
   function validateShortcut(shortcutStr) {
     if (!shortcutStr) return { valid: false, error: 'empty' };

     const parts = shortcutStr.split('+');
     if (parts.length < 2) return { valid: false, error: 'invalid' };

     const key = parts[parts.length - 1];
     const modifiers = parts.slice(0, -1);

     // Must have at least one modifier
     const validModifiers = ['Ctrl', 'Alt', 'Shift', 'Meta'];
     const hasModifier = modifiers.some(m => validModifiers.includes(m));
     if (!hasModifier) return { valid: false, error: 'invalid' };

     // Key must be a single character or named key (not a modifier)
     if (validModifiers.includes(key)) return { valid: false, error: 'invalid' };

     // Check reserved shortcuts
     if (RESERVED_SHORTCUTS.includes(shortcutStr)) {
       return { valid: false, error: 'reserved' };
     }

     return { valid: true };
   }

   // Check conflict with the other shortcut
   function checkShortcutConflict(commandId, shortcutStr) {
     const otherCommandId = getOtherCommandId(commandId);
     const otherSettingKey = getShortcutSettingKey(otherCommandId);
     const otherShortcut = currentSettings[otherSettingKey] || getDefaultShortcut(otherCommandId);
     return otherShortcut === shortcutStr;
   }

   // Format a shortcut string into <kbd> HTML
   function formatShortcutDisplay(shortcutStr) {
     if (!shortcutStr) return '';
     const parts = shortcutStr.split('+');
     // On Mac, display Meta as Cmd
     const displayParts = parts.map(p => {
       if (p === 'Meta') return isMacOS() ? 'Cmd' : 'Meta';
       return p;
     });
     return displayParts.map(p => `<kbd class="key">${p}</kbd>`).join(' + ');
   }

   // Active recording state
   let activeRecordingCommandId = null;
   let recordingKeydownHandler = null;

   // Initialize shortcut recorders
   function initShortcutRecorders() {
     ['toggle', 'edit'].forEach(commandId => {
       const changeBtn = document.getElementById(`shortcut-change-${commandId}`);
       const resetBtn = document.getElementById(`shortcut-reset-${commandId}`);
       const inputEl = document.getElementById(`shortcut-input-${commandId}`);

       if (changeBtn) {
         changeBtn.addEventListener('click', () => startRecording(commandId));
       }
       if (resetBtn) {
         resetBtn.addEventListener('click', () => resetShortcut(commandId));
       }
       if (inputEl) {
         inputEl.addEventListener('click', () => startRecording(commandId));
       }
     });

     // Apply current settings to the recorder displays
     updateShortcutDisplays();
   }

   // Update all shortcut displays based on current settings
   function updateShortcutDisplays() {
     ['toggle', 'edit'].forEach(commandId => {
       const settingKey = getShortcutSettingKey(commandId);
       const customShortcut = currentSettings[settingKey];
       const displayShortcut = customShortcut || getDefaultShortcut(commandId);

       const keysEl = document.getElementById(`shortcut-keys-${commandId}`);
       const resetBtn = document.getElementById(`shortcut-reset-${commandId}`);

       if (keysEl) {
         keysEl.innerHTML = formatShortcutDisplay(displayShortcut);
       }
       if (resetBtn) {
         resetBtn.style.display = customShortcut ? 'inline-block' : 'none';
       }
     });
   }

   // Start recording a shortcut
   function startRecording(commandId) {
     // Cancel any existing recording
     if (activeRecordingCommandId) {
       cancelRecording();
     }

     activeRecordingCommandId = commandId;

     const inputEl = document.getElementById(`shortcut-input-${commandId}`);
     const keysEl = document.getElementById(`shortcut-keys-${commandId}`);
     const recordingEl = document.getElementById(`shortcut-recording-${commandId}`);
     const changeBtn = document.getElementById(`shortcut-change-${commandId}`);

     if (inputEl) inputEl.classList.add('recording');
     if (keysEl) keysEl.style.display = 'none';
     if (recordingEl) {
       const i18nInstance = window.i18n || i18n;
       recordingEl.textContent = i18nInstance.t('options.keyboard.recordingPrompt');
       recordingEl.style.display = 'inline';
     }
     if (changeBtn) changeBtn.style.display = 'none';

     // Add keydown listener
     recordingKeydownHandler = function(e) {
       e.preventDefault();
       e.stopPropagation();

       if (e.key === 'Escape') {
         cancelRecording();
         return;
       }

       const shortcutStr = parseKeyEventToShortcut(e);
       if (!shortcutStr) return; // Only modifiers pressed, wait for more

       // Validate
       const validation = validateShortcut(shortcutStr);
       if (!validation.valid) {
         const i18nInstance = window.i18n || i18n;
         if (validation.error === 'reserved') {
           showToast(i18nInstance.t('options.keyboard.shortcutReserved'), 'warning');
         } else {
           showToast(i18nInstance.t('options.keyboard.shortcutInvalid'), 'warning');
         }
         return;
       }

       // Check conflict
       if (checkShortcutConflict(commandId, shortcutStr)) {
         const i18nInstance = window.i18n || i18n;
         showToast(i18nInstance.t('options.keyboard.shortcutConflict'), 'warning');
         return;
       }

       // Save the shortcut
       stopRecording(commandId, shortcutStr);
     };

     document.addEventListener('keydown', recordingKeydownHandler, true);

     // Click outside to cancel
     setTimeout(() => {
       document.addEventListener('click', handleRecordingClickOutside, true);
     }, 100);
   }

   // Handle click outside to cancel recording
   function handleRecordingClickOutside(e) {
     if (!activeRecordingCommandId) return;
     const inputEl = document.getElementById(`shortcut-input-${activeRecordingCommandId}`);
     const changeBtn = document.getElementById(`shortcut-change-${activeRecordingCommandId}`);
     if (inputEl && !inputEl.contains(e.target) && changeBtn && !changeBtn.contains(e.target)) {
       cancelRecording();
     }
   }

   // Cancel recording without saving
   function cancelRecording() {
     if (!activeRecordingCommandId) return;

     const commandId = activeRecordingCommandId;
     cleanupRecording(commandId);
     updateShortcutDisplays();
   }

   // Stop recording and save the shortcut
   async function stopRecording(commandId, shortcutStr) {
     cleanupRecording(commandId);

     const settingKey = getShortcutSettingKey(commandId);
     const defaultShortcut = getDefaultShortcut(commandId);

     // If the shortcut is the same as the default, store null
     if (shortcutStr === defaultShortcut) {
       currentSettings[settingKey] = null;
     } else {
       currentSettings[settingKey] = shortcutStr;
     }

     updateShortcutDisplays();
     await saveSettings(false);

     const i18nInstance = window.i18n || i18n;
     showToast(i18nInstance.t('options.keyboard.shortcutSaved'), 'success');
   }

   // Reset shortcut to default
   async function resetShortcut(commandId) {
     const settingKey = getShortcutSettingKey(commandId);
     currentSettings[settingKey] = null;
     updateShortcutDisplays();
     await saveSettings(false);

     const i18nInstance = window.i18n || i18n;
     showToast(i18nInstance.t('options.keyboard.shortcutReset'), 'success');
   }

   // Clean up recording state
   function cleanupRecording(commandId) {
     if (recordingKeydownHandler) {
       document.removeEventListener('keydown', recordingKeydownHandler, true);
       recordingKeydownHandler = null;
     }
     document.removeEventListener('click', handleRecordingClickOutside, true);

     const inputEl = document.getElementById(`shortcut-input-${commandId}`);
     const keysEl = document.getElementById(`shortcut-keys-${commandId}`);
     const recordingEl = document.getElementById(`shortcut-recording-${commandId}`);
     const changeBtn = document.getElementById(`shortcut-change-${commandId}`);

     if (inputEl) inputEl.classList.remove('recording');
     if (keysEl) keysEl.style.display = 'inline';
     if (recordingEl) recordingEl.style.display = 'none';
     if (changeBtn) changeBtn.style.display = 'inline-block';

     activeRecordingCommandId = null;
   }