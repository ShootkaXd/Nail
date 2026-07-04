import { useEffect, useRef, useState } from 'react'
import { masterApi } from '../../api/admin'
import type { MasterPhoto } from '../../types'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export default function PortfolioPage() {
  const [photos, setPhotos] = useState<MasterPhoto[]>([])
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const load = () => masterApi.listPhotos().then(setPhotos)
  useEffect(() => { load() }, [])

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      await masterApi.uploadPhoto(file, caption)
      setCaption('')
      if (fileRef.current) fileRef.current.value = ''
      load()
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка загрузки')
    } finally { setUploading(false) }
  }

  const del = async (id: number) => {
    if (!confirm('Удалить фото?')) return
    await masterApi.deletePhoto(id)
    load()
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Моё портфолио</h1>
      <p className="text-gray-500 text-sm mb-6">Фотографии работ видны клиентам на странице «Наши мастера».</p>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 max-w-lg">
        <Input label="Подпись к фото (необязательно)" value={caption} onChange={e => setCaption(e.target.value)} placeholder="Например: Гель-лак, френч" />
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
        <div className="mt-4">
          <Button onClick={() => fileRef.current?.click()} loading={uploading}>📷 Загрузить фото</Button>
          <p className="text-xs text-gray-400 mt-2">JPG, PNG, WEBP или GIF, до 5 МБ</p>
        </div>
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
      </div>

      {photos.length === 0 ? (
        <p className="text-gray-400">Пока нет фотографий</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map(p => (
            <div key={p.id} className="relative group rounded-xl overflow-hidden bg-gray-100 aspect-square">
              <img src={p.url} alt={p.caption ?? ''} className="w-full h-full object-cover" />
              {p.caption && <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs px-2 py-1 truncate">{p.caption}</span>}
              <button onClick={() => del(p.id)}
                className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
