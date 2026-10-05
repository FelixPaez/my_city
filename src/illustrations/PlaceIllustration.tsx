import { useId, type ReactNode } from 'react';
import type { PlaceIllustration as Kind } from '../config.types.ts';

/**
 * Ilustraciones de respaldo de los planes (5:4), como fotos de las de antes:
 * colores cálidos, luz de tarde y una viñeta suave (la pone el CSS de .place-art).
 * Los detalles con clase art-* se animan cuando la foto está activa.
 */
export function PlaceIllustration({ kind }: { kind: Kind }) {
  const uid = useId().replace(/[^\w-]/g, '');
  const id = (name: string) => `${name}-${uid}`;
  const Scene = SCENES[kind];
  return (
    <svg viewBox="0 0 500 400" preserveAspectRatio="xMidYMid slice" className="place-illustration" aria-hidden="true">
      <Scene id={id} />
    </svg>
  );
}

type SceneProps = { id: (name: string) => string };

function Gradient({ id, stops, x2 = 0, y2 = 1 }: { id: string; stops: [number, string, number?][]; x2?: number; y2?: number }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
      {stops.map(([offset, color, opacity = 1]) => (
        <stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
      ))}
    </linearGradient>
  );
}

function Glow({ id, color }: { id: string; color: string }) {
  return (
    <radialGradient id={id}>
      <stop offset="0" stopColor={color} stopOpacity="0.85" />
      <stop offset="0.4" stopColor={color} stopOpacity="0.3" />
      <stop offset="1" stopColor={color} stopOpacity="0" />
    </radialGradient>
  );
}

