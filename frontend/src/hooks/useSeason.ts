export type Season = 'winter' | 'spring' | 'summer' | 'autumn'

export interface SeasonTheme {
  season: Season
  label: string
  emoji: string
  // Tailwind gradient classes for page background
  gradient: string
  // Header accent
  headerBorder: string
  badge: string
}

const THEMES: Record<Season, SeasonTheme> = {
  winter: {
    season: 'winter',
    label: 'Зима',
    emoji: '❄️',
    gradient: 'from-sky-50 via-white to-blue-50',
    headerBorder: 'border-sky-100',
    badge: 'bg-sky-100 text-sky-700',
  },
  spring: {
    season: 'spring',
    label: 'Весна',
    emoji: '🌸',
    gradient: 'from-pink-50 via-white to-green-50',
    headerBorder: 'border-pink-100',
    badge: 'bg-pink-100 text-pink-700',
  },
  summer: {
    season: 'summer',
    label: 'Лето',
    emoji: '☀️',
    gradient: 'from-amber-50 via-white to-rose-50',
    headerBorder: 'border-amber-100',
    badge: 'bg-amber-100 text-amber-700',
  },
  autumn: {
    season: 'autumn',
    label: 'Осень',
    emoji: '🍂',
    gradient: 'from-orange-50 via-white to-yellow-50',
    headerBorder: 'border-orange-100',
    badge: 'bg-orange-100 text-orange-700',
  },
}

export function seasonForMonth(month: number): Season {
  // month: 0-11
  if (month === 11 || month === 0 || month === 1) return 'winter'
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  return 'autumn'
}

// Optional manual override stored in localStorage ('auto' | season)
export function useSeason(): SeasonTheme {
  const override = (typeof localStorage !== 'undefined' && localStorage.getItem('season')) || 'auto'
  const season: Season = override !== 'auto' && override in THEMES
    ? (override as Season)
    : seasonForMonth(new Date().getMonth())
  return THEMES[season]
}

export const ALL_SEASONS = THEMES
