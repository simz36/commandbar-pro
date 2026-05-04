// Internationalization system for CommandBar Pro
class I18n {
  constructor() {
    this.currentLanguage = 'en';
    this.translations = {
      en: {
        // Main interface
        appName: 'CommandBar Pro',
        appDescription: 'Advanced Command Bar for Chrome inspired by Arc Browser',
        
        // Placeholders and input texts
        searchPlaceholder: 'Type a search/URL, or activate commands with / ...',
        editUrlPlaceholder: 'Edit current URL',
        
        // Commands
        commands: {
          newTab: 'New Tab',
          newWindow: 'New Window',
          incognito: 'Incognito Window',
          pinTab: 'Pin Tab',
          closeTab: 'Close Tab',
          duplicateTab: 'Duplicate Tab',
          reload: 'Reload Page',
          bookmarks: 'Show Bookmarks',
          history: 'Show History',
          downloads: 'Show Downloads',
          settings: 'Open Settings',
          extensions: 'Manage Extensions',
          readerMode: 'Enable Reader Mode',
          developerMode: 'Developer Mode'
        },
        
        // Command descriptions
        commandDescs: {
          newTab: 'Create new tab',
          newWindow: 'Create new window',
          incognito: 'Incognito window',
          pinTab: 'Pin current tab',
          closeTab: 'Close current tab',
          duplicateTab: 'Duplicate current tab',
          reload: 'Reload page',
          bookmarks: 'Show bookmarks',
          history: 'Show history',
          downloads: 'Show downloads',
          settings: 'Open settings',
          extensions: 'Manage extensions',
          readerMode: 'Enable reader mode',
          developerMode: 'Developer mode'
        },
        
        // Sections
        sections: {
          quickCommands: 'Quick Commands',
          quickAccess: 'Quick Access',
          availableCommands: 'Available Commands',
          webSearch: 'Web Search',
          navigation: 'Navigation',
          openTabs: 'Open Tabs',
          bookmarks: 'Bookmarks',
          history: 'History',
          autocomplete: 'Autocomplete'
        },
        
        // Search
        search: {
          searchInGoogle: 'Search "{query}" in Google',
          searchInBing: 'Search "{query}" in Bing',
          searchInDuckDuckGo: 'Search "{query}" in DuckDuckGo',
          searchInYahoo: 'Search "{query}" in Yahoo',
          searchInPerplexity: 'Search "{query}" in Perplexity',
          goToUrl: 'Go to {url}',
          openInNewTab: 'Open in new tab',
          noResults: 'No commands found'
        },
        
        // Hints and help
        hints: {
          pressEnter: 'Press Enter',
          pressTab: 'Press Tab',
          editMode: 'Edit Mode - All actions open in this tab'
        },
        
        // Actions
        actions: {
          open: 'Open',
          openInNewTab: 'Open in New Tab',
          openInBackground: 'Open in Background',
          close: 'Close',
          pin: 'Pin',
          duplicate: 'Duplicate'
        },
        
        // Cache management
        cache: {
          title: '⚡ ULTRA Cache',
          status: {
            title: 'ULTRA Cache Status',
            description: 'Permanent cache system with preloaded favicons',
            state: 'Status:',
            urls: 'URLs in cache:',
            domains: 'Unique domains:',
            favicons: 'Cached favicons:',
            lastUpdate: 'Last update:',
            memory: 'Memory usage:',
            autoUpdate: 'Auto-update:'
          },
          actions: {
            title: 'ULTRA Cache Actions',
            description: 'Manage the advanced cache system',
            rebuild: 'Load ULTRA Cache',
            clear: 'Clear Cache',
            viewTopDomains: 'View Top Domains',
            stats: 'Statistics'
          },
          config: {
            title: 'Advanced Configuration',
            description: 'Adjust ULTRA cache behavior'
          },
          progress: {
            title: 'ULTRA Load Progress',
            description: 'Processing complete history...'
          },
          topDomains: {
            title: 'Most Visited Domains',
            description: 'The most frequent websites in your history'
          },
          stats: {
            title: 'Detailed Statistics',
            description: 'Complete cache performance information'
          }
        },

        // Popup
        popup: {
          version: 'v1.4.0',
          keyboardShortcuts: 'Keyboard Shortcuts',
          openCommandBar: 'Open Command Bar',
          developerMode: 'Developer mode',
          features: 'Features',
          availableCommands: 'Available Commands',
          searchTypes: 'Search Types',
          configuration: 'Configuration',
          tryCommandBar: 'Try Command Bar',
          advancedSettings: 'Advanced Settings',
          changeLanguage: 'Language Settings',
          
          // Popup messages
          messages: {
            openOptionsManually: 'Open extension options to change language'
          },
          
          // Features
          featureItems: {
            universalSearch: 'Universal Search',
            quickNavigation: 'Quick Navigation',
            tabManagement: 'Tab Management',
            bookmarkAccess: 'Bookmark Access',
            historySearch: 'History Search',
            quickCommands: 'Quick Commands'
          },
          
          // Search types
          searchTypeItems: {
            webSearch: {
              title: 'Web Search',
              desc: 'Search on Google, Bing or DuckDuckGo'
            },
            directNavigation: {
              title: 'Direct Navigation',
              desc: 'Type a URL to navigate'
            },
            openTabs: {
              title: 'Open Tabs',
              desc: 'Search and switch between tabs'
            },
            bookmarks: {
              title: 'Bookmarks',
              desc: 'Search your saved bookmarks'
            },
            history: {
              title: 'History',
              desc: 'Search your browsing history'
            }
          },
          
          // Settings
          settings: {
            darkTheme: 'Dark Theme'
          },
          
          // Tips
          tips: {
            useSlash: 'Use "/" at the start for specific commands',
            directUrl: 'Type a URL for direct navigation'
          },
          
          // Commands
          commands: {
            newTab: 'new tab',
            newTabDesc: 'Create new tab',
            pin: 'pin',
            pinDesc: 'Pin current tab',
            close: 'close',
            closeDesc: 'Close current tab',
            duplicate: 'duplicate',
            duplicateDesc: 'Duplicate current tab',
            bookmarks: 'bookmarks',
            bookmarksDesc: 'Show bookmarks',
            history: 'history',
            historyDesc: 'Show history'
          }
        },
        
        // Options
        options: {
          title: 'CommandBar Pro - Options',
          subtitle: 'Advanced Configuration',
          
          // Main sections
          generalSettings: 'General Settings',
          searchAndResults: 'Search and Results',
          keyboardShortcuts: 'Keyboard Shortcuts',
          privacyAndData: 'Privacy and Data',
          language: 'Language',
          
          // General settings
          general: {
            interfaceTheme: 'Interface Theme',
            interfaceThemeDesc: 'Select CommandBar visual theme',
            animationSpeed: 'Animation Speed',
            animationSpeedDesc: 'Control transition speed',
            maxResults: 'Maximum Results',
            maxResultsDesc: 'Maximum number of suggestions per category',
            
            themeOptions: {
              auto: 'Automatic (System)',
              light: 'Light',
              dark: 'Dark'
            },
            
            animationOptions: {
              slow: 'Slow',
              normal: 'Normal',
              fast: 'Fast',
              none: 'No animations'
            }
          },
          
          // Search settings
          searchSettings: {
            searchSources: 'Search Sources',
            searchSourcesDesc: 'Select where to search for results',
            searchDelay: 'Search Delay (ms)',
            searchDelayDesc: 'Wait time before executing search',
            searchDelayRecommended: 'Recommended',
            defaultSearchEngine: 'Default Search Engine',
            defaultSearchEngineDesc: 'Search engine for web queries',
            
            sources: {
              openTabs: 'Open Tabs',
              bookmarks: 'Bookmarks',
              history: 'History'
            },
            
            engines: {
              google: 'Google',
              bing: 'Bing',
              duckduckgo: 'DuckDuckGo',
              yahoo: 'Yahoo'
            }
          },
          
          // Keyboard shortcuts
          keyboard: {
            mainShortcuts: 'Main Shortcuts',
            mainShortcutsDesc: 'Keyboard combinations for CommandBar',
            openCommandBar: 'Open Command Bar',
            editCurrentUrl: 'Edit current URL',
            developerMode: 'Developer mode',
            additionalConfig: 'Additional Configuration',
            additionalConfigDesc: 'Customize shortcut behavior',
            preventSiteShortcuts: 'Prevent website shortcuts',
            changeShortcut: 'Change',
            resetShortcut: 'Reset',
            recordingPrompt: 'Press your shortcut...',
            pressEscapeToCancel: 'Press Escape to cancel',
            shortcutSaved: 'Shortcut saved successfully',
            shortcutReset: 'Shortcut reset to default',
            shortcutConflict: 'This shortcut is already assigned to another action',
            shortcutInvalid: 'At least one modifier key and a regular key are required',
            shortcutReserved: 'This shortcut is reserved by the browser'
          },

          // Excluded websites
          excludedWebsites: {
            title: 'Excluded Websites',
            description: 'CommandBar will be disabled on sites matching these patterns',
            inputPlaceholder: 'Enter a URL pattern (supports regex)',
            addButton: 'Add',
            noPatterns: 'No patterns configured',
            examples: 'Examples: .*\\.google\\.com, https://mail\\..*',
            invalidRegex: 'Invalid regular expression pattern',
            patternAdded: 'Pattern added successfully',
            patternRemoved: 'Pattern removed successfully',
            duplicatePattern: 'This pattern already exists'
          },

          // Privacy
          privacy: {
            dataCollection: 'Data Collection',
            dataCollectionDesc: 'Control over what data is stored locally',
            dataCleanup: 'Data Cleanup',
            dataCleanupDesc: 'Manage stored data',
            usageStats: 'Usage statistics (local)',
            
            // Privacy actions
            actions: {
              clearCache: 'Clear Cache',
              clearStats: 'Clear Statistics',
              resetAll: 'Reset All'
            },
            
            statsViewer: 'Statistics Viewer',
            statsViewerDesc: 'View locally stored usage statistics',
            viewStats: 'View Statistics',
            refreshStats: 'Refresh',
            noStats: 'No statistics available',
            statsEmpty: 'Enable data collection to view statistics',
            
            actions: {
              open: 'Open',
              openInNewTab: 'Open in New Tab',
              openInBackground: 'Open in Background',
              close: 'Close',
              pin: 'Pin',
              duplicate: 'Duplicate'
            },
            
            // Statistics labels
            statsLabels: {
              commandbar_opened: 'CommandBar opened',
              search_performed: 'Searches performed',
              action_executed: 'Actions executed',
              keyboard_command: 'Keyboard commands',
              url_edit_mode: 'URL edit mode',
              options_page_opened: 'Options page opened',
              today: 'Today',
              yesterday: 'Yesterday',
              total: 'Total',
              last7days: 'Last 7 days',
              last30days: 'Last 30 days'
            }
          },
          
          // Buttons
          buttons: {
            exportSettings: 'Export Settings',
            importSettings: 'Import Settings',
            saveChanges: 'Save Changes',
            cancel: 'Cancel',
            confirm: 'Confirm'
          },
          
          // Footer
          footer: {
            version: 'CommandBar Pro v1.4.0',
            changelog: 'Changelog',
            reportBug: 'Report bug',
            viewSource: 'View source code'
          },
          
          // Messages
          messages: {
            settingsLoaded: 'Settings loaded successfully',
            settingsSaved: 'Settings saved successfully',
            cacheCleared: 'Cache cleared successfully',
            statsCleared: 'Statistics cleared successfully',
            settingsReset: 'Settings reset successfully',
            settingsExported: 'Settings exported successfully',
            settingsImported: 'Settings imported successfully',
            invalidFile: 'Error: Invalid settings file',
            themeChanged: 'Theme changed to: {theme}',
            languageChanged: 'Language changed to: {language}',
            
            errors: {
              loadingSettings: 'Error loading settings',
              savingSettings: 'Error saving settings',
              clearingCache: 'Error clearing cache',
              clearingStats: 'Error clearing statistics',
              resettingSettings: 'Error resetting settings',
              importingSettings: 'Error importing settings'
            }
          },
          
          // Confirmations
          confirmations: {
            clearCache: {
              title: 'Clear Cache',
              message: 'Are you sure you want to clear all cache? This will remove saved search results.'
            },
            clearStats: {
              title: 'Clear Statistics',
              message: 'Are you sure you want to clear all usage statistics?'
            },
            resetAll: {
              title: 'Reset All',
              message: 'Are you sure you want to reset all settings? This action cannot be undone.'
            }
          }
        },
        
        // Experimental functions
        experimental: {
          title: 'Experimental Functions',
          warning: 'Experimental functions are under development and may change in future versions. Use them at your own risk.',
          autoOpenNewTab: 'Auto-open in New Tab',
          autoOpenNewTabDesc: 'Automatically open complete CommandBar when creating new empty tabs (Ctrl+T, + button). Includes all features: tab search, bookmarks, history, and intelligent autocompletion.',
          autoOpenEnabled: 'Enable auto-open',
          autoOpenDelay: 'Auto-open Delay (ms)',
          autoOpenDelayDesc: 'Wait time before opening CommandBar (100ms recommended for fast transition)',
          quickTest: 'Quick Test',
          quickTestDesc: 'Verify if experimental configuration is working correctly',
          testAutoOpen: 'Test Auto-open',
          checkConfig: 'Check Config',
          forceSave: 'Force Save',
          testLanguage: 'Test Language'
        },
        
        // Toasts and notifications
        notifications: {
          success: 'Success',
          error: 'Error',
          warning: 'Warning',
          info: 'Information'
        }
      }
    };
    
    // Load saved language
    this.loadLanguage();
  }

  async loadLanguage() {
    try {
      const lang = await this.getStoredLanguage();

      if (this.translations[lang]) {
        this.currentLanguage = lang;
      } else {
        this.currentLanguage = 'en';
      }
    } catch (error) {
      this.currentLanguage = 'en';
    }
  }
  
  async setLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLanguage = lang;
      try {
        await chrome.storage.sync.set({ language: lang });
      } catch (error) {
        console.error('Error saving language:', error);
      }
    }
  }
  
  t(key, replacements = {}) {
    const keys = key.split('.');
    let value = this.translations[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    if (typeof value === 'string') {
      for (const [placeholder, replacement] of Object.entries(replacements)) {
        value = value.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), replacement);
      }
    }

    return value;
  }
  
  getCurrentLanguage() {
    return this.currentLanguage;
  }
  
  getAvailableLanguages() {
    return Object.keys(this.translations);
  }
}

// Global instance
const i18n = new I18n();

// Para uso en otros archivos
if (typeof window !== 'undefined') {
  window.i18n = i18n;
} 