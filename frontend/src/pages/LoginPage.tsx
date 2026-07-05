import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { authApi } from '../api/admin'
import { useAuthStore } from '../store/auth.store'
import { useSiteConfig } from '../hooks/useSiteConfig'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import type { AuthUser } from '../types'

export default function LoginPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login: doLogin } = useAuthStore()
  const navigate = useNavigate()
  const site = useSiteConfig()

  useEffect(() => {
    authApi.setupStatus().then(({ needsSetup }) => { if (needsSetup) navigate('/setup', { replace: true }) }).catch(() => {})
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await authApi.login(login, password)
      doLogin(token, user as AuthUser)
      navigate(user.role === 'admin' ? '/admin' : '/master')
    } catch {
      setError('Неверный логин или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          {site.logoUrl ? (
            <img src={site.logoUrl} alt={site.salonName} className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4" />
          ) : (
            <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{site.salonName}</h1>
          <p className="text-gray-500 text-sm mt-1">Вход для сотрудников</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Логин"
            type="text"
            value={login}
            onChange={e => setLogin(e.target.value)}
            placeholder="admin"
            autoComplete="username"
            required
          />
          <Input
            label="Пароль"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <Button type="submit" loading={loading} className="w-full" size="lg">Войти</Button>
        </form>

        <p className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Вернуться к записи
          </a>
        </p>
      </div>
    </div>
  )
}
