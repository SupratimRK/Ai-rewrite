import { useState } from 'react'
import { Key, Brain, Hash, TestTube, Save } from 'lucide-react'

const AI_MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recommended)' },
  { value: 'gemini-2.5-flash-lite-preview', label: 'Gemini 2.5 Flash Lite' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' },
]

export default function GeneralTab({ settings, saveSettings, showStatus }) {
  const [apiKey, setApiKey] = useState(settings.geminiApiKey)
  const [selectedModel, setSelectedModel] = useState(settings.selectedModel)
  const [maxTextLength, setMaxTextLength] = useState(settings.maxTextLength)
  const [enableUndo, setEnableUndo] = useState(settings.enableUndo)
  const [enableUsageTracking, setEnableUsageTracking] = useState(settings.enableUsageTracking)
  const [enableKeyboardShortcuts, setEnableKeyboardShortcuts] = useState(settings.enableKeyboardShortcuts)
  const [isTestingConnection, setIsTestingConnection] = useState(false)

  const handleSave = async () => {
    try {
      await saveSettings({
        geminiApiKey: apiKey,
        selectedModel,
        maxTextLength: parseInt(maxTextLength),
        enableUndo,
        enableUsageTracking,
        enableKeyboardShortcuts
      })
      showStatus('Settings saved successfully!', 'success')
    } catch (error) {
      showStatus('Error saving settings: ' + error.message, 'error')
    }
  }

  const testApiConnection = async () => {
    if (!apiKey.trim()) {
      showStatus('Please enter an API key first', 'error')
      return
    }

    setIsTestingConnection(true)
    
    try {
      // Simulate API test - in real extension this would make actual API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock success/failure based on key format
      if (apiKey.startsWith('AIza') && apiKey.length > 20) {
        showStatus('API connection successful!', 'success')
      } else {
        showStatus('Invalid API key format. Keys should start with "AIza"', 'error')
      }
    } catch (error) {
      showStatus('Connection test failed: ' + error.message, 'error')
    } finally {
      setIsTestingConnection(false)
    }
  }

  return (
    <div>
      <div className="section-title">API Configuration</div>
      
      <div className="form-group">
        <label htmlFor="apiKey">
          <Key size={16} style={{ display: 'inline', marginRight: '6px' }} />
          Google Gemini API Key
        </label>
        <input
          type="password"
          id="apiKey"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Paste your API key here..."
        />
        <div className="help-text" style={{ marginTop: '8px' }}>
          Get your free API key from{' '}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
            Google AI Studio
          </a>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="selectedModel">
            <Brain size={16} style={{ display: 'inline', marginRight: '6px' }} />
            AI Model
          </label>
          <select
            id="selectedModel"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            {AI_MODELS.map(model => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="maxTextLength">
            <Hash size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Max Text Length
          </label>
          <input
            type="number"
            id="maxTextLength"
            value={maxTextLength}
            onChange={(e) => setMaxTextLength(e.target.value)}
            min="100"
            max="32000"
          />
        </div>
      </div>

      <div className="button-group" style={{ marginBottom: '32px' }}>
        <button onClick={handleSave}>
          <Save size={16} />
          Save Settings
        </button>
        <button 
          onClick={testApiConnection} 
          className="secondary"
          disabled={isTestingConnection}
        >
          <TestTube size={16} />
          {isTestingConnection ? 'Testing...' : 'Test Connection'}
        </button>
      </div>

      <div className="section-title">Features & Preferences</div>

      <div className="form-group">
        <div className="checkbox-group">
          <input
            type="checkbox"
            id="enableUndo"
            checked={enableUndo}
            onChange={(e) => setEnableUndo(e.target.checked)}
          />
          <label htmlFor="enableUndo">Enable undo functionality</label>
        </div>
        <div className="help-text" style={{ marginTop: '4px', marginLeft: '24px' }}>
          Allow reverting text changes with Ctrl+Shift+Z
        </div>
      </div>

      <div className="form-group">
        <div className="checkbox-group">
          <input
            type="checkbox"
            id="enableUsageTracking"
            checked={enableUsageTracking}
            onChange={(e) => setEnableUsageTracking(e.target.checked)}
          />
          <label htmlFor="enableUsageTracking">Enable usage tracking</label>
        </div>
        <div className="help-text" style={{ marginTop: '4px', marginLeft: '24px' }}>
          Track statistics for improvements (stored locally only)
        </div>
      </div>

      <div className="form-group">
        <div className="checkbox-group">
          <input
            type="checkbox"
            id="enableKeyboardShortcuts"
            checked={enableKeyboardShortcuts}
            onChange={(e) => setEnableKeyboardShortcuts(e.target.checked)}
          />
          <label htmlFor="enableKeyboardShortcuts">Enable keyboard shortcuts</label>
        </div>
        <div className="help-text" style={{ marginTop: '4px', marginLeft: '24px' }}>
          Use hotkeys for quick text rewriting
        </div>
      </div>

      <div className="tip-box">
        <span style={{ color: 'var(--success-color)', fontWeight: 'bold', marginRight: '8px' }}>💡</span>
        <div>
          <strong>Pro Tip:</strong> Start with Gemini 2.5 Flash for the best balance of speed, quality, and cost. 
          You can always switch models later based on your needs.
        </div>
      </div>
    </div>
  )
}