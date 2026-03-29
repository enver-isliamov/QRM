import useSWR from 'swr'
import { supabase, EthnoEventRow } from '../lib/supabase'
import { ethnoEvents as staticEvents } from '../store/data/ethnoCalendar'

export function useEthnoEvents() {
  const { data: events = [], isLoading: loading } = useSWR('ethno_events', async () => {
    const { data, error } = await supabase.from('ethno_events').select('*').order('event_date')
    if (data && !error && data.length > 0) {
      return data as EthnoEventRow[]
    } else {
      return staticEvents.map(e => ({
        id: e.id, event_date: e.date, title: e.title, title_crh: e.titleCrh,
        description: e.description, description_crh: e.descriptionCrh,
        type: e.type, is_recurring: false,
      })) as EthnoEventRow[]
    }
  })

  const upcoming = (count = 5) => {
    const today = new Date().toISOString().split('T')[0]
    return events.filter(e => e.event_date >= today).slice(0, count)
  }

  return { events, loading, upcoming }
}
