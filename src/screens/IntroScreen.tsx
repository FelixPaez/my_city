import * as m from 'motion/react-m';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DOVE_FEET, DOVE_VIEW } from '../actors/doveShape.ts';
import { doveGeometry } from '../actors/geometry.ts';
import { config } from '../config.ts';
import { transition } from '../design/motion.ts';
import { usePointerFine } from '../hooks/useMediaQuery.ts';
import { useViewport } from '../hooks/useViewport.ts';
import { fill } from '../lib/format.ts';
import { whenIdle } from '../lib/idle.ts';
import { prefetchSoundEngine } from '../sound/index.ts';
import { useFlow } from '../state/flowContext.ts';
import { RevealText } from '../ui/RevealText.tsx';

/** Primera pantalla: el saludo escrito a mano en el cielo y la paloma en el balcón. */
export function IntroScreen() {
  const { dispatch } = useFlow();
  const pointerFine = usePointerFine();
  const viewport = useViewport();
  const geo = doveGeometry(viewport);
  const opened = useRef(false);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const [arrowAngle, setArrowAngle] = useState<number | null>(null);

  const open = () => {
    if (opened.current) return;
    opened.current = true;
    dispatch({ type: 'OPEN_LETTER' });
  };

  // Mientras ella mira la paloma, se precarga lo siguiente: la cursiva de la carta y el sonido.
  useEffect(
    () =>
      whenIdle(() => {
        void document.fonts?.load('italic 500 1em "Cormorant Garamond"').catch(() => undefined);
        prefetchSoundEngine();
      }),
    [],
  );

  const height = (geo.width * DOVE_VIEW.height) / DOVE_VIEW.width;
  const dove = {
    left: geo.perch.x - (DOVE_FEET.x / DOVE_VIEW.width) * geo.width - 10,
    top: geo.perch.y - (DOVE_FEET.y / DOVE_VIEW.height) * height - 10,
    width: geo.width + 20,
    height: height + 20,
  };

  // La flecha de la pista apunta a la paloma, esté donde esté (abajo en móvil, a la derecha en escritorio).
  const doveX = dove.left + dove.width / 2;
  const doveY = dove.top + dove.height / 2;
  useLayoutEffect(() => {
    const aim = () => {
      const box = arrowRef.current?.getBoundingClientRect();
      if (!box) return;
      const angle = Math.atan2(doveY - (box.top + box.height / 2), doveX - (box.left + box.width / 2));
      setArrowAngle(Math.round((angle * 180) / Math.PI));
    };
    aim();
    // El título cambia de alto cuando llega su letra: se vuelve a apuntar.
    let alive = true;
    void document.fonts?.ready.then(() => alive && aim());
    return () => {
      alive = false;
    };
  }, [doveX, doveY]);

  return (
    <m.div className="screen-fixed" exit={{ opacity: 0, y: -10, transition: transition.exit }}>
      <div className="intro__text veil">
        <RevealText as="h1" text={fill(config.intro.title)} className="intro__title font-script text-script text-on-sea" />
        <m.p
          className="intro__subtitle text-body text-on-sea-soft"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transition.enter, delay: 0.7 }}
        >
          {config.intro.subtitle}
        </m.p>
        {/* Solo una indicación: la carta se abre tocando la paloma, no este letrero. */}
        <m.div
          className="intro__hint text-on-sea"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transition.enter, delay: 2.4 }}
        >
          <p className="hint-tag pill">
            <span
              ref={arrowRef}
              aria-hidden="true"
              className="hint-button__icon intro__arrow"
              style={{ transform: `rotate(${arrowAngle ?? -90}deg)`, opacity: arrowAngle === null ? 0 : 1 }}
            >
              <ArrowIcon />
            </span>
            <span>{config.intro.hint[pointerFine ? 'mouse' : 'touch']}</span>
          </p>
        </m.div>
      </div>

      {/* Zona táctil sobre la paloma (que vive en la ciudad, debajo de esta capa). */}
      <button type="button" className="intro__dove" aria-label="Abrir la carta que trae la paloma" style={dove} onClick={open} />
    </m.div>
  );
}

/** Flecha hacia la derecha; se gira para señalar la paloma y empuja suave hacia ella. */
function ArrowIcon() {
  return (
    <svg className="intro__arrow-nudge" viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 10h12M11 5.5l4.5 4.5-4.5 4.5" />
    </svg>
  );
}
