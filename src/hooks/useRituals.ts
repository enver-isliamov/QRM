import useSWR from 'swr'
import { supabase, RitualRow, RitualStepRow } from '../lib/supabase'
import { rituals as staticRituals } from '../data/rituals'

export function useRituals() {
  const { data: rituals = [], isLoading: loading } = useSWR('rituals', async () => {
    const { data, error } = await supabase.from('rituals').select('*').order('sort_order')
    if (data && !error && data.length > 0) return data as RitualRow[]
    return staticRituals.map(r => ({ 
      id: r.id, title: r.title, title_crh: r.titleCrh, 
      subtitle: r.subtitle, subtitle_crh: r.subtitleCrh, icon: r.icon 
    })) as RitualRow[]
  })
  return { rituals, loading }
}

export function useRitualDetail(id: string) {
  const { data, isLoading: loading } = useSWR(id ? `ritual_${id}` : null, async () => {
    const [rRes, sRes] = await Promise.all([
      supabase.from('rituals').select('*').eq('id', id).single(),
      supabase.from('ritual_steps').select('*').eq('ritual_id', id).order('step_order'),
    ])
    
    if (rRes.data && !rRes.error) {
      return {
        ritual: rRes.data as RitualRow,
        steps: (sRes.data as RitualStepRow[]) ?? []
      }
    } else {
      const s = staticRituals.find(r => r.id === id)
      if (s) {
        return {
          ritual: { id: s.id, title: s.title, title_crh: s.titleCrh, subtitle: s.subtitle, subtitle_crh: s.subtitleCrh, icon: s.icon } as RitualRow,
          steps: s.steps.map((step, i) => ({ 
            id: i, ritual_id: id, step_order: i+1, 
            title: step.title, title_crh: step.titleCrh, 
            description: step.description, description_crh: step.descriptionCrh 
          })) as RitualStepRow[]
        }
      }
    }
    return { ritual: null, steps: [] }
  })

  return { 
    ritual: data?.ritual || null, 
    steps: data?.steps || [], 
    loading 
  }
}
