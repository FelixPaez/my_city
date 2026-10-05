import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { dur } from '../design/motion.ts';
import type { Mood } from '../lib/mood.ts';
import { seeded } from '../lib/random.ts';
import { MoonIcon } from '../ui/MoonIcon.tsx';

type Props = { mood: Mood; moonPhase: number; south: boolean; lite: boolean };

/** El cielo de Santa Clara: cuatro horas que se funden, sol y luna reales, nubes y pájaros. */
export function Sky({ mood, moonPhase, south, lite }: Props) {
  return (
    <>
      <div className="sky sky--morning" />
      <div className="sky sky--day" />
      <div className="sky sky--sunset" />
      <div className="sky sky--night" />
      <Stars visible={mood === 'night'} count={lite ? 18 : 40} />
      <div className="moon">
        <div className="moon__halo" />
        <MoonIcon phase={moonPhase} south={south} className="moon__icon" size={34} />
      </div>
      <div className="sun">
        <div className="sun__body">
          <div className="sun__halo" />
          <div className="sun__warm" />
          <div className="sun__disc" />
        </div>
      </div>
      <Clouds count={lite ? 2 : 4} />
      {!lite && <Birds />}
    </>
  );
}

/** Las estrellas solo existen de noche: se montan al llegar y se funden al irse. */
function Stars({ visible, count }: { visible: boolean; count: number }) {
  const [wasVisible, setWasVisible] = useState(visible);
  const [lingering, setLingering] = useState(false);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (!visible) setLingering(true);
  }

  useEffect(() => {
    if (!lingering) return;
    const id = window.setTimeout(() => setLingering(false), dur.ambient * 1000);
    return () => window.clearTimeout(id);
  }, [lingering]);

  const stars = useMemo(() => {
    const rand = seeded(7);
    return Array.from({ length: count }, () => ({
      left: rand() * 100,
      top: Math.pow(rand(), 1.3) * 52 + 2,
      size: 1 + rand() * 1.6,
      duration: 2.4 + rand() * 3,
      delay: -rand() * 5,
    }));
  }, [count]);

  if (!visible && !lingering) return null;
  return (
    <div className="stars" data-leaving={!visible || undefined}>
      {stars.map((s, i) => (
        <span
          key={i}
          className="star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Nubes lentas: blancas de día, rosadas al atardecer, casi invisibles de noche. */
function Clouds({ count }: { count: number }) {
  const clouds = useMemo(() => {
    const rand = seeded(19);
    return Array.from({ length: count }, (_, i) => ({
      top: 6 + i * 9 + rand() * 6,
      scale: 0.7 + rand() * 0.6,
      duration: 150 + rand() * 90,
      delay: -rand() * 200,
    }));
  }, [count]);
  return (
    <div className="clouds">
      {clouds.map((c, i) => (
        <div
          key={i}
          className="cloud"
          style={{ top: `${c.top}%`, animationDuration: `${c.duration}s`, animationDelay: `${c.delay}s` } as CSSProperties}
        >
          <div className="cloud__shape" style={{ transform: `scale(${c.scale})` }}>
            <span className="cloud__tone cloud__tone--day" />
            <span className="cloud__tone cloud__tone--dusk" />
            <span className="cloud__tone cloud__tone--night" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** De vez en cuando, una bandada cruza el cielo (de día y al atardecer). */
function Birds() {
  const birds = [
    { x: 0, y: 0, s: 1, d: 0 },
    { x: -22, y: 10, s: 0.8, d: 0.18 },
    { x: -40, y: -6, s: 0.7, d: 0.32 },
    { x: -58, y: 14, s: 0.6, d: 0.1 },
  ];
  return (
    <div className="birds" aria-hidden="true">
      {birds.map((b, i) => (
        <span key={i} className="bird" style={{ left: b.x, top: b.y, transform: `scale(${b.s})`, animationDelay: `${b.d}s` }}>
          <svg viewBox="0 0 24 10" width="24" height="10">
            <path d="M1 7.5Q6.5 1 12 6.5Q17.5 1 23 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
      ))}
    </div>
  );
}