/** D’Rolando: una mesa para dos, vela encendida y la ciudad de noche por la ventana. */
function Restaurant({ id }: SceneProps) {
  return (
    <>
      <defs>
        <Gradient id={id('wall')} stops={[[0, '#f1d3ad'], [1, '#d9a87c']]} />
        <Gradient id={id('night')} stops={[[0, '#232c57'], [0.7, '#5b4a7e'], [1, '#c58a8e']]} />
        <Gradient id={id('cloth')} stops={[[0, '#fffaf1'], [1, '#efe1cc']]} />
        <Glow id={id('candle')} color="#ffd58a" />
        <Glow id={id('lamp')} color="#ffe2a8" />
      </defs>
      <rect width="500" height="400" fill={`url(#${id('wall')})`} />
      {/* Ventana con arco y la ciudad de noche */}
      <path d="M58 262V118a86 86 0 0 1 172 0v144z" fill={`url(#${id('night')})`} />
      <path d="M86 214h22v48H86zM118 196h16v66h-16zM144 222h26v40h-26zM178 204h18v58h-18zM204 230h14v32h-14z" fill="#2c2850" />
      {[
        [92, 226],
        [100, 240],
        [124, 208],
        [126, 230],
        [150, 234],
        [160, 246],
        [184, 216],
        [186, 236],
        [208, 242],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="4" height="5" fill="#ffd58a" className="art-twinkle" style={{ animationDelay: `${-(x % 7) * 0.4}s` }} />
      ))}
      <path d="M190 92a12 12 0 1 0 9 20 9 9 0 1 1-9-20z" fill="#fbf1dc" />
      {[
        [96, 110],
        [128, 84],
        [160, 128],
        [112, 150],
      ].map(([x, y]) => (
        <circle key={`s${x}`} cx={x} cy={y} r="1.6" fill="#fbf1dc" className="art-twinkle" style={{ animationDelay: `${-(y % 5) * 0.5}s` }} />
      ))}
      <path d="M58 262V118a86 86 0 0 1 172 0v144" fill="none" stroke="#f6ead8" strokeWidth="9" />
      <path d="M144 34v228M60 150h168" stroke="#f6ead8" strokeWidth="5" />
      {/* Cuadro en la pared */}
      <rect x="318" y="66" width="122" height="88" rx="3" fill="#a8703f" />
      <rect x="328" y="76" width="102" height="68" fill="#f2c08a" />
      <path d="M328 124c18-10 36-10 52 0s34 10 50 0v20H328z" fill="#b97f9f" />
      <circle cx="398" cy="104" r="11" fill="#fff1d2" />
      {/* Lámpara colgante */}
      <path d="M300 0v52" stroke="#5c4033" strokeWidth="2" />
      <circle cx="300" cy="82" r="90" fill={`url(#${id('lamp')})`} opacity="0.55" className="art-glow" />
      <path d="M276 76c0-14 11-24 24-24s24 10 24 24z" fill="#7e2333" />
      <ellipse cx="300" cy="77" rx="10" ry="3.5" fill="#ffe7b4" />
      {/* Zócalo de madera */}
      <rect y="262" width="500" height="138" fill="#8a4b36" />
      <path d="M0 268h500" stroke="#6f3a29" strokeWidth="4" />
      {/* Mesa con mantel */}
      <ellipse cx="270" cy="306" rx="200" ry="36" fill={`url(#${id('cloth')})`} />
      <path d="M70 306c0 30 0 70 0 94h400V306c0 18-90 34-200 34S70 324 70 306z" fill="#f2e3cc" />
      <path d="M110 340v60M170 346v54M230 349v51M290 349v51M350 346v54M410 340v60" stroke="#e5d2b6" strokeWidth="2" />
      {/* Platos */}
      <ellipse cx="190" cy="304" rx="48" ry="13" fill="#fffdf8" stroke="#e2d4bf" />
      <ellipse cx="190" cy="304" rx="30" ry="7.5" fill="none" stroke="#eadfcd" />
      <ellipse cx="352" cy="306" rx="48" ry="13" fill="#fffdf8" stroke="#e2d4bf" />
      <ellipse cx="352" cy="306" rx="30" ry="7.5" fill="none" stroke="#eadfcd" />
      {/* Copas de vino */}
      {[236, 306].map((x) => (
        <g key={x}>
          <path d={`M${x - 11} 248c0 16 5 24 11 24s11-8 11-24z`} fill="#fbf6ee" opacity="0.75" stroke="#e5d8c6" />
          <path d={`M${x - 10} 258c1 9 5 13 10 13s9-4 10-13z`} fill="#7e2333" />
          <path d={`M${x} 272v18`} stroke="#e5d8c6" strokeWidth="2" />
          <ellipse cx={x} cy="291" rx="9" ry="2.6" fill="#f3ebde" stroke="#e5d8c6" />
        </g>
      ))}
      {/* Vela */}
      <circle cx="271" cy="244" r="70" fill={`url(#${id('candle')})`} className="art-glow" />
      <rect x="264" y="250" width="14" height="44" rx="2" fill="#fbf3e2" />
      <ellipse cx="271" cy="294" rx="14" ry="4" fill="#d9c7aa" />
      <path d="M271 230c5 6 6 11 3 15-2 2-4 2-6 0-3-4-1-9 3-15z" fill="#ffc35a" className="art-flicker" />
      {/* Una rosa en un florero */}
      <path d="M418 296c-4-12-2-26 4-30 6 4 8 18 4 30z" fill="#e7dccd" stroke="#d6c7b2" />
      <path d="M421 266v-22" stroke="#6f8a5e" strokeWidth="2" />
      <circle cx="421" cy="240" r="7" fill="#b8324a" />
      <path d="M417 239c2-3 6-3 8 0" stroke="#7e2333" fill="none" />
    </>
  );
}

