import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/admin'
import { useAuthStore } from '../store/auth.store'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import type { AuthUser } from '../types'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await authApi.login(email, password)
      login(token, user as AuthUser)
      navigate(user.role === 'admin' ? '/admin' : '/master')
    } catch {
      setError('Неверный email или пароль')
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
          <p className="text-gray-500 text-sm mt-1">Войдите в систему</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@nail.local" required />
          <Input label="Пароль" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <Button type="submit" loading={loading} className="w-full" size="lg">Войти</Button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-xl text-xs text-gray-500 space-y-1">
          <p><strong>Администратор:</strong> admin@nail.local / admin123</p>
          <p><strong>Мастер:</strong> anna@nail.local / master123</p>
        </div>
      </div>
    </div>
  )
}
