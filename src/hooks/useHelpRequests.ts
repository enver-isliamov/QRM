import { useState, useEffect } from 'react'
import { supabase, HelpRequestRow } from '../lib/supabase'

export function useHelpRequests() {
  const [requests, setRequests] = useState<HelpRequestRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('help_requests_with_count').select('*').eq('status', 'active')
      .order('created_at', { ascending: false })
    if (data && !error) setRequests(data as HelpRequestRow[])
    setLoading(false)
  }

  useEffect(() => {
    fetchRequests()
    const channel = supabase.channel('help_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'help_requests' }, fetchRequests)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const addRequest = async (data: Omit<HelpRequestRow, 'id'|'created_at'|'updated_at'|'responses_count'>, userId?: string) => {
    const { data: inserted, error } = await supabase.from('help_requests')
      .insert({ ...data, author_id: userId ?? null }).select().single()
    if (inserted && !error) await fetchRequests()
    return { data: inserted, error }
  }

  const respond = async (requestId: string, userId?: string) => {
    const { error } = await supabase.from('help_responses')
      .insert({ request_id: requestId, user_id: userId ?? null })
    if (!error) setRequests(prev => prev.map(r => r.id === requestId ? { ...r, responses_count: (r.responses_count ?? 0) + 1 } : r))
    return { error }
  }

  const urgent = requests.filter(r => r.urgency === 'urgent')
  const normal = requests.filter(r => r.urgency === 'normal')
  return { requests, urgent, normal, loading, addRequest, respond }
}
