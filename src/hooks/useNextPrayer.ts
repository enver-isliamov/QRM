import { useState, useEffect } from 'react';
import { usePrayerTimesForDate } from './usePrayerTimes';
import { prayerNames } from '../data/prayerTimes';

export function useNextPrayer() {
  const [now, setNow] = useState(new Date());
  const { prayers } = usePrayerTimesForDate(now);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!prayers) {
    return { currentPrayer: null, nextPrayer: null, timeRemaining: null };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSeconds = now.getSeconds();

  let currentPrayer = null;
  let nextPrayer = null;
  let timeRemaining = null;

  const prayerTimesInMinutes = prayerNames.map(p => {
    const timeStr = (prayers as any)[p.key] as string;
    if (!timeStr) return { ...p, minutes: -1 };
    const [h, m] = timeStr.split(':').map(Number);
    return { ...p, minutes: h * 60 + m, timeStr };
  }).filter(p => p.minutes !== -1);

  for (let i = 0; i < prayerTimesInMinutes.length; i++) {
    const p = prayerTimesInMinutes[i];
    if (currentMinutes < p.minutes) {
      nextPrayer = p;
      if (i > 0) {
        currentPrayer = prayerTimesInMinutes[i - 1];
      } else {
        // Before Fajr, current is Isha from previous day (simplification)
        currentPrayer = prayerTimesInMinutes[prayerTimesInMinutes.length - 1];
      }
      break;
    }
  }

  if (!nextPrayer) {
    // After Isha, next is Fajr tomorrow
    nextPrayer = prayerTimesInMinutes[0];
    currentPrayer = prayerTimesInMinutes[prayerTimesInMinutes.length - 1];
    
    // Calculate time until Fajr tomorrow
    const fajrMinutes = nextPrayer.minutes + 24 * 60;
    const diffMinutes = fajrMinutes - currentMinutes - 1;
    const diffSeconds = 60 - currentSeconds;
    
    const h = Math.floor(diffMinutes / 60);
    const m = diffMinutes % 60;
    const s = diffSeconds === 60 ? 0 : diffSeconds;
    
    timeRemaining = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  } else {
    const diffMinutes = nextPrayer.minutes - currentMinutes - 1;
    const diffSeconds = 60 - currentSeconds;
    
    const h = Math.floor(diffMinutes / 60);
    const m = diffMinutes % 60;
    const s = diffSeconds === 60 ? 0 : diffSeconds;
    
    timeRemaining = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  return { currentPrayer, nextPrayer, timeRemaining };
}
