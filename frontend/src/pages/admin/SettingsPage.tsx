import { useEffect, useRef, useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { publicApi } from '../../api/public'
import { settingsApi, systemApi } from '../../api/admin'
import { invalidateSiteConfig } from '../../hooks/useSiteConfig'
import { previewTheme } from '../../hooks/useTheme'
import { ALL_SEASONS } from '../../hooks/useSeason'
import type { BookingFormConfig, SiteConfig } from '../../types'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

const FIELD_LABELS: Record<string, string> = { name: 'Имя', phone: 'Телефон', email: 'Email', notes: 'Пожелания' }

const FONT_OPTIONS = ['Manrope', 'Inter', 'Nunito Sans', 'Montserrat', 'Marcellus', 'Cormorant Garamond', 'Playfair Display', 'Jost']

export default function SettingsPage() {
  const [config, setConfig] = useState<BookingFormConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [version, setVersion] = useState<{ version: string; commit: string; branch: string } | null>(null)
  const [updateInfo, setUpdateInfo] = useState<{ updateAvailable: boolean; local: string; remote: string; changes: string } | null>(null)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [season, setSeason] = useState(() => localStorage.getItem('season') || 'auto')

  // Site config (salon name, logo, legal requisites)
  const [site, setSite] = useState<SiteConfig | null>(null)
  const [savingSite, setSavingSite] = useState(false)
  const [siteSaved, setSiteSaved] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)

  // Theme (color + font)
  const [theme, setTheme] = useState({ primaryColor: '#A06F50', fontFamily: 'Manrope' })
  const [savingTheme, setSavingTheme] = useState(false)
  const [themeSaved, setThemeSaved] = useState(false)

  useEffect(() => {
    publicApi.getFormConfig().then(setConfig)
    publicApi.getSiteConfig().then(setSite).catch(() => {})
    publicApi.getTheme().then(setTheme).catch(() => {})
    systemApi.version().then(setVersion).catch(() => {})
  }, [])

  const saveSite = async () => {
    if (!site) return
    setSavingSite(true)
    await settingsApi.updateSite(site)
    invalidateSiteConfig()
    setSavingSite(false)
    setSiteSaved(true)
    setTimeout(() => setSiteSaved(false), 2000)
  }

  const onLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    try {
      const updated = await settingsApi.uploadLogo(file)
      setSite(updated as SiteConfig)
      invalidateSiteConfig()
    } finally {
      setLogoUploading(false)
      if (logoRef.current) logoRef.current.value = ''
    }
  }

  const setReq = (key: keyof SiteConfig['requisites'], value: string) =>
    setSite(s => s ? { ...s, requisites: { ...s.requisites, [key]: value } } : s)

  const save = async () => {
    if (!config) return
    setSaving(true)
    await settingsApi.updateBookingForm(config)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const updateThemeField = (patch: Partial<typeof theme>) => {
    const next = { ...theme, ...patch }
    setTheme(next)
    previewTheme(next) // live preview across the whole admin UI as you edit
  }

  const saveTheme = async () => {
    setSavingTheme(true)
    await settingsApi.updateTheme(theme)
    setSavingTheme(false)
    setThemeSaved(true)
    setTimeout(() => setThemeSaved(false), 2000)
  }

  const checkUpdates = async () => {
    setCheckingUpdate(true)
    try { setUpdateInfo(await systemApi.checkUpdates()) }
    catch { setUpdateInfo(null) }
    finally { setCheckingUpdate(false) }
  }

  if (!config) return <div className="p-6 text-gray-400">Загрузка...</div>

  const fields = config.fields
  const fieldKeys = Object.keys(fields) as Array<keyof typeof fields>

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Настройки</h1>

      {/* Salon identity & legal requisites */}
      {site && (
        <section className="surface p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Салон: название, логотип, реквизиты</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {site.logoUrl ? (
                <img src={site.logoUrl} alt="Логотип" className="w-14 h-14 rounded-xl object-cover border border-gray-200" />
              ) : (
                <div className="w-14 h-14 bg-brand-500 rounded-xl flex items-center justify-center text-white">
                  <Sparkles className="w-6 h-6" />
                </div>
              )}
              <div>
                <input ref={logoRef} type="file" accept="image/*" onChange={onLogoFile} className="hidden" />
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => logoRef.current?.click()} loading={logoUploading}>
                    Загрузить логотип
                  </Button>
                  {site.logoUrl && (
                    <Button variant="ghost" size="sm" onClick={() => setSite(s => s ? { ...s, logoUrl: null } : s)}>
                      Убрать
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">JPG/PNG/WEBP, до 5 МБ. Показывается в шапке сайта.</p>
              </div>
            </div>

            <Input label="Название салона" value={site.salonName}
              onChange={e => setSite(s => s ? { ...s, salonName: e.target.value } : s)} />

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Реквизиты (152-ФЗ): показываются в подвале сайта и политике обработки персональных данных
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input label="ИП / ООО (оператор ПДн)" placeholder="ИП Иванова Анна Петровна"
                  value={site.requisites.companyName} onChange={e => setReq('companyName', e.target.value)} />
                <Input label="ИНН" placeholder="123456789012"
                  value={site.requisites.inn} onChange={e => setReq('inn', e.target.value)} />
                <Input label="ОГРН / ОГРНИП" placeholder="312345678900012"
                  value={site.requisites.ogrn} onChange={e => setReq('ogrn', e.target.value)} />
                <Input label="Адрес" placeholder="г. Москва, ул. Ленина 10"
                  value={site.requisites.address} onChange={e => setReq('address', e.target.value)} />
                <Input label="E-mail для обращений" placeholder="salon@mail.ru"
                  value={site.requisites.email} onChange={e => setReq('email', e.target.value)} />
                <Input label="Телефон" placeholder="+7 (900) 123-45-67"
                  value={site.requisites.phone} onChange={e => setReq('phone', e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={saveSite} loading={savingSite}>Сохранить</Button>
              {siteSaved && <span className="text-sm text-green-600 flex items-center gap-1"><Check className="w-4 h-4" /> Сохранено</span>}
            </div>
          </div>
        </section>
      )}

      {/* Colors & fonts */}
      <section className="surface p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-1">Оформление: цвет и шрифт</h2>
        <p className="text-sm text-gray-500 mb-4">Основной цвет сайта (кнопки, ссылки, акценты) и шрифт текста.</p>

        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Основной цвет</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.primaryColor}
                onChange={e => updateThemeField({ primaryColor: e.target.value })}
                className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
              />
              <Input
                value={theme.primaryColor}
                onChange={e => updateThemeField({ primaryColor: e.target.value })}
                className="w-28 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Шрифт</label>
            <select
              value={theme.fontFamily}
              onChange={e => updateThemeField({ fontFamily: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm h-10"
              style={{ fontFamily: theme.fontFamily }}
            >
              {FONT_OPTIONS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
            </select>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 mb-4" style={{ fontFamily: theme.fontFamily }}>
          <p className="text-xs text-gray-400 mb-2">Предпросмотр</p>
          <div className="flex items-center gap-3">
            <button type="button" className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: theme.primaryColor }}>
              Записаться
            </button>
            <span className="text-sm" style={{ color: theme.primaryColor }}>Ссылка примера</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={saveTheme} loading={savingTheme}>Сохранить оформление</Button>
          {themeSaved && <span className="text-sm text-green-600 flex items-center gap-1"><Check className="w-4 h-4" /> Сохранено</span>}
        </div>
      </section>

      {/* Booking form */}
      <section className="surface p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Форма записи для клиентов</h2>
        <div className="space-y-4">
          <Input label="Заголовок" value={config.title} onChange={e => setConfig({ ...config, title: e.target.value })} />
          <Input label="Подзаголовок" value={config.subtitle} onChange={e => setConfig({ ...config, subtitle: e.target.value })} />

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Поля формы контактов</p>
            <div className="space-y-2">
              {fieldKeys.map(key => {
                const f = fields[key]
                const locked = key === 'name' || key === 'phone'
                return (
                  <div key={key} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <span className="w-24 text-sm font-medium text-gray-700">{FIELD_LABELS[key]}</span>
                    <Input
                      className="flex-1"
                      value={f.label}
                      onChange={e => setConfig({ ...config, fields: { ...fields, [key]: { ...f, label: e.target.value } } })}
                    />
                    <label className="flex items-center gap-1 text-xs text-gray-600">
                      <input type="checkbox" checked={f.enabled} disabled={locked}
                        onChange={e => setConfig({ ...config, fields: { ...fields, [key]: { ...f, enabled: e.target.checked } } })}
                        className="accent-brand-500" /> Показывать
                    </label>
                    <label className="flex items-center gap-1 text-xs text-gray-600">
                      <input type="checkbox" checked={f.required} disabled={locked}
                        onChange={e => setConfig({ ...config, fields: { ...fields, [key]: { ...f, required: e.target.checked } } })}
                        className="accent-brand-500" /> Обязательно
                    </label>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">Поля «Имя» и «Телефон» всегда обязательны.</p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={save} loading={saving}>Сохранить форму</Button>
            {saved && <span className="text-sm text-green-600 flex items-center gap-1"><Check className="w-4 h-4" /> Сохранено</span>}
          </div>
        </div>
      </section>

      {/* Seasonal theme */}
      <section className="surface p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-1">Оформление по временам года</h2>
        <p className="text-sm text-gray-500 mb-4">Тема оформления страницы записи. «Авто» — определяется по текущей дате.</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { localStorage.setItem('season', 'auto'); setSeason('auto') }}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${season === 'auto' ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-300 text-gray-700 hover:border-brand-300'}`}>
            Авто
          </button>
          {Object.values(ALL_SEASONS).map(s => (
            <button key={s.season} onClick={() => { localStorage.setItem('season', s.season); setSeason(s.season) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition flex items-center gap-1.5 ${season === s.season ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-300 text-gray-700 hover:border-brand-300'}`}>
              <s.Icon className="w-4 h-4" /> {s.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">Настройка сохраняется в этом браузере.</p>
      </section>

      {/* Updates */}
      <section className="surface p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Версия и обновления</h2>
        {version && (
          <div className="text-sm text-gray-600 mb-4 space-y-1">
            <p>Версия: <span className="font-mono">{version.version}</span></p>
            <p>Коммит: <span className="font-mono">{version.commit}</span> ({version.branch})</p>
          </div>
        )}
        <Button variant="secondary" onClick={checkUpdates} loading={checkingUpdate}>Проверить обновления</Button>

        {updateInfo && (
          <div className="mt-4 text-sm">
            {updateInfo.updateAvailable ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="font-medium text-amber-800">Доступно обновление ({updateInfo.local} → {updateInfo.remote})</p>
                {updateInfo.changes && <pre className="mt-2 text-xs text-amber-700 whitespace-pre-wrap">{updateInfo.changes}</pre>}
                <p className="mt-3 text-xs text-gray-600">
                  Для применения выполните на сервере: <code className="bg-white px-1.5 py-0.5 rounded">./update.sh</code>
                  {' '}(или <code className="bg-white px-1.5 py-0.5 rounded">docker compose pull && docker compose up -d --build</code>)
                </p>
              </div>
            ) : (
              <p className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">У вас последняя версия</p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
