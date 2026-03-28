import { useState, useEffect } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase, Profile } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) setProfile(data as Profile)
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session); setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const signInWithMagicLink = (email: string) =>
    supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/auth/callback' } })

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/auth/callback' } })

  const signOut = async () => { await supabase.auth.signOut(); setProfile(null) }

  return { session, user, profile, loading, isAuthenticated: !!session,
           signInWithMagicLink, signInWithGoogle, signOut,
           refreshProfile: () => user && fetchProfile(user.id) }
}
