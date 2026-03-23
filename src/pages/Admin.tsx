import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, Settings, BarChart3, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

type Tab = 'users' | 'content' | 'stats' | 'settings';

function Admin() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('stats');

  const tabs = [
    { id: 'stats' as Tab,    label: 'Статистика',     icon: BarChart3 },
    { id: 'users' as Tab,    label: 'Пользователи',   icon: Users },
    { id: 'content' as Tab,  label: 'Контент',        icon: Settings },
    { id: 'settings' as Tab, label: 'Настройки',      icon: Shield },
  ];

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <button onClick={() => navigate('/profile')} className="flex items-center gap-2 text-gray-600 mb-2">
          <ChevronLeft className="w-5 h-5" /><span>Назад</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Админ-панель</h1>
            <p className="text-sm text-gray-500">Управление приложением</p>
          </div>
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto hide-scrollbar">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === id ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 pb-20">
        {activeTab === 'stats' && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Статистика</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Намазов записей', value: '—', color: 'text-emerald-600' },
                { label: 'Обращений',       value: '—', color: 'text-rose-600' },
                { label: 'Встреч',          value: '—', color: 'text-amber-600' },
                { label: 'Пользователей',   value: '—', color: 'text-purple-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                  <div className={`text-3xl font-bold ${color}`}>{value}</div>
                  <div className="text-sm text-gray-500">{label}</div>
                </div>
              ))}
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-sm text-emerald-700">
                Статистика в реальном времени доступна в{' '}
                <a href="https://supabase.com/dashboard/project/cksqnhldbrvbmdwtjefq"
                  target="_blank" rel="noreferrer"
                  className="font-medium underline">
                  Supabase Dashboard
                </a>
              </p>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Пользователи</h2>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
              <p className="text-sm text-gray-600">
                Управление пользователями производится через Supabase Authentication.
              </p>
              <a href="https://supabase.com/dashboard/project/cksqnhldbrvbmdwtjefq/auth/users"
                target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-purple-500 text-white py-3 rounded-xl font-medium hover:bg-purple-600 transition-colors">
                Открыть в Supabase
              </a>
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700 font-medium mb-1">Как назначить администратора:</p>
                <code className="text-xs text-amber-800 bg-amber-100 p-2 rounded block">
                  UPDATE profiles SET role = 'admin' WHERE id = '...uuid...';
                </code>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Управление контентом</h2>
            <div className="space-y-3">
              {[
                { title: 'Этно-календарь',     table: 'ethno_events',  desc: 'Праздники и памятные даты' },
                { title: 'Обрядовый гид',      table: 'rituals',       desc: 'Описания обрядов' },
                { title: 'Расписание намазов', table: 'prayer_times',  desc: 'Время намазов' },
                { title: 'Встречи сёл',        table: 'meetings',      desc: 'События в сёлах' },
                { title: 'Микро-Ярдым',        table: 'help_requests', desc: 'Обращения о помощи' },
              ].map(({ title, table, desc }) => (
                <div key={table} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
                  <p className="text-sm text-gray-500 mb-3">{desc}</p>
                  <a href={`https://supabase.com/dashboard/project/cksqnhldbrvbmdwtjefq/editor?table=${table}`}
                    target="_blank" rel="noreferrer"
                    className="text-purple-600 text-sm font-medium hover:underline">
                    Редактировать в Supabase →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Настройки</h2>
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-2">Supabase проект</h3>
                <p className="text-xs text-gray-500 font-mono mb-3">cksqnhldbrvbmdwtjefq</p>
                <a href="https://supabase.com/dashboard/project/cksqnhldbrvbmdwtjefq"
                  target="_blank" rel="noreferrer"
                  className="text-purple-600 text-sm font-medium hover:underline">
                  Открыть Dashboard →
                </a>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-2">Текущий пользователь</h3>
                <p className="text-sm text-gray-600">{profile?.name}</p>
                <p className="text-xs text-gray-400 mt-1">Роль: {profile?.role}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
