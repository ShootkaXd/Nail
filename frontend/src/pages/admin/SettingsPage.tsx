import { useEffect, useState } from 'react'
import { publicApi } from '../../api/public'
import { settingsApi, systemApi } from '../../api/admin'
import type { BookingFormConfig } from '../../types'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

const FIELD_LABELS: Record<string, string> = { name: 'Имя', phone: 'Телефон', email: 'Email', notes: 'Пожелания' }

export default function SettingsPage() {
  const [config, setConfig] = useState<BookingFormConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [version, setVersion] = useState<{ version: string; commit: string; branch: string } | null>(null)
  const [updateInfo, setUpdateInfo] = useState<{ updateAvailable: boolean; local: string; remote: string; changes: string } | null>(null)
  const [checkingUpdate, setCheckingUpdate] = useState(false)

  useEffect(() => {
    publicApi.getFormConfig().then(setConfig)
    systemApi.version().then(setVersion).catch(() => {})
  }, [])

  const save = async () => {
    if (!config) return
    setSaving(true)
    await settingsApi.updateBookingForm(config)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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

      {/* Booking form */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
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
                        className="accent-rose-500" /> Показывать
                    </label>
                    <label className="flex items-center gap-1 text-xs text-gray-600">
                      <input type="checkbox" checked={f.required} disabled={locked}
                        onChange={e => setConfig({ ...config, fields: { ...fields, [key]: { ...f, required: e.target.checked } } })}
                        className="accent-rose-500" /> Обязательно
                    </label>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">Поля «Имя» и «Телефон» всегда обязательны.</p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={save} loading={saving}>Сохранить форму</Button>
            {saved && <span className="text-sm text-green-600">✓ Сохранено</span>}
          </div>
        </div>
      </section>

      {/* Updates */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
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
