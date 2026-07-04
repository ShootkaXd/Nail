import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/admin'
import { useAuthStore } from '../store/auth.store'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import type { AuthUser } from '../types'

export default function SetupPage() {
  const [form, setForm] = useState({ name: '', login: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const { login: doLogin } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    authApi.setupStatus()
      .then(({ needsSetup }) => { if (!needsSetup) navigate('/login', { replace: true }) })
      .finally(() => setChecking(false))
  }, [navigate])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Пароли не совпадают')
    if (form.password.length < 8) return setError('Пароль должен быть не короче 8 символов')
    setLoading(true)
    try {
      const { token, user } = await authApi.setup({
        name: form.name, login: form.login, email: form.email || undefined, password: form.password,
      })
      doLogin(token, user as AuthUser)
      navigate('/admin', { replace: true })
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { error?: string } }; message?: string }
      if (err.response?.data?.error) setError(err.response.data.error)
      else if (err.response?.status) setError(`Сервер вернул ошибку ${err.response.status}. Проверьте логи: docker compose logs backend`)
      else setError('Нет соединения с сервером (API недоступен)')
    } finally {
      setLoading(false)
    }
  }

  if (checking) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-4">⚙️</div>
          <h1 className="text-2xl font-bold text-gray-900">Настройка системы</h1>
          <p className="text-gray-500 text-sm mt-1">Создайте учётную запись администратора</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Input label="Имя *" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Иван Петров" required />
          <Input label="Логин *" value={form.login} onChange={e => set('login', e.target.value)} placeholder="admin" autoComplete="username" required />
          <Input label="Email (необязательно)" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="admin@salon.ru" />
          <Input label="Пароль *" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Минимум 8 символов, буквы и цифры" autoComplete="new-password" required />
          <Input label="Повторите пароль *" type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} autoComplete="new-password" required />
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <Button type="submit" loading={loading} className="w-full" size="lg">Создать администратора</Button>
        </form>
      </div>
    </div>
  )
}
