import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Home from './pages/Home'
import PrayerTimes from './pages/PrayerTimes'
import EthnoCalendar from './pages/EthnoCalendar'
import Rituals from './pages/Rituals'
import RitualDetail from './pages/RitualDetail'
import MicroYardym from './pages/MicroYardym'
import VillageMeetings from './pages/VillageMeetings'
import MeetingDetail from './pages/MeetingDetail'
import MeetingEdit from './pages/MeetingEdit'
import Notifications from './pages/Notifications'
import Sections from './pages/Sections'
import Profile from './pages/Profile'
import PublicProfile from './pages/PublicProfile'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Support from './pages/Support'
import Admin from './pages/Admin'
import YandexMetrika from './components/YandexMetrika'
import './index.css'

function ProtectedRoute({ children, requireStaff = false }: { children: React.ReactNode; requireStaff?: boolean }) {
  const { isAuthenticated, profile, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (requireStaff && profile?.role !== 'admin' && profile?.role !== 'moderator') return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Router>
      <YandexMetrika />
      <Routes>
        <Route path="/login"         element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
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
          <Route path="admin"             element={
            <ProtectedRoute requireStaff><Admin /></ProtectedRoute>
          } />
        </Route>
      </Routes>
    </Router>
  )
}
