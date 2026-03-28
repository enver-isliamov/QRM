import { useState, useEffect } from 'react'
import { Session, User } from '@supabase/supabase-js'
import useSWR, { mutate } from 'swr'
import { supabase, Profile } from '../lib/supabase'
import i18n from '../i18n'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const { data: profile, isLoading: profileLoading } = useSWR(user ? `profile_${user.id}` : null, async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
    if (error) throw error
    if (data && data.language && data.language !== i18n.language) {
      i18n.changeLanguage(data.language)
    }
    return data as Profile
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session); setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signInWithMagicLink = (email: string) =>
    supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/auth/callback' } })

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/auth/callback' } })

  const signOut = async () => { 
    await supabase.auth.signOut()
    mutate(user ? `profile_${user.id}` : null, null, false)
  }

  return { 
    session, user, profile: profile || null, 
    loading: authLoading || (user && profileLoading), 
    isAuthenticated: !!session,
    signInWithMagicLink, signInWithGoogle, signOut,
    refreshProfile: () => user && mutate(`profile_${user.id}`) 
  }
}
