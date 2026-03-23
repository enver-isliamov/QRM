import { useState, useEffect } from 'react'
import { supabase, MeetingRow } from '../lib/supabase'

export function useMeetings(userId?: string | null) {
  const [meetings, setMeetings] = useState<MeetingRow[]>([])
  const [attending, setAttending] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const fetchMeetings = async () => {
    const { data, error } = await supabase
      .from('meetings_with_stats')
      .select('*')
      .eq('status', 'upcoming')
      .order('meeting_date', { ascending: true })

    if (data && !error) setMeetings(data as MeetingRow[])
    setLoading(false)
  }

  const fetchAttending = async (uid: string) => {
    const { data } = await supabase
      .from('meeting_attendees')
      .select('meeting_id')
      .eq('user_id', uid)
    if (data) setAttending(new Set(data.map(r => r.meeting_id)))
  }

  useEffect(() => {
    fetchMeetings()
    if (userId) fetchAttending(userId)
    else setAttending(new Set())
  }, [userId])

  const toggleAttend = async (meetingId: string) => {
    if (!userId) return false

    const isGoing = attending.has(meetingId)
    if (isGoing) {
      await supabase
        .from('meeting_attendees')
        .delete()
        .eq('meeting_id', meetingId)
        .eq('user_id', userId)
      setAttending(prev => { const s = new Set(prev); s.delete(meetingId); return s })
      setMeetings(prev =>
        prev.map(m => m.id === meetingId
          ? { ...m, attendees_count: Math.max(0, (m.attendees_count ?? 1) - 1) }
          : m)
      )
    } else {
      const { error } = await supabase
        .from('meeting_attendees')
        .insert({ meeting_id: meetingId, user_id: userId })
      if (!error) {
        setAttending(prev => new Set([...prev, meetingId]))
        setMeetings(prev =>
          prev.map(m => m.id === meetingId
            ? { ...m, attendees_count: (m.attendees_count ?? 0) + 1 }
            : m)
        )
      }
    }
    return true
  }

  const addMeeting = async (
    data: Omit<MeetingRow, 'id' | 'created_at' | 'attendees_count' | 'fund_progress'>,
    authorId: string
  ) => {
    const { data: inserted, error } = await supabase
      .from('meetings')
      .insert({ ...data, author_id: authorId })
      .select()
      .single()

    if (inserted && !error) {
      await fetchMeetings()
    }
    return { data: inserted, error }
  }

  const isGoing = (meetingId: string) => attending.has(meetingId)

  return { meetings, loading, toggleAttend, addMeeting, isGoing }
}
