import * as m from 'motion/react-m';
import { useEffect, useRef } from 'react';
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
import { HintButton } from '../ui/HintButton.tsx';
import { RevealText } from '../ui/RevealText.tsx';

/** Primera pantalla: su nombre escrito a mano en el cielo y la paloma en el balcón. */
export function IntroScreen() {
  const { dispatch } = useFlow();
  const pointerFine = usePointerFine();
  const geo = doveGeometry(useViewport());
  const opened = useRef(false);

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
        <m.div
          className="intro__hint text-on-sea"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transition.enter, delay: 2.4 }}
        >
          <HintButton icon={<span className="pulse-dot" />} onClick={open} className="pill">
            {config.intro.hint[pointerFine ? 'mouse' : 'touch']}
          </HintButton>
        </m.div>
      </div>

      {/* Zona táctil sobre la paloma (que vive en la ciudad, debajo de esta capa). */}
      <button
        type="button"
        className="intro__dove"
        aria-label="Abrir la carta que trae la paloma"
        style={{
          left: geo.perch.x - (DOVE_FEET.x / DOVE_VIEW.width) * geo.width - 10,
          top: geo.perch.y - (DOVE_FEET.y / DOVE_VIEW.height) * height - 10,
          width: geo.width + 20,
          height: height + 20,
        }}
        onClick={open}
      />
    </m.div>
  );
}
