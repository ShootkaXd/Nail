import { useEffect, useState } from 'react'
import { publicApi } from '../api/public'
import type { SiteConfig } from '../types'

const fallback: SiteConfig = {
  salonName: 'Nail Studio',
  logoUrl: null,
  requisites: { companyName: '', inn: '', ogrn: '', address: '', email: '', phone: '' },
}

let cached: SiteConfig | null = null

export function useSiteConfig(): SiteConfig {
  const [config, setConfig] = useState<SiteConfig>(cached ?? fallback)

  useEffect(() => {
    if (cached) return
    publicApi.getSiteConfig().then(c => { cached = c; setConfig(c) }).catch(() => {})
  }, [])

  return config
}

export function invalidateSiteConfig() {
  cached = null
}
