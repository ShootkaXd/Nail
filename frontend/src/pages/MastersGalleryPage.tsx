import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { publicApi } from '../api/public'
import { useSeason } from '../hooks/useSeason'
import type { GalleryMaster, MasterPhoto } from '../types'
import Spinner from '../components/ui/Spinner'

export default function MastersGalleryPage() {
  const [masters, setMasters] = useState<GalleryMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<MasterPhoto | null>(null)
  const theme = useSeason()

  useEffect(() => {
    publicApi.getMastersGallery().then(setMasters).finally(() => setLoading(false))
  }, [])

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.gradient}`}>
      <header className={`bg-white/80 backdrop-blur shadow-sm border-b ${theme.headerBorder}`}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">💅</div>
            <h1 className="text-xl font-bold text-gray-900">Наши мастера</h1>
          </div>
          <Link to="/" className="bg-rose-500 hover:bg-rose-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">
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
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{m.name}</h2>
                      {profile?.bio && <p className="text-sm text-gray-500 mt-0.5 max-w-2xl">{profile.bio}</p>}
                      {categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {categories.map(c => (
                            <span key={c} className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">{c}</span>
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
