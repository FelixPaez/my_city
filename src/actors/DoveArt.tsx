import { useTransform, type MotionValue } from 'motion/react';
import * as m from 'motion/react-m';
import { useId, type Ref } from 'react';
import { DOVE_VIEW } from './doveShape.ts';

type Props = {
  /** En vuelo: alas abiertas aleteando y patas recogidas. */
  flying: boolean;
  /** 0 → 1: el sobre en el pico (se desvanece cuando lo suelta). */
  envelope: MotionValue<number>;
  width: number;
  envelopeRef?: Ref<SVGGElement>;
};

/**
 * La paloma mensajera: blanca, redondita, con rubor en la mejilla y la carta lacrada
 * en el pico. De pie, respira, parpadea y ladea la cabeza; en vuelo, aletea.
 */
export function DoveArt({ flying, envelope, width, envelopeRef }: Props) {
  const id = useId().replace(/[^\w-]/g, '');
  const body = `dove-body-${id}`;
  const wing = `dove-wing-${id}`;
  const envelopeScale = useTransform(envelope, [0, 1], [0.6, 1]);
  return (
    <svg
      viewBox={`0 0 ${DOVE_VIEW.width} ${DOVE_VIEW.height}`}
      width={width}
      height={(width * DOVE_VIEW.height) / DOVE_VIEW.width}
      className="dove"
      data-flying={flying || undefined}
      aria-hidden="true"
      overflow="visible"
    >
      <defs>
        <linearGradient id={body} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffdf8" />
          <stop offset="0.65" stopColor="#f7f1e8" />
          <stop offset="1" stopColor="#e6dccf" />
        </linearGradient>
        <linearGradient id={wing} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fffdf9" />
          <stop offset="1" stopColor="#ece3d6" />
        </linearGradient>
      </defs>

      <g className="dove__breath">
        {/* Ala de atrás (solo en vuelo). */}
        <g className="dove__flight dove__flight--far">
          <path
            d="M62 44C64 30 74 18 90 11C89 16 92 18 97 17C93 24 96 26 100 26C93 34 82 41 70 46Z"
            fill="#e9e1d5"
            stroke="#d3c7b8"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </g>

        {/* Cola */}
        <path d="M92 60L127 52C131 57 129 63 123 66L96 72Z" fill="#efe8de" stroke="#d6cbbd" strokeWidth="1" strokeLinejoin="round" />
        <path d="M100 60L124 56M101 66L122 61" stroke="#ddd3c6" strokeWidth="0.9" />

        {/* Patas (se recogen al volar) */}
        <g className="dove__legs">
          <path d="M58 79L56.5 87M67 80L67 88" stroke="#d98a8f" strokeWidth="2.3" strokeLinecap="round" />
          <path d="M52.5 88H60.5M63 88.6H71" stroke="#d98a8f" strokeWidth="1.9" strokeLinecap="round" />
        </g>

        {/* Cuerpo y cuello */}
        <path
          d="M35 61C33 47 43 37 58 37C74 37 90 45 100 55C104 61 102 69 94 74C82 81 64 83 50 79C41 76 36 69 35 61Z"
          fill={`url(#${body})`}
          stroke="#d6cbbd"
          strokeWidth="1"
        />
        <path d="M31.5 41C34 34 41 31 49 33L58 41C50 45 42 49 37 56Z" fill="#fffcf6" />

        {/* Ala plegada */}
        <g className="dove__folded">
          <path
            d="M51 45C63 38 84 42 103 55C97 61 87 67 75 69C64 71 55 65 51 57Z"
            fill={`url(#${wing})`}
            stroke="#d3c7b8"
            strokeWidth="1"
          />
          <path
            d="M66 51C74 51 83 55 92 59M60 57C70 58 79 61 87 65M58 50C63 47 69 46 75 47"
            fill="none"
            stroke="#dcd1c3"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
        </g>

        {/* Cabeza (con el sobre en el pico: se mueven juntos) */}
        <g className="dove__head">
          <m.g ref={envelopeRef} style={{ opacity: envelope, scale: envelopeScale, transformOrigin: '24px 33px' }}>
            <g transform="rotate(-9 13 40)">
              <rect x="0" y="31" width="25" height="17" rx="1.6" fill="#fbf6ec" stroke="#d6c9b5" strokeWidth="1" />
              <path d="M0.6 32L12.5 41L24.4 32" fill="none" stroke="#d6c9b5" strokeWidth="1" strokeLinejoin="round" />
              <circle cx="12.5" cy="41" r="3.1" fill="#7e2333" />
              <path
                d="M12.5 42.6C11 41.6 10.8 40.2 11.8 39.8C12.3 39.6 12.5 40 12.5 40.3C12.5 40 12.7 39.6 13.2 39.8C14.2 40.2 14 41.6 12.5 42.6Z"
                fill="#f3c9cf"
              />
            </g>
          </m.g>
          <circle cx="41" cy="33" r="12.5" fill="#fffdf8" stroke="#d6cbbd" strokeWidth="1" />
          <path d="M31.8 41.4C34.5 35.2 41.5 31.6 49.5 33.4" fill="none" stroke="#fffdf8" strokeWidth="3" />
          <g className="dove__eye">
            <circle cx="36.8" cy="30.8" r="2.1" fill="#2a2f4f" />
            <circle cx="37.5" cy="30.1" r="0.7" fill="#ffffff" />
          </g>
          <ellipse cx="40" cy="37.6" rx="3" ry="1.7" fill="#f2b0a8" opacity="0.5" />
          <path d="M29.2 31.2L21.8 34.6L29.6 35.9Z" fill="#d79c94" />
          <ellipse cx="30.2" cy="31.6" rx="1.7" ry="1.1" fill="#f6efe6" />
        </g>

        {/* Ala de delante (solo en vuelo) */}
        <g className="dove__flight dove__flight--near">
          <path
            d="M56 46C56 30 66 14 86 5C85 11 89 13 95 11C92 18 96 21 102 20C96 30 84 40 68 48Z"
            fill={`url(#${wing})`}
            stroke="#d3c7b8"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <path d="M62 40C68 30 76 22 86 16M66 44C74 36 84 30 94 26" fill="none" stroke="#dcd1c3" strokeWidth="0.9" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
