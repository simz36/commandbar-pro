# CommandBar Pro - Chrome Extension

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-blue?style=for-the-badge&logo=googlechrome)](https://chrome.google.com/webstore/detail/commandbar-pro/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.2.1-brightgreen?style=for-the-badge)](https://github.com/kennysamuerto/commandbar-pro)
[![Privacy First](https://img.shields.io/badge/Privacy-First-ff69b4?style=for-the-badge&logo=shield)](PRIVACY.md)

An advanced Command Bar for Chrome inspired by Arc Browser that allows you to navigate, search and control your browser efficiently.

### ✨ Features

#### 🚀 Main Functionalities
- **Universal keyboard shortcuts**:
  - `Ctrl+K` (or `Cmd+K` on Mac) - Open Command Bar
  - `Ctrl+Shift+K` (or `Cmd+Shift+K` on Mac) - Edit current URL
- **Smart search**: Find tabs, bookmarks and history
- **Direct navigation**: Type URLs to navigate instantly
- **Quick commands**: Execute actions with "/" prefix
- **Web search**: Google, Bing, DuckDuckGo integrated
- **Complete tab management**: Create, pin, duplicate, close
- **Dark/light theme**: Adapts to your preferences
- **Responsive interface**: Works perfectly on any resolution
- **Optimized popup**: 480px width, fully scrollable with balanced design
- **Auto configuration**: Opens automatically on install
- **🧪 Experimental: Auto-open on New Tab**: Automatically opens CommandBar when creating new empty tabs

#### 🎯 Search Types

##### 1. Direct Navigation
```
google.com → Navigate to Google
https://github.com → Open GitHub
brand.com → Detect if open or open new tab
```

##### 2. Commands with "/"
```
/new tab → Create new tab
/pin → Pin current tab
/close → Close current tab
/duplicate → Duplicate current tab
/bookmarks → Open bookmarks manager
/history → Open browser history
/reload → Reload current page
/edit url → Edit current URL
```

##### 3. Universal Search
```
facebook → Search in tabs, bookmarks, history and web
work project → Find related tabs
important document → Search in bookmarks and history
```

### 🛠️ Installation

#### Method 1: From source code
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right corner)
4. Click "Load unpacked extension"
5. Select the `commandbar` folder
6. Done! The extension will be installed
7. **Configuration page will open automatically**

#### Method 2: From Chrome Store
*Coming soon*

### 🎮 Usage

#### Open CommandBar
- **Main shortcut**: `Ctrl+K` (Windows/Linux) or `Cmd+K` (Mac)
- **Edit current URL**: `Ctrl+Shift+K` (Windows/Linux) or `Cmd+Shift+K` (Mac)
- **Click icon**: Click on extension icon
- **Popup button**: "Try Command Bar"

#### Keyboard Navigation
- `Enter`: Execute selected action
- `↑/↓`: Navigate between suggestions
- `Escape`: Close CommandBar

#### Usage Examples

##### Search and Switch Tab
1. Open CommandBar (`Cmd+K` or `Ctrl+K`)
2. Type: `youtube`
3. Select YouTube tab from list
4. Press `Enter`

##### Direct Navigation
1. Open CommandBar (`Cmd+K` or `Ctrl+K`)
2. Type: `github.com`
3. Press `Enter`

##### Edit Current URL
1. Press `Cmd+Shift+K` (or `Ctrl+Shift+K`)
2. Modify the pre-filled URL
3. Press `Enter` to navigate in same tab

##### Web Search
1. Open CommandBar (`Cmd+K` or `Ctrl+K`)
2. Type: `javascript best practices`
3. Select "Search on Google"
4. Press `Enter`

### ⚙️ Configuration

Access configuration from:
- Extension popup → "Advanced Settings"
- Or from `chrome://extensions/` → CommandBar Pro → Options
- **Opens automatically** when installing the extension!

#### Available Options
- **Dark Theme**: Interface with dark colors
- **Search sources**: Customize where to search
- **Search engine**: Google, Bing, DuckDuckGo, Yahoo
- **🧪 Experimental Features**: Auto-open on new tab (disabled by default)

#### APIs Used
- **Chrome Tabs API**: Tab management
- **Chrome Bookmarks API**: Bookmarks access
- **Chrome History API**: History search
- **Chrome Storage API**: Persistent configuration
- **Chrome Commands API**: Keyboard shortcuts
- **Chrome Scripting API**: Script injection

#### Required Permissions
- `tabs`: Tab access and management
- `bookmarks`: Bookmarks reading
- `history`: History search
- `storage`: Save configuration
- `activeTab`: Active tab interaction
- `scripting`: Script injection
- `<all_urls>`: Function on all websites

### 🔧 Development

#### Project Structure
- **Manifest V3**: Latest Chrome extension version
- **Service Worker**: Works without blocking browser
- **Content Scripts**: Non-invasive injection
- **Modern CSS**: Grid, Flexbox, CSS variables
- **Vanilla JavaScript**: No external dependencies

#### Main Files
- `i18n.js`: Translation system
- `background.js`: Main service worker
- `content.js`: CommandBar interface
- `popup.js/html`: Extension popup
- `options.js/html`: Configuration page
- `new_tab.js/html`: Custom new tab page (experimental)

### 🐛 Troubleshooting

#### CommandBar doesn't appear
1. Verify extension is enabled
2. Refresh web page
3. Check error console (`F12`)

#### Shortcuts don't work
1. Verify permissions in `chrome://extensions/`
2. Check conflicts with other shortcuts
3. Reinstall extension if necessary

#### Search finds no results
1. Verify `bookmarks` and `history` permissions
2. Check you have bookmarks/history
3. Try more specific searches

### 📈 Performance

#### Implemented Optimizations
- **Lazy loading**: Load elements on demand
- **Debounce**: Avoid excessive searches while typing (50ms)
- **Optimized indexes**: Fast search in large datasets
- **Memory management**: Automatic resource cleanup
- **Hybrid cache**: 5000 cache entries + access to 1000 complete history entries
- **Smart autocomplete**: Queries all your history, not just since installation

#### Metrics
- **Load time**: < 100ms
- **Search**: < 50ms for local results
- **Memory**: < 10MB typical usage

### 🔒 Privacy and Security

**CommandBar Pro is designed with privacy as a fundamental principle.**

#### 🛡️ Data Protection
- **100% Local**: All data remains on your device
- **No Servers**: We don't send information to external servers
- **No Tracking**: We don't track your browsing behavior
- **No Analytics**: We don't collect usage metrics
- **Open Source**: Total transparency for auditing

#### 📋 Data Access
- **History**: Only for smart autocomplete (temporary)
- **Bookmarks**: Only for searches (temporary)
- **Tabs**: Only for management and switching (temporary)
- **Configuration**: Only user preferences (local)

#### 🔐 What we DON'T do
- ❌ Don't send data to external servers
- ❌ Don't track your browsing
- ❌ Don't share personal information
- ❌ Don't show ads
- ❌ Don't use tracking cookies
- ❌ Don't implement telemetry

#### 📄 Privacy Policy
For detailed information about how we handle your data, see our [complete Privacy Policy](PRIVACY.md).

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### 🤝 Contributions

Contributions are welcome! Please:

1. Fork the project
2. Create a branch for your feature (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 📞 Support

- 🐛 **Issues**: [Report problems](https://github.com/kennysamuerto/commandbar-pro/issues)
- 📧 **Contact**: Open an issue for general questions
- 🔒 **Privacy**: Read our [Privacy Policy](PRIVACY.md)

### 🌟 Credits

Inspired by:
- **Arc Browser**: For its excellent CommandBar
- **Raycast**: For command design
- **Alfred**: For universal search

