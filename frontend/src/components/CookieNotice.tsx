import { useState } from 'react'

export default function CookieNotice() {
  const [accepted, setAccepted] = useState(() => localStorage.getItem('cookieAccepted') === '1')
  if (accepted) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4">
      <div className="max-w-3xl mx-auto bg-gray-900/95 text-white rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-xl">
        <p className="text-xs leading-relaxed flex-1">
          Мы используем файлы cookie и аналогичные технологии для работы сайта.
          Продолжая пользоваться сайтом, вы соглашаетесь с обработкой файлов cookie
          в соответствии с <a href="/privacy" className="underline">политикой обработки персональных данных</a>.
        </p>
        <button
          onClick={() => { localStorage.setItem('cookieAccepted', '1'); setAccepted(true) }}
          className="shrink-0 bg-white text-gray-900 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Хорошо
        </button>
      </div>
    </div>
  )
}
