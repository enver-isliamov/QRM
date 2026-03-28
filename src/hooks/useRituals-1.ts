import { useState, useEffect } from 'react'
import { supabase, RitualRow, RitualStepRow } from '../lib/supabase'
import { rituals as staticRituals } from '../data/rituals'

export function useRituals() {
  const [rituals, setRituals] = useState<RitualRow[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.from('rituals').select('*').order('sort_order').then(({ data, error }) => {
      if (data && !error && data.length > 0) setRituals(data as RitualRow[])
      else setRituals(staticRituals.map(r => ({ id: r.id, title: r.title, title_crh: r.titleCrh, subtitle: r.subtitle, subtitle_crh: r.subtitleCrh, icon: r.icon })))
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
    ]).then(([rRes, sRes]) => {
      if (rRes.data && !rRes.error) { setRitual(rRes.data as RitualRow); setSteps((sRes.data as RitualStepRow[]) ?? []) }
      else {
        const s = staticRituals.find(r => r.id === id)
        if (s) {
          setRitual({ id: s.id, title: s.title, title_crh: s.titleCrh, subtitle: s.subtitle, subtitle_crh: s.subtitleCrh, icon: s.icon })
          setSteps(s.steps.map((step, i) => ({ id: i, ritual_id: id, step_order: i+1, title: step.title, title_crh: step.titleCrh, description: step.description, description_crh: step.descriptionCrh })))
        }
      }
      setLoading(false)
    })
  }, [id])
  return { ritual, steps, loading }
}
