import { useState, useEffect } from 'react'
import { supabase, MeetingRow } from '../lib/supabase'

export function useMeetings(userId?: string | null) {
  const [meetings, setMeetings] = useState<MeetingRow[]>([])
  const [attending, setAttending] = useState<Set<string>>(new Set())
  const [subscribed, setSubscribed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const fetchMeetings = async () => {
    const { data } = await supabase
      .from('meetings_with_stats').select('*').eq('status', 'upcoming')
      .order('meeting_date', { ascending: true })
    if (data) setMeetings(data as MeetingRow[])
    setLoading(false)
  }

  const fetchUserData = async (uid: string) => {
    const [att, sub] = await Promise.all([
      supabase.from('meeting_attendees').select('meeting_id').eq('user_id', uid),
      supabase.from('meeting_subscriptions').select('meeting_id').eq('user_id', uid),
    ])
    if (att.data) setAttending(new Set(att.data.map(r => r.meeting_id)))
    if (sub.data) setSubscribed(new Set(sub.data.map(r => r.meeting_id)))
  }

  useEffect(() => {
    fetchMeetings()
    if (userId) fetchUserData(userId)
    else { setAttending(new Set()); setSubscribed(new Set()) }
  }, [userId])

  const toggleAttend = async (meetingId: string) => {
    if (!userId) return false
    const going = attending.has(meetingId)
    if (going) {
      await supabase.from('meeting_attendees').delete().eq('meeting_id', meetingId).eq('user_id', userId)
      setAttending(prev => { const s = new Set(prev); s.delete(meetingId); return s })
      setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, attendees_count: Math.max(0, (m.attendees_count ?? 1) - 1) } : m))
    } else {
      const { error } = await supabase.from('meeting_attendees').insert({ meeting_id: meetingId, user_id: userId })
      if (!error) {
        setAttending(prev => new Set([...prev, meetingId]))
        setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, attendees_count: (m.attendees_count ?? 0) + 1 } : m))
      }
    }
    return true
  }

  const toggleSubscribe = async (meetingId: string) => {
    if (!userId) return false
    const isSub = subscribed.has(meetingId)
    if (isSub) {
      await supabase.from('meeting_subscriptions').delete().eq('meeting_id', meetingId).eq('user_id', userId)
      setSubscribed(prev => { const s = new Set(prev); s.delete(meetingId); return s })
    } else {
      const { error } = await supabase.from('meeting_subscriptions').insert({ meeting_id: meetingId, user_id: userId })
      if (!error) setSubscribed(prev => new Set([...prev, meetingId]))
    }
    return true
  }

  const addMeeting = async (data: Partial<MeetingRow>, authorId: string) => {
    const { data: inserted, error } = await supabase
      .from('meetings').insert({ ...data, author_id: authorId }).select().single()
    if (inserted && !error) await fetchMeetings()
    return { data: inserted, error }
  }

  const updateMeeting = async (id: string, updates: Partial<MeetingRow>) => {
    const meeting = meetings.find(m => m.id === id)
    const { error } = await supabase.from('meetings').update(updates).eq('id', id)
    if (!error) {
      await fetchMeetings()
      
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
    refresh: fetchMeetings,
  }
}

export function useMeetingDetail(id: string | undefined) {
  const [meeting, setMeeting] = useState<MeetingRow | null>(null)
  const [participants, setParticipants] = useState<{ id: string; name: string; avatar_url?: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('meetings_with_stats').select('*').eq('id', id).single(),
      supabase.from('meeting_attendees')
        .select('user_id, profiles(id, name, avatar_url)')
        .eq('meeting_id', id).limit(20),
    ]).then(([mRes, pRes]) => {
      if (mRes.data) setMeeting(mRes.data as MeetingRow)
      if (pRes.data) setParticipants(pRes.data.map((r: any) => r.profiles).filter(Boolean))
      setLoading(false)
    })
  }, [id])

  return { meeting, participants, loading }
}
