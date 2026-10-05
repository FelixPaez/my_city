import { useTransform, type MotionValue } from 'motion/react';
import * as m from 'motion/react-m';
import { WaxSeal } from '../../ui/WaxSeal.tsx';

type Props = {
  /** 0 = solapa cerrada · 1 = abierta (hacia arriba, detrás de la carta). */
  flap: MotionValue<number>;
  /** 0 = lacre entero · 1 = las dos mitades ya cayeron. */
  breakSeal: MotionValue<number>;
  /** Opacidad del lacre entero (al volver a sellar, cae de golpe). */
  seal: MotionValue<number>;
  /** 0 = la carta dentro · 1 = asomando por arriba. */
  slide: MotionValue<number>;
  /** «Para …», escrito a mano. */
  name: string;
};

/**
 * El sobre visto por detrás: solapa triangular con lacre vino, pliegues en diagonal
 * y su nombre escrito a mano. La solapa se abre con escala vertical (solo transform).
 */
export function Envelope({ flap, breakSeal, seal, slide, name }: Props) {
  const flapScale = useTransform(flap, [0, 1], [1, -1]);
  // A mitad de camino la solapa pasa detrás de la carta.
  const flapFront = useTransform(flap, (v) => (v < 0.5 ? 1 : 0));
  const flapBack = useTransform(flap, (v) => (v < 0.5 ? 0 : 1));
  const letterY = useTransform(slide, [0, 1], [0, -96]);
  const halves = useTransform(breakSeal, [0, 0.001, 1], [0, 1, 0]);
  const leftX = useTransform(breakSeal, [0, 1], [0, -26]);
  const rightX = useTransform(breakSeal, [0, 1], [0, 26]);
  const halfY = useTransform(breakSeal, [0, 1], [0, 34]);
  const leftRotate = useTransform(breakSeal, [0, 1], [0, -40]);
  const rightRotate = useTransform(breakSeal, [0, 1], [0, 40]);
  const sealScale = useTransform(seal, [0, 1], [1.5, 1]);

  return (
    <svg viewBox="-20 -150 340 370" className="envelope" aria-hidden="true" overflow="visible">
      {/* Solapa abierta (detrás de todo) */}
      <m.g style={{ opacity: flapBack, scaleY: flapScale, transformOrigin: '150px 0px' }}>
        <path d="M2 2L150 118L298 2Z" fill="#e9dcc5" stroke="#d6c7ae" strokeWidth="1.2" strokeLinejoin="round" />
      </m.g>

      {/* Fondo del sobre */}
      <rect x="0" y="0" width="300" height="200" rx="6" fill="#efe4d1" />

      {/* La carta doblada, que sube al abrir */}
      <m.g style={{ y: letterY }}>
        <rect x="30" y="12" width="240" height="180" rx="3" fill="#fbf7ef" stroke="#e3d8c6" strokeWidth="1" />
        <path d="M52 46H214M52 64H236M52 82H196" stroke="#d9cdb9" strokeWidth="2" strokeLinecap="round" />
      </m.g>

      {/* Frente del sobre: pliegues laterales e inferior (tapan la carta) */}
      <path d="M0 0L148 112L0 200Z" fill="#f6eedf" stroke="#ddcfb8" strokeWidth="1" strokeLinejoin="round" />
      <path d="M300 0L152 112L300 200Z" fill="#f6eedf" stroke="#ddcfb8" strokeWidth="1" strokeLinejoin="round" />
      <path d="M0 200L150 96L300 200Z" fill="#f9f2e5" stroke="#ddcfb8" strokeWidth="1" strokeLinejoin="round" />
      <rect x="0.6" y="0.6" width="298.8" height="198.8" rx="6" fill="none" stroke="#d6c7ae" strokeWidth="1.2" />
      <text x="150" y="176" textAnchor="middle" className="envelope__name">
        {name}
      </text>

      {/* Solapa cerrada (delante) */}
      <m.g style={{ opacity: flapFront, scaleY: flapScale, transformOrigin: '150px 0px' }}>
        <path d="M2 2L150 112L298 2Z" fill="#f3e9d8" stroke="#d6c7ae" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M14 6L150 106L286 6" fill="none" stroke="#e7dac4" strokeWidth="1" />
      </m.g>

      {/* Lacre entero */}
      <m.g style={{ opacity: seal, scale: sealScale, transformOrigin: '150px 112px' }}>
        <WaxSeal />
      </m.g>

      {/* Lacre roto: dos mitades que se separan y caen */}
      <m.g style={{ opacity: halves, x: leftX, y: halfY, rotate: leftRotate, transformOrigin: '140px 112px' }}>
        <path d="M150 90A22 22 0 0 0 150 134L144 120L151 112L145 104Z" fill="#7e2333" />
      </m.g>
      <m.g style={{ opacity: halves, x: rightX, y: halfY, rotate: rightRotate, transformOrigin: '160px 112px' }}>
        <path d="M150 90A22 22 0 0 1 150 134L144 120L151 112L145 104Z" fill="#8e2c3d" />
      </m.g>
    </svg>
  );
}
