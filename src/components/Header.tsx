import { useNavigate, useLocation } from 'react-router-dom';
import { User, MapPin, ChevronLeft } from 'lucide-react';
import { useStore } from '../store/useStore';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useStore();
  
  const isHome = location.pathname === '/';
  const showBackButton = !isHome && location.pathname !== '/login';
  
  return (
    <header className="bg-white sticky top-0 z-50 safe-area-top">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          {showBackButton ? (
            <button 
              onClick={() => navigate(-1)}
              className="p-1 -ml-1 touch-feedback"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
          ) : null}
          <button onClick={() => navigate('/')} className="flex items-center gap-1">
            <span className="text-xl font-bold text-emerald-600">ORAZA</span>
            <span className="text-xs text-gray-400">.RU</span>
          </button>
        </div>
        
        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Location */}
          <div className="flex items-center gap-1 text-gray-500">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">Крым</span>
          </div>
          
          {/* Profile button */}
          <button
            onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              isAuthenticated 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{isAuthenticated ? (user?.name?.split(' ')[0] || 'Профиль') : 'Войти'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
