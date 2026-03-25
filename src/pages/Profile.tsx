import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Bell, Shield, LogOut, ChevronRight, Globe, Heart, Star, Activity } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

function Profile() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const { i18n } = useTranslation();
  const language = i18n.language as 'ru' | 'crh';

  const setLanguageState = (lang: 'ru' | 'crh') => {
    i18n.changeLanguage(lang);
  };
  
  const [stats, setStats] = useState({
    helpResponses: 0,
    helpRequests: 0,
    meetingsOrganized: 0,
    trustScore: 0,
    badges: [] as { id: string, name: string, icon: any, color: string, description: string }[]
  });

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        // Fetch help responses
        const { count: responsesCount } = await supabase
          .from('help_responses')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Fetch help requests
        const { count: requestsCount } = await supabase
          .from('help_requests')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', user.id);

        // Fetch meetings organized
        const { count: meetingsCount } = await supabase
          .from('meetings')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', user.id);

        const rCount = responsesCount || 0;
        const reqCount = requestsCount || 0;
        const mCount = meetingsCount || 0;

        // Calculate Trust Score
        // Base score: 100
        // +10 for each response
        // +5 for each request created (active community member)
        // +20 for each meeting organized
        const calculatedTrustScore = 100 + (rCount * 10) + (reqCount * 5) + (mCount * 20);

        // Determine Badges
        const earnedBadges = [];
        
        if (rCount >= 1) {
          earnedBadges.push({
            id: 'helper_1',
            name: 'Первый отклик',
            icon: Heart,
            color: 'text-rose-500 bg-rose-50 border-rose-200',
            description: 'Откликнулся на просьбу о помощи'
          });
        }
        if (rCount >= 5) {
          earnedBadges.push({
            id: 'helper_5',
            name: 'Надежный помощник',
            icon: Shield,
            color: 'text-emerald-500 bg-emerald-50 border-emerald-200',
            description: 'Помог 5 раз'
          });
        }
        if (mCount >= 1) {
          earnedBadges.push({
            id: 'organizer',
            name: 'Организатор',
            icon: Star,
            color: 'text-amber-500 bg-amber-50 border-amber-200',
            description: 'Организовал встречу'
          });
        }
        if (reqCount >= 1) {
          earnedBadges.push({
            id: 'active',
            name: 'Активный участник',
            icon: Activity,
            color: 'text-blue-500 bg-blue-50 border-blue-200',
            description: 'Создал обращение'
          });
        }

        setStats({
          helpResponses: rCount,
          helpRequests: reqCount,
          meetingsOrganized: mCount,
          trustScore: profile?.trust_score || calculatedTrustScore,
          badges: earnedBadges
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [user, profile]);

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Вы не вошли</h2>
          <p className="text-gray-500 mb-6">Войдите, чтобы увидеть профиль и отслеживать намазы</p>
          <button onClick={() => navigate('/login')}
            className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors">
            Войти
          </button>
        </div>
      </div>
    );
  }

  const menuItems = [
    { icon: Settings, label: 'Настройки', labelCrh: 'Сазламалар', action: () => setShowSettings(true) },
    { icon: Bell, label: 'Уведомления', labelCrh: 'Бильдиришлер', action: () => setShowNotifSettings(true) },
    { icon: Shield, label: 'Безопасность', labelCrh: 'Эминлик', action: () => setShowSecurity(true) },
    { icon: Heart, label: 'Поддержка', labelCrh: 'Ярдым', action: () => navigate('/support') },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Профиль</h1>
      </div>

      {/* User Card */}
      <div className="p-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-emerald-600" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800">{profile.name || 'Пользователь'}</h2>
              <p className="text-gray-500 text-sm">{user.email}</p>
              <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
                profile.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {profile.role === 'admin' ? 'Администратор' : profile.role === 'moderator' ? 'Модератор' : 'Пользователь'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Способ входа</span>
              <span className="text-gray-700 capitalize">{profile.provider}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">В сообществе с</span>
              <span className="text-gray-700">{new Date(profile.created_at).toLocaleDateString('ru-RU')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats & Trust Score */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">Рейтинг доверия</h3>
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg font-bold">
              <Shield className="w-4 h-4" />
              {stats.trustScore}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-gray-800">{stats.helpResponses}</div>
              <div className="text-xs text-gray-500">Откликов</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-gray-800">{stats.helpRequests}</div>
              <div className="text-xs text-gray-500">Обращений</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-gray-800">{stats.meetingsOrganized}</div>
              <div className="text-xs text-gray-500">Встреч</div>
            </div>
          </div>

          {stats.badges.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-800 mb-3 text-sm">Достижения</h3>
              <div className="flex flex-wrap gap-2">
                {stats.badges.map(badge => (
                  <div key={badge.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${badge.color}`} title={badge.description}>
                    <badge.icon className="w-4 h-4" />
                    <span className="text-xs font-medium">{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Language */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
            <Globe className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-gray-800">Язык</span>
          </div>
          <div className="p-2">
            {([['ru', 'Русский'], ['crh', 'Къырымтатар тили']] as const).map(([lang, label]) => (
              <button key={lang} onClick={() => setLanguageState(lang)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg ${
                  language === lang ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50'
                }`}>
                <span>{label}</span>
                {language === lang && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {menuItems.map((item, i) => (
            <button key={item.label} onClick={item.action}
              className={`w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 ${
                i !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
              }`}>
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-800">{language === 'crh' ? item.labelCrh : item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>

      {(profile.role === 'admin' || profile.role === 'moderator') && (
        <div className="px-4 pb-4">
          <button onClick={() => navigate('/admin')}
            className="w-full bg-purple-500 text-white rounded-xl px-4 py-4 flex items-center justify-between hover:bg-purple-600 transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" />
              <span className="font-medium">{profile.role === 'admin' ? 'Админ-панель' : 'Панель модератора'}</span>
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="px-4 pb-20">
        <button onClick={() => setShowLogout(true)}
          className="w-full bg-rose-50 text-rose-600 rounded-xl px-4 py-4 flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Выйти</span>
        </button>
      </div>

      {showLogout && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay" onClick={() => setShowLogout(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-800 text-center mb-2">Выйти из аккаунта?</h2>
            <p className="text-gray-600 text-center mb-6">Для входа потребуется повторная авторизация.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogout(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium">Отмена</button>
              <button onClick={handleLogout} className="flex-1 bg-rose-500 text-white py-3 rounded-xl font-medium hover:bg-rose-600">Выйти</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Настройки</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Темная тема</span>
                <button className="w-11 h-6 bg-gray-200 rounded-full relative opacity-50 cursor-not-allowed">
                  <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                </button>
              </div>
              <p className="text-xs text-gray-400">В разработке</p>
            </div>
            <button onClick={() => setShowSettings(false)} className="w-full mt-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium">Закрыть</button>
          </div>
        </div>
      )}

      {/* Notifications Settings Modal */}
      {showNotifSettings && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay" onClick={() => setShowNotifSettings(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Настройки уведомлений</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Push-уведомления</span>
                <button className="w-11 h-6 bg-emerald-500 rounded-full relative">
                  <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Email-рассылка</span>
                <button className="w-11 h-6 bg-gray-200 rounded-full relative">
                  <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                </button>
              </div>
            </div>
            <button onClick={() => setShowNotifSettings(false)} className="w-full mt-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium">Закрыть</button>
          </div>
        </div>
      )}

      {/* Security Modal */}
      {showSecurity && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay" onClick={() => setShowSecurity(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Безопасность</h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Текущая сессия</p>
                <p className="font-medium text-gray-800">{navigator.userAgent.split(' ')[0]} • {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
              </div>
              {profile.provider === 'email' && (
                <button className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50">
                  Изменить пароль
                </button>
              )}
            </div>
            <button onClick={() => setShowSecurity(false)} className="w-full mt-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium">Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
