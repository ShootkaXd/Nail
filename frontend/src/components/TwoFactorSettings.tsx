import { useState } from 'react'
import { ShieldCheck, ShieldOff } from 'lucide-react'
import { twoFactorApi } from '../api/admin'
import Button from './ui/Button'
import Input from './ui/Input'
import Modal from './ui/Modal'

interface Props {
  enabled: boolean
  onChanged: (enabled: boolean) => void
}

export default function TwoFactorSettings({ enabled, onChanged }: Props) {
  const [step, setStep] = useState<'closed' | 'password' | 'scan' | 'disable'>('closed')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [qr, setQr] = useState<{ secret: string; qrDataUrl: string } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const close = () => {
    setStep('closed'); setPassword(''); setCode(''); setQr(null); setError('')
  }

  const startSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await twoFactorApi.setup(password)
      setQr(result)
      setStep('scan')
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Неверный пароль')
    } finally {
      setLoading(false)
    }
  }

  const confirmEnable = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await twoFactorApi.enable(code)
      onChanged(true)
      close()
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Неверный код')
    } finally {
      setLoading(false)
    }
  }

  const confirmDisable = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await twoFactorApi.disable(password, code)
      onChanged(false)
      close()
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-3">
          {enabled ? <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" /> : <ShieldOff className="w-5 h-5 text-gray-400 shrink-0" />}
          <div>
            <p className="text-sm font-medium text-gray-900">Двухфакторная аутентификация</p>
            <p className="text-xs text-gray-500">{enabled ? 'Включена' : 'Отключена'} — код из приложения (Google Authenticator и т.п.)</p>
          </div>
        </div>
        {enabled ? (
          <Button variant="secondary" size="sm" onClick={() => setStep('disable')}>Отключить</Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setStep('password')}>Включить</Button>
        )}
      </div>

      <Modal open={step === 'password'} onClose={close} title="Включить 2FA" size="sm">
        <form onSubmit={startSetup} className="space-y-4">
          <p className="text-sm text-gray-500">Подтвердите пароль, чтобы начать настройку.</p>
          <Input label="Пароль" type="password" value={password} onChange={e => setPassword(e.target.value)} autoFocus required />
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3">
            <Button variant="secondary" type="button" onClick={close}>Отмена</Button>
            <Button type="submit" loading={loading}>Далее</Button>
          </div>
        </form>
      </Modal>

      <Modal open={step === 'scan'} onClose={close} title="Отсканируйте QR-код" size="sm">
        {qr && (
          <form onSubmit={confirmEnable} className="space-y-4">
            <p className="text-sm text-gray-500">
              Отсканируйте код в приложении Google Authenticator, Яндекс.Ключ или аналогичном, затем введите
              шестизначный код для подтверждения.
            </p>
            <img src={qr.qrDataUrl} alt="QR-код 2FA" className="mx-auto w-48 h-48" />
            <p className="text-xs text-gray-400 text-center">
              Не получается отсканировать? Введите вручную: <span className="font-mono">{qr.secret}</span>
            </p>
            <Input
              label="Код из приложения"
              type="text"
              inputMode="numeric"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              autoFocus
              required
            />
            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex gap-3">
              <Button variant="secondary" type="button" onClick={close}>Отмена</Button>
              <Button type="submit" loading={loading}>Подтвердить</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={step === 'disable'} onClose={close} title="Отключить 2FA" size="sm">
        <form onSubmit={confirmDisable} className="space-y-4">
          <p className="text-sm text-gray-500">Для отключения подтвердите пароль и текущий код из приложения.</p>
          <Input label="Пароль" type="password" value={password} onChange={e => setPassword(e.target.value)} autoFocus required />
          <Input label="Код из приложения" type="text" inputMode="numeric" value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" required />
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3">
            <Button variant="secondary" type="button" onClick={close}>Отмена</Button>
            <Button variant="danger" type="submit" loading={loading}>Отключить</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
