import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import Home from './pages/Home';
import PrayerTimes from './pages/PrayerTimes';
import EthnoCalendar from './pages/EthnoCalendar';
import Rituals from './pages/Rituals';
import RitualDetail from './pages/RitualDetail';
import MicroYardym from './pages/MicroYardym';
import VillageMeetings from './pages/VillageMeetings';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Support from './pages/Support';
import './index.css';

// Protected route component
function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { isAuthenticated, user } = useStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="prayer-times" element={<PrayerTimes />} />
          <Route path="ethno-calendar" element={<EthnoCalendar />} />
          <Route path="rituals" element={<Rituals />} />
          <Route path="rituals/:id" element={<RitualDetail />} />
          <Route path="micro-yardym" element={<MicroYardym />} />
          <Route path="village-meetings" element={<VillageMeetings />} />
          <Route path="support" element={<Support />} />
          <Route 
            path="profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="admin" 
            element={
              <ProtectedRoute requireAdmin>
                <Admin />
              </ProtectedRoute>
            } 
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
