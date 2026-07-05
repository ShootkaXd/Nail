import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react'
import { authApi, twoFactorApi } from '../api/admin'
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

  // Second step: TOTP code, shown when the account has 2FA enabled
  const [preAuthToken, setPreAuthToken] = useState<string | null>(null)
  const [code, setCode] = useState('')

  useEffect(() => {
    authApi.setupStatus().then(({ needsSetup }) => { if (needsSetup) navigate('/setup', { replace: true }) }).catch(() => {})
  }, [navigate])

  const finishLogin = (token: string, user: AuthUser) => {
    doLogin(token, user)
    navigate(user.role === 'admin' ? '/admin' : '/master')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await authApi.login(login, password)
      if (result.requires2FA && result.preAuthToken) {
        setPreAuthToken(result.preAuthToken)
      } else if (result.token && result.user) {
        finishLogin(result.token, result.user as AuthUser)
      }
    } catch {
      setError('Неверный логин или пароль')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!preAuthToken) return
    setError('')
    setLoading(true)
    try {
      const { token, user } = await twoFactorApi.verifyLogin(preAuthToken, code)
      finishLogin(token, user as AuthUser)
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Неверный код')
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
              {preAuthToken ? <ShieldCheck className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{site.salonName}</h1>
          <p className="text-gray-500 text-sm mt-1">{preAuthToken ? 'Введите код из приложения-аутентификатора' : 'Вход для сотрудников'}</p>
        </div>

        {preAuthToken ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              label="Код подтверждения"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              autoFocus
              required
            />
            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <Button type="submit" loading={loading} className="w-full" size="lg">Подтвердить</Button>
            <button type="button" onClick={() => { setPreAuthToken(null); setCode(''); setError('') }}
              className="text-sm text-gray-400 hover:text-gray-600 w-full text-center">
              ← Назад к логину
            </button>
          </form>
        ) : (
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
        )}

        <p className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Вернуться к записи
          </a>
        </p>
      </div>
    </div>
  )
}
