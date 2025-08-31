import { useState, useEffect } from 'react'
import { Bot, Settings, Palette, BarChart3, HelpCircle, Wrench } from 'lucide-react'
import GeneralTab from './GeneralTab'
import ModesTab from './ModesTab'
import CustomTab from './CustomTab'
import StatsTab from './StatsTab'
import HelpTab from './HelpTab'
import AdvancedTab from './AdvancedTab'

const TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'modes', label: 'Modes', icon: Bot },
  { id: 'custom', label: 'Custom', icon: Palette },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'help', label: 'Help', icon: HelpCircle },
  { id: 'advanced', label: 'Advanced', icon: Wrench },
]

const BUILT_IN_MODES = {
  humanize: "Humanize (Make Natural)",
  grammar: "Fix Grammar & Spelling",
  professional: "Professional Tone",
  polite: "Polite & Courteous",
  casual: "Casual & Friendly",
  confident: "Confident & Assertive",
  empathetic: "Empathetic & Understanding",
  persuasive: "Persuasive & Compelling",
  concise: "Concise & Clear",
  detailed: "Detailed & Comprehensive",
  creative: "Creative & Engaging",
  technical: "Technical & Precise",
  academic: "Academic & Scholarly",
  marketing: "Marketing & Sales",
  cheeky: "Cheeky & Playful",
  newby: "Beginner-Friendly",
  composer: "Compose from Instruction",
  translate: "Translate to English",
  summarize: "Summarize Key Points",
  expand: "Expand & Elaborate",
  simplify: "Simplify & Clarify"
}

export default function OptionsPage({ isDarkMode, onThemeToggle }) {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    geminiApiKey: '',
    selectedModel: 'gemini-2.5-flash',
    maxTextLength: 8000,
    enableUndo: true,
    enableUsageTracking: true,
    enableKeyboardShortcuts: true,
    enabledModes: Object.keys(BUILT_IN_MODES),
    customModes: {},
    darkMode: false
  })
  const [stats, setStats] = useState({
    totalRewrites: 0,
    totalChars: 0,
    favoriteMode: '-',
    lastUsed: '-'
  })
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' })

  useEffect(() => {
    loadSettings()
    loadStats()
  }, [])

  const loadSettings = () => {
    // In a real Chrome extension, this would use chrome.storage.sync.get()
    // For now, we'll use localStorage as a fallback
    try {
      const stored = localStorage.getItem('ai-rewriter-settings')
      if (stored) {
        const parsedSettings = JSON.parse(stored)
        setSettings(prev => ({ ...prev, ...parsedSettings }))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const saveSettings = (newSettings) => {
    try {
      const updatedSettings = { ...settings, ...newSettings }
      setSettings(updatedSettings)
      localStorage.setItem('ai-rewriter-settings', JSON.stringify(updatedSettings))
      
      // In a real Chrome extension, this would also use chrome.storage.sync.set()
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.set(updatedSettings)
      }
      
      return Promise.resolve()
    } catch (error) {
      console.error('Error saving settings:', error)
      return Promise.reject(error)
    }
  }

  const loadStats = () => {
    try {
      const stored = localStorage.getItem('ai-rewriter-stats')
      if (stored) {
        setStats(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const showStatus = (text, type = 'success') => {
    setStatusMessage({ text, type })
    setTimeout(() => setStatusMessage({ text: '', type: '' }), 3000)
  }

  const tabProps = {
    settings,
    saveSettings,
    stats,
    loadStats,
    showStatus,
    builtInModes: BUILT_IN_MODES,
    isDarkMode,
    onThemeToggle
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralTab {...tabProps} />
      case 'modes':
        return <ModesTab {...tabProps} />
      case 'custom':
        return <CustomTab {...tabProps} />
      case 'stats':
        return <StatsTab {...tabProps} />
      case 'help':
        return <HelpTab {...tabProps} />
      case 'advanced':
        return <AdvancedTab {...tabProps} />
      default:
        return <GeneralTab {...tabProps} />
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1><Bot size={32} style={{ display: 'inline', marginRight: '12px' }} />AI Text Rewriter</h1>
        <div className="subtitle">Powered by Google Gemini AI</div>
      </div>

      <div className="main-content">
        <div className="tabs">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`tab ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {statusMessage.text && (
          <div className={`status-message ${statusMessage.type}`}>
            {statusMessage.text}
          </div>
        )}

        <div className="tab-content active">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}