/** Heladería Pati: una copa con tres bolas bajo un toldo de rayas. */
function IceCream({ id }: SceneProps) {
  const stripes = Array.from({ length: 10 }, (_, i) => i);
  return (
    <>
      <defs>
        <Gradient id={id('wall')} stops={[[0, '#f7e1d6'], [1, '#efc9bd']]} />
        <Gradient id={id('glass')} stops={[[0, '#ffffff', 0.7], [1, '#e9e1ea', 0.5]]} x2={1} y2={0} />
        <Gradient id={id('marble')} stops={[[0, '#f6f0ea'], [1, '#e5d9cf']]} />
      </defs>
      <rect width="500" height="400" fill={`url(#${id('wall')})`} />
      {/* Toldo de rayas con borde festoneado */}
      {stripes.map((i) => (
        <rect key={i} x={i * 50} y="0" width="50" height="92" fill={i % 2 ? '#fbf1e6' : '#e88fa6'} />
      ))}
      {stripes.map((i) => (
        <path key={`f${i}`} d={`M${i * 50} 92a25 18 0 0 0 50 0z`} fill={i % 2 ? '#fbf1e6' : '#e88fa6'} />
      ))}
      <rect y="90" width="500" height="4" fill="#d9788f" opacity="0.5" />
      {/* Estantes con tarros de colores */}
      <rect x="40" y="150" width="420" height="6" rx="2" fill="#c58f78" />
      {[70, 120, 170, 330, 380, 430].map((x, i) => (
        <g key={x}>
          <rect x={x - 14} y="118" width="28" height="32" rx="5" fill="#fffaf3" opacity="0.85" />
          <rect x={x - 12} y="126" width="24" height="22" rx="4" fill={['#f2a5b5', '#fbe7c2', '#8a5a44', '#f6c38a', '#d98a8f', '#f8e3b0'][i]} />
        </g>
      ))}
      {/* Mostrador de mármol */}
      <rect y="292" width="500" height="108" fill={`url(#${id('marble')})`} />
      <path d="M30 330c40-12 70 8 110-6M220 360c50-16 90 10 140-8M380 316c30 4 60-10 90 2" stroke="#d5c6ba" strokeWidth="1.5" fill="none" />
      <rect y="288" width="500" height="8" fill="#dccdc1" />
      {/* La copa, sobre el mostrador */}
      <g transform="translate(0 44)">
      <ellipse cx="250" cy="292" rx="44" ry="8" fill="#d8c8bd" />
      <path d="M232 290c4-10 10-14 18-14s14 4 18 14z" fill={`url(#${id('glass')})`} stroke="#d9cdd6" />
      <rect x="246" y="250" width="8" height="30" fill={`url(#${id('glass')})`} stroke="#d9cdd6" />
      <path d="M180 202c4 34 34 52 70 52s66-18 70-52z" fill={`url(#${id('glass')})`} stroke="#d9cdd6" strokeWidth="1.5" />
      <path d="M186 206c4 26 30 40 64 40s60-14 64-40z" fill="#f6d2dc" opacity="0.6" />
      {/* Las tres bolas */}
      <circle cx="214" cy="194" r="34" fill="#f2a5b5" />
      <path d="M186 210c6 10 12 4 16 12s10 2 14 8" stroke="#e38a9e" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="286" cy="194" r="34" fill="#fbf1dc" />
      <circle cx="250" cy="158" r="36" fill="#8a5a44" />
      <path d="M222 176c6 8 10 2 16 10s12-2 18 6 10 0 16 6" stroke="#6f4434" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="238" cy="146" r="6" fill="#a87459" opacity="0.6" />
      {/* Barquillo y cereza */}
      <rect x="296" y="120" width="12" height="62" rx="3" fill="#e9c27a" transform="rotate(24 302 151)" />
      <path d="M297 130l10 4M295 142l10 4M293 154l10 4" stroke="#c99a52" strokeWidth="1.5" transform="rotate(24 302 151)" />
      <path d="M252 118c4-12 12-18 20-22" stroke="#6f8a5e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="250" cy="122" r="11" fill="#c22d3a" />
      <circle cx="246" cy="118" r="3" fill="#f6a3ac" />
      {/* Dos cucharitas: para compartir */}
      <path d="M150 300l40-34M354 300l-40-34" stroke="#c9bcb0" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="192" cy="264" rx="6" ry="9" fill="#ddd2c8" transform="rotate(48 192 264)" />
      <ellipse cx="312" cy="264" rx="6" ry="9" fill="#ddd2c8" transform="rotate(-48 312 264)" />
      </g>
    </>
  );
}

