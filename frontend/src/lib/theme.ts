import { useEffect, useState } from 'react'

const KEY = 'agri_theme'

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === 'dark'
  } catch {
    return false
  }
}

export function applyStoredTheme() {
  document.documentElement.classList.toggle('dark', read())
}

export function useTheme() {
  const [dark, setDarkState] = useState(read)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem(KEY, dark ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }, [dark])
  return { dark, setDark: setDarkState }
}
