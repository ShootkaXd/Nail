import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth.store'
import BookingPage from './pages/BookingPage'
import LoginPage from './pages/LoginPage'
import AdminLayout from './pages/admin/AdminLayout'
import ServicesPage from './pages/admin/ServicesPage'
import MastersPage from './pages/admin/MastersPage'
import PromotionsPage from './pages/admin/PromotionsPage'
import BookingsPage from './pages/admin/BookingsPage'
import MasterLayout from './pages/master/MasterLayout'
import CalendarPage from './pages/master/CalendarPage'
import WorkingHoursPage from './pages/master/WorkingHoursPage'

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
        <Route path="/login" element={<LoginPage />} />

        <Route path="/admin" element={<RequireRole role="admin"><AdminLayout /></RequireRole>}>
          <Route index element={<Navigate to="/admin/bookings" replace />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="masters" element={<MastersPage />} />
          <Route path="promotions" element={<PromotionsPage />} />
          <Route path="bookings" element={<BookingsPage />} />
        </Route>

        <Route path="/master" element={<RequireRole role="master"><MasterLayout /></RequireRole>}>
          <Route index element={<Navigate to="/master/calendar" replace />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="hours" element={<WorkingHoursPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
