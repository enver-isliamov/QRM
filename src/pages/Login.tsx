import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MessageCircle } from 'lucide-react';
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
    onTelegramAuth?: (user: any) => void;
  }
}

// Get environment variables
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const TELEGRAM_BOT_NAME = import.meta.env.VITE_TELEGRAM_BOT_NAME || '';

function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useStore();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const telegramContainerRef = useRef<HTMLDivElement>(null);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile');
    }
  }, [isAuthenticated, navigate]);
  
  // Handle Telegram auth callback
  const handleTelegramAuth = useCallback((user: any) => {
    const mockUser: UserType = {
      id: 'telegram_' + user.id,
      email: user.username ? `${user.username}@telegram.org` : `telegram_${user.id}@user.org`,
      name: user.first_name + (user.last_name ? ' ' + user.last_name : ''),
      avatar: user.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name)}&background=0088cc&color=fff`,
      role: 'user',
      provider: 'telegram',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    login(mockUser);
    navigate('/profile');
  }, [login, navigate]);
  
  // Expose callback to window for Telegram widget
  useEffect(() => {
    window.onTelegramAuth = handleTelegramAuth;
    return () => {
      delete window.onTelegramAuth;
    };
  }, [handleTelegramAuth]);
  
  // Initialize Google Sign-In
  useEffect(() => {
    if (GOOGLE_CLIENT_ID && window.google && googleButtonRef.current) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
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
        <button onClick={() => navigate('/')} className="text-gray-600 flex items-center gap-1">
          <span>←</span>
          <span>На главную</span>
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
          
          {/* Login Options */}
          <div className="space-y-4">
            {/* Google Sign-In */}
            {GOOGLE_CLIENT_ID ? (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div ref={googleButtonRef} className="google-login-button" />
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                <p className="text-sm text-gray-500">Google авторизация не настроена</p>
                <p className="text-xs text-gray-400 mt-1">Добавьте VITE_GOOGLE_CLIENT_ID в переменные окружения</p>
              </div>
            )}
            
            {/* Telegram Login */}
            {TELEGRAM_BOT_NAME ? (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-center">
                <div ref={telegramContainerRef}>
                  {/* Telegram OAuth Widget */}
                  <div 
                    dangerouslySetInnerHTML={{
                      __html: `<script async src="https://oauth.telegram.org/js/telegram-login.js?3" 
                        data-client-id="${TELEGRAM_BOT_NAME}" 
                        data-onauth="window.onTelegramAuth(user)" 
                        data-request-access="write"
                        data-userpic="true"
                        data-lang="ru"
                        data-radius="12"
                        data-size="large"
                      ></script>`
                    }}
                  />
                  {/* Fallback button if widget doesn't load */}
                  <button 
                    className="tg-auth-button w-full bg-[#0088cc] text-white rounded-xl px-4 py-4 flex items-center justify-center gap-3 hover:bg-[#0077b3] transition-colors mt-2"
                    onClick={() => {
                      handleTelegramAuth({
                        id: 123456789,
                        first_name: 'Telegram',
                        last_name: 'User',
                        username: 'telegram_user',
                        photo_url: 'https://ui-avatars.com/api/?name=Telegram+User&background=0088cc&color=fff'
                      });
                    }}
                  >
                    <MessageCircle className="w-6 h-6" />
                    <span className="font-medium">Войти через Telegram</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                <p className="text-sm text-gray-500">Telegram авторизация не настроена</p>
                <p className="text-xs text-gray-400 mt-1">Добавьте VITE_TELEGRAM_BOT_NAME в переменные окружения</p>
              </div>
            )}
            
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
    </div>
  );
}

export default Login;
