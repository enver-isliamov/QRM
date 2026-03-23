import { useState, useEffect } from 'react'
import { supabase, PrayerTimeRow } from '../lib/supabase'
import { format } from 'date-fns'

// Fallback to static data if DB unavailable
import { prayerTimes2026 } from '../data/prayerTimes'

export function usePrayerTimesForDate(date: Date) {
  const [prayers, setPrayers] = useState<PrayerTimeRow | null>(null)
  const [loading, setLoading] = useState(true)

  const dateStr = format(date, 'yyyy-MM-dd')

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function load() {
      try {
        const { data, error } = await supabase
          .from('prayer_times')
          .select('*')
          .eq('date', dateStr)
          .single()

        if (!cancelled) {
          if (data && !error) {
            // Convert time strings "HH:MM:SS" → "HH:MM"
            setPrayers({
              ...data,
              fajr:    data.fajr.slice(0, 5),
              sunrise: data.sunrise.slice(0, 5),
              dhuhr:   data.dhuhr.slice(0, 5),
              asr:     data.asr.slice(0, 5),
              maghrib: data.maghrib.slice(0, 5),
              isha:    data.isha.slice(0, 5),
            })
          } else {
            // Fallback to static data
            const staticDay = prayerTimes2026[dateStr]
            if (staticDay) {
              setPrayers({ id: 0, ...staticDay } as any)
            } else {
              setPrayers(null)
            }
          }
        }
      } catch {
        if (!cancelled) {
          const staticDay = prayerTimes2026[dateStr]
          setPrayers(staticDay ? { id: 0, ...staticDay } as any : null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [dateStr])

  return { prayers, loading }
}

export function usePrayerCompletions(userId: string | null, date: Date) {
  const [completed, setCompleted] = useState<string[]>([])
  const dateStr = format(date, 'yyyy-MM-dd')

  useEffect(() => {
    if (!userId) { setCompleted([]); return }
    supabase
      .from('prayer_completions')
      .select('prayer_key')
      .eq('user_id', userId)
      .eq('date', dateStr)
      .then(({ data }) => {
        setCompleted(data?.map(r => r.prayer_key) ?? [])
      })
  }, [userId, dateStr])

  const toggle = async (prayerKey: string) => {
    if (!userId) return
    const isCompleted = completed.includes(prayerKey)
    if (isCompleted) {
      await supabase
        .from('prayer_completions')
        .delete()
        .eq('user_id', userId)
        .eq('date', dateStr)
        .eq('prayer_key', prayerKey)
      setCompleted(prev => prev.filter(k => k !== prayerKey))
    } else {
      await supabase
        .from('prayer_completions')
        .insert({ user_id: userId, date: dateStr, prayer_key: prayerKey })
      setCompleted(prev => [...prev, prayerKey])
    }
  }

  return { completed, toggle }
}
