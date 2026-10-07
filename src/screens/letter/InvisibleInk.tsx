import { useMotionValueEvent, useTransform, type MotionValue } from 'motion/react';
import * as m from 'motion/react-m';
import { Fragment, useMemo, useRef } from 'react';
import { ramp } from '../../lib/ramp.ts';
import { seeded } from '../../lib/random.ts';

type Props = {
  /** 0 → 1: progreso de mantener presionado (el calor que revela la tinta). */
  progress: MotionValue<number>;
};

/** Marca `data-heating` mientras hay calor, para que las llamas y el aire caliente solo se animen entonces. */
function useHeatingFlag<T extends HTMLElement>(progress: MotionValue<number>) {
  const ref = useRef<T>(null);
  useMotionValueEvent(progress, 'change', (v) => {
    const el = ref.current;
    const heating = v > 0.01;
    if (el && (el.dataset.heating === 'true') !== heating) el.dataset.heating = String(heating);
  });
  return ref;
}

/**
 * El calor de una vela detrás del papel, como cuando de niños se leía la tinta de limón:
 * la luz atraviesa el papel y tiembla con la llama, sube el aire caliente y el papel se va
 * tostando alrededor. Todo crece mientras ella mantiene presionado y se enfría si suelta.
 */
export function InkWarmth({ progress }: Props) {
  const ref = useHeatingFlag<HTMLDivElement>(progress);
  const glow = useTransform(progress, [0, 0.12, 1], [0, 0.65, 1]);
  const glowScale = useTransform(progress, [0, 1], [0.45, 1.08]);
  const core = useTransform(progress, [0.05, 0.5, 1], [0, 0.8, 1]);
  const toast = useTransform(progress, [0.2, 1], [0, 1]);
  const toastScale = useTransform(progress, [0.2, 1], [0.55, 1]);
  const rising = useTransform(progress, [0.05, 0.35], [0, 1]);
  return (
    <div ref={ref} className="ink-warmth" aria-hidden="true">
      <m.span className="ink-warmth__toast" style={{ opacity: toast, scale: toastScale }} />
      <m.span className="ink-warmth__glow" style={{ opacity: glow, scale: glowScale }} />
      <m.span className="ink-warmth__core" style={{ opacity: core }}>
        <span className="ink-warmth__flicker" />
      </m.span>
      <m.span className="ink-warmth__rising" style={{ opacity: rising }}>
        <span />
        <span />
        <span />
      </m.span>
    </div>
  );
}

type InkTextProps = Props & {
  text: string;
  /** La clase del texto que imita (`letter__words` o `letter__question`): mismo tamaño y mismos renglones. */
  className: string;
};

type InkWord = { light: HTMLElement; dark: HTMLElement; at: number };

/**
 * Lo escrito con tinta invisible: no se ve nada hasta que ella calienta el papel. Entonces cada
 * palabra aparece donde más calienta (en el centro) y se extiende hacia los bordes; primero
 * dorada, como el limón que empieza a tostarse, y después sepia oscuro. Si suelta antes de
 * tiempo, la tinta se vuelve a esconder. Mismas cajas que `RevealText`: al pasar de página,
 * el texto queda exactamente en su sitio.
 */
export function InkText({ text, className, progress }: InkTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
  const measured = useRef<InkWord[] | null>(null);

  // Se mide al empezar a calentar (el texto ya no se mueve) y se olvida al enfriarse del todo.
  const measure = (): InkWord[] => {
    const root = ref.current;
    if (!root) return [];
    const area = root.getBoundingClientRect();
    const cx = area.left + area.width / 2;
    const cy = area.top + area.height * 0.58;
    const nodes = [...root.querySelectorAll<HTMLElement>('.ink-word')];
    // Un óvalo más ancho que alto: los renglones se calientan casi a la vez de lado a lado.
    const dist = nodes.map((el) => {
      const b = el.getBoundingClientRect();
      return Math.hypot((b.left + b.width / 2 - cx) / 1.35, b.top + b.height / 2 - cy);
    });
    const far = Math.max(1, ...dist);
    const rand = seeded(words.length * 31 + 7);
    return nodes.map((el, i) => ({
      light: el.firstElementChild as HTMLElement,
      dark: el.lastElementChild as HTMLElement,
      // Umbral de cada palabra: del centro (0,14) a los bordes (0,58), con algo de azar.
      at: Math.min(0.6, Math.max(0.1, 0.14 + 0.44 * (dist[i] / far) + (rand() - 0.5) * 0.08)),
    }));
  };

  useMotionValueEvent(progress, 'change', (h) => {
    if (h <= 0) {
      measured.current?.forEach((w) => {
        w.light.style.opacity = '0';
        w.dark.style.opacity = '0';
      });
      measured.current = null;
      return;
    }
    measured.current ??= measure();
    for (const w of measured.current) {
      const dark = ramp(h, w.at + 0.1, w.at + 0.4);
      // La capa dorada se retira al final para que la letra quede igual de fina que en la página siguiente.
      w.light.style.opacity = String(ramp(h, w.at, w.at + 0.16) * (1 - ramp(h, w.at + 0.32, w.at + 0.4)));
      w.dark.style.opacity = String(dark);
    }
  });

  return (
    <div className="letter__text ink-layer" aria-hidden="true">
      <p ref={ref} className={className}>
        {words.map((word, i) => (
          <Fragment key={i}>
            <span className="reveal-word">
              <span className="inline-block ink-word">
                <span className="ink-word__light">{word}</span>
                <span className="ink-word__dark">{word}</span>
              </span>
            </span>
            {i < words.length - 1 ? ' ' : null}
          </Fragment>
        ))}
      </p>
    </div>
  );
}

/** La vela del botón: la llama se enciende y crece mientras ella mantiene presionado. */
export function CandleIcon({ progress }: Props) {
  const ref = useHeatingFlag<HTMLSpanElement>(progress);
  const lit = useTransform(progress, [0, 0.12, 1], [0, 0.75, 1]);
  const grow = useTransform(progress, [0, 1], [0.75, 1.2]);
  return (
    <span ref={ref} className="candle">
      <m.span className="candle__halo" style={{ opacity: lit, scale: grow }} />
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3.2c2 2.2 2.6 3.7 2.6 5a2.6 2.6 0 0 1-5.2 0c0-1.3.6-2.8 2.6-5z" fill="currentColor" fillOpacity="0.18" />
        <g className="candle__flicker">
          <m.path
            d="M12 3.2c2 2.2 2.6 3.7 2.6 5a2.6 2.6 0 0 1-5.2 0c0-1.3.6-2.8 2.6-5z"
            fill="#f2a641"
            stroke="#d9772b"
            style={{ opacity: lit, scale: grow, transformBox: 'fill-box', transformOrigin: '50% 100%' }}
          />
        </g>
        <path d="M12 10.6v2.2M8.6 13h6.8v7.4H8.6z" />
      </svg>
    </span>
  );
}
