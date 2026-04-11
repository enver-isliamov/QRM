import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Clock, Heart, MapPin, Grid3X3 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'

export default function BottomNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { featureToggles } = useStore()
  const { t } = useTranslation()

  const navItems = [
    { path: '/',               label: t('nav.home'),  icon: Home,     show: true },
    { path: '/prayer-times',   label: t('nav.namaz'),   icon: Clock,    show: true },
    { path: '/micro-yardym',   label: t('nav.yardym'),    icon: Heart,    show: featureToggles.yardym },
    { path: '/village-meetings', label: t('home.village_meetings'), icon: MapPin,   show: featureToggles.meetings },
    { path: '/sections',       label: t('nav.sections'),  icon: Grid3X3,  show: true },
  ]

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    if (path === '/sections') return ['/ethno-calendar','/rituals','/profile','/support','/admin','/notifications'].some(p => location.pathname.startsWith(p))
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border safe-area-bottom z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16 relative">
        {navItems.filter(item => item.show).map(({ path, label, icon: Icon }) => {
          const active = isActive(path)
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center justify-center flex-1 h-full relative z-10 gap-1 transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute inset-x-0 -top-px h-0.5 bg-primary"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <motion.div 
                animate={{ y: active ? -2 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="flex flex-col items-center gap-0.5"
              >
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className={`text-[10px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </motion.div>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
