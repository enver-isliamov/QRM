import { useNavigate } from 'react-router-dom'
import { Calendar, BookOpen, User, Heart, Shield, Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { useStore } from '../store/useStore'

export default function Sections() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, profile } = useAuth()
  const { featureToggles } = useStore()

  const sections = [
    {
      icon: Calendar, bg: 'bg-emerald-100', color: 'text-emerald-600',
      title: t('sections.ethno_calendar'), sub: t('sections.ethno_calendar_sub', 'Праздники и памятные даты'),
      path: '/ethno-calendar',
      show: featureToggles.calendar
    },
    {
      icon: BookOpen, bg: 'bg-amber-100', color: 'text-amber-600',
      title: t('sections.rituals'), sub: t('sections.rituals_sub', 'Никях, Дженазе, Суннат'),
      path: '/rituals',
      show: featureToggles.rituals
    },
    {
      icon: Bell, bg: 'bg-blue-100', color: 'text-blue-600',
      title: t('sections.notifications'), sub: t('sections.notifications_sub', 'Встречи, отклики, обновления'),
      path: '/notifications',
      show: true
    },
    {
      icon: Heart, bg: 'bg-rose-100', color: 'text-rose-600',
      title: t('sections.support'), sub: t('sections.support_sub', 'Помочь развитию ORAZA'),
      path: '/support',
      show: true
    },
  ]

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      <div className="p-4 pb-24">

        {/* Profile card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          {isAuthenticated ? (
            <button onClick={() => navigate('/profile')} className="flex items-center gap-4 w-full text-left">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <User className="w-7 h-7 text-emerald-600" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{profile?.name || t('common.user', 'Пользователь')}</p>
                <p className="text-sm text-gray-400">{t('sections.open_profile')}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                profile?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {profile?.role === 'admin' ? t('sections.admin_label') : t('sections.member_label')}
              </span>
            </button>
          ) : (
            <button onClick={() => navigate('/login')} className="flex items-center gap-4 w-full text-left">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7 text-gray-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-700">{t('sections.login_button')}</p>
                <p className="text-sm text-gray-400">{t('sections.login_desc', 'Отмечай намазы, участвуй в встречах')}</p>
              </div>
            </button>
          )}
        </div>

        {/* Sections grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {sections.filter(s => s.show).map(({ icon: Icon, bg, color, title, sub, path }) => (
            <button key={path} onClick={() => navigate(path)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left touch-feedback hover:border-emerald-200 transition-colors active:scale-95">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="font-semibold text-gray-800 text-sm leading-tight">{title}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">{sub}</p>
            </button>
          ))}
        </div>

        {/* Admin panel - only for admin */}
        {profile?.role === 'admin' && (
          <button onClick={() => navigate('/admin')}
            className="w-full bg-purple-500 text-white rounded-2xl p-4 flex items-center gap-3 hover:bg-purple-600 transition-colors touch-feedback">
            <Shield className="w-5 h-5" />
            <div className="text-left">
              <p className="font-semibold">{t('sections.admin_panel')}</p>
              <p className="text-xs text-purple-200">{t('sections.admin_desc')}</p>
            </div>
          </button>
        )}
      </div>
    </div>
  )
}
