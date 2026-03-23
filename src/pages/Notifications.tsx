import { useNavigate } from 'react-router-dom';
import { Bell, Check, ChevronRight, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';

const typeIcon: Record<string, string> = {
  meeting_update: '📅',
  meeting_date_set: '🔔',
  help_response: '🤝',
  help_request_new: '🆘',
  system: 'ℹ️',
};

function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(user?.id ?? null);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Войдите, чтобы видеть уведомления</p>
          <button onClick={() => navigate('/login')} className="mt-4 bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-medium">Войти</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Уведомления</h1>
            {unreadCount > 0 && <p className="text-sm text-emerald-600">{unreadCount} непрочитанных</p>}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-600">
              <CheckCheck className="w-4 h-4" /><span>Все прочитаны</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 pb-24">
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">Уведомлений пока нет</p>
            <p className="text-sm text-gray-300 mt-1">Они появятся, когда что-то произойдёт</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <button key={n.id}
                onClick={() => { markRead(n.id); if (n.link) navigate(n.link); }}
                className={`w-full text-left rounded-xl p-4 border transition-colors ${
                  n.is_read ? 'bg-white border-gray-100' : 'bg-emerald-50 border-emerald-200'
                }`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{typeIcon[n.type] ?? '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-medium text-sm ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                      {!n.is_read && <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-1" />}
                    </div>
                    {n.body && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(n.created_at), 'd MMM, HH:mm', { locale: ru })}
                    </p>
                  </div>
                  {n.link && <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
