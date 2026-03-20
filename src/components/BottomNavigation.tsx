import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Heart, MapPin } from 'lucide-react';

function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Главная', labelCrh: 'Баш саифе', icon: Home },
    { path: '/micro-yardym', label: 'Ярдым', labelCrh: 'Ярдым', icon: Heart },
    { path: '/village-meetings', label: 'Карта', labelCrh: 'Харита', icon: MapPin },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full touch-feedback ${
                isActive ? 'text-emerald-600' : 'text-gray-400'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNavigation;
