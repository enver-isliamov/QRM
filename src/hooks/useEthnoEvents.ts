import useSWR from 'swr'
import { supabase, EthnoEventRow } from '../lib/supabase'
import { ethnoEvents as staticEvents } from '../store/data/ethnoCalendar'

export function useEthnoEvents() {
  const { data: events = [], isLoading: loading } = useSWR('ethno_events', async () => {
    const { data: dbData, error } = await supabase.from('ethno_events').select('*').order('event_date')
    
    const mappedStatic = staticEvents.map(e => ({
      id: e.id, 
      event_date: e.date, 
      title: e.title, 
      title_crh: e.titleCrh,
      description: e.description, 
      description_crh: e.descriptionCrh,
      type: e.type as any, 
      is_recurring: false,
    })) as EthnoEventRow[]

    if (error || !dbData) {
      return mappedStatic
    }

    // Merge and remove duplicates by date + title
    const combined = [...mappedStatic, ...(dbData as EthnoEventRow[])]
    const unique = combined.reduce((acc, current) => {
      const key = `${current.event_date}-${current.title}`
      if (!acc.find(item => `${item.event_date}-${item.title}` === key)) {
        acc.push(current)
      }
      return acc
    }, [] as EthnoEventRow[])

    return unique.sort((a, b) => a.event_date.localeCompare(b.event_date))
  })

  const upcoming = (count = 5) => {
    const today = new Date().toISOString().split('T')[0]
    return events.filter(e => e.event_date >= today).slice(0, count)
  }

  return { events, loading, upcoming }
}
