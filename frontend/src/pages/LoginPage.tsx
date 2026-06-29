import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/admin'
import { useAuthStore } from '../store/auth.store'
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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-4">💅</div>
          <h1 className="text-2xl font-bold text-gray-900">Nail Studio</h1>
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
          <a href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← Вернуться к записи</a>
        </p>
      </div>
    </div>
  )
}
