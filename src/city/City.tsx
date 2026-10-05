import { useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { spring } from '../design/motion.ts';
import { usePointerFine } from '../hooks/useMediaQuery.ts';
import { usePageHidden } from '../hooks/usePageHidden.ts';
import { useViewport } from '../hooks/useViewport.ts';
import type { Mood } from '../lib/mood.ts';
import { cityLayout, type CityLayout } from './layout.ts';
import { Lights } from './Lights.tsx';
import { BalconyLayer, FarLayer, ParkLayer } from './Skyline.tsx';
import { Sky } from './Sky.tsx';

/** Color de la barra del navegador para cada hora (el tono de arriba del cielo). */
const THEME_COLOR: Record<Mood, string> = {
  morning: '#9fb7de',
  day: '#84b2e2',
  sunset: '#2c3566',
  night: '#0b1029',
};

export type CityProps = {
  mood: Mood;
  /** Brisa de 0 (calma) a 1 (viento suave): mece más o menos las palmas. */
  breeze: number;
  /** Fase de la luna que se ve de noche. */
  moonPhase: number;
  /** Hemisferio sur: la luna se dibuja al revés. */
  south?: boolean;
  /** Dispositivo modesto: menos estrellas, nubes y efectos. */
  lite?: boolean;
  /** Lo que vive en la escena (la paloma). */
  actors?: ReactNode;
};

/**
 * Santa Clara al caer la tarde: un único componente que nunca se desmonta.
 * Las pantallas solo cambian sus parámetros (hora del día y brisa) y él hace la transición.
 */
export function City({ mood, breeze, moonPhase, south = false, lite = false, actors }: CityProps) {
  const viewport = useViewport();
  const layout = cityLayout(viewport);
  const hidden = usePageHidden();
  const pointerFine = usePointerFine();
  const reduced = useReducedMotion();
  const parallax = useMotionValue(0);
  const smooth = useSpring(parallax, spring.drift);

  // Con ratón, la ciudad sigue al cursor con un paralaje sutil (lo cercano se mueve más).
  useEffect(() => {
    if (!pointerFine || reduced) {
      parallax.set(0);
      return;
    }
    const onMove = (e: PointerEvent) => parallax.set((0.5 - e.clientX / window.innerWidth) * 22);
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [pointerFine, reduced, parallax]);

  // El texto que va sobre el cielo y la barra del navegador acompañan a la hora del día.
  useEffect(() => {
    document.documentElement.dataset.mood = mood;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[mood]);
  }, [mood]);

  const sway = 0.5 + 1.3 * Math.min(1, Math.max(0, breeze));

  return (
    <div
      className="city"
      data-mood={mood}
      data-paused={hidden || undefined}
      style={{ '--sway': sway } as CSSProperties}
      aria-hidden="true"
    >
      <Sky mood={mood} moonPhase={moonPhase} south={south} lite={lite} />
      <Depth parallax={smooth} depth={0.2}>
        <FarLayer layout={layout} />
      </Depth>
      <Depth parallax={smooth} depth={0.5}>
        <ParkLayer layout={layout} />
        <LampGlows layout={layout} />
      </Depth>
      <Depth parallax={smooth} depth={1}>
        <BalconyLayer layout={layout} />
      </Depth>
      {actors}
      <Lights lite={lite} />
    </div>
  );
}

function Depth({ parallax, depth, children }: { parallax: MotionValue<number>; depth: number; children: ReactNode }) {
  const x = useTransform(parallax, (v) => v * depth);
  return (
    <m.div className="city-depth" style={{ x }}>
      {children}
    </m.div>
  );
}

/** El halo de las farolas y de los bombillos de la glorieta, al caer la tarde. */
function LampGlows({ layout }: { layout: CityLayout }) {
  const { glorieta } = layout;
  return (
    <div className="lamp-glows">
      {layout.lamps.map((lamp, i) => (
        <span key={i} className="lamp-glow" style={{ left: lamp.x, top: lamp.top + 10, animationDelay: `${-i * 0.9}s` }} />
      ))}
      <span
        className="glorieta-glow"
        style={{ left: glorieta.x, top: glorieta.top + glorieta.width * 0.36, width: glorieta.width * 1.6 }}
      />
    </div>
  );
}
