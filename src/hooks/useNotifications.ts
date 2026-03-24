import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export type AppNotification = {
  id: string; user_id: string
  type: 'meeting_update' | 'meeting_date_set' | 'help_response' | 'help_request_new' | 'system'
  title: string; body?: string; link?: string
  is_read: boolean; created_at: string
}

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!userId) { setNotifications([]); setUnreadCount(0); return }

    const fetch = async () => {
      const { data } = await supabase
        .from('user_notifications').select('*').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(50)
      if (data) {
        setNotifications(data as AppNotification[])
        setUnreadCount(data.filter((n: AppNotification) => !n.is_read).length)
      }
    }

    fetch()

    const channel = supabase.channel('notif_' + userId)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'user_notifications', filter: `user_id=eq.${userId}`
      }, (payload) => {
        setNotifications(prev => [payload.new as AppNotification, ...prev])
        setUnreadCount(c => c + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const markRead = async (id: string) => {
    await supabase.from('user_notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(c => Math.max(0, c - 1))
  }

  const markAllRead = async () => {
    if (!userId) return
    await supabase.from('user_notifications').update({ is_read: true })
      .eq('user_id', userId).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  return { notifications, unreadCount, markRead, markAllRead }
}
