import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('valkovalley-theme')
    // 有手动选择就用，没就跟随系统
    return stored || getSystemTheme()
  })

  // 1. 没有手动选择时，跟随系统变化
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    function onChange() {
      const stored = localStorage.getItem('valkovalley-theme')
      if (!stored) setTheme(getSystemTheme())
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // 2. 同步 className
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('valkovalley-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('valkovalley-theme', next)
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
