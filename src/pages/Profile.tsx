import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Bell, Shield, LogOut, ChevronRight, Globe, Heart } from 'lucide-react';
import { useStore } from '../store/useStore';

function Profile() {
  const navigate = useNavigate();
  const { user, logout, language, setLanguage } = useStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const menuItems = [
    {
      icon: Settings,
      label: 'Настройки',
      labelCrh: 'Сазламалар',
      action: () => {}
    },
    {
      icon: Bell,
      label: 'Уведомления',
      labelCrh: 'Бильдиришлер',
      action: () => {}
    },
    {
      icon: Shield,
      label: 'Безопасность',
      labelCrh: 'Эминлик',
      action: () => {}
    },
    {
      icon: Heart,
      label: 'Поддержка',
      labelCrh: 'Ярдым',
      action: () => navigate('/support')
    },
  ];
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Профиль</h1>
      </div>
      
      {/* User Info Card */}
      <div className="p-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-emerald-600" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800">{user?.name}</h2>
              <p className="text-gray-500">{user?.email}</p>
              <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
                user?.role === 'admin' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {user?.role === 'admin' ? 'Администратор' : 'Пользователь'}
              </span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Способ входа</span>
              <span className="text-gray-700 capitalize">{user?.provider}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-500">Дата регистрации</span>
              <span className="text-gray-700">
                {user?.createdAt && new Date(user.createdAt).toLocaleDateString('ru-RU')}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Language Setting */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-800">Язык</span>
            </div>
          </div>
          <div className="p-2">
            <button
              onClick={() => setLanguage('ru')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg ${
                language === 'ru' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50'
              }`}
            >
              <span>Русский</span>
              {language === 'ru' && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
            </button>
            <button
              onClick={() => setLanguage('crh')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg ${
                language === 'crh' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50'
              }`}
            >
              <span>Къырымтатар тили</span>
              {language === 'crh' && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Menu Items */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              onClick={item.action}
              className={`w-full flex items-center justify-between px-4 py-4 ${
                index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
              } hover:bg-gray-50`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-800">{language === 'crh' ? item.labelCrh : item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>
      
      {/* Admin Link */}
      {user?.role === 'admin' && (
        <div className="px-4 pb-4">
          <button
            onClick={() => navigate('/admin')}
            className="w-full bg-purple-500 text-white rounded-xl px-4 py-4 flex items-center justify-between hover:bg-purple-600 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" />
              <span className="font-medium">Админ-панель</span>
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {/* Logout Button */}
      <div className="px-4 pb-20">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full bg-rose-50 text-rose-600 rounded-xl px-4 py-4 flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Выйти</span>
        </button>
      </div>
      
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-overlay"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-800 text-center mb-2">Выйти из аккаунта?</h2>
            <p className="text-gray-600 text-center mb-6">
              Вы уверены, что хотите выйти? Для входа потребуется повторная авторизация.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium"
              >
                Отмена
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-rose-500 text-white py-3 rounded-xl font-medium hover:bg-rose-600"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
