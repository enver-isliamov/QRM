import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MessageCircle, AlertCircle, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { User as UserType } from '../types';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
    TelegramLoginWidget?: {
      data: any;
    };
  }
}

function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useStore();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [error] = useState<string | null>(null);
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile');
    }
  }, [isAuthenticated, navigate]);
  
  // Initialize Google Sign-In
  useEffect(() => {
    if (window.google && googleButtonRef.current) {
      window.google.accounts.id.initialize({
        client_id: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your actual client ID
        callback: handleGoogleCallback,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'signin_with',
        shape: 'pill',
      });
    }
  }, []);
  
  const handleGoogleCallback = (_response: any) => {
    // In a real app, you would verify the token on your backend
    // For demo purposes, we'll create a mock user
    const mockUser: UserType = {
      id: 'google_' + Date.now(),
      email: 'user@gmail.com',
      name: 'Пользователь Google',
      avatar: 'https://ui-avatars.com/api/?name=Google+User&background=10B981&color=fff',
      role: 'user',
      provider: 'google',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    login(mockUser);
    navigate('/profile');
  };
  
  const handleTelegramLogin = () => {
    setShowTelegramModal(true);
  };
  
  const handleTelegramAuth = (user: any) => {
    const mockUser: UserType = {
      id: 'telegram_' + user.id,
      email: user.username ? `${user.username}@telegram.org` : 'telegram@user.org',
      name: user.first_name + (user.last_name ? ' ' + user.last_name : ''),
      avatar: user.photo_url,
      role: 'user',
      provider: 'telegram',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    login(mockUser);
    navigate('/profile');
  };
  
  // Demo login for testing
  const handleDemoLogin = () => {
    const demoUser: UserType = {
      id: 'demo_' + Date.now(),
      email: 'demo@oraza.ru',
      name: 'Демо Пользователь',
      avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=10B981&color=fff',
      role: 'user',
      provider: 'email',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    login(demoUser);
    navigate('/profile');
  };
  
  // Demo admin login for testing
  const handleAdminLogin = () => {
    const adminUser: UserType = {
      id: 'admin_1',
      email: 'admin@oraza.ru',
      name: 'Администратор',
      avatar: 'https://ui-avatars.com/api/?name=Admin&background=9333EA&color=fff',
      role: 'admin',
      provider: 'email',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    login(adminUser);
    navigate('/admin');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <button onClick={() => navigate('/')} className="text-gray-600">
          ← На главную
        </button>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Вход в ORAZA</h1>
            <p className="text-gray-500 mt-1">Выберите способ авторизации</p>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}
          
          {/* Login Options */}
          <div className="space-y-3">
            {/* Google Sign-In */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div ref={googleButtonRef} className="google-login-button" />
              <p className="text-xs text-gray-400 text-center mt-2">
                Требуется настройка Google Client ID
              </p>
            </div>
            
            {/* Telegram Login */}
            <button
              onClick={handleTelegramLogin}
              className="w-full bg-[#0088cc] text-white rounded-xl px-4 py-4 flex items-center justify-center gap-3 hover:bg-[#0077b3] transition-colors"
            >
              <MessageCircle className="w-6 h-6" />
              <span className="font-medium">Войти через Telegram</span>
            </button>
            
            {/* Divider */}
            <div className="flex items-center gap-4 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-sm text-gray-400">или</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            
            {/* Demo Login */}
            <button
              onClick={handleDemoLogin}
              className="w-full bg-emerald-500 text-white rounded-xl px-4 py-4 font-medium hover:bg-emerald-600 transition-colors"
            >
              Демо вход (Пользователь)
            </button>
            
            <button
              onClick={handleAdminLogin}
              className="w-full bg-purple-500 text-white rounded-xl px-4 py-4 font-medium hover:bg-purple-600 transition-colors"
            >
              Демо вход (Админ)
            </button>
          </div>
          
          {/* Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Авторизуясь, вы соглашаетесь с{' '}
              <a href="#" className="text-emerald-600 hover:underline">
                условиями использования
              </a>
            </p>
          </div>
        </div>
      </div>
      
      {/* Telegram Modal */}
      {showTelegramModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-overlay"
          onClick={() => setShowTelegramModal(false)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Вход через Telegram</h2>
              <button onClick={() => setShowTelegramModal(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[#0088cc] rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-600 mb-4">
                Для входа через Telegram необходимо настроить Telegram Bot и получить API ключ.
              </p>
              <p className="text-sm text-gray-500">
                Инструкция по настройке доступна в документации проекта.
              </p>
            </div>
            
            <button
              onClick={() => {
                // Demo Telegram auth
                handleTelegramAuth({
                  id: 123456789,
                  first_name: 'Telegram',
                  last_name: 'User',
                  username: 'telegram_user',
                  photo_url: 'https://ui-avatars.com/api/?name=Telegram+User&background=0088cc&color=fff'
                });
              }}
              className="w-full bg-[#0088cc] text-white py-3 rounded-xl font-medium"
            >
              Демо вход через Telegram
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
