import { Link } from 'react-router-dom'
import { useSiteConfig } from '../hooks/useSiteConfig'

export default function PublicFooter() {
  const site = useSiteConfig()
  const r = site.requisites
  const year = new Date().getFullYear()

  return (
    <footer className="mt-12 border-t border-gray-200 bg-white/70 backdrop-blur">
      <div className="max-w-4xl mx-auto px-4 py-6 text-xs text-gray-500 space-y-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-medium text-gray-700">{site.salonName}</span>
          <Link to="/privacy" className="hover:text-gray-700 underline underline-offset-2">
            Политика обработки персональных данных
          </Link>
          <Link to="/offer" className="hover:text-gray-700 underline underline-offset-2">
            Публичная оферта
          </Link>
          <Link to="/masters" className="hover:text-gray-700">Наши мастера</Link>
          <Link to="/my-bookings" className="hover:text-gray-700">Мои записи</Link>
        </div>
        {(r.companyName || r.inn || r.address) && (
          <p>
            {r.companyName && <>{r.companyName}. </>}
            {r.inn && <>ИНН {r.inn}. </>}
            {r.ogrn && <>ОГРН(ИП) {r.ogrn}. </>}
            {r.address && <>Адрес: {r.address}. </>}
          </p>
        )}
        {(r.phone || r.email) && (
          <p>
            {r.phone && <>Тел.: {r.phone}. </>}
            {r.email && <>E-mail: {r.email}</>}
          </p>
        )}
        <p>© {year} {site.salonName}. Отправляя форму записи, вы соглашаетесь с политикой обработки персональных данных.</p>
      </div>
    </footer>
  )
}
