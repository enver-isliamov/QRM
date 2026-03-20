export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin' | 'moderator';
  provider: 'google' | 'telegram' | 'email';
  createdAt: string;
  lastLogin: string;
}

export interface PrayerTime {
  name: string;
  nameCrh: string;
  time: string;
  completed?: boolean;
}

export interface DailyPrayers {
  date: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface EthnoEvent {
  id: string;
  date: string;
  day: number;
  month: string;
  monthCrh: string;
  title: string;
  titleCrh: string;
  description: string;
  descriptionCrh: string;
  type: 'holiday' | 'memorial' | 'custom';
}

export interface Ritual {
  id: string;
  title: string;
  titleCrh: string;
  subtitle: string;
  subtitleCrh: string;
  icon: string;
  steps: RitualStep[];
}

export interface RitualStep {
  title: string;
  titleCrh: string;
  description: string;
  descriptionCrh: string;
}

export interface HelpRequest {
  id: string;
  type: 'blood' | 'money' | 'other';
  urgency: 'urgent' | 'normal';
  title: string;
  location: string;
  description: string;
  contactPhone: string;
  createdAt: string;
  status: 'active' | 'completed' | 'cancelled';
  responses: number;
}

export interface VillageMeeting {
  id: string;
  village: string;
  villageCrh: string;
  organizer: string;
  location: string;
  date: string;
  time?: string;
  description: string;
  fundProgress?: number;
  fundGoal?: number;
  fundPurpose?: string;
  attendees: number;
  isUserGoing: boolean;
  status: 'upcoming' | 'completed' | 'cancelled';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}
