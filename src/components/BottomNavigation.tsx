import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Clock, Heart, MapPin, Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';

function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications(user?.id ?? null);

  const navItems = [
    { path: '/',                  label: 'Главная',  icon: Home },
    { path: '/prayer-times',      label: 'Намазы',   icon: Clock },
    { path: '/micro-yardym',      label: 'Ярдым',    icon: Heart },
    { path: '/village-meetings',  label: 'Встречи',  icon: MapPin },
    { path: '/notifications',     label: 'Лента',    icon: Bell, badge: unreadCount },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {navItems.map(({ path, label, icon: Icon, badge }) => {
          const isActive = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path);
          return (
            <button key={path} onClick={() => navigate(path)}
              className={`flex flex-col items-center justify-center flex-1 h-full touch-feedback relative ${
                isActive ? 'text-emerald-600' : 'text-gray-400'
              }`}>
              <div className="relative">
                <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                {badge != null && badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-0.5">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNavigation;
