import { useNavigate, useLocation } from 'react-router-dom'
import { User, MapPin, ChevronLeft, Bell, Heart } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'

// Titles for each route
const PAGE_TITLES: Record<string, string> = {
  '/': 'ORAZA',
  '/prayer-times': 'Намазы',
  '/ethno-calendar': 'Этно-календарь',
  '/rituals': 'Обрядовый гид',
  '/micro-yardym': 'Микро-Ярдым',
  '/village-meetings': 'Встречи сёл',
  '/notifications': 'Уведомления',
  '/profile': 'Профиль',
  '/support': 'Поддержка',
  '/admin': 'Админ-панель',
  '/login': 'Вход',
}

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, profile } = useAuth()
  const { unreadCount } = useNotifications(profile?.id ?? null)

  const isHome = location.pathname === '/'
  const isLogin = location.pathname === '/login'
  const isCallback = location.pathname === '/auth/callback'
  const showBack = !isHome && !isLogin && !isCallback

  // Dynamic title
  const title = PAGE_TITLES[location.pathname] ?? 'ORAZA'
  const isHomeTitle = title === 'ORAZA'

  return (
    <header className="bg-white sticky top-0 z-50 safe-area-top border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: back or logo */}
        <div className="flex items-center gap-2 min-w-0">
          {showBack ? (
            <button onClick={() => navigate(-1)} className="p-1 -ml-1 touch-feedback flex-shrink-0">
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
          ) : null}
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5 min-w-0">
            {isHomeTitle ? (
              <>
                <span className="text-xl font-bold text-emerald-600">ORAZA</span>
                <span className="text-xs text-gray-400">.RU</span>
              </>
            ) : (
              <span className="text-lg font-semibold text-gray-800 truncate">{title}</span>
            )}
          </button>
        </div>

        {/* Right: location + profile/bell */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isHomeTitle && (
            <div className="flex items-center gap-1 text-gray-400 mr-1">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-xs">Крым</span>
            </div>
          )}

          {/* Support icon */}
          <button onClick={() => navigate('/support')} className="p-1.5 touch-feedback text-rose-500 hover:scale-110 transition-transform">
            <Heart className="w-5 h-5 fill-rose-500" />
          </button>

          {/* Notification bell - only when logged in */}
          {isAuthenticated && !isLogin && (
            <button onClick={() => navigate('/notifications')} className="relative p-1.5 touch-feedback">
              <Bell className="w-5 h-5 text-gray-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Profile button */}
          {!isLogin && !isCallback && (
            <button
              onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isAuthenticated
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <User className="w-4 h-4" />
              )}
              <span className="max-w-[80px] truncate">
                {isAuthenticated ? (profile?.name?.split(' ')[0] || 'Профиль') : 'Войти'}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
