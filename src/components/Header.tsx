import { useNavigate, useLocation } from 'react-router-dom'
import { User, MapPin, ChevronLeft, Bell, Heart } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import { Button } from './ui/button'

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, profile } = useAuth()
  const { unreadCount } = useNotifications(profile?.id ?? null)

  const isLogin = location.pathname === '/login'
  const isCallback = location.pathname === '/auth/callback'
  const sectionPaths = ['/village-meetings', '/micro-yardym', '/rituals', '/ethno-calendar']
  const showBack = location.pathname !== '/' && !isLogin && !isCallback && !sectionPaths.includes(location.pathname)

  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 safe-area-top border-b border-border shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: back or logo */}
        <div className="flex items-center gap-2 min-w-0">
          {showBack ? (
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="flex-shrink-0 -ml-2 h-9 w-9">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </Button>
          ) : null}
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5 min-w-0">
            <span className="text-xl font-bold text-primary">ORAZA</span>
            <span className="text-xs text-muted-foreground">.RU</span>
          </button>
        </div>

        {/* Right: location + profile/bell */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-1 text-muted-foreground mr-1">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs">Крым</span>
          </div>

          {/* Support icon */}
          <Button variant="ghost" size="icon" onClick={() => navigate('/support')} className="h-9 w-9 text-rose-500 hover:text-rose-600 hover:bg-rose-50">
            <Heart className="w-5 h-5 fill-current" />
          </Button>

          {/* Notification bell - only when logged in */}
          {isAuthenticated && !isLogin && (
            <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')} className="relative h-9 w-9">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          )}

          {/* Profile button */}
          {!isLogin && !isCallback && (
            <Button
              variant={isAuthenticated ? "secondary" : "default"}
              size="sm"
              onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}
              className="rounded-full gap-2 pl-2"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <User className="w-4 h-4" />
              )}
              <span className="max-w-[80px] truncate">
                {isAuthenticated ? (profile?.name?.split(' ')[0] || 'Профиль') : 'Войти'}
              </span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
