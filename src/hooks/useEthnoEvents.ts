import { useState, useEffect } from 'react'
import { supabase, EthnoEventRow } from '../lib/supabase'
import { ethnoEvents as staticEvents } from '../data/ethnoCalendar'

export function useEthnoEvents() {
  const [events, setEvents] = useState<EthnoEventRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('ethno_events')
      .select('*')
      .order('event_date', { ascending: true })
      .then(({ data, error }) => {
        if (data && !error && data.length > 0) {
          setEvents(data as EthnoEventRow[])
        } else {
          // Fallback to static data
          setEvents(staticEvents.map(e => ({
            id: e.id,
            event_date: e.date,
            title: e.title,
            title_crh: e.titleCrh,
            description: e.description,
            description_crh: e.descriptionCrh,
            type: e.type,
            is_recurring: false,
          })))
        }
        setLoading(false)
      })
  }, [])

  const upcoming = (count = 5) => {
    const today = new Date().toISOString().split('T')[0]
    return events
      .filter(e => e.event_date >= today)
      .slice(0, count)
  }

  return { events, loading, upcoming }
}
