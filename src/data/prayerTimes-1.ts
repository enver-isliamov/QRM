import { DailyPrayers } from '../types';

export const prayerTimes2026: Record<string, DailyPrayers> = {
  '2026-03-21': { date: '2026-03-21', fajr: '05:17', sunrise: '06:34', dhuhr: '12:55', asr: '16:15', maghrib: '19:06', isha: '20:23' },
  '2026-03-22': { date: '2026-03-22', fajr: '05:15', sunrise: '06:32', dhuhr: '12:55', asr: '16:16', maghrib: '19:07', isha: '20:25' },
  '2026-03-23': { date: '2026-03-23', fajr: '05:13', sunrise: '06:30', dhuhr: '12:54', asr: '16:17', maghrib: '19:09', isha: '20:26' },
  '2026-03-24': { date: '2026-03-24', fajr: '05:11', sunrise: '06:28', dhuhr: '12:54', asr: '16:18', maghrib: '19:10', isha: '20:28' },
  '2026-03-25': { date: '2026-03-25', fajr: '05:09', sunrise: '06:26', dhuhr: '12:54', asr: '16:19', maghrib: '19:11', isha: '20:29' },
  '2026-03-26': { date: '2026-03-26', fajr: '05:07', sunrise: '06:24', dhuhr: '12:53', asr: '16:20', maghrib: '19:13', isha: '20:31' },
  '2026-03-27': { date: '2026-03-27', fajr: '05:05', sunrise: '06:22', dhuhr: '12:53', asr: '16:21', maghrib: '19:14', isha: '20:32' },
  '2026-03-28': { date: '2026-03-28', fajr: '05:03', sunrise: '06:20', dhuhr: '12:53', asr: '16:22', maghrib: '19:15', isha: '20:34' },
  '2026-03-29': { date: '2026-03-29', fajr: '05:01', sunrise: '06:18', dhuhr: '12:52', asr: '16:23', maghrib: '19:17', isha: '20:35' },
  '2026-03-30': { date: '2026-03-30', fajr: '04:59', sunrise: '06:16', dhuhr: '12:52', asr: '16:24', maghrib: '19:18', isha: '20:37' },
  '2026-03-31': { date: '2026-03-31', fajr: '04:57', sunrise: '06:14', dhuhr: '12:52', asr: '16:25', maghrib: '19:19', isha: '20:38' },
};

export function getTodayPrayers(): DailyPrayers | null {
  const today = new Date().toISOString().split('T')[0];
  return prayerTimes2026[today] || null;
}

export function getPrayersForDate(date: string): DailyPrayers | null {
  return prayerTimes2026[date] || null;
}

export const prayerNames = [
  { key: 'fajr',    name: 'Фаджр',   nameCrh: 'Фаджр',              arabic: 'الفجر',  description: 'Утренний намаз' },
  { key: 'sunrise', name: 'Восход',  nameCrh: 'Къуняш чыкъышы',     arabic: 'شروق',   description: 'Восход солнца' },
  { key: 'dhuhr',   name: 'Зухр',    nameCrh: 'Зухр',                arabic: 'الظهر',  description: 'Полуденный намаз' },
  { key: 'asr',     name: 'Аср',     nameCrh: 'Аср',                 arabic: 'العصر',  description: 'Послеполуденный намаз' },
  { key: 'maghrib', name: 'Магриб',  nameCrh: 'Магриб',              arabic: 'المغرب', description: 'Вечерний намаз' },
  { key: 'isha',    name: 'Иша',     nameCrh: 'Иша',                 arabic: 'العشاء', description: 'Ночной намаз' },
];