/** La Bodeguita del Medio: barra de madera, botellas, dos mojitos y la pared llena de firmas. */
function Bodeguita({ id }: SceneProps) {
  const scribbles = [
    'M30 40c10-8 20 6 30-2s18 4 26-4',
    'M120 30c8 6 14-6 22 0s12 8 20 0',
    'M210 44c12-10 18 4 28-4m6 2c4 6 10 6 14 0',
    'M330 28c10 8 20-8 30 0s14 4 22-6',
    'M420 42c8-6 14 6 22-2s10 4 18-2',
    'M60 76c14 4 22-8 34-2s16 4 24-4',
    'M178 70c6-6 12 4 18-2s12 6 20 0m4-4c6 4 8 10 2 12',
    'M300 72c10-4 16 8 26 2s14-6 22 2',
    'M400 80c8 6 18-8 26 0',
    'M40 112c12-6 20 6 30 0',
    'M150 110c8 4 16-6 24 0s12 2 18-4',
    'M262 116c10-8 16 6 26-2',
    'M380 112c6 6 14-4 20 2s12 0 16-6',
  ];
  return (
    <>
      <defs>
        <Gradient id={id('wall')} stops={[[0, '#f3e6cb'], [1, '#e4cfa9']]} />
        <Gradient id={id('wood')} stops={[[0, '#8a5638'], [1, '#5c3824']]} />
        <Glow id={id('lamp')} color="#ffe2a8" />
      </defs>
      <rect width="500" height="400" fill={`url(#${id('wall')})`} />
      {/* La pared firmada */}
      {scribbles.map((d, i) => (
        <path key={i} d={d} stroke={i % 3 ? '#8a6a54' : '#6a4f7a'} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.45" />
      ))}
      {/* Lámpara */}
      <path d="M250 0v44" stroke="#5c4033" strokeWidth="2" />
      <circle cx="250" cy="70" r="110" fill={`url(#${id('lamp')})`} opacity="0.6" className="art-glow" />
      <path d="M228 66c0-12 10-22 22-22s22 10 22 22z" fill="#5c3824" />
      {/* Estante con botellas */}
      <rect x="20" y="186" width="460" height="10" rx="2" fill="#6f4430" />
      {[
        [48, '#b9772f'],
        [82, '#7a4a2a'],
        [112, '#d9cdb4'],
        [146, '#9a5b2c'],
        [352, '#c98a3c'],
        [384, '#6b4a5e'],
        [416, '#d9cdb4'],
        [448, '#a8642f'],
      ].map(([x, color]) => (
        <g key={x as number}>
          <rect x={(x as number) - 11} y="138" width="22" height="48" rx="4" fill={color as string} opacity="0.92" />
          <rect x={(x as number) - 4} y="120" width="8" height="20" rx="2" fill={color as string} />
          <rect x={(x as number) - 9} y="152" width="18" height="14" fill="#f6ead2" opacity="0.8" />
        </g>
      ))}
      {/* Barra */}
      <rect y="282" width="500" height="20" fill="#9b6342" />
      <rect y="300" width="500" height="100" fill={`url(#${id('wood')})`} />
      {[60, 140, 220, 300, 380, 460].map((x) => (
        <path key={x} d={`M${x} 302v98`} stroke="#4a2c1c" strokeWidth="3" opacity="0.5" />
      ))}
      {/* Dos mojitos */}
      {[200, 292].map((x, i) => (
        <g key={x}>
          <path d={`M${x - 26} 196h52l-5 88h-42z`} fill="#fbf8ef" opacity="0.8" stroke="#d9cfb8" strokeWidth="1.5" />
          <path d={`M${x - 23} 212h46l-4 70h-38z`} fill="#e4ebc0" opacity="0.95" />
          <rect x={x - 16} y="226" width="13" height="13" rx="2" fill="#ffffff" opacity="0.8" transform={`rotate(12 ${x - 9} 232)`} />
          <rect x={x + 2} y="244" width="12" height="12" rx="2" fill="#ffffff" opacity="0.75" transform={`rotate(-10 ${x + 8} 250)`} />
          <ellipse cx={x - 8} cy="262" rx="9" ry="4" fill="#6f9a5e" transform={`rotate(-25 ${x - 8} 262)`} />
          <ellipse cx={x + 9} cy="222" rx="9" ry="4" fill="#7fa86b" transform={`rotate(30 ${x + 9} 222)`} />
          <circle cx={x + (i ? -14 : 14)} cy="200" r="13" fill="#d7e07a" stroke="#b9c45a" strokeWidth="2" />
          <path d={`M${x + (i ? -14 : 14)} 187v26M${x + (i ? -27 : 1)} 200h26`} stroke="#b9c45a" strokeWidth="1.2" />
          <path d={`M${x + 6} 150l-10 120`} stroke="#e0584a" strokeWidth="4" strokeLinecap="round" />
        </g>
      ))}
      {/* Una guitarra apoyada */}
      <g transform="rotate(-14 420 300)">
        <rect x="414" y="168" width="12" height="96" rx="3" fill="#5c3824" />
        <rect x="410" y="152" width="20" height="22" rx="4" fill="#4a2c1c" />
        <circle cx="420" cy="292" r="34" fill="#c27a3e" />
        <circle cx="420" cy="252" r="26" fill="#c27a3e" />
        <circle cx="420" cy="276" r="9" fill="#4a2c1c" />
        <path d="M416 160v150M424 160v150" stroke="#f3e2c0" strokeWidth="0.8" />
      </g>
    </>
  );
}

