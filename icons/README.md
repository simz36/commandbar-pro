# 🎨 CommandBar Pro Icons

This directory contains different icon variants for the CommandBar Pro extension.

## 📁 Available Icons

### 🔴 Red Icons (Current)
- `icon16_red.svg` - 16px with red background and white magnifier
- `icon32_red.svg` - 32px with red background and white magnifier
- `icon48_red.svg` - 48px with red background and white magnifier
- `icon128_red.svg` - 128px with red background and white magnifier

### 🔵 Blue Icons (Original)
- `icon16.svg` - 16px with blue background and command bar
- `icon32.svg` - 32px (empty, fallback)
- `icon48.svg` - 48px (empty, fallback)
- `icon128.svg` - 128px (empty, fallback)

### 📷 Other Formats
- `icon16.png` - PNG version of the 16px icon
- `_icon16.svg` - Backup file

## 🔄 How to Switch Icons

### To use the red icons (current):
```json
"icons": {
  "16": "icons/icon16_red.svg",
  "32": "icons/icon32_red.svg",
  "48": "icons/icon48_red.svg",
  "128": "icons/icon128_red.svg"
}
```

### To switch back to the blue icons:
```json
"icons": {
  "16": "icons/icon16.svg",
  "32": "icons/icon32.svg",
  "48": "icons/icon48.svg",
  "128": "icons/icon128.svg"
}
```

## ⚙️ Switching Instructions

1. **Edit** the `manifest.json` file
2. **Update** the paths in the `icons` and `action.default_icon` sections
3. **Reload** the extension at `chrome://extensions/`
4. **Verify** the new icons render correctly

## 🎯 Red Icon Features

- ✅ **Modern red background** with smooth gradients
- ✅ **White magnifier** with depth detail
- ✅ **Shadows and highlights** for a professional look
- ✅ **Scalable** — look great at every size
- ✅ **Compatible** with both light and dark mode
- ✅ **Optimized** for the Chrome Web Store

## 📐 Technical Specifications

| Size  | Primary Use            | Detail                              |
|-------|------------------------|-------------------------------------|
| 16px  | Toolbar                | Minimalist, clean lines             |
| 32px  | Menus and tabs         | More detail, light effects          |
| 48px  | Extensions page        | Full detail, gradients              |
| 128px | Chrome Web Store       | Maximum quality, advanced effects   |

## 🎨 Color Palette

### Red Icons:
- **Light red**: `#F87171`
- **Medium red**: `#EF4444`
- **Dark red**: `#DC2626`
- **Deep red**: `#B91C1C`
- **White**: `#FFFFFF`

### Blue Icons:
- **Light blue**: `#667eea`
- **Dark blue**: `#764ba2`
- **White**: `#ffffff`

## 💡 Recommendations

- **Corporate branding**: Use the red icons (more eye-catching)
- **Minimalist style**: Use the blue icons (more subtle)
- **Maximum visibility**: The red ones stand out in the toolbar
- **Consistency**: Keep the same color across the app

## 🔄 Changelog

- **v1.2.0**: Added red icons with magnifier design
- **v1.0.0**: Original blue icons with command bar

---

**💡 Tip**: If you create custom icons, keep the aspect ratio and make sure they remain legible at 16px.
