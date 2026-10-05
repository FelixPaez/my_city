import * as m from 'motion/react-m';
import { useState } from 'react';
import { spring, transition } from '../design/motion.ts';
import type { Progress } from '../state/selectors.ts';

/** Hasta dónde llegan las farolas; el último tramo es de la glorieta. */
const TRAVEL = 0.9;

/**
 * Indicador de progreso: una fila de farolas del parque que se van encendiendo a su paso.
 * Una palomita salta de farola en farola y, al final, se ilumina la glorieta.
 */
export function LampProgress({ progress }: { progress: Progress }) {
  const { index, total, arrived, labels } = progress;
  const at = (i: number) => (Math.min(i, total) / total) * TRAVEL;

  // La palomita mira hacia donde va: si se vuelve atrás, se da la vuelta.
  const [last, setLast] = useState(index);
  const [facing, setFacing] = useState<1 | -1>(1);
  if (index !== last) {
    setFacing(index > last ? 1 : -1);
    setLast(index);
  }

  const current = [...labels].reverse().find((l) => l.at <= index);

  return (
    <div
      className="lamps text-on-sea"
      role="progressbar"
      aria-label="Progreso"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={Math.min(index, total)}
      aria-valuetext={arrived ? 'Llegada' : current ? `${current.text}: paso ${index + 1} de ${total}` : undefined}
    >
      <div className="lamps__wire" />
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="lamps__lamp"
          data-lit={i <= index || arrived || undefined}
          data-current={(i === index && !arrived) || undefined}
          style={{ left: `${at(i) * 100}%` }}
        >
          <LampIcon />
        </span>
      ))}
      {labels.map((label) => (
        <span
          key={label.text}
          className="lamps__label label-caps hidden lg:block"
          data-current={label === current || undefined}
          style={{ left: `${at(label.at) * 100}%` }}
        >
          {label.text}
        </span>
      ))}
      <m.div className="lamps__track" initial={false} animate={{ x: `${(arrived ? 1 : at(index)) * 100}%` }} transition={spring.buoy}>
        <m.div className="lamps__dove" initial={false} animate={{ scaleX: facing }} transition={transition.enter}>
          <m.div key={index} className="lamps__hop" initial={{ y: -7 }} animate={{ y: 0 }} transition={spring.buoy}>
            <TinyDove />
          </m.div>
        </m.div>
      </m.div>
      <Glorieta lit={arrived} />
    </div>
  );
}

function LampIcon() {
  return (
    <svg viewBox="0 0 14 30" width="14" height="30" aria-hidden="true" overflow="visible">
      <circle className="lamps__glow" cx="7" cy="9" r="9" />
      <path d="M2.6 4.6 7 1l4.4 3.6z" fill="currentColor" />
      <path className="lamps__glass" d="M3.4 4.6h7.2l-.9 7.6H4.3z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
      <path d="M7 12.2V29M5 29h4M5.2 19.5h3.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/** La palomita del indicador (mira a la derecha: hacia donde avanza). */
function TinyDove() {
  return (
    <svg viewBox="0 0 26 20" width="26" height="20" aria-hidden="true">
      <path
        d="M6.5 12.5c-.4-3.6 2.5-6 6.2-5.6 2.6.3 4.6 1.7 6 3.4l4.8-1.6c.5 1.6-.4 3-1.9 3.6-1.6 3.4-5 5.2-9 4.8-3.3-.3-5.7-2-6.1-4.6z"
        fill="#fffdf8"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      <circle cx="18.6" cy="6.6" r="3.2" fill="#fffdf8" stroke="currentColor" strokeWidth="0.9" />
      <path d="M21.6 6.4 24.4 7.6l-2.8.8z" fill="#d79c94" />
      <circle cx="19.6" cy="6" r="0.7" fill="currentColor" />
      <path d="M9.5 10.4c2.3-1.4 5-1.2 7.4.6" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

/** Al final del camino, la glorieta del parque: se ilumina al llegar. */
function Glorieta({ lit }: { lit: boolean }) {
  return (
    <div className="lamps__glorieta" data-lit={lit || undefined}>
      <svg viewBox="0 0 30 30" width="30" height="30" aria-hidden="true" overflow="visible">
        <circle className="lamps__halo" cx="15" cy="16" r="16" />
        <path d="M3 13.5C6 11 9 6.6 15 2c6 4.6 9 9 12 11.5z" fill={lit ? '#ffd58a' : 'currentColor'} stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
        <path d="M5 14v11M10 14v11M15 14v11M20 14v11M25 14v11" stroke="currentColor" strokeWidth="1.3" />
        <path d="M2 13.6h26M1.5 25.4h27M3 21h24" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    </div>
  );
}
