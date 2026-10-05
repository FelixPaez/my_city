import { AnimatePresence, animate, useMotionValue, usePresence, useReducedMotion, useTransform, type MotionValue } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useState, type ReactNode } from 'react';
import { feedback } from '../design/feedback.ts';
import { ease, transition } from '../design/motion.ts';

type Dir = 1 | -1;

/** Tablillas de la persiana: más en pantallas altas. */
const SLATS = 11;
/** Cuánto se retrasa cada tablilla respecto de la anterior (fracción del recorrido). */
const STAGGER = 0.045;

/**
 * Escenario de pantallas: al cambiar `screenKey`, una persiana colonial se cierra sobre
 * la pantalla que se va y se abre sobre la nueva. Las tablillas giran (escala vertical),
 * de arriba abajo al avanzar y de abajo arriba al volver.
 */
export function ShutterStage({ screenKey, dir, children }: { screenKey: string; dir: Dir; children: ReactNode }) {
  // La primera pantalla aparece sin persiana; las siguientes entran con ella.
  const [firstKey] = useState(screenKey);
  return (
    <div className="absolute inset-0 z-10">
      <AnimatePresence initial={false} mode="wait">
        <ShutterScreen key={screenKey} dir={dir} instant={screenKey === firstKey}>
          {children}
        </ShutterScreen>
      </AnimatePresence>
    </div>
  );
}

function ShutterScreen({ dir, instant, children }: { dir: Dir; instant: boolean; children: ReactNode }) {
  const [isPresent, safeToRemove] = usePresence();
  const reduced = Boolean(useReducedMotion());
  /** 0 = abierta (se ve la pantalla) · 1 = cerrada. */
  const closed = useMotionValue(instant ? 0 : 1);
  const fade = useMotionValue(instant ? 1 : 0);

  useEffect(() => {
    if (isPresent) {
      if (instant) return;
      if (reduced) {
        closed.set(0);
        const controls = animate(fade, 1, transition.reduced);
        return () => controls.stop();
      }
      fade.set(1);
      const controls = animate(closed, 0, { duration: 0.55, ease: ease.surface, delay: 0.05 });
      return () => controls.stop();
    }
    if (reduced) {
      const controls = animate(fade, 0, transition.reduced);
      void controls.then(() => safeToRemove?.());
      return () => controls.stop();
    }
    feedback('shutter');
    const controls = animate(closed, 1, { duration: 0.42, ease: ease.swell });
    void controls.then(() => safeToRemove?.());
    return () => controls.stop();
  }, [isPresent, instant, reduced, closed, fade, safeToRemove]);

  return (
    <div className="absolute inset-0" style={{ pointerEvents: isPresent ? undefined : 'none' }}>
      <m.div className="absolute inset-0" style={{ opacity: fade }}>
        {children}
      </m.div>
      {!reduced && <Shutters closed={closed} dir={dir} />}
    </div>
  );
}

function Shutters({ closed, dir }: { closed: MotionValue<number>; dir: Dir }) {
  const visible = useTransform(closed, (v) => (v > 0.001 ? 'visible' : 'hidden'));
  return (
    <m.div className="shutters" style={{ visibility: visible }} aria-hidden="true">
      {Array.from({ length: SLATS }, (_, i) => (
        <Slat key={i} index={dir === 1 ? i : SLATS - 1 - i} closed={closed} />
      ))}
    </m.div>
  );
}

function Slat({ index, closed }: { index: number; closed: MotionValue<number> }) {
  const span = 1 - STAGGER * (SLATS - 1);
  const scaleY = useTransform(closed, (v) => Math.min(1, Math.max(0, (v - index * STAGGER) / span)));
  return (
    <m.span className="shutter-slat" style={{ scaleY }}>
      <span />
    </m.span>
  );
}
