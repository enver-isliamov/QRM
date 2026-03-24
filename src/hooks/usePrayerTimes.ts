import { useState, useEffect } from 'react'
import { supabase, PrayerTimeRow } from '../lib/supabase'
import { prayerTimes2026 } from '../data/prayerTimes'
import { format } from 'date-fns'

export function usePrayerTimesForDate(date: Date) {
  const [prayers, setPrayers] = useState<PrayerTimeRow | null>(null)
  const [loading, setLoading] = useState(true)
  const dateStr = format(date, 'yyyy-MM-dd')

  useEffect(() => {
    let cancelled = false; setLoading(true)
    supabase.from('prayer_times').select('*').eq('date', dateStr).single()
      .then(({ data, error }) => {
        if (cancelled) return
        if (data && !error) {
          setPrayers({ ...data, fajr: data.fajr.slice(0,5), sunrise: data.sunrise.slice(0,5),
            dhuhr: data.dhuhr.slice(0,5), asr: data.asr.slice(0,5),
            maghrib: data.maghrib.slice(0,5), isha: data.isha.slice(0,5) })
        } else {
          const s = prayerTimes2026[dateStr]
          setPrayers(s ? { id: 0, ...s } as PrayerTimeRow : null)
        }
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [dateStr])

  return { prayers, loading }
}

export function usePrayerCompletions(userId: string | null, date: Date) {
  const [completed, setCompleted] = useState<string[]>([])
  const dateStr = format(date, 'yyyy-MM-dd')

  useEffect(() => {
    if (!userId) { setCompleted([]); return }
    supabase.from('prayer_completions').select('prayer_key').eq('user_id', userId).eq('date', dateStr)
      .then(({ data }) => setCompleted(data?.map(r => r.prayer_key) ?? []))
  }, [userId, dateStr])

  const toggle = async (prayerKey: string) => {
    if (!userId) return
    if (completed.includes(prayerKey)) {
      await supabase.from('prayer_completions').delete().eq('user_id', userId).eq('date', dateStr).eq('prayer_key', prayerKey)
      setCompleted(prev => prev.filter(k => k !== prayerKey))
    } else {
      await supabase.from('prayer_completions').insert({ user_id: userId, date: dateStr, prayer_key: prayerKey })
      setCompleted(prev => [...prev, prayerKey])
    }
  }
  return { completed, toggle }
}
