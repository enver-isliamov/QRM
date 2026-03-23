import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase env vars missing — running in demo mode')
}

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)

export type Profile = {
  id: string
  name: string
  avatar_url?: string | null
  role: 'user' | 'moderator' | 'admin'
  provider: string
  language?: 'ru' | 'crh'
  phone?: string | null
  bio?: string | null
  village?: string | null
  created_at: string
  last_login: string
}

export type PrayerTimeRow = {
  id: number
  date: string
  fajr: string
  sunrise: string
  dhuhr: string
  asr: string
  maghrib: string
  isha: string
}

export type EthnoEventRow = {
  id: string
  event_date: string
  title: string
  title_crh?: string
  description?: string
  description_crh?: string
  type: 'holiday' | 'memorial' | 'custom'
  is_recurring: boolean
}

export type RitualRow = {
  id: string
  title: string
  title_crh?: string
  subtitle?: string
  subtitle_crh?: string
  icon?: string
  sort_order?: number
}

export type RitualStepRow = {
  id: number
  ritual_id: string
  step_order: number
  title: string
  title_crh?: string
  description?: string
  description_crh?: string
}

export type HelpRequestRow = {
  id: string
  author_id?: string
  type: 'blood' | 'money' | 'other'
  urgency: 'urgent' | 'normal'
  title: string
  location: string
  description: string
  contact_phone?: string
  status: 'active' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  responses_count?: number
}

export type MeetingRow = {
  id: string
  author_id?: string
  village: string
  village_crh?: string
  organizer: string
  organizer_phone?: string | null
  organizer_email?: string | null
  location?: string | null
  meeting_date: string
  meeting_time?: string | null
  description?: string | null
  fund_purpose?: string | null
  fund_goal?: number | null
  fund_current?: number | null
  fund_progress?: number | null
  fund_cloudtips_url?: string | null
  fund_instructions?: string | null
  cover_image_url?: string | null
  is_public?: boolean
  status: 'upcoming' | 'completed' | 'cancelled'
  created_at: string
  // from view
  attendees_count?: number
  subscribers_count?: number
}
