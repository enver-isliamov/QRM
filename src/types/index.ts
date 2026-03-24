export interface DailyPrayers {
  date: string; fajr: string; sunrise: string;
  dhuhr: string; asr: string; maghrib: string; isha: string;
}
export interface EthnoEvent {
  id: string; date: string; day: number;
  month: string; monthCrh: string;
  title: string; titleCrh: string;
  description: string; descriptionCrh: string;
  type: 'holiday' | 'memorial' | 'custom';
}
export interface Ritual {
  id: string; title: string; titleCrh: string;
  subtitle: string; subtitleCrh: string;
  icon: string; steps: RitualStep[];
}
export interface RitualStep {
  title: string; titleCrh: string;
  description: string; descriptionCrh: string;
}
