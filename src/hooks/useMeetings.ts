import useSWR, { mutate } from 'swr'
import { supabase, MeetingRow } from '../lib/supabase'

export function useMeetings(userId?: string | null) {
  const { data: meetings = [], isLoading: loading } = useSWR('meetings', async () => {
    // ВРЕМЕННО: Читаем напрямую из таблицы meetings, чтобы проверить сохранение ссылки
    const { data, error } = await supabase
      .from('meetings').select('*').eq('status', 'upcoming')
      .order('meeting_date', { ascending: true })
    if (error) throw error
    return data as MeetingRow[]
  })

  const { data: userData } = useSWR(userId ? `user_meetings_${userId}` : null, async () => {
    const [att, sub] = await Promise.all([
      supabase.from('meeting_attendees').select('meeting_id').eq('user_id', userId!),
      supabase.from('meeting_subscriptions').select('meeting_id').eq('user_id', userId!),
    ])
    return {
      attending: new Set(att.data?.map(r => r.meeting_id) || []),
      subscribed: new Set(sub.data?.map(r => r.meeting_id) || [])
    }
  })

  const attending = userData?.attending || new Set<string>()
  const subscribed = userData?.subscribed || new Set<string>()

  const toggleAttend = async (meetingId: string) => {
    if (!userId) return false
    const going = attending.has(meetingId)
    if (going) {
      await supabase.from('meeting_attendees').delete().eq('meeting_id', meetingId).eq('user_id', userId)
    } else {
      await supabase.from('meeting_attendees').insert({ meeting_id: meetingId, user_id: userId })
    }
    mutate('meetings')
    mutate(`user_meetings_${userId}`)
    return true
  }

  const toggleSubscribe = async (meetingId: string) => {
    if (!userId) return false
    const isSub = subscribed.has(meetingId)
    if (isSub) {
      await supabase.from('meeting_subscriptions').delete().eq('meeting_id', meetingId).eq('user_id', userId)
    } else {
      await supabase.from('meeting_subscriptions').insert({ meeting_id: meetingId, user_id: userId })
    }
    mutate(`user_meetings_${userId}`)
    return true
  }

  const addMeeting = async (data: Partial<MeetingRow>, authorId: string) => {
    console.log('Supabase: Adding meeting with data:', data);
    const { data: inserted, error } = await supabase
      .from('meetings').insert({ ...data, author_id: authorId }).select().single()
    if (error) console.error('Supabase: Add meeting error:', error);
    if (inserted && !error) mutate('meetings')
    return { data: inserted, error }
  }

  const updateMeeting = async (id: string, updates: Partial<MeetingRow>) => {
    const meeting = meetings.find(m => m.id === id)
    console.log('Supabase: Updating meeting', id, 'with data:', updates);
    const { error } = await supabase.from('meetings').update(updates).eq('id', id)
    if (error) console.error('Supabase: Update meeting error:', error);
    if (!error) {
      mutate('meetings')
      
      const { data: subs } = await supabase.from('meeting_subscriptions').select('user_id').eq('meeting_id', id)
      if (subs && subs.length > 0) {
        const isDateSet = meeting && !meeting.meeting_time && updates.meeting_time
        const type = isDateSet ? 'meeting_date_set' : 'meeting_update'
        const title = isDateSet 
          ? `Назначено время встречи в ${meeting.village}` 
          : (meeting ? `Встреча в ${meeting.village} обновлена` : 'Встреча обновлена')
        const body = isDateSet
          ? `Время встречи: ${updates.meeting_time}`
          : 'Организатор внес изменения в детали встречи.'
          
        const notifications = subs.map(sub => ({
          user_id: sub.user_id,
          type: type,
          title: title,
          body: body,
          link: `/meetings/${id}`
        }))
        await supabase.from('user_notifications').insert(notifications)
      }
    }
    return { error }
  }

  return {
    meetings, loading, toggleAttend, toggleSubscribe, addMeeting, updateMeeting,
    isGoing: (id: string) => attending.has(id),
    isSubscribed: (id: string) => subscribed.has(id),
    refresh: () => mutate('meetings'),
  }
}

export function useMeetingDetail(id: string | undefined) {
  const { data, isLoading: loading } = useSWR(id ? `meeting_${id}` : null, async () => {
    const [mRes, pRes] = await Promise.all([
      supabase.from('meetings').select('*').eq('id', id!).single(),
      supabase.from('meeting_attendees')
        .select('user_id, profiles(id, name, avatar_url)')
        .eq('meeting_id', id!).limit(20),
    ])
    return {
      meeting: mRes.data as MeetingRow,
      participants: pRes.data?.map((r: any) => r.profiles).filter(Boolean) || []
    }
  })

  return { 
    meeting: data?.meeting || null, 
    participants: data?.participants || [], 
    loading,
    refresh: () => mutate(`meeting_${id}`)
  }
}
