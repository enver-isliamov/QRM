import { useState, useEffect } from 'react'
import { supabase, RitualRow, RitualStepRow } from '../lib/supabase'
import { rituals as staticRituals } from '../data/rituals'

export function useRituals() {
  const [rituals, setRituals] = useState<RitualRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('rituals')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (data && !error && data.length > 0) {
          setRituals(data as RitualRow[])
        } else {
          setRituals(staticRituals.map(r => ({
            id: r.id,
            title: r.title,
            title_crh: r.titleCrh,
            subtitle: r.subtitle,
            subtitle_crh: r.subtitleCrh,
            icon: r.icon,
            sort_order: 0,
            created_at: '',
          })))
        }
        setLoading(false)
      })
  }, [])

  return { rituals, loading }
}

export function useRitualDetail(id: string) {
  const [ritual, setRitual] = useState<RitualRow | null>(null)
  const [steps, setSteps] = useState<RitualStepRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    Promise.all([
      supabase.from('rituals').select('*').eq('id', id).single(),
      supabase.from('ritual_steps').select('*').eq('ritual_id', id).order('step_order'),
    ]).then(([ritualRes, stepsRes]) => {
      if (ritualRes.data && !ritualRes.error) {
        setRitual(ritualRes.data as RitualRow)
        setSteps((stepsRes.data as RitualStepRow[]) ?? [])
      } else {
        // Fallback
        const staticR = staticRituals.find(r => r.id === id)
        if (staticR) {
          setRitual({ id: staticR.id, title: staticR.title, title_crh: staticR.titleCrh, subtitle: staticR.subtitle, subtitle_crh: staticR.subtitleCrh, icon: staticR.icon })
          setSteps(staticR.steps.map((s, i) => ({
            id: i,
            ritual_id: id,
            step_order: i + 1,
            title: s.title,
            title_crh: s.titleCrh,
            description: s.description,
            description_crh: s.descriptionCrh,
          })))
        }
      }
      setLoading(false)
    })
  }, [id])

  return { ritual, steps, loading }
}
