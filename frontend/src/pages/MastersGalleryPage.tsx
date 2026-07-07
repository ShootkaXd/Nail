import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Sparkles } from 'lucide-react'
import { publicApi } from '../api/public'
import { useSeason } from '../hooks/useSeason'
import { useSiteConfig } from '../hooks/useSiteConfig'
import SeasonalEffects from '../components/SeasonalEffects'
import PublicFooter from '../components/PublicFooter'
import Avatar from '../components/ui/Avatar'
import type { GalleryMaster, MasterPhoto } from '../types'
import Spinner from '../components/ui/Spinner'

export default function MastersGalleryPage() {
  const [masters, setMasters] = useState<GalleryMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<MasterPhoto | null>(null)
  const theme = useSeason()
  const site = useSiteConfig()

  useEffect(() => {
    publicApi.getMastersGallery().then(setMasters).finally(() => setLoading(false))
  }, [])

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br ${theme.gradient}`}>
      <SeasonalEffects season={theme.season} />
      <header className={`sticky top-0 z-30 glass shadow-sm ${theme.headerBorder}`}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {site.logoUrl ? (
              <img src={site.logoUrl} alt={site.salonName} className="w-10 h-10 rounded-2xl object-cover shrink-0 shadow-sm" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md shadow-brand-500/25">
                <Sparkles className="w-5 h-5" />
              </div>
            )}
            <h1 className="text-lg sm:text-xl font-extrabold text-gradient truncate">Наши мастера</h1>
          </div>
          <Link to="/" className="bg-gradient-to-b from-brand-400 to-brand-600 hover:from-brand-500 hover:to-brand-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-brand-500/25 transition-all active:scale-[0.97]">
            Записаться
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {loading ? <Spinner /> : masters.length === 0 ? (
          <p className="text-center text-gray-400 py-16">Мастера пока не добавлены</p>
        ) : (
          <div className="space-y-10">
            {masters.map((m, i) => {
              const profile = m.masterProfile
              const categories = [...new Set(profile?.masterServices.map(ms => ms.service.category) ?? [])]
              return (
                <section key={m.id} style={{ animationDelay: `${i * 60}ms` }} className="surface p-6 animate-fade-in-up opacity-0 [animation-fill-mode:forwards]">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar name={m.name} url={profile?.avatarUrl} size={64} />
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{m.name}</h2>
                      {profile?.bio && <p className="text-sm text-gray-500 mt-0.5 max-w-2xl">{profile.bio}</p>}
                      {profile?.address && (
                        <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" /> {profile.address}
                        </p>
                      )}
                      {categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {categories.map(c => (
                            <span key={c} className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">{c}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {profile && profile.photos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {profile.photos.map((p, pi) => (
                        <button key={p.id} onClick={() => setLightbox(p)}
                          style={{ animationDelay: `${pi * 30}ms` }}
                          className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 animate-fade-in-up opacity-0 [animation-fill-mode:forwards]">
                          <img src={p.url} alt={p.caption ?? ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                          {p.caption && (
                            <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs px-2 py-1 truncate">{p.caption}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Фотографии работ пока не добавлены</p>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </main>
      <div className="flex-1" />
      <PublicFooter />

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in" onClick={() => setLightbox(null)}>
          <div className="max-w-3xl max-h-[90vh] animate-scale-in">
            <img src={lightbox.url} alt={lightbox.caption ?? ''} className="max-w-full max-h-[85vh] rounded-xl object-contain" />
            {lightbox.caption && <p className="text-center text-white/80 text-sm mt-3">{lightbox.caption}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
