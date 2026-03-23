import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Bell, Shield, LogOut, ChevronRight, Globe, Heart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

function Profile() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const [language, setLanguageState] = useState<'ru' | 'crh'>('ru');

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
    { icon: Settings, label: 'Настройки', labelCrh: 'Сазламалар', action: () => {} },
    { icon: Bell, label: 'Уведомления', labelCrh: 'Бильдиришлер', action: () => {} },
    { icon: Shield, label: 'Безопасность', labelCrh: 'Эминлик', action: () => {} },
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

      {profile.role === 'admin' && (
        <div className="px-4 pb-4">
          <button onClick={() => navigate('/admin')}
            className="w-full bg-purple-500 text-white rounded-xl px-4 py-4 flex items-center justify-between hover:bg-purple-600 transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" />
              <span className="font-medium">Админ-панель</span>
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-overlay" onClick={() => setShowLogout(false)}>
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
    </div>
  );
}

export default Profile;
