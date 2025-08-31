import { ExternalLink, Keyboard, Zap, Brain } from 'lucide-react'

export default function HelpTab() {
  return (
    <div>
      <div className="section-title">Help & Documentation</div>
      
      <div className="help-section">
        <h3>
          <Zap size={20} style={{ display: 'inline', marginRight: '8px' }} />
          Getting Started
        </h3>
        <ol style={{ margin: '12px 0', paddingLeft: '20px' }}>
          <li>Get your API key from{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
              Google AI Studio <ExternalLink size={14} style={{ display: 'inline' }} />
            </a>
          </li>
          <li>Paste it in the General settings tab</li>
          <li>Select your preferred AI model</li>
          <li>Right-click on any text to access rewrite options</li>
        </ol>
      </div>

      <div className="help-section">
        <h3>
          <Keyboard size={20} style={{ display: 'inline', marginRight: '8px' }} />
          Keyboard Shortcuts
        </h3>
        <div className="shortcut-item">
          <span>Humanize Mode</span>
          <span className="shortcut-key">Ctrl+Shift+H</span>
        </div>
        <div className="shortcut-item">
          <span>Professional Mode</span>
          <span className="shortcut-key">Ctrl+Shift+P</span>
        </div>
        <div className="shortcut-item">
          <span>Fix Grammar</span>
          <span className="shortcut-key">Ctrl+Shift+G</span>
        </div>
        <div className="shortcut-item">
          <span>Undo Last Rewrite</span>
          <span className="shortcut-key">Ctrl+Shift+Z</span>
        </div>
      </div>

      <div className="help-grid">
        <div className="help-section">
          <h3>
            <Brain size={20} style={{ display: 'inline', marginRight: '8px' }} />
            AI Models Explained
          </h3>
          
          <div className="model-info">
            <div className="model-name">Gemini 2.5 Flash (Recommended)</div>
            <div className="model-desc">
              Perfect balance of speed, quality, and cost. Best for most use cases with excellent 
              understanding of context and nuanced rewriting.
            </div>
          </div>

          <div className="model-info">
            <div className="model-name">Gemini 2.5 Flash Lite</div>
            <div className="model-desc">
              Cost-efficient option with good quality. Ideal for simple rewrites and high-volume 
              usage where budget is a concern.
            </div>
          </div>

          <div className="model-info">
            <div className="model-name">Gemini 2.0 Flash</div>
            <div className="model-desc">
              Fast and modern with excellent performance. Great for quick rewrites with maintained 
              quality and speed.
            </div>
          </div>

          <div className="model-info">
            <div className="model-name">Gemini 2.0 Flash Lite</div>
            <div className="model-desc">
              Ultra-fast processing for basic text transformations. Best for simple rewrites 
              where speed is priority.
            </div>
          </div>
        </div>

        <div className="help-section">
          <h3>Built-in Modes</h3>
          <ul className="feature-list">
            <li><strong>Humanize:</strong> Make text sound more natural and conversational</li>
            <li><strong>Fix Grammar:</strong> Correct grammatical errors and typos</li>
            <li><strong>Professional:</strong> Formal business communication style</li>
            <li><strong>Polite:</strong> Soften language with respectful phrasing</li>
            <li><strong>Casual:</strong> Informal, conversational style</li>
            <li><strong>Confident:</strong> Strong, decisive language</li>
            <li><strong>Empathetic:</strong> Caring and emotionally aware tone</li>
            <li><strong>Persuasive:</strong> Convincing and motivating language</li>
            <li><strong>Concise:</strong> Remove fluff, get to the point</li>
            <li><strong>Detailed:</strong> Add depth and explanations</li>
            <li><strong>Creative:</strong> Vivid, imaginative language</li>
            <li><strong>Technical:</strong> Accurate technical terminology</li>
            <li><strong>Academic:</strong> Formal academic writing style</li>
            <li><strong>Marketing:</strong> Promotional and engaging copy</li>
            <li><strong>Cheeky:</strong> Witty and slightly sarcastic</li>
            <li><strong>Beginner-Friendly:</strong> Simple language for newcomers</li>
            <li><strong>Compose:</strong> Generate new content from prompts</li>
            <li><strong>Translate:</strong> Translate text from other languages to English</li>
            <li><strong>Summarize:</strong> Extract and condense main ideas</li>
            <li><strong>Expand:</strong> Add more detail and explanation</li>
            <li><strong>Simplify:</strong> Make text easier to understand</li>
          </ul>
        </div>
      </div>

      <div className="help-section">
        <h3>Troubleshooting Common Issues</h3>
        
        <div style={{ marginBottom: '16px' }}>
          <strong style={{ color: 'var(--text-color)' }}>Extension not working?</strong>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Check that your API key is correctly saved</li>
            <li>Verify you're on a regular website (not chrome:// pages)</li>
            <li>Try refreshing the page and extension</li>
            <li>Test the API connection in General settings</li>
          </ul>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <strong style={{ color: 'var(--text-color)' }}>API errors?</strong>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Ensure your API key starts with "AIza"</li>
            <li>Check your internet connection</li>
            <li>Try switching to a different AI model</li>
            <li>Wait a moment if you hit rate limits</li>
          </ul>
        </div>

        <div>
          <strong style={{ color: 'var(--text-color)' }}>Unexpected results?</strong>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Try rephrasing your original text</li>
            <li>Use a different rewrite mode</li>
            <li>Check if content triggered safety filters</li>
            <li>Use the undo feature if needed</li>
          </ul>
        </div>
      </div>

      <div className="help-section">
        <h3>Privacy & Security</h3>
        <ul className="feature-list">
          <li>Your API key is stored securely in your browser</li>
          <li>Text is sent directly to Google's servers, not stored by us</li>
          <li>Usage statistics are kept locally on your device</li>
          <li>No external tracking or analytics</li>
          <li>Open source code for transparency</li>
        </ul>
      </div>

      <div className="tip-box" style={{ marginTop: '32px' }}>
        <span style={{ color: 'var(--success-color)', fontWeight: 'bold', marginRight: '8px' }}>💡</span>
        <div>
          <strong>Need more help?</strong> Visit our{' '}
          <a href="https://github.com/SupratimRK/Ai-rewrite" target="_blank" rel="noopener noreferrer">
            GitHub repository <ExternalLink size={14} style={{ display: 'inline' }} />
          </a>{' '}
          for detailed documentation, troubleshooting guides, and community support.
        </div>
      </div>
    </div>
  )
}