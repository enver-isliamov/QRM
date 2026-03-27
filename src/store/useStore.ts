import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, HelpRequest, VillageMeeting, Notification } from '../types';

interface AppState {
  // User
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  
  // Prayer tracking
  completedPrayers: Record<string, string[]>;
  togglePrayer: (date: string, prayer: string) => void;
  
  // Help requests
  helpRequests: HelpRequest[];
  addHelpRequest: (request: HelpRequest) => void;
  respondToHelp: (requestId: string) => void;
  
  // Village meetings
  meetings: VillageMeeting[];
  toggleMeetingAttendance: (meetingId: string) => void;
  addMeeting: (meeting: VillageMeeting) => void;
  
  // Notifications
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  
  // Admin
  users: User[];
  addUser: (user: User) => void;
  updateUserRole: (userId: string, role: User['role']) => void;
  deleteUser: (userId: string) => void;
  
  // Feature Toggles
  featureToggles: {
    yardym: boolean;
    meetings: boolean;
    calendar: boolean;
    rituals: boolean;
    preModeration: boolean;
  };
  setFeatureToggle: (feature: 'yardym' | 'meetings' | 'calendar' | 'rituals' | 'preModeration', value: boolean) => void;
}

// Demo users for testing
const demoUsers: User[] = [
  {
    id: '1',
    email: 'admin@oraza.ru',
    name: 'Администратор',
    role: 'admin',
    provider: 'email',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  }
];

// Demo help requests
const demoHelpRequests: HelpRequest[] = [
  {
    id: '1',
    type: 'blood',
    urgency: 'urgent',
    title: 'СРОЧНО: КРОВЬ 4-',
    location: 'Симферополь, Центр Крови',
    description: 'Для Ибраимова Эскендера. Просим отозваться доноров.',
    contactPhone: '+7 (978) 123-45-67',
    createdAt: new Date().toISOString(),
    status: 'active',
    responses: 0
  }
];

// Demo meetings
const demoMeetings: VillageMeeting[] = [
  {
    id: '1',
    village: 'с. Ускут (Приветное)',
    villageCrh: 'Ускут койю (Мерhaba)',
    organizer: 'Совет старейшин',
    location: 'Поляна "Кок-Асан"',
    date: '2026-06-15',
    time: '12:00',
    description: 'Встреча жителей села. Планируется обсуждение вопросов благоустройства.',
    fundProgress: 65,
    fundGoal: 500000,
    fundPurpose: 'Сбор на реставрацию чешме',
    attendees: 142,
    isUserGoing: false,
    status: 'upcoming'
  },
  {
    id: '2',
    village: 'с. Кучук-Узень',
    villageCrh: 'Кучук-Узень койю',
    organizer: 'Оргкомитет',
    location: 'Дом культуры',
    date: '2026-04-10',
    description: 'Дата встречи уточняется оргкомитетом...',
    attendees: 0,
    isUserGoing: false,
    status: 'upcoming'
  }
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // User
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
      
      // Prayer tracking
      completedPrayers: {},
      togglePrayer: (date, prayer) => set((state) => {
        const dayPrayers = state.completedPrayers[date] || [];
        const newDayPrayers = dayPrayers.includes(prayer)
          ? dayPrayers.filter(p => p !== prayer)
          : [...dayPrayers, prayer];
        return {
          completedPrayers: {
            ...state.completedPrayers,
            [date]: newDayPrayers
          }
        };
      }),
      
      // Help requests
      helpRequests: demoHelpRequests,
      addHelpRequest: (request) => set((state) => ({
        helpRequests: [request, ...state.helpRequests]
      })),
      respondToHelp: (requestId) => set((state) => ({
        helpRequests: state.helpRequests.map(r =>
          r.id === requestId ? { ...r, responses: r.responses + 1 } : r
        )
      })),
      
      // Meetings
      meetings: demoMeetings,
      toggleMeetingAttendance: (meetingId) => set((state) => ({
        meetings: state.meetings.map(m =>
          m.id === meetingId
            ? { ...m, isUserGoing: !m.isUserGoing, attendees: m.isUserGoing ? m.attendees - 1 : m.attendees + 1 }
            : m
        )
      })),
      addMeeting: (meeting) => set((state) => ({
        meetings: [meeting, ...state.meetings]
      })),
      
      // Notifications
      notifications: [],
      addNotification: (notification) => set((state) => ({
        notifications: [notification, ...state.notifications]
      })),
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        )
      })),
      clearNotifications: () => set({ notifications: [] }),
      
      // Admin
      users: demoUsers,
      addUser: (user) => set((state) => ({
        users: [...state.users, user]
      })),
      updateUserRole: (userId, role) => set((state) => ({
        users: state.users.map(u =>
          u.id === userId ? { ...u, role } : u
        )
      })),
      deleteUser: (userId) => set((state) => ({
        users: state.users.filter(u => u.id !== userId)
      })),
      
      // Feature Toggles
      featureToggles: {
        yardym: true,
        meetings: true,
        calendar: true,
        rituals: true,
        preModeration: false,
      },
      setFeatureToggle: (feature, value) => set((state) => ({
        featureToggles: { ...state.featureToggles, [feature]: value }
      }))
    }),
    {
      name: 'oraza-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        completedPrayers: state.completedPrayers,
        meetings: state.meetings,
        featureToggles: state.featureToggles
      })
    }
  )
);
