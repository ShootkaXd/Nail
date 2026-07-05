import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Sparkles, Users, Percent, ClipboardList, Wallet, ShieldCheck, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import { useSiteConfig } from '../../hooks/useSiteConfig'

const nav = [
  { to: '/admin/services', label: 'Услуги', Icon: Sparkles },
  { to: '/admin/masters', label: 'Мастера', Icon: Users },
  { to: '/admin/promotions', label: 'Акции', Icon: Percent },
  { to: '/admin/bookings', label: 'Записи', Icon: ClipboardList },
  { to: '/admin/reports', label: 'Бухгалтерия', Icon: Wallet },
  { to: '/admin/admins', label: 'Администраторы', Icon: ShieldCheck },
  { to: '/admin/settings', label: 'Настройки', Icon: Settings },
]

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const site = useSiteConfig()

  const handleLogout = () => { logout(); navigate('/login') }

  const logo = site.logoUrl ? (
    <img src={site.logoUrl} alt={site.salonName} className="w-10 h-10 rounded-xl object-cover shrink-0" />
  ) : (
    <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shrink-0">
      <Sparkles className="w-5 h-5" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col shrink-0">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {logo}
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">{site.salonName}</p>
              <p className="text-xs text-gray-400">Администратор</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {nav.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400">Администратор</p>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 p-1.5" title="Выйти">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header + horizontal nav */}
      <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            {logo}
            <p className="font-bold text-gray-900 text-sm truncate">{site.salonName}</p>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 text-sm px-2 py-1">Выйти</button>
        </div>
        <nav className="flex gap-1 px-2 pb-2 overflow-x-auto">
          {nav.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-600' : 'text-gray-600'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <main className="flex-1 overflow-auto min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
