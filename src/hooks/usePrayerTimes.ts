import useSWR, { mutate } from 'swr'
import { supabase, PrayerTimeRow } from '../lib/supabase'
import { prayerTimes2026 } from '../store/data/prayerTimes'
import { format } from 'date-fns'

export function usePrayerTimesForDate(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd')
  const { data: prayers = null, isLoading: loading } = useSWR(`prayers_${dateStr}`, async () => {
    const { data, error } = await supabase.from('prayer_times').select('*').eq('date', dateStr).single()
    if (data && !error) {
      return { 
        ...data, 
        fajr: data.fajr.slice(0,5), 
        sunrise: data.sunrise.slice(0,5),
        dhuhr: data.dhuhr.slice(0,5), 
        asr: data.asr.slice(0,5),
        maghrib: data.maghrib.slice(0,5), 
        isha: data.isha.slice(0,5) 
      } as PrayerTimeRow
    } else {
      const s = prayerTimes2026[dateStr]
      return s ? { id: 0, ...s } as PrayerTimeRow : null
    }
  })

  return { prayers, loading }
}

export function usePrayerCompletions(userId: string | null, date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd')
  const { data: completed = [], isLoading: loading } = useSWR(userId ? `completions_${userId}_${dateStr}` : null, async () => {
    const { data, error } = await supabase.from('prayer_completions').select('prayer_key').eq('user_id', userId!).eq('date', dateStr)
    if (error) throw error
    return data?.map(r => r.prayer_key) ?? []
  })

  const toggle = async (prayerKey: string) => {
    if (!userId) return
    const isCompleted = completed.includes(prayerKey)
    if (isCompleted) {
      await supabase.from('prayer_completions').delete().eq('user_id', userId).eq('date', dateStr).eq('prayer_key', prayerKey)
    } else {
      await supabase.from('prayer_completions').insert({ user_id: userId, date: dateStr, prayer_key: prayerKey })
    }
    mutate(`completions_${userId}_${dateStr}`)
  }
  return { completed, toggle, loading }
}
