# Changelog - CommandBar Pro

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

### [1.4.0] - 2025-08-07

#### ✨ Added
- **🖼️ New Ultra Cache System**: 

#### 🐛 Fixed
- **Stability improvements**: Improvements for stability

### [1.3.0] - 2025-08-01

#### ✨ Added
- **🖼️ New Window Command**: Create new browser windows with `Ctrl+N` shortcut
- **🕵️ Incognito Window Command**: Open incognito windows for private browsing
- **🔄 Reload Tab Command**: Refresh current tab with visual feedback
- **🔧 Developer Mode Command**: Toggle developer tools with `Ctrl+Shift+I`
- **📖 Enhanced Reader Mode**: Improved visual filters with better contrast and saturation
- **🎯 Toast Notifications**: Visual feedback for all command executions

#### 🐛 Fixed
- **Command Execution Issues**: Fixed all non-working commands (pin, close, duplicate, reload)
- **Popup Translations**: Complete translation support for all popup elements
- **Options Page Translations**: Fixed missing translations for privacy actions
- **Duplicate Web Search**: Prevented duplicate web search sections in suggestions
- **Background Script Actions**: Added missing `get_current_tab`, `create_window`, `create_incognito_window`, `reload_tab`, `toggle_devtools` actions

#### 🔧 Changed
- **Removed Edit Current URL**: Replaced with more useful Developer Mode command
- **Improved Error Handling**: Better error management with user-friendly messages
- **Enhanced Translation System**: More robust translation loading with retry mechanisms
- **Updated Keyboard Shortcuts**: Changed `Ctrl+Shift+K` to `Ctrl+Shift+I` for developer mode

#### 🚀 Improved
- **Command Feedback**: All commands now show success/error notifications
- **Translation Robustness**: Aggressive retry system for problematic translations
- **User Experience**: Better visual feedback and error messages
- **Code Quality**: Improved error handling and logging throughout the extension

#### 🔧 Technical
- Added comprehensive background script functions for tab and window management
- Implemented robust translation retry system for options page
- Enhanced content script with better error handling
- Improved i18n system with fallback mechanisms
- Added toast notification system for user feedback

### [1.2.1] - 2025-07-31

#### 🐛 Fixed
- **Console Spam Elimination**: Removed remaining `console.log` statements that were causing error spam in extension management page
- **Content Script Robustness**: Improved initialization error handling for restricted pages (chrome://, about:blank, etc.)
- **Silent Error Handling**: Added proper checks for `chrome.storage` availability before initialization
- **Production Ready**: Clean console output for end users with no unnecessary logging

#### 🔧 Technical
- Enhanced content script initialization with availability checks
- Silent fallback handling for pages where extension APIs are not accessible
- Improved error handling in i18n, options, popup, and background scripts
- Better compatibility with restricted websites and internal Chrome pages

### [1.2.0] - 2025-07-31

#### ✨ Added
- **🧪 Experimental Feature: Auto-open in New Tab**:
  - CommandBar automatically opens when creating new empty tabs (Ctrl+T, + button)
  - **Disabled by default** - optional experimental function
  - Includes custom `new_tab.html` page for fast transition
  - **Complete** CommandBar with all features: tab search, bookmarks, history
  - Smart navigation: same tab from new tab, new tab from other pages
  - Configurable delay (100ms recommended) for smooth transition
  - **No usage tracking** for this experimental feature

#### 🔧 Changed
- **Updated Footer Links**:
  - Changelog now points to official GitHub repository
  - Report Bug uses GitHub Issues instead of email
  - View Source Code points to correct repository
- **Experimental Section**: English hardcoded interface for greater stability

#### 🚀 Improved
- **Production Optimization**:
  - Removed **all debug console.log** (200+ logs cleaned)
  - Only keeps `console.error` for critical errors
  - Clean console for end users
  - Improved performance without unnecessary logging operations
- **System Robustness**:
  - Improved handling of Chrome internal pages (`chrome://`, `about:blank`)
  - Smart fallbacks for content script injection
  - Prevention of infinite loops in auto-open
  - Automatic detection of tabs created by CommandBar

#### 🐛 Fixed
- Translation issues in experimental options section
- Content Security Policy (CSP) conflicts in `new_tab.html`
- Manifest errors with invalid schemes (`chrome-extension://`)
- Unnecessary auto-opening in tabs created by CommandBar for navigation
- Improvements in script injection stability on problematic sites

#### 🔧 Technical
- New tab architecture with custom extension page
- Tab marking system to prevent loops
- Sequential script injection (`i18n.js` → `styles.css` → `content.js`)
- Smart context detection (new tab vs. regular page)
- Optimization of delays and timeouts for better UX
- Code cleanup: experimental debug functions removed

### [1.1.1] - 2025-07-30

#### 🚀 Improved
- **Smart Hybrid Cache**:
  - Cache size increased from 100 to **5000 entries**
  - Queries up to **1000 entries** from complete Chrome history
  - Autocomplete now works with **your entire history**, not just since installation
  - Cache expiration time increased to 60 seconds for better performance
  - Configurable constants for future optimizations

#### 🔧 Technical
- Hybrid cache architecture: local speed + complete history access
- Optimized cleanup algorithm (keeps 2500 most recent entries)
- Updated technical documentation in privacy policy

#### 🐛 Fixed
- Removed unnecessary console warnings for optional interface elements
- `updateElementText` functions now silently handle missing elements
- Initialization errors when i18n system is not immediately available
- More robust initialization with fallbacks to ensure basic functionality
- Defensive translation handling to avoid console errors

### [1.1.0] - 2025-07-30

#### ✨ Added
- **New Edit Mode Shortcut**: `Cmd+Shift+K` (Mac) / `Ctrl+Shift+K` (Windows/Linux)
  - Pre-fills CommandBar with current URL
  - All actions open in current tab
  - Perfect for editing URLs or navigating in same tab

#### 🔧 Changed  
- **Universal Keyboard Shortcuts**:
  - `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux) → Normal CommandBar
  - `Cmd+Shift+K` (Mac) / `Ctrl+Shift+K` (Windows/Linux) → Edit CommandBar
  - **Advantage**: Universal standard for command bars (like GitHub, VSCode, Arc)

#### 🚀 Improved
- **Smart Autocomplete Algorithm**:
  - 200ms debounce to avoid interference with fast typing
  - Hybrid sorting: 70% frequency + 30% recency
  - Priority for exact matches at domain start
  - Better user experience when typing fast

### [1.0.0] - 2025-07-28

#### 🎉 Initial Release

##### ✨ Added
- **Universal Command Bar**: `Ctrl+K` / `Cmd+K` keyboard shortcut for quick access
- **Smart Search**: Find content in tabs, bookmarks and history
- **Direct Navigation**: Type URLs to navigate instantly
- **Quick Commands**: Command system with "/" prefix for specific actions
- **Tab Management**: Create, pin, duplicate, close tabs from CommandBar
- **Web Search**: Integration with Google, Bing and DuckDuckGo
- **Modern Interface**: Clean and responsive design with smooth animations
- **Adaptive Theme**: Automatic support for light and dark mode
- **Options Page**: Advanced configuration with multiple customization options
- **Total Privacy**: All data stays local, no sending to servers

