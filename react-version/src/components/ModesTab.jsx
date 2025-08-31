import { useState } from 'react'
import { Save, RotateCcw, CheckSquare, Square } from 'lucide-react'

const MODE_DESCRIPTIONS = {
  humanize: "Make text sound more natural and conversational",
  grammar: "Correct spelling and grammar errors only",
  professional: "Business-appropriate formal tone",
  polite: "Courteous and respectful language",
  casual: "Friendly, informal conversation style",
  confident: "Assertive and decisive language",
  empathetic: "Understanding and caring tone",
  persuasive: "Compelling and convincing language",
  concise: "Clear and to-the-point",
  detailed: "Comprehensive and thorough explanations",
  creative: "Engaging and imaginative writing",
  technical: "Precise and specification-focused",
  academic: "Formal academic writing style",
  marketing: "Promotional and engaging copy",
  cheeky: "Playful and slightly sarcastic",
  newby: "Simple language for beginners",
  composer: "Generate content from instructions",
  translate: "Convert to English or improve clarity",
  summarize: "Extract key points concisely",
  expand: "Add more detail and explanation",
  simplify: "Make text easier to understand"
}

export default function ModesTab({ settings, saveSettings, showStatus, builtInModes }) {
  const [enabledModes, setEnabledModes] = useState(settings.enabledModes || [])

  const handleModeToggle = (modeKey) => {
    const updatedModes = enabledModes.includes(modeKey)
      ? enabledModes.filter(mode => mode !== modeKey)
      : [...enabledModes, modeKey]
    
    setEnabledModes(updatedModes)
  }

  const handleSave = async () => {
    if (enabledModes.length === 0) {
      showStatus('Please select at least one mode', 'error')
      return
    }

    try {
      await saveSettings({ enabledModes })
      showStatus('Mode settings saved successfully!', 'success')
    } catch (error) {
      showStatus('Error saving modes: ' + error.message, 'error')
    }
  }

  const handleReset = () => {
    const allModes = Object.keys(builtInModes)
    setEnabledModes(allModes)
    showStatus('Mode settings reset to default', 'success')
  }

  const handleSelectAll = () => {
    setEnabledModes(Object.keys(builtInModes))
  }

  const handleDeselectAll = () => {
    setEnabledModes([])
  }

  return (
    <div>
      <div className="section-title">Built-in Rewrite Modes</div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Choose which rewrite modes appear in your context menu. You can enable/disable modes anytime.
      </p>

      <div className="mode-list">
        {Object.entries(builtInModes).map(([key, name]) => {
          const isEnabled = enabledModes.includes(key)
          return (
            <div key={key} className="mode-item">
              <div className="mode-checkbox">
                <input
                  type="checkbox"
                  id={`mode-${key}`}
                  checked={isEnabled}
                  onChange={() => handleModeToggle(key)}
                  style={{ marginRight: '12px' }}
                />
                <div>
                  <div className="mode-label">{name}</div>
                  <div className="mode-description">
                    {MODE_DESCRIPTIONS[key] || 'Advanced text transformation mode'}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="button-group">
        <button onClick={handleSave}>
          <Save size={16} />
          Save Mode Settings
        </button>
        <button onClick={handleReset} className="secondary">
          <RotateCcw size={16} />
          Reset to Default
        </button>
        <button onClick={handleSelectAll} className="secondary">
          <CheckSquare size={16} />
          Select All
        </button>
        <button onClick={handleDeselectAll} className="secondary">
          <Square size={16} />
          Deselect All
        </button>
      </div>

      <div className="tip-box" style={{ marginTop: '24px' }}>
        <span style={{ color: 'var(--success-color)', fontWeight: 'bold', marginRight: '8px' }}>💡</span>
        <div>
          <strong>Tip:</strong> Start with a few essential modes like Humanize, Professional, and Grammar Fix. 
          You can always enable more modes later as you discover what works best for your writing style.
        </div>
      </div>
    </div>
  )
}