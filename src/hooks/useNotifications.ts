import { useState, useEffect, useCallback } from 'react'
import useSWR, { mutate } from 'swr'
import { supabase } from '../lib/supabase'

export type AppNotification = {
  id: string; user_id: string
  type: 'meeting_update' | 'meeting_date_set' | 'help_response' | 'help_request_new' | 'system' | 'comment_reply' | 'mention'
  title: string; body?: string; link?: string
  is_read: boolean; created_at: string
}

const PAGE_SIZE = 20

export function useNotifications(userId: string | null) {
  const [page, setPage] = useState(1)
  const [allNotifications, setAllNotifications] = useState<AppNotification[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  // Первая страница через SWR (кэш + realtime)
  const { data: firstPage = [], isLoading: loading } = useSWR(
    userId ? `notifications_${userId}` : null,
    async () => {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .range(0, PAGE_SIZE - 1)

      if (error) throw error
      return data as AppNotification[]
    }
  )

  // Синхронизируем первую страницу с локальным стейтом
  useEffect(() => {
    if (firstPage.length > 0 || !loading) {
      setAllNotifications(firstPage)
      setHasMore(firstPage.length >= PAGE_SIZE)
      setPage(1)
    }
  }, [firstPage, loading])

  // Realtime: новые уведомления вставляются в начало
  useEffect(() => {
    if (!userId) return

    const channel = supabase.channel('notif_' + userId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        const newNotif = payload.new as AppNotification
        setAllNotifications(prev => {
          // Не дублировать
          if (prev.some(n => n.id === newNotif.id)) return prev
          return [newNotif, ...prev]
        })
        // Также обновляем SWR-кэш для первой страницы
        mutate(`notifications_${userId}`)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  // Загрузить следующую страницу
  const loadMore = useCallback(async () => {
    if (!userId || loadingMore || !hasMore) return

    setLoadingMore(true)
    const from = allNotifications.length
    const to   = from + PAGE_SIZE - 1

    const { data, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to)

    setLoadingMore(false)

    if (!error && data) {
      setAllNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id))
        const unique = (data as AppNotification[]).filter(n => !existingIds.has(n.id))
        return [...prev, ...unique]
      })
      setHasMore(data.length >= PAGE_SIZE)
    }
  }, [userId, loadingMore, hasMore, allNotifications.length])

  // Отметить одно уведомление прочитанным
  const markRead = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('id', id)

    if (!error) {
      setAllNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
    }
  }, [])

  // Отметить все прочитанными
  const markAllRead = useCallback(async () => {
    if (!userId) return
    const { error } = await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (!error) {
      setAllNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      mutate(`notifications_${userId}`)
    }
  }, [userId])

  // Очистить прочитанные
  const clearRead = useCallback(async () => {
    if (!userId) return
    const { error } = await supabase
      .from('user_notifications')
      .delete()
      .eq('user_id', userId)
      .eq('is_read', true)

    if (!error) {
      setAllNotifications(prev => prev.filter(n => !n.is_read))
      mutate(`notifications_${userId}`)
    }
  }, [userId])

  const unreadCount = allNotifications.filter(n => !n.is_read).length

  return {
    notifications: allNotifications,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    markRead,
    markAllRead,
    clearRead,
  }
}
