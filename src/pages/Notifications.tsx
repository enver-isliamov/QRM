import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, CheckCheck, BellRing, Loader2, Trash2, Share } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useNotifications, AppNotification } from '../hooks/useNotifications'
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

const typeLabel: Record<string, string> = {
  meeting_update: 'Встреча обновлена',
  meeting_date_set: 'Назначено время',
  help_response: 'Новый отклик',
  help_request_new: 'Новое обращение',
  system: 'Система',
}

export default function Notifications() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { notifications, unreadCount, markRead, markAllRead, clearRead } = useNotifications(user?.id ?? null)
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPushPermission(Notification.permission)
    }
    
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    
    setIsStandalone(
      (window.navigator as any).standalone || 
      window.matchMedia('(display-mode: standalone)').matches
    );
  }, [])

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, AppNotification[]> = {};
    notifications.forEach(n => {
      // Group by link (e.g. /meetings/123) or id if no link
      const key = n.link || n.id;
      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    });
    
    return Object.entries(groups).map(([key, items]) => ({
      key,
      items: items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      latestDate: new Date(items[0].created_at),
      hasUnread: items.some(i => !i.is_read),
      link: items[0].link,
      type: items[0].type
    })).sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime());
  }, [notifications]);

  const requestPushPermission = async () => {
    if (isIOS && !isStandalone) {
      toast.error('Для работы уведомлений на iPhone необходимо добавить приложение на экран "Домой"');
      return;
    }

    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      toast.error('Ваш браузер не поддерживает Push-уведомления. Попробуйте использовать Chrome или Safari (после установки на экран "Домой")');
      return;
    }

    setIsSubscribing(true)
    try {
      const perm = await Notification.requestPermission()
      setPushPermission(perm)
      
      if (perm === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          });
        }

        const { error } = await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: user?.id,
            subscription: subscription.toJSON()
          }, { onConflict: 'user_id, subscription' });

        if (error) throw error;
        toast.success('Push-уведомления успешно включены!')
      } else {
        toast.error('Вы отклонили запрос на отправку уведомлений.')
      }
    } catch (error) {
      console.error('Error requesting push permission:', error)
      toast.error('Ошибка при настройке уведомлений. Попробуйте позже.')
    } finally {
      setIsSubscribing(false)
    }
  }

  const handleGroupClick = (group: any) => {
    // Mark all in group as read
    group.items.forEach((n: any) => {
      if (!n.is_read) markRead(n.id);
    });
    
    if (group.link) navigate(group.link);
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

  const readCount = notifications.filter(n => n.is_read).length;

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-4 border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Уведомления</h1>
            {unreadCount > 0 && <p className="text-sm text-emerald-600">{unreadCount} непрочитанных</p>}
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="p-2 text-gray-400 hover:text-emerald-600 transition-colors" title="Отметить все как прочитанные">
                <CheckCheck className="w-5 h-5" />
              </button>
            )}
            {readCount > 0 && (
              <button onClick={clearRead} className="p-2 text-gray-400 hover:text-rose-600 transition-colors" title="Очистить прочитанные">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 pb-24">
        {pushPermission !== 'granted' && (
          <div className="mb-6 bg-white border border-blue-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <BellRing className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">Будьте в курсе событий</h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Включите Push-уведомления, чтобы не пропустить отклики на ваши просьбы и новости встреч.
                </p>
                
                {isIOS && !isStandalone ? (
                  <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-3">
                    <Share className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-normal">
                      <strong>Для iPhone:</strong> Нажмите «Поделиться» <Share className="inline w-3 h-3" /> в браузере и выберите <strong>«На экран "Домой"»</strong>. Только после этого уведомления станут доступны.
                    </p>
                  </div>
                ) : (
                  <button 
                    onClick={requestPushPermission} 
                    disabled={isSubscribing}
                    className="mt-4 w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-blue-100">
                    {isSubscribing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Настройка...</span>
                      </>
                    ) : (
                      <span>Включить уведомления</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Уведомлений пока нет</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-[240px] mx-auto">
              Подпишитесь на встречу или создайте обращение, чтобы получать новости.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedNotifications.map(group => (
              <div key={group.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button 
                  onClick={() => handleGroupClick(group)}
                  className={`w-full text-left p-4 transition-colors hover:bg-gray-50 flex items-start gap-3 ${
                    group.hasUnread ? 'bg-emerald-50/30' : ''
                  }`}>
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0 border border-gray-100">
                    {typeIcon[group.type] ?? '🔔'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                          {typeLabel[group.type] ?? 'Уведомление'}
                        </span>
                        <h4 className={`font-bold text-sm leading-tight ${group.hasUnread ? 'text-gray-900' : 'text-gray-600'}`}>
                          {group.items[0].title}
                        </h4>
                      </div>
                      {group.hasUnread && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full flex-shrink-0 mt-1 shadow-sm shadow-emerald-200" />}
                    </div>
                    
                    {group.items.length > 1 ? (
                      <div className="mt-2 space-y-2">
                        {group.items.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-start gap-2">
                            <div className="w-1 h-1 bg-gray-300 rounded-full mt-1.5 flex-shrink-0" />
                            <p className="text-xs text-gray-500 line-clamp-1">{item.body || 'Без описания'}</p>
                          </div>
                        ))}
                        {group.items.length > 3 && (
                          <p className="text-[10px] font-medium text-emerald-600">
                            + еще {group.items.length - 3} сообщения
                          </p>
                        )}
                      </div>
                    ) : (
                      group.items[0].body && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {group.items[0].body}
                        </p>
                      )
                    )}
                    
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-medium">
                        {format(group.latestDate, 'd MMMM, HH:mm', { locale: ru })}
                      </span>
                      {group.link && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-tight">
                          <span>Подробнее</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
