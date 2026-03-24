import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Clock, Heart, MapPin, Grid3X3 } from 'lucide-react'

// Bottom nav: 5 clear tabs
// Home → дашборд
// Намазы → расписание (часто используется)
// Ярдым → взаимопомощь
// Встречи → встречи сёл
// Разделы → все остальные разделы (календарь, обряды, профиль)

const navItems = [
  { path: '/',               label: 'Главная',  icon: Home  },
  { path: '/prayer-times',   label: 'Намазы',   icon: Clock },
  { path: '/micro-yardym',   label: 'Ярдым',    icon: Heart },
  { path: '/village-meetings', label: 'Встречи', icon: MapPin },
  { path: '/sections',       label: 'Разделы',  icon: Grid3X3 },
]

export default function BottomNavigation() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    if (path === '/sections') return ['/ethno-calendar','/rituals','/profile','/support','/admin','/notifications'].some(p => location.pathname.startsWith(p))
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = isActive(path)
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center justify-center flex-1 h-full touch-feedback gap-0.5 ${
                active ? 'text-emerald-600' : 'text-gray-400'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className={`text-[10px] font-medium ${active ? 'text-emerald-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
