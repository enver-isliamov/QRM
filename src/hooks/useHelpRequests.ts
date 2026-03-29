import { useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import { supabase, HelpRequestRow } from '../lib/supabase'

export function useHelpRequests() {
  const { data: requests = [], isLoading: loading } = useSWR('help_requests', async () => {
    const { data, error } = await supabase
      .from('help_requests_with_count').select('*').eq('status', 'active')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as HelpRequestRow[]
  })

  useEffect(() => {
    const channel = supabase.channel('help_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'help_requests' }, () => mutate('help_requests'))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const addRequest = async (data: Omit<HelpRequestRow, 'id'|'created_at'|'updated_at'|'responses_count'>, userId?: string) => {
    if (userId) {
      const { count } = await supabase.from('help_requests')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId)
        .eq('status', 'active');
      
      if (count && count >= 3) {
        return { data: null, error: new Error('У вас уже есть 3 активных обращения. Закройте старые, чтобы добавить новое.') };
      }
    }
    const { data: inserted, error } = await supabase.from('help_requests')
      .insert({ ...data, author_id: userId ?? null }).select().single()
    if (inserted && !error) mutate('help_requests')
    return { data: inserted, error }
  }

  const respond = async (requestId: string, userId?: string) => {
    const { error } = await supabase.from('help_responses')
      .insert({ request_id: requestId, user_id: userId ?? null })
    if (!error) {
      mutate('help_requests')
      const request = requests.find(r => r.id === requestId)
      if (request && request.author_id && request.author_id !== userId) {
        await supabase.from('user_notifications').insert({
          user_id: request.author_id,
          type: 'help_response',
          title: 'Новый отклик',
          body: `Кто-то откликнулся на вашу просьбу "${request.title}".`,
          link: `/yardym/${requestId}`
        })
      }
    }
    return { error }
  }

  const closeRequest = async (requestId: string) => {
    const { error } = await supabase.from('help_requests')
      .update({ status: 'completed' })
      .eq('id', requestId)
    if (!error) mutate('help_requests')
    return { error }
  }

  const updateRequest = async (requestId: string, updates: Partial<HelpRequestRow>) => {
    // Удаляем вычисляемые поля, которые нельзя обновлять в таблице
    const { responses_count, created_at, updated_at, author, ...cleanUpdates } = updates as any;
    
    console.log('Updating help_request:', requestId, cleanUpdates);
    
    const { error } = await supabase.from('help_requests')
      .update(cleanUpdates)
      .eq('id', requestId)
    
    if (error) {
      console.error('Supabase Update Error:', error);
    }
    
    if (!error) mutate('help_requests')
    return { error }
  }

  const urgent = requests.filter(r => r.urgency === 'urgent')
  const normal = requests.filter(r => r.urgency === 'normal')
  return { requests, urgent, normal, loading, addRequest, respond, closeRequest, updateRequest }
}
