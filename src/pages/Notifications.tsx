import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, CheckCheck, BellRing, Loader2, Trash2, Share, BellOff, AlertTriangle, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useNotifications, AppNotification } from '../hooks/useNotifications'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  'BD6HcwhDmsVV41he4vOhZ9L6MI8qGQR5ZDRxTJpJN_cogqm0VFeMH0pekjQw24AHXZGYpV1U9dA-mzydQXxgznA'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from(rawData, c => c.charCodeAt(0))
}

type PushSupportResult = {
  supported: boolean
  reason: 'ok' | 'no_sw' | 'no_notification' | 'no_push_manager' | 'ios_not_standalone'
}

function checkPushSupport(): PushSupportResult {
  const hasSW    = 'serviceWorker' in navigator
  const hasNotif = 'Notification' in window
  const hasPush  = 'PushManager' in window
  const ua = navigator.userAgent.toLowerCase()
  const isIOS = /iphone|ipad|ipod/.test(ua)
  const isStandalone =
    (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  if (isIOS && !isStandalone) return { supported: false, reason: 'ios_not_standalone' }
  if (!hasSW)    return { supported: false, reason: 'no_sw' }
  if (!hasNotif) return { supported: false, reason: 'no_notification' }
  if (!hasPush)  return { supported: false, reason: 'no_push_manager' }
  return { supported: true, reason: 'ok' }
}

const typeIcon: Record<string, string> = {
  meeting_update: '📅', meeting_date_set: '🔔',
  help_response: '🤝', help_request_new: '🆘', system: 'ℹ️',
}
const typeLabel: Record<string, string> = {
  meeting_update: 'Встреча обновлена', meeting_date_set: 'Назначено время',
  help_response: 'Новый отклик', help_request_new: 'Новое обращение', system: 'Система',
}

export default function Notifications() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { notifications, unreadCount, markRead, markAllRead, clearRead } = useNotifications(user?.id ?? null)
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default')
  const [isSubscribing, setIsSubscribing]   = useState(false)
  const [pushSupport, setPushSupport]       = useState<PushSupportResult | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setPushSupport(checkPushSupport())
      if ('Notification' in window) setPushPermission(Notification.permission)
    }, 200)
    return () => clearTimeout(timer)
  }, [])

  // FIX-003: useMemo возвращает массив — правильно типизируем
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, AppNotification[]> = {}
    notifications.forEach(n => {
      const key = n.link || n.id
      if (!groups[key]) groups[key] = []
      groups[key].push(n)
    })
    return Object.entries(groups)
      .map(([key, items]) => ({
        key,
        items: items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        latestDate: new Date(items[0].created_at),
        hasUnread: items.some(i => !i.is_read),
        link: items[0].link,
        type: items[0].type,
      }))
      .sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime())
  }, [notifications])

  // FIX-003: (typeof arr)[0] вместо ReturnType<typeof arr>[0]
  const handleGroupClick = (group: (typeof groupedNotifications)[0]) => {
    // FIX-003: явный тип n в forEach
    group.items.forEach((n: AppNotification) => { if (!n.is_read) markRead(n.id) })
    if (group.link) navigate(group.link)
  }

  const requestPushPermission = async () => {
    if (!pushSupport) return
    if (pushSupport.reason === 'ios_not_standalone') {
      toast.error('На iPhone/iPad уведомления работают только в установленном PWA')
      return
    }
    if (!pushSupport.supported) {
      toast.error('Ваш браузер не поддерживает push-уведомления')
      return
    }
    if (pushPermission === 'denied') {
      toast.error('Уведомления заблокированы. Разрешите их в настройках браузера.')
      return
    }
    try {
      setIsSubscribing(true)
      const perm = await Notification.requestPermission()
      setPushPermission(perm)
      if (perm !== 'granted') {
        toast.error('Разрешение не получено.')
        return
      }
      const registration = await navigator.serviceWorker.ready
      if (!registration.pushManager) {
        toast.error('Push Manager недоступен. Установите приложение на экран «Домой».')
        return
      }
      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        // FIX-002: .buffer as ArrayBuffer — правильный тип для applicationServerKey
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
        })
      }
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({ user_id: user?.id, subscription: subscription.toJSON() }, { onConflict: 'user_id' })
      if (error) throw error
      toast.success('Push-уведомления включены! 🎉')
    } catch (err: unknown) {
      const e = err as Error
      if (e.name === 'NotAllowedError') {
        toast.error('Разрешение отклонено. Проверьте настройки браузера.')
      } else {
        toast.error(`Ошибка: ${e.message || 'Неизвестная ошибка'}`)
      }
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
          <button onClick={() => navigate('/login')} className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-medium">Войти</button>
        </div>
      </div>
    )
  }

  const readCount  = notifications.filter(n => n.is_read).length
  const showBanner = pushSupport !== null && pushPermission !== 'granted'

  const renderPushBanner = () => {
    if (!showBanner || !pushSupport) return null

    if (pushSupport.reason === 'ios_not_standalone') {
      return (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Share className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900">Установите приложение для уведомлений</h3>
              <p className="text-sm text-amber-800 mt-1 leading-relaxed">Уведомления на iPhone работают только в установленном приложении.</p>
              <div className="mt-3 bg-white border border-amber-200 rounded-xl p-3 space-y-2 text-sm text-amber-900">
                <p>1. Нажмите <strong>«Поделиться»</strong> в Safari</p>
                <p>2. Выберите <strong>«На экран "Домой"»</strong></p>
                <p>3. Откройте приложение с иконки и включите уведомления</p>
              </div>
              <p className="text-xs text-amber-600 mt-2">Требуется iOS 16.4+ и Safari</p>
            </div>
          </div>
        </div>
      )
    }

    if (pushPermission === 'denied') {
      return (
        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-rose-900">Уведомления заблокированы</h3>
              <div className="mt-3 bg-white border border-rose-200 rounded-xl p-3 text-sm text-rose-800 space-y-1">
                <p>• Нажмите на <strong>значок замка 🔒</strong> в адресной строке</p>
                <p>• Найдите «Уведомления» → «Разрешить»</p>
                <p>• Перезагрузите страницу</p>
              </div>
              <button onClick={() => window.location.reload()}
                className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:underline">
                <Settings className="w-4 h-4" />Обновить страницу
              </button>
            </div>
          </div>
        </div>
      )
    }

    if (!pushSupport.supported) {
      return (
        <div className="mb-6 bg-gray-100 border border-gray-200 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-2xl flex items-center justify-center flex-shrink-0">
              <BellOff className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-700">Push-уведомления недоступны</h3>
              <p className="text-sm text-gray-500 mt-1">Попробуйте Google Chrome или установите приложение на экран «Домой».</p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="mb-6 bg-white border border-blue-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <BellRing className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">Будьте в курсе событий</h3>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              Получайте уведомления об откликах и новостях встреч — даже когда приложение закрыто.
            </p>
            <button onClick={requestPushPermission} disabled={isSubscribing}
              className="mt-4 w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-blue-100">
              {isSubscribing
                ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Подключение...</span></>
                : <><Bell className="w-5 h-5" /><span>Включить уведомления</span></>
              }
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-4 border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Уведомления</h1>
            {unreadCount > 0 && <p className="text-sm text-emerald-600">{unreadCount} непрочитанных</p>}
          </div>
          <div className="flex items-center gap-2">
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
        {renderPushBanner()}

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
                <button onClick={() => handleGroupClick(group)}
                  className={`w-full text-left p-4 transition-colors hover:bg-gray-50 flex items-start gap-3 ${group.hasUnread ? 'bg-emerald-50/30' : ''}`}>
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
                      {group.hasUnread && (
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full flex-shrink-0 mt-1 shadow-sm shadow-emerald-200" />
                      )}
                    </div>
                    {group.items.length > 1 ? (
                      <div className="mt-2 space-y-1">
                        {group.items.slice(0, 3).map(item => (
                          <div key={item.id} className="flex items-start gap-2">
                            <div className="w-1 h-1 bg-gray-300 rounded-full mt-1.5 flex-shrink-0" />
                            <p className="text-xs text-gray-500 line-clamp-1">{item.body || '–'}</p>
                          </div>
                        ))}
                        {group.items.length > 3 && (
                          <p className="text-[10px] font-medium text-emerald-600">+ ещё {group.items.length - 3}</p>
                        )}
                      </div>
                    ) : (
                      group.items[0].body && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{group.items[0].body}</p>
                      )
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-medium">
                        {format(group.latestDate, 'd MMMM, HH:mm', { locale: ru })}
                      </span>
                      {group.link && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-tight">
                          <span>Подробнее</span><ChevronRight className="w-3 h-3" />
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
