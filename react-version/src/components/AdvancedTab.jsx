import { useState } from 'react'
import { Moon, Upload, Download, RotateCcw, AlertTriangle } from 'lucide-react'

export default function AdvancedTab({ settings, saveSettings, showStatus, isDarkMode, onThemeToggle }) {
  const [importFile, setImportFile] = useState(null)

  const handleDarkModeToggle = async (checked) => {
    try {
      await saveSettings({ darkMode: checked })
      onThemeToggle()
      showStatus('Theme preference saved!', 'success')
    } catch (error) {
      showStatus('Error saving theme preference: ' + error.message, 'error')
    }
  }

  const exportSettings = () => {
    try {
      const dataStr = JSON.stringify(settings, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `ai-rewriter-settings-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      showStatus('Settings exported successfully!', 'success')
    } catch (error) {
      showStatus('Error exporting settings: ' + error.message, 'error')
    }
  }

  const handleImportFile = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const importedSettings = JSON.parse(e.target.result)
        
        // Validate the imported settings structure
        const validKeys = [
          'geminiApiKey', 'selectedModel', 'maxTextLength', 'enableUndo',
          'enableUsageTracking', 'enableKeyboardShortcuts', 'enabledModes',
          'customModes', 'darkMode'
        ]
        
        const filteredSettings = {}
        validKeys.forEach(key => {
          if (importedSettings.hasOwnProperty(key)) {
            filteredSettings[key] = importedSettings[key]
          }
        })

        if (Object.keys(filteredSettings).length === 0) {
          showStatus('Invalid settings file format', 'error')
          return
        }

        await saveSettings(filteredSettings)
        showStatus('Settings imported successfully! Please refresh to see changes.', 'success')
        
        // Reset file input
        event.target.value = ''
      } catch (error) {
        showStatus('Error importing settings: Invalid file format', 'error')
        event.target.value = ''
      }
    }
    
    reader.readAsText(file)
  }

  const resetAllSettings = async () => {
    const confirmMessage = `Are you sure you want to reset ALL settings to default? This will:

• Clear your API key
• Reset all preferences to default
• Remove all custom modes
• Clear usage statistics

This action cannot be undone.`

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      // Clear localStorage
      localStorage.removeItem('ai-rewriter-settings')
      localStorage.removeItem('ai-rewriter-stats')
      
      // Reset to defaults
      const defaultSettings = {
        geminiApiKey: '',
        selectedModel: 'gemini-2.5-flash',
        maxTextLength: 8000,
        enableUndo: true,
        enableUsageTracking: true,
        enableKeyboardShortcuts: true,
        enabledModes: [],
        customModes: {},
        darkMode: false
      }

      await saveSettings(defaultSettings)
      
      showStatus('All settings have been reset to default. Please refresh the page.', 'success')
    } catch (error) {
      showStatus('Error resetting settings: ' + error.message, 'error')
    }
  }

  return (
    <div>
      <div className="section-title">Advanced Settings</div>
      
      <div className="form-group">
        <label>
          <Moon size={16} style={{ display: 'inline', marginRight: '6px' }} />
          Appearance
        </label>
        <div className="checkbox-group">
          <input
            type="checkbox"
            id="darkModeAdvanced"
            checked={isDarkMode}
            onChange={(e) => handleDarkModeToggle(e.target.checked)}
          />
          <label htmlFor="darkModeAdvanced">Enable dark mode</label>
        </div>
        <div className="help-text" style={{ marginTop: '4px', marginLeft: '24px' }}>
          Switch between light and dark themes for comfortable viewing
        </div>
      </div>

      <div className="section-title" style={{ marginTop: '32px' }}>Data Management</div>
      
      <div className="form-group">
        <label>Settings Backup & Restore</label>
        <div className="help-text" style={{ marginBottom: '16px' }}>
          Export your settings to back them up or share across devices. Import previously exported settings.
        </div>
        <div className="button-group">
          <button onClick={exportSettings} className="secondary">
            <Download size={16} />
            Export Settings
          </button>
          <button 
            onClick={() => document.getElementById('importFileInput').click()} 
            className="secondary"
          >
            <Upload size={16} />
            Import Settings
          </button>
        </div>
        <input
          type="file"
          id="importFileInput"
          accept=".json"
          onChange={handleImportFile}
          style={{ display: 'none' }}
        />
      </div>

      <div className="form-group">
        <label style={{ color: 'var(--error-color)' }}>
          <AlertTriangle size={16} style={{ display: 'inline', marginRight: '6px' }} />
          Danger Zone
        </label>
        <div className="help-text" style={{ marginBottom: '16px', color: 'var(--error-color)' }}>
          <strong>Warning:</strong> This action will permanently delete all your settings, custom modes, 
          and usage statistics. This cannot be undone.
        </div>
        <button onClick={resetAllSettings} className="danger">
          <RotateCcw size={16} />
          Reset All Settings
        </button>
      </div>

      <div className="help-section" style={{ marginTop: '32px' }}>
        <h3>About Data Storage</h3>
        <ul className="feature-list">
          <li><strong>Local Storage:</strong> Settings are stored locally in your browser for quick access</li>
          <li><strong>Chrome Sync:</strong> If available, settings sync across your Chrome browsers</li>
          <li><strong>Privacy:</strong> No data is sent to external servers except for AI processing</li>
          <li><strong>Export Format:</strong> Settings are exported as JSON files for easy backup</li>
        </ul>
      </div>

      <div className="help-section">
        <h3>Performance Tips</h3>
        <ul className="feature-list">
          <li>Use Gemini 2.5 Flash for best speed/quality balance</li>
          <li>Keep text selections under 2000 characters for faster processing</li>
          <li>Disable unused modes to simplify the context menu</li>
          <li>Regular exports ensure you don't lose custom configurations</li>
        </ul>
      </div>

      <div className="tip-box" style={{ marginTop: '24px' }}>
        <span style={{ color: 'var(--success-color)', fontWeight: 'bold', marginRight: '8px' }}>💡</span>
        <div>
          <strong>Backup Recommendation:</strong> Export your settings regularly, especially after creating 
          custom modes or fine-tuning your preferences. This ensures you can quickly restore your 
          configuration if needed.
        </div>
      </div>
    </div>
  )
}