/** Un lugar sorpresa: una calle colonial al atardecer y una «?» hecha de estrellas. */
function MysteryCity({ id }: SceneProps) {
  const vp = { x: 250, y: 236 };
  const arches = [0, 1, 2, 3, 4];
  const question = [
    [222, 74],
    [234, 58],
    [256, 54],
    [274, 64],
    [276, 84],
    [260, 100],
    [250, 118],
    [250, 136],
  ];
  return (
    <>
      <defs>
        <Gradient id={id('sky')} stops={[[0, '#2c3566'], [0.55, '#8f6f9f'], [1, '#f2b48f']]} />
        <Gradient id={id('left')} stops={[[0, '#c98f6a'], [1, '#9c6250']]} x2={1} y2={0} />
        <Gradient id={id('right')} stops={[[0, '#7d7fa8'], [1, '#a4a7c8']]} x2={1} y2={0} />
        <Gradient id={id('street')} stops={[[0, '#6f5a74'], [1, '#4a3c55']]} />
        <Glow id={id('lamp')} color="#ffd58a" />
      </defs>
      <rect width="500" height="400" fill={`url(#${id('sky')})`} />
      {question.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === question.length - 1 ? 3.6 : 2.6} fill="#fbf1dc" className="art-twinkle" style={{ animationDelay: `${-i * 0.35}s` }} />
      ))}
      <path d={`M${question.slice(0, -1).map(([x, y]) => `${x} ${y}`).join('L')}`} fill="none" stroke="#fbf1dc" strokeWidth="1" opacity="0.5" />
      {[
        [60, 40],
        [140, 90],
        [380, 50],
        [430, 120],
        [330, 110],
        [100, 150],
      ].map(([x, y]) => (
        <circle key={`st${x}`} cx={x} cy={y} r="1.4" fill="#fbf1dc" opacity="0.8" className="art-twinkle" />
      ))}
      {/* Calle empedrada hacia el fondo */}
      <path d={`M0 400L${vp.x - 34} ${vp.y + 22}H${vp.x + 34}L500 400z`} fill={`url(#${id('street')})`} />
      {[0, 1, 2, 3, 4, 5].map((row) => {
        const t = (row + 1) / 7;
        const y = vp.y + 22 + (400 - vp.y - 22) * t * t;
        const half = 34 + (250 - 34) * t * t;
        return <path key={row} d={`M${vp.x - half} ${y}H${vp.x + half}`} stroke="#3c3048" strokeWidth={1 + t * 2} opacity="0.5" />;
      })}
      {/* Fachadas con portales en perspectiva */}
      <path d={`M0 40L${vp.x - 34} ${vp.y - 30}V${vp.y + 22}L0 400z`} fill={`url(#${id('left')})`} />
      <path d={`M500 70L${vp.x + 34} ${vp.y - 26}V${vp.y + 22}L500 400z`} fill={`url(#${id('right')})`} />
      {arches.map((i) => {
        const t = i / arches.length;
        const k = 1 - t * 0.8;
        const x = (vp.x - 34) * (t * 0.92);
        const w = 40 * k;
        const top = 150 + t * 70;
        const bottom = 400 - (400 - vp.y - 22) * t - 14 * k;
        return <path key={`l${i}`} d={`M${x + 8} ${bottom}V${top + w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0V${bottom}z`} fill="#5c3b40" opacity="0.75" />;
      })}
      {arches.map((i) => {
        const t = i / arches.length;
        const k = 1 - t * 0.8;
        const w = 40 * k;
        const x = 500 - (500 - vp.x - 34) * (t * 0.92) - 8 - w;
        const top = 160 + t * 64;
        const bottom = 400 - (400 - vp.y - 22) * t - 14 * k;
        return <path key={`r${i}`} d={`M${x} ${bottom}V${top + w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0V${bottom}z`} fill="#4a4568" opacity="0.75" />;
      })}
      {/* Farolas encendidas */}
      {[
        [64, 236, 1],
        [150, 236, 0.6],
        [436, 246, 1],
        [356, 240, 0.6],
      ].map(([x, y, s]) => (
        <g key={`f${x}`}>
          <circle cx={x} cy={y} r={44 * s} fill={`url(#${id('lamp')})`} className="art-glow" />
          <rect x={x - 1.5 * s} y={y + 8 * s} width={3 * s} height={120 * s} fill="#2c2440" />
          <path d={`M${x - 7 * s} ${y - 4 * s}h${14 * s}l${-2 * s} ${14 * s}h${-10 * s}z`} fill="#ffd58a" stroke="#2c2440" strokeWidth={1.5 * s} />
          <path d={`M${x - 8 * s} ${y - 4 * s}l${8 * s} ${-7 * s}l${8 * s} ${7 * s}z`} fill="#2c2440" />
        </g>
      ))}
    </>
  );
}

