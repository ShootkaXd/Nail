import { useEffect, useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { adminsApi, accountApi, authApi } from '../../api/admin'
import { useAuthStore } from '../../store/auth.store'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import TwoFactorSettings from '../../components/TwoFactorSettings'

interface Admin { id: number; name: string; login: string; email: string | null; createdAt: string }

export default function AdminsPage() {
  const { user } = useAuthStore()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', login: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // change password
  const [pwOpen, setPwOpen] = useState(false)
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  const load = () => adminsApi.list().then(setAdmins)
  useEffect(() => {
    load()
    authApi.me().then((me: unknown) => setTwoFactorEnabled(Boolean((me as { twoFactorEnabled?: boolean }).twoFactorEnabled)))
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await adminsApi.create({ name: form.name, login: form.login, email: form.email || undefined, password: form.password })
      setCreating(false)
      setForm({ name: '', login: '', email: '', password: '' })
      load()
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка')
    } finally { setLoading(false) }
  }

  const del = async (id: number) => {
    if (!confirm('Удалить администратора?')) return
    try { await adminsApi.delete(id); load() }
    catch (e: unknown) { alert((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка') }
  }

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg('')
    setPwSuccess(false)
    if (pw.next !== pw.confirm) return setPwMsg('Пароли не совпадают')
    try {
      await accountApi.changePassword(pw.current, pw.next)
      setPwMsg('Пароль изменён')
      setPwSuccess(true)
      setPw({ current: '', next: '', confirm: '' })
      setTimeout(() => setPwOpen(false), 1200)
    } catch (e: unknown) {
      setPwMsg((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Администраторы</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setPwOpen(true)}>Сменить мой пароль</Button>
          <Button onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4" /> Добавить администратора
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mb-6">
        <TwoFactorSettings enabled={twoFactorEnabled} onChanged={setTwoFactorEnabled} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto max-w-3xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Имя</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Логин</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {admins.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {a.name} {a.id === user?.id && <span className="text-xs text-brand-500">(вы)</span>}
                </td>
                <td className="px-4 py-3 text-gray-600">{a.login}</td>
                <td className="px-4 py-3 text-gray-500">{a.email ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  {a.id !== user?.id && (
                    <button onClick={() => del(a.id)} className="text-red-500 hover:text-red-700 text-xs">Удалить</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="Новый администратор" size="sm">
        <form onSubmit={create} className="space-y-4">
          <Input label="Имя *" value={form.name} onChange={e => set('name', e.target.value)} required />
          <Input label="Логин *" value={form.login} onChange={e => set('login', e.target.value)} required />
          <Input label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          <Input label="Пароль *" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Минимум 8 символов, буквы и цифры" required />
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3">
            <Button variant="secondary" type="button" onClick={() => setCreating(false)}>Отмена</Button>
            <Button type="submit" loading={loading}>Создать</Button>
          </div>
        </form>
      </Modal>

      <Modal open={pwOpen} onClose={() => setPwOpen(false)} title="Смена пароля" size="sm">
        <form onSubmit={changePw} className="space-y-4">
          <Input label="Текущий пароль" type="password" value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} required />
          <Input label="Новый пароль" type="password" value={pw.next} onChange={e => setPw(p => ({ ...p, next: e.target.value }))} placeholder="Минимум 8 символов, буквы и цифры" required />
          <Input label="Повторите новый пароль" type="password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} required />
          {pwMsg && (
            <p className={`text-sm px-3 py-2 rounded-lg flex items-center gap-1.5 ${pwSuccess ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>
              {pwSuccess && <Check className="w-4 h-4 shrink-0" />} {pwMsg}
            </p>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" type="button" onClick={() => setPwOpen(false)}>Отмена</Button>
            <Button type="submit">Сохранить</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
