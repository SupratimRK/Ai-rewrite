import { useState, useEffect } from 'react'
import { Settings, Moon, Sun } from 'lucide-react'
import OptionsPage from './components/OptionsPage'
import './App.css'

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Apply theme to document body
    if (isDarkMode) {
      document.body.setAttribute('data-theme', 'dark')
    } else {
      document.body.removeAttribute('data-theme')
    }
  }, [isDarkMode])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <div className="app">
      <button className="theme-toggle" onClick={toggleTheme}>
        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <OptionsPage isDarkMode={isDarkMode} onThemeToggle={toggleTheme} />
    </div>
  )
}

export default App
