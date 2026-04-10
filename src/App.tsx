import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { WifiOff } from 'lucide-react'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import YandexMetrika from './components/YandexMetrika'
import ErrorBoundary from './components/ErrorBoundary'
import { Toaster } from 'sonner'
import './index.css'

// ─── ЛЕНИВАЯ ЗАГРУЗКА СТРАНИЦ ────────────────────────────────────────────────
// Каждая страница загружается только при первом посещении.
// Уменьшает начальный бандл на ~60% и ускоряет Time-to-Interactive.

const Home            = lazy(() => import('./pages/Home'))
const PrayerTimes     = lazy(() => import('./pages/PrayerTimes'))
const EthnoCalendar   = lazy(() => import('./pages/EthnoCalendar'))
const Rituals         = lazy(() => import('./pages/Rituals'))
const RitualDetail    = lazy(() => import('./pages/RitualDetail'))
const MicroYardym     = lazy(() => import('./pages/MicroYardym'))
const VillageMeetings = lazy(() => import('./pages/VillageMeetings'))
const MeetingDetail   = lazy(() => import('./pages/MeetingDetail'))
const MeetingEdit     = lazy(() => import('./pages/MeetingEdit'))
const Notifications   = lazy(() => import('./pages/Notifications'))
const Sections        = lazy(() => import('./pages/Sections'))
const Profile         = lazy(() => import('./pages/Profile'))
const PublicProfile   = lazy(() => import('./pages/PublicProfile'))
const Login           = lazy(() => import('./pages/Login'))
const AuthCallback    = lazy(() => import('./pages/AuthCallback'))
const Support         = lazy(() => import('./pages/Support'))
const Admin           = lazy(() => import('./pages/Admin'))

// ─── FALLBACK ─────────────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400 font-medium">Загрузка...</span>
      </div>
    </div>
  )
}

// ─── ЗАЩИТА МАРШРУТОВ ─────────────────────────────────────────────────────────
function ProtectedRoute({ children, requireStaff = false }: { children: React.ReactNode; requireStaff?: boolean }) {
  const { isAuthenticated, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (requireStaff && profile?.role !== 'admin' && profile?.role !== 'moderator') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

// ─── КОРНЕВОЙ КОМПОНЕНТ ───────────────────────────────────────────────────────
export default function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline  = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <ErrorBoundary>
      <Toaster position="top-center" richColors />
      <Router>
        <YandexMetrika />

        {isOffline && (
          <div className="bg-rose-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium sticky top-0 z-50">
            <WifiOff className="w-4 h-4" />
            Нет подключения к интернету
          </div>
        )}

        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Публичные маршруты */}
            <Route path="/login"         element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Основные маршруты с Layout */}
            <Route path="/" element={<Layout />}>
              <Route index                    element={<Home />} />
              <Route path="prayer-times"      element={<PrayerTimes />} />
              <Route path="ethno-calendar"    element={<EthnoCalendar />} />
              <Route path="rituals"           element={<Rituals />} />
              <Route path="rituals/:id"       element={<RitualDetail />} />
              <Route path="micro-yardym"      element={<MicroYardym />} />
              <Route path="village-meetings"  element={<VillageMeetings />} />
              <Route path="meetings/:id"      element={<MeetingDetail />} />
              <Route path="meetings/:id/edit" element={<MeetingEdit />} />
              <Route path="notifications"     element={<Notifications />} />
              <Route path="sections"          element={<Sections />} />
              <Route path="support"           element={<Support />} />
              <Route path="profile"           element={<Profile />} />
              <Route path="user/:id"          element={<PublicProfile />} />
              <Route path="admin" element={
                <ProtectedRoute requireStaff>
                  <Admin />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  )
}