/** Pasadía sorpresa: una piscina al sol, dos tumbonas y una nube que pregunta. */
function Pasadia({ id }: SceneProps) {
  return (
    <>
      <defs>
        <Gradient id={id('sky')} stops={[[0, '#86b8e4'], [1, '#f4e8d4']]} />
        <Gradient id={id('pool')} stops={[[0, '#5fb0d8'], [1, '#2f86b8']]} />
        <Glow id={id('sun')} color="#fff1c6" />
      </defs>
      <rect width="500" height="400" fill={`url(#${id('sky')})`} />
      <circle cx="404" cy="70" r="80" fill={`url(#${id('sun')})`} />
      <circle cx="404" cy="70" r="26" fill="#fff6dc" />
      {/* La nube con forma de «?» */}
      <path
        d="M196 92c0-26 24-42 52-42s52 16 52 40c0 24-26 30-40 44-6 6-8 12-8 20"
        fill="none"
        stroke="#ffffff"
        strokeWidth="20"
        strokeLinecap="round"
        opacity="0.92"
      />
      <circle cx="252" cy="190" r="11" fill="#ffffff" opacity="0.92" />
      {/* Fondo: hotel bajo con palmas */}
      <rect x="0" y="196" width="500" height="64" fill="#f6efe2" />
      <path d="M0 196h500" stroke="#e1d3bc" strokeWidth="4" />
      {[30, 90, 150, 330, 390, 450].map((x) => (
        <rect key={x} x={x} y="212" width="26" height="30" rx="2" fill="#a9c6db" />
      ))}
      <path d="M216 260v-58h68v58z" fill="#e9d6b8" />
      {[
        [210, 120],
        [292, 132],
      ].map(([x, top]) => (
        <g key={x}>
          <path d={`M${x} 262c2-40 2-90 4-${262 - top - 12}`} stroke="#a58b72" strokeWidth="6" fill="none" />
          {[-150, -120, -80, -45, -15, 20].map((a) => {
            const r = (a * Math.PI) / 180;
            const ex = x + 4 + Math.cos(r) * 40;
            const ey = top + Math.sin(r) * 26 + 16;
            return <path key={a} d={`M${x + 4} ${top}Q${(x + 4 + ex) / 2} ${top - 12} ${ex} ${ey}`} stroke="#6f9a5e" strokeWidth="6" fill="none" strokeLinecap="round" />;
          })}
        </g>
      ))}
      {/* Terraza y piscina */}
      <rect y="258" width="500" height="142" fill="#ead8bc" />
      <path d="M60 400L120 290H380L440 400z" fill={`url(#${id('pool')})`} />
      <path d="M120 290H380L440 400" fill="none" stroke="#f8f2e6" strokeWidth="6" />
      <path d="M60 400L120 290" stroke="#f8f2e6" strokeWidth="6" />
      {[318, 342, 370].map((y, i) => (
        <path key={y} d={`M${150 - i * 18} ${y}q20-8 40 0t40 0 40 0`} stroke="#d6f0fb" strokeWidth="2.5" fill="none" opacity="0.7" className="art-wave" />
      ))}
      {/* Tumbonas y sombrilla */}
      {[24, 410].map((x) => (
        <g key={x}>
          <path d={`M${x} 330l60-6 4 12-60 6z`} fill="#fbf1e6" stroke="#d9c4a8" />
          <path d={`M${x + 4} 324l-6-28 12-2 6 28z`} fill="#fbf1e6" stroke="#d9c4a8" />
          <path d={`M${x + 8} 342v16M${x + 58} 336v16`} stroke="#b9a184" strokeWidth="3" />
        </g>
      ))}
      <path d="M454 330V232" stroke="#8a6a54" strokeWidth="4" />
      <path d="M396 244c10-28 34-40 58-40s48 12 58 40z" fill="#e88f6a" />
      <path d="M430 210c-6 10-8 22-8 34M478 210c6 10 8 22 8 34" stroke="#fbf1e6" strokeWidth="8" />
    </>
  );
}

const SCENES: Record<Kind, (props: SceneProps) => ReactNode> = {
  restaurant: Restaurant,
  icecream: IceCream,
  bodeguita: Bodeguita,
  'mystery-city': MysteryCity,
  pasadia: Pasadia,
};
