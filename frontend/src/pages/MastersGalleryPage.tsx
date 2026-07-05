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
      <header className={`bg-white/80 backdrop-blur shadow-sm border-b ${theme.headerBorder}`}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {site.logoUrl ? (
              <img src={site.logoUrl} alt={site.salonName} className="w-10 h-10 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
            )}
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Наши мастера</h1>
          </div>
          <Link to="/" className="bg-brand-500 hover:bg-brand-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            Записаться
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {loading ? <Spinner /> : masters.length === 0 ? (
          <p className="text-center text-gray-400 py-16">Мастера пока не добавлены</p>
        ) : (
          <div className="space-y-10">
            {masters.map(m => {
              const profile = m.masterProfile
              const categories = [...new Set(profile?.masterServices.map(ms => ms.service.category) ?? [])]
              return (
                <section key={m.id} className="bg-white rounded-2xl border border-gray-200 p-6">
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
                      {profile.photos.map(p => (
                        <button key={p.id} onClick={() => setLightbox(p)}
                          className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                          <img src={p.url} alt={p.caption ?? ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
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
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="max-w-3xl max-h-[90vh]">
            <img src={lightbox.url} alt={lightbox.caption ?? ''} className="max-w-full max-h-[85vh] rounded-xl object-contain" />
            {lightbox.caption && <p className="text-center text-white/80 text-sm mt-3">{lightbox.caption}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
