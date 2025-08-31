import { RefreshCw, Trash2 } from 'lucide-react'

export default function StatsTab({ stats, loadStats, showStatus }) {
  const handleRefreshStats = () => {
    loadStats()
    showStatus('Statistics refreshed!', 'success')
  }

  const handleClearStats = () => {
    if (!confirm('Are you sure you want to clear all usage statistics? This action cannot be undone.')) {
      return
    }

    try {
      localStorage.removeItem('ai-rewriter-stats')
      
      // Reset stats in the parent component by calling loadStats
      loadStats()
      
      showStatus('Statistics cleared successfully!', 'success')
    } catch (error) {
      showStatus('Error clearing statistics: ' + error.message, 'error')
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === '-') return '-'
    try {
      return new Date(dateStr).toLocaleDateString()
    } catch {
      return dateStr
    }
  }

  return (
    <div>
      <div className="section-title">Usage Analytics</div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Track your writing improvements and most-used features:
      </p>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{formatNumber(stats.totalRewrites || 0)}</div>
          <div>Total Rewrites</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{formatNumber(stats.totalChars || 0)}</div>
          <div>Characters Processed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.favoriteMode || '-'}</div>
          <div>Most Used Mode</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{formatDate(stats.lastUsed)}</div>
          <div>Last Used</div>
        </div>
      </div>

      {/* Additional detailed stats if available */}
      {stats.modeUsage && Object.keys(stats.modeUsage).length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <div className="section-title">Mode Usage Breakdown</div>
          <div style={{ 
            background: 'var(--card-background)', 
            border: '1px solid var(--card-border)', 
            borderRadius: 'var(--radius-lg)', 
            padding: '20px',
            marginTop: '16px'
          }}>
            {Object.entries(stats.modeUsage)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 10)
              .map(([mode, count]) => (
                <div key={mode} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--card-border)'
                }}>
                  <span style={{ color: 'var(--text-color)', textTransform: 'capitalize' }}>
                    {mode.replace(/_/g, ' ')}
                  </span>
                  <span style={{ 
                    color: 'var(--primary-color)', 
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>
                    {count} uses
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="button-group" style={{ marginTop: '32px' }}>
        <button onClick={handleRefreshStats} className="secondary">
          <RefreshCw size={16} />
          Refresh Stats
        </button>
        <button onClick={handleClearStats} className="danger">
          <Trash2 size={16} />
          Clear All Stats
        </button>
      </div>

      <div className="help-section" style={{ marginTop: '32px' }}>
        <h3>Understanding Your Statistics</h3>
        <ul className="feature-list">
          <li><strong>Total Rewrites:</strong> Number of successful text transformations</li>
          <li><strong>Characters Processed:</strong> Total amount of text you've improved</li>
          <li><strong>Most Used Mode:</strong> Your preferred rewriting style</li>
          <li><strong>Last Used:</strong> When you last used the extension</li>
        </ul>
        <div className="help-text" style={{ marginTop: '16px' }}>
          <strong>Privacy Note:</strong> All statistics are stored locally on your device and never shared. 
          You can disable usage tracking in the General settings if preferred.
        </div>
      </div>
    </div>
  )
}