import { useEffect, useState } from 'react';
import { config } from '../config.ts';
import { moodAt, type Mood } from '../lib/mood.ts';

const realMood = () => moodAt(new Date(), config.location.latitude, config.location.longitude, config.location.timeZone);

/** Hora del cielo según la hora real de Santa Clara (se revisa cada minuto). */
export function useRealMood(): Mood {
  const [mood, setMood] = useState(realMood);
  useEffect(() => {
    const id = window.setInterval(() => setMood(realMood()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return mood;
}
