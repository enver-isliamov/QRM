import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, CheckCheck, BellRing, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useNotifications } from '../hooks/useNotifications'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BD6HcwhDmsVV41he4vOhZ9L6MI8qGQR5ZDRxTJpJN_cogqm0VFeMH0pekjQw24AHXZGYpV1U9dA-mzydQXxgznA'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const typeIcon: Record<string, string> = {
  meeting_update: '📅', meeting_date_set: '🔔',
  help_response: '🤝', help_request_new: '🆘', system: 'ℹ️',
}

export default function Notifications() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(user?.id ?? null)
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default')
  const [isSubscribing, setIsSubscribing] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPushPermission(Notification.permission)
    }
  }, [])

  const requestPushPermission = async () => {
    // 0. Проверка на HTTPS
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      toast.error('Push-уведомления работают только через защищенное соединение (HTTPS)');
      return;
    }

    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      toast.error('Ваш браузер не поддерживает Push-уведомления');
      return;
    }

    setIsSubscribing(true)
    try {
      const perm = await Notification.requestPermission()
      setPushPermission(perm)
      
      if (perm === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        
        // Проверяем существующую подписку
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          });
        }

        // Сохраняем в Supabase
        const { error } = await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: user?.id,
            subscription: subscription.toJSON()
          }, { onConflict: 'user_id, subscription' });

        if (error) throw error;
        
        alert('Push-уведомления успешно включены!')
      } else {
        alert('Вы отклонили запрос на отправку уведомлений.')
      }
    } catch (error) {
      console.error('Error requesting push permission:', error)
      alert('Ошибка при настройке уведомлений. Попробуйте позже.')
    } finally {
      setIsSubscribing(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">Войдите, чтобы видеть уведомления</p>
          <button onClick={() => navigate('/login')}
            className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-medium">
            Войти
          </button>
        </div>
      </div>
    )
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
              <CheckCheck className="w-4 h-4" />
              <span>Все прочитаны</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 pb-24">
        {pushPermission === 'default' && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <BellRing className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 text-sm">Включить Push-уведомления</h3>
              <p className="text-xs text-blue-700 mt-0.5 mb-2 leading-relaxed">
                Получайте важные уведомления, даже когда приложение закрыто.
              </p>
              <button 
                onClick={requestPushPermission} 
                disabled={isSubscribing}
                className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors touch-feedback flex items-center gap-2 disabled:opacity-50">
                {isSubscribing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Настройка...</span>
                  </>
                ) : (
                  <span>Включить</span>
                )}
              </button>
            </div>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">Уведомлений пока нет</p>
            <p className="text-sm text-gray-300 mt-1">Подпишись на встречу или создай обращение</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <button key={n.id}
                onClick={() => { markRead(n.id); if (n.link) navigate(n.link) }}
                className={`w-full text-left rounded-xl p-4 border transition-colors ${
                  n.is_read ? 'bg-white border-gray-100' : 'bg-emerald-50 border-emerald-200'
                }`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{typeIcon[n.type] ?? '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-medium text-sm leading-snug ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                        {n.title}
                      </p>
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
  )
}
