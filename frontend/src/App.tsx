import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth.store'
import BookingPage from './pages/BookingPage'
import LoginPage from './pages/LoginPage'
import SetupPage from './pages/SetupPage'
import AdminLayout from './pages/admin/AdminLayout'
import ServicesPage from './pages/admin/ServicesPage'
import MastersPage from './pages/admin/MastersPage'
import PromotionsPage from './pages/admin/PromotionsPage'
import BookingsPage from './pages/admin/BookingsPage'
import AdminsPage from './pages/admin/AdminsPage'
import SettingsPage from './pages/admin/SettingsPage'
import MasterLayout from './pages/master/MasterLayout'
import CalendarPage from './pages/master/CalendarPage'
import WorkingHoursPage from './pages/master/WorkingHoursPage'
import PortfolioPage from './pages/master/PortfolioPage'
import ReportsPage from './pages/admin/ReportsPage'
import MastersGalleryPage from './pages/MastersGalleryPage'
import PrivacyPage from './pages/PrivacyPage'

function RequireRole({ role, children }: { role: string; children: React.ReactNode }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/master'} replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BookingPage />} />
        <Route path="/masters" element={<MastersGalleryPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/admin" element={<RequireRole role="admin"><AdminLayout /></RequireRole>}>
          <Route index element={<Navigate to="/admin/bookings" replace />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="masters" element={<MastersPage />} />
          <Route path="promotions" element={<PromotionsPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="admins" element={<AdminsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="/master" element={<RequireRole role="master"><MasterLayout /></RequireRole>}>
          <Route index element={<Navigate to="/master/calendar" replace />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="hours" element={<WorkingHoursPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
