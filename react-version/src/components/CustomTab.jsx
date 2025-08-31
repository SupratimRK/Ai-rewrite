import { useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'

export default function CustomTab({ settings, saveSettings, showStatus }) {
  const [customModeName, setCustomModeName] = useState('')
  const [customModePrompt, setCustomModePrompt] = useState('')
  const [editingMode, setEditingMode] = useState(null)
  const [customModes, setCustomModes] = useState(settings.customModes || {})

  const handleAddCustomMode = async () => {
    const name = customModeName.trim()
    const prompt = customModePrompt.trim()

    if (!name || !prompt) {
      showStatus('Please enter both name and prompt', 'error')
      return
    }

    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '_')
    
    if (customModes[key]) {
      showStatus('A mode with this name already exists', 'error')
      return
    }

    const newCustomModes = {
      ...customModes,
      [key]: { name, prompt }
    }

    try {
      await saveSettings({ customModes: newCustomModes })
      setCustomModes(newCustomModes)
      
      // Clear form
      setCustomModeName('')
      setCustomModePrompt('')
      
      showStatus('Custom mode added successfully!', 'success')
    } catch (error) {
      showStatus('Error adding custom mode: ' + error.message, 'error')
    }
  }

  const handleEditCustomMode = (key) => {
    const mode = customModes[key]
    if (mode) {
      setCustomModeName(mode.name)
      setCustomModePrompt(mode.prompt)
      setEditingMode(key)
    }
  }

  const handleUpdateCustomMode = async () => {
    const name = customModeName.trim()
    const prompt = customModePrompt.trim()

    if (!name || !prompt) {
      showStatus('Please enter both name and prompt', 'error')
      return
    }

    const newCustomModes = {
      ...customModes,
      [editingMode]: { name, prompt }
    }

    try {
      await saveSettings({ customModes: newCustomModes })
      setCustomModes(newCustomModes)
      
      // Clear form and editing state
      setCustomModeName('')
      setCustomModePrompt('')
      setEditingMode(null)
      
      showStatus('Custom mode updated successfully!', 'success')
    } catch (error) {
      showStatus('Error updating custom mode: ' + error.message, 'error')
    }
  }

  const handleDeleteCustomMode = async (key) => {
    if (!confirm('Are you sure you want to delete this custom mode?')) {
      return
    }

    const newCustomModes = { ...customModes }
    delete newCustomModes[key]

    try {
      await saveSettings({ customModes: newCustomModes })
      setCustomModes(newCustomModes)
      showStatus('Custom mode deleted successfully!', 'success')
    } catch (error) {
      showStatus('Error deleting custom mode: ' + error.message, 'error')
    }
  }

  const handleCancelEdit = () => {
    setCustomModeName('')
    setCustomModePrompt('')
    setEditingMode(null)
  }

  return (
    <div>
      <div className="section-title">Custom Rewrite Modes</div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Create your own custom rewrite modes with specific instructions:
      </p>
      
      <div className="custom-form-row">
        <div className="form-group">
          <label htmlFor="customModeName">Mode Name</label>
          <input
            type="text"
            id="customModeName"
            value={customModeName}
            onChange={(e) => setCustomModeName(e.target.value)}
            placeholder="e.g., Formal Academic"
          />
        </div>
        <div className="form-group">
          <label htmlFor="customModePrompt">Prompt Instructions</label>
          <textarea
            id="customModePrompt"
            value={customModePrompt}
            onChange={(e) => setCustomModePrompt(e.target.value)}
            placeholder="Describe how the text should be rewritten..."
            style={{ minHeight: '80px' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {editingMode ? (
            <>
              <button onClick={handleUpdateCustomMode}>
                <Edit size={16} />
                Update Mode
              </button>
              <button onClick={handleCancelEdit} className="secondary">
                Cancel
              </button>
            </>
          ) : (
            <button onClick={handleAddCustomMode}>
              <Plus size={16} />
              Add Mode
            </button>
          )}
        </div>
      </div>

      <div className="tip-box">
        <span style={{ color: 'var(--success-color)', fontWeight: 'bold', marginRight: '8px' }}>💡</span>
        <div>
          <strong>Pro Tip:</strong> Be specific in your instructions. Include tone, style, audience, and any special requirements.
        </div>
      </div>

      <div className="help-text" style={{ marginBottom: '24px' }}>
        <strong>Example prompts:</strong><br />
        • "Rewrite this text in an academic style with proper citations and formal language."<br />
        • "Convert this to a casual, friendly social media post with emojis."<br />
        • "Transform this into a professional business email with corporate tone."
      </div>

      {/* Custom Modes List */}
      <div>
        {Object.keys(customModes).length === 0 ? (
          <div className="help-text" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            No custom modes created yet. Add one above to get started!
          </div>
        ) : (
          Object.entries(customModes).map(([key, mode]) => (
            <div key={key} className="custom-mode">
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-color)' }}>{mode.name}</h4>
              <p style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                {mode.prompt.substring(0, 100)}
                {mode.prompt.length > 100 ? '...' : ''}
              </p>
              <div className="button-group">
                <button 
                  className="small secondary" 
                  onClick={() => handleEditCustomMode(key)}
                >
                  <Edit size={14} />
                  Edit
                </button>
                <button 
                  className="small danger" 
                  onClick={() => handleDeleteCustomMode(key)}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}