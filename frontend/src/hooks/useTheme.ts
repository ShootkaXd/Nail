import { useEffect } from 'react'
import api from '../api/client'
import { generateShades } from '../lib/colorRamp'

export interface ThemeConfig {
  primaryColor: string
  fontFamily: string
}

const FONT_LINK_ID = 'theme-font-link'
let appliedFont: string | null = null

function applyTheme(theme: ThemeConfig) {
  const shades = generateShades(theme.primaryColor)
  const root = document.documentElement.style
  for (const [step, hex] of Object.entries(shades)) {
    root.setProperty(`--brand-${step}`, hex)
  }
  root.setProperty('--font-body', `'${theme.fontFamily}', system-ui, sans-serif`)

  if (appliedFont !== theme.fontFamily) {
    appliedFont = theme.fontFamily
    let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.id = FONT_LINK_ID
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.fontFamily)}:wght@400;500;600;700&display=swap`
  }
}

// Fetches the admin-configured theme once and applies it as CSS variables +
// a Google Font link. Call at the app root so it's active everywhere.
export function useThemeLoader() {
  useEffect(() => {
    api.get<ThemeConfig>('/public/theme').then(({ data }) => applyTheme(data)).catch(() => {})
  }, [])
}

export function previewTheme(theme: ThemeConfig) {
  applyTheme(theme)
}
