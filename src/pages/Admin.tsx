import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, Settings, BarChart3, UserPlus, Trash2, Edit, ChevronLeft, X, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import { User } from '../types';

type AdminTab = 'users' | 'content' | 'settings' | 'stats';

function Admin() {
  const navigate = useNavigate();
  const { users, updateUserRole, deleteUser, addUser } = useStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'user' as const
  });
  
  const tabs = [
    { id: 'users' as AdminTab, label: 'Пользователи', icon: Users },
    { id: 'content' as AdminTab, label: 'Контент', icon: Settings },
    { id: 'stats' as AdminTab, label: 'Статистика', icon: BarChart3 },
    { id: 'settings' as AdminTab, label: 'Настройки', icon: Shield },
  ];
  
  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) return;
    
    const user: User = {
      id: 'user_' + Date.now(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      provider: 'email',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    addUser(user);
    setShowAddUserModal(false);
    setNewUser({ name: '', email: '', role: 'user' });
  };
  
  const handleDeleteUser = (userId: string) => {
    if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      deleteUser(userId);
    }
  };
  
  const handleUpdateRole = (userId: string, role: User['role']) => {
    updateUserRole(userId, role);
    setEditingUser(null);
  };
  
  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-gray-600 mb-2"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Назад</span>
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
      
      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id 
                    ? 'border-purple-500 text-purple-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 pb-20">
        {activeTab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Пользователи</h2>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="flex items-center gap-1 bg-purple-500 text-white px-3 py-2 rounded-lg text-sm font-medium"
              >
                <UserPlus className="w-4 h-4" />
                Добавить
              </button>
            </div>
            
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{user.name}</h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-700' 
                              : user.role === 'moderator'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {user.role === 'admin' ? 'Админ' : user.role === 'moderator' ? 'Модератор' : 'Пользователь'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {user.provider}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 hover:bg-rose-50 rounded-lg text-gray-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'content' && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Управление контентом</h2>
            
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-2">Этно-календарь</h3>
                <p className="text-sm text-gray-500 mb-3">Управление праздниками и памятными датами</p>
                <button className="text-purple-600 text-sm font-medium">
                  Редактировать →
                </button>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-2">Обрядовый гид</h3>
                <p className="text-sm text-gray-500 mb-3">Управление описаниями обрядов</p>
                <button className="text-purple-600 text-sm font-medium">
                  Редактировать →
                </button>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-2">Расписание намазов</h3>
                <p className="text-sm text-gray-500 mb-3">Обновление времени намазов</p>
                <button className="text-purple-600 text-sm font-medium">
                  Редактировать →
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'stats' && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Статистика</h2>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                <div className="text-3xl font-bold text-purple-600">{users.length}</div>
                <div className="text-sm text-gray-500">Пользователей</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                <div className="text-3xl font-bold text-emerald-600">12</div>
                <div className="text-sm text-gray-500">Событий</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                <div className="text-3xl font-bold text-rose-600">3</div>
                <div className="text-sm text-gray-500">Обращений</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                <div className="text-3xl font-bold text-amber-600">5</div>
                <div className="text-sm text-gray-500">Встреч</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3">Активность за неделю</h3>
              <div className="h-32 flex items-end justify-between gap-2">
                {[40, 65, 45, 80, 55, 70, 90].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className="w-full bg-purple-200 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-gray-400">
                      {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Настройки приложения</h2>
            
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-2">Монетизация</h3>
                <p className="text-sm text-gray-500 mb-3">Настройка ссылки для поддержки проекта</p>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value="https://pay.cloudtips.ru/p/8a27e9ab"
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
                  />
                  <button className="px-3 py-2 bg-purple-500 text-white rounded-lg text-sm">
                    Изменить
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-2">Telegram Bot</h3>
                <p className="text-sm text-gray-500 mb-3">Настройка бота для уведомлений</p>
                <button className="text-purple-600 text-sm font-medium">
                  Настроить →
                </button>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-2">Google Auth</h3>
                <p className="text-sm text-gray-500 mb-3">Настройка авторизации через Google</p>
                <button className="text-purple-600 text-sm font-medium">
                  Настроить →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Add User Modal */}
      {showAddUserModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-overlay"
          onClick={() => setShowAddUserModal(false)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Добавить пользователя</h2>
              <button onClick={() => setShowAddUserModal(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Введите имя"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="user">Пользователь</option>
                  <option value="moderator">Модератор</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
              
              <button
                onClick={handleAddUser}
                disabled={!newUser.name || !newUser.email}
                className="w-full bg-purple-500 text-white font-semibold py-3 rounded-xl hover:bg-purple-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit User Modal */}
      {editingUser && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-overlay"
          onClick={() => setEditingUser(null)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Изменить роль</h2>
              <button onClick={() => setEditingUser(null)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600">Пользователь: <strong>{editingUser.name}</strong></p>
              <p className="text-sm text-gray-500">{editingUser.email}</p>
            </div>
            
            <div className="space-y-2">
              {(['user', 'moderator', 'admin'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => handleUpdateRole(editingUser.id, role)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border ${
                    editingUser.role === role 
                      ? 'border-purple-500 bg-purple-50 text-purple-700' 
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>
                    {role === 'admin' ? 'Администратор' : role === 'moderator' ? 'Модератор' : 'Пользователь'}
                  </span>
                  {editingUser.role === role && <Check className="w-5 h-5" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
