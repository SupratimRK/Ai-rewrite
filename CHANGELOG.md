# Changelog

All notable changes to the AI Text Rewriter Pro extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.5.2] - 2026-09-01

### Added
- Automatic browser/system theme detection (`prefers-color-scheme`) with dynamic synchronization
- Zero-flash initial theme rendering via CSS `@media (prefers-color-scheme: dark)` and light override support

### Changed
- Updated all AI provider presets with curated fast, non-pro models & dynamic evergreen pointers:
  - **OpenAI**: `chat-latest` (default), `gpt-5.6-luna`, `gpt-4o-mini`, `o4-mini`
  - **Google Gemini**: `gemini-flash-lite-latest` (default), `gemini-flash-latest`, `gemini-3.7-flash`, `gemini-3.5-flash-lite`
  - **Groq**: Streamlined provider name (removed "(Ultra-Fast)") and added fast models (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `openai/gpt-oss-20b`, `groq/compound-mini`)
  - **DeepSeek**: `deepseek-v4-flash` (default), `deepseek-v4-flash-vision-exp`, `deepseek-v4-pro`
  - **OpenRouter**: `openrouter/auto` (default), `google/gemini-3.7-flash`, `deepseek/deepseek-v4-flash`, `anthropic/claude-3.5-haiku`
  - **Vercel AI Gateway**: `openai/chat-latest` (default), `openai/gpt-4o-mini`, `google/gemini-3.7-flash`, `anthropic/claude-3-5-haiku`
  - **Ollama**: `llama3.2` (default), `qwen2.5:7b`, `phi4-mini`, `mistral`, `deepseek-r1:8b`

---

## [2.5.1] - 2026-02-08

### Fixed
- Fixed preview mode text injection failing when clicking "Insert" button
- Fixed selection highlighting not working for input/textarea elements
- Improved selection state preservation for reliable text replacement
- Added CSS-based highlighting (golden outline) for input/textarea fields

### Enhanced
- Better error messages when text replacement fails
- Improved cleanup of highlight styles after preview dismiss

---

## [2.5.0] - 2026-02-07

### Changed
- **Major API Migration**: Switched from Google Gemini to OpenAI APIs
- Support for OpenAI-compatible endpoints (LM Studio, Ollama, Vercel AI Gateway)

### Added
- 21 Professional Writing Modes (up from 17)
- Custom API base URL support for third-party providers
- Enhanced model selection (GPT-4o, GPT-4o-mini, GPT-3.5-turbo)
- Preview mode with popover UI for reviewing AI suggestions
- Improved keyboard shortcut verification

### Enhanced
- Modernized options page with flat, contemporary design
- Better prompt engineering for more accurate rewrites
- Improved error handling and retry logic
- Updated documentation for OpenAI setup

---

## [2.1.1] - 2025-01-09

### Added
- Repository optimization for better search discoverability
- Comprehensive GitHub repository metadata and templates
- Enhanced package.json with SEO keywords
- GitHub Actions workflow for validation
- Contributing guidelines and documentation

### Enhanced
- Improved manifest.json description for Chrome Web Store
- Better README.md structure with badges and keywords
- SEO-optimized content for Google search visibility

## [2.1.0] - 2024-12-XX

### Added
- Enhanced error handling and user notifications
- Smart notification system with clickable error messages
- Automatic error detection for API keys and network issues
- Progressive error messages with context-aware help

### Improved
- Better user experience with informative error messages
- Native Chrome notifications for setup reminders
- Auto-recovery with intelligent retry logic

## [2.0.0] - 2024-11-XX

### Added
- 🎭 **17 Professional Writing Modes** - From humanize to technical precision
- 🎨 **Custom Mode Creator** - Build your own rewriting styles  
- ↶ **Undo Functionality** - Instantly revert any rewrite
- ⌨️ **Keyboard Shortcuts** - Lightning-fast rewriting with hotkeys
- 📊 **Usage Analytics** - Track your writing improvements
- 🎨 **Modern Options Interface** - Dark mode support and intuitive settings
- 🛡️ **Enhanced Error Handling** - Robust retry logic and user-friendly error messages
- 📢 **Smart Notifications** - Helpful popups that fade away gracefully

### Enhanced
- Multiple Gemini AI model support (2.5 Flash, 2.0 Flash, etc.)
- Improved performance and reliability
- Better user interface and experience
- More comprehensive settings and customization options

## [1.0.0] - 2024-XX-XX

### Added
- Initial release of AI Text Rewriter Pro
- Basic text rewriting functionality
- Google Gemini AI integration
- Context menu integration
- Simple options page

---

For more details on each release, visit the [GitHub Releases](https://github.com/SupratimRK/Ai-rewrite/releases) page.