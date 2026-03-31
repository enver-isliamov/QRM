import { useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import { supabase } from '../lib/supabase'

export type AppNotification = {
  id: string; user_id: string
  type: 'meeting_update' | 'meeting_date_set' | 'help_response' | 'help_request_new' | 'system'
  title: string; body?: string; link?: string
  is_read: boolean; created_at: string
}

export function useNotifications(userId: string | null) {
  const { data: notifications = [], isLoading: loading } = useSWR(userId ? `notifications_${userId}` : null, async () => {
    const { data, error } = await supabase
      .from('user_notifications').select('*').eq('user_id', userId!)
      .order('created_at', { ascending: false }).limit(50)
    if (error) throw error
    return data as AppNotification[]
  })

  useEffect(() => {
    if (!userId) return

    const channel = supabase.channel('notif_' + userId)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'user_notifications', filter: `user_id=eq.${userId}`
      }, () => mutate(`notifications_${userId}`))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const markRead = async (id: string) => {
    const { error } = await supabase.from('user_notifications').update({ is_read: true }).eq('id', id)
    if (!error) mutate(`notifications_${userId}`)
  }

  const markAllRead = async () => {
    if (!userId) return
    const { error } = await supabase.from('user_notifications').update({ is_read: true })
      .eq('user_id', userId).eq('is_read', false)
    if (!error) mutate(`notifications_${userId}`)
  }

  const clearRead = async () => {
    if (!userId) return
    const { error } = await supabase.from('user_notifications').delete()
      .eq('user_id', userId).eq('is_read', true)
    if (!error) mutate(`notifications_${userId}`)
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return { notifications, unreadCount, markRead, markAllRead, clearRead, loading }
}
