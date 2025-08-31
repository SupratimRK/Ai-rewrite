# AI Text Rewriter - React-Vite Version

This is a modern React-Vite version of the AI Text Rewriter Chrome extension, maintaining all core features while providing a clean, modern UI with Lucide React icons.

## 🚀 Features

- **Modern React Architecture**: Built with React 18 and Vite for optimal performance
- **Lucide React Icons**: Clean, modern icons throughout the interface
- **Dark Mode Support**: Seamless light/dark theme switching
- **All Original Features**: Complete feature parity with the original extension
  - API key configuration and testing
  - 21 built-in writing modes
  - Custom mode creation and management
  - Usage statistics tracking
  - Settings export/import
  - Keyboard shortcuts
  - Undo functionality

## 🛠️ Development

### Prerequisites
- Node.js 14+ 
- npm or yarn

### Setup
```bash
cd react-version
npm install
```

### Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Chrome Extension Integration
The built files in `dist/` are ready to be used as a Chrome extension:

1. Build the project: `npm run build`
2. Load the extension in Chrome:
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `react-version` folder

## 📋 Component Structure

```
src/
├── components/
│   ├── OptionsPage.jsx      # Main container component
│   ├── GeneralTab.jsx       # API configuration
│   ├── ModesTab.jsx         # Built-in modes management
│   ├── CustomTab.jsx        # Custom modes creation
│   ├── StatsTab.jsx         # Usage statistics
│   ├── HelpTab.jsx          # Documentation and help
│   └── AdvancedTab.jsx      # Advanced settings
├── App.jsx                  # Root component with theme management
├── App.css                  # Global styles with CSS variables
└── main.jsx                 # Application entry point
```

## 🎨 Design System

### Colors
- Primary: `#3b82f6` (Blue)
- Success: `#10b981` (Green)
- Error: `#ef4444` (Red)
- Warning: `#f59e0b` (Orange)

### Typography
- Font Family: Inter, Segoe UI, Roboto, sans-serif
- Base Size: 14px
- Line Height: 1.5

### Spacing
- Border Radius: 6px (sm), 8px (md), 12px (lg)
- Padding/Margin: 8px, 12px, 16px, 20px, 24px, 32px, 40px

## 🔧 Configuration

### Chrome Extension Files
- `manifest.json` - Extension manifest (updated for React build)
- `background.js` - Service worker (unchanged)
- `content.js` - Content script (unchanged)
- `icons/` - Extension icons (unchanged)

### Vite Configuration
- Optimized build output for Chrome extensions
- Proper asset naming for extension compatibility
- Base path set to relative for extension loading

## 🌟 Key Improvements

1. **Modern React Architecture**: Component-based structure for better maintainability
2. **Lucide Icons**: Replaced emoji/Unicode icons with professional Lucide React icons
3. **Better State Management**: Proper React state management with hooks
4. **Responsive Design**: Mobile-friendly responsive layout
5. **Accessible**: Better keyboard navigation and screen reader support
6. **Type Safety Ready**: Structure ready for TypeScript conversion if needed

## 🔄 Migration from Original

The React version maintains 100% feature parity with the original HTML/JS version:

- ✅ All 21 writing modes supported
- ✅ Custom mode creation and editing
- ✅ API key management and testing
- ✅ Usage statistics tracking
- ✅ Settings export/import
- ✅ Dark mode theming
- ✅ Chrome extension compatibility
- ✅ Keyboard shortcuts support

## 📦 Build Output

The build process creates a `dist/` folder containing:
- `index.html` - Main extension page
- `assets/index.css` - Bundled styles
- `assets/index.js` - Bundled JavaScript
- All optimized for Chrome extension loading

## 🎯 Usage in Chrome Extension

The manifest.json has been updated to point to the built React application:
```json
{
  "options_page": "dist/index.html",
  "action": {
    "default_popup": "dist/index.html"
  }
}
```

This allows the React app to function as both the options page and popup for the extension.
