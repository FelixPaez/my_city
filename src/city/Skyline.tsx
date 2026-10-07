import { memo, useMemo, type CSSProperties, type ReactNode } from 'react';
import { seeded } from '../lib/random.ts';
import type { CityLayout } from './layout.ts';

/**
 * Las capas de la ciudad, dibujadas a mano con primitivas SVG y una semilla fija
 * (se ve igual en cada visita). Cada capa define su geometría una sola vez en <defs>
 * y la repite en tres tonos —día, crepúsculo y noche— que se funden por opacidad:
 * solo se anima la opacidad, nunca el color.
 *
 * Los colores salen de variables CSS (`--b0`, `--lit1`…) que cada tono define.
 */

type Tone = 'day' | 'dusk' | 'night';
type Vars = Record<string, string>;
const TONES: Tone[] = ['day', 'dusk', 'night'];
const OVERSCAN = 40;

/** fill con variable CSS (las variables se heredan dentro de <use>). */
const f = (name: string): CSSProperties => ({ fill: `var(${name})` });

const toneStyle = (vars: Vars) => vars as CSSProperties;

// ---------- Paletas ----------

const FAR: Record<Tone, Vars> = {
  day: {
    '--b0': '#dcc9c1',
    '--b1': '#d9cfb8',
    '--b2': '#c6cadb',
    '--trim': '#efe5d7',
    '--roof': '#cc9d88',
    '--win': '#ab9ca8',
    '--lit1': '#ab9ca8',
    '--lit2': '#ab9ca8',
    '--dark': '#a397ab',
    '--tall': '#ccc8d8',
    '--tower': '#e6dbcb',
    '--palm': '#aaa8be',
    '--trunk': '#bfb7c6',
    '--shaft': '#aaa8be',
  },
  dusk: {
    '--b0': '#8f6b8e',
    '--b1': '#886a8b',
    '--b2': '#7b6990',
    '--trim': '#9e7c98',
    '--roof': '#8c6180',
    '--win': '#5f4b78',
    '--lit1': '#ffc979',
    '--lit2': '#5f4b78',
    '--dark': '#5e4a77',
    '--tall': '#806d95',
    '--tower': '#9a7b9b',
    '--palm': '#604d79',
    '--trunk': '#6d5784',
    '--shaft': '#604d79',
  },
  night: {
    '--b0': '#2e2d57',
    '--b1': '#2c2b53',
    '--b2': '#30315b',
    '--trim': '#3a396c',
    '--roof': '#2b2952',
    '--win': '#24234b',
    '--lit1': '#ffcd78',
    '--lit2': '#f0b45e',
    '--dark': '#23224b',
    '--tall': '#2d2e5a',
    '--tower': '#373668',
    '--palm': '#26254d',
    '--trunk': '#2c2b53',
    '--shaft': '#26254d',
  },
};

const PARK: Record<Tone, Vars> = {
  day: {
    '--stone': '#f4ebdc',
    '--shade': '#cbb9a7',
    '--roof': '#c1715a',
    '--iron': '#4c4251',
    '--glass': '#d4cbc3',
    '--tree': '#909c79',
    '--tree-dark': '#77845f',
    '--flame': '#d9583b',
    '--flame-2': '#ea8550',
    '--palm': '#7f9271',
    '--trunk': '#a89c90',
    '--shaft': '#93a383',
    '--park': '#cfbda2',
    '--hedge': '#8a9873',
    '--bulb': '#c1715a',
  },
  dusk: {
    '--stone': '#a9869f',
    '--shade': '#6f577f',
    '--roof': '#7e5378',
    '--iron': '#3b2e4d',
    '--glass': '#ffd38a',
    '--tree': '#5b4c73',
    '--tree-dark': '#4c3f64',
    '--flame': '#9b4b64',
    '--flame-2': '#aa5b6b',
    '--palm': '#504369',
    '--trunk': '#5e4d72',
    '--shaft': '#55476f',
    '--park': '#5e4b6f',
    '--hedge': '#4c3f63',
    '--bulb': '#ffd38a',
  },
  night: {
    '--stone': '#3c3b69',
    '--shade': '#272751',
    '--roof': '#2f2d56',
    '--iron': '#16152f',
    '--glass': '#ffd47e',
    '--tree': '#1e1e3f',
    '--tree-dark': '#181835',
    '--flame': '#2b2143',
    '--flame-2': '#34274b',
    '--palm': '#1b1b39',
    '--trunk': '#242448',
    '--shaft': '#1d1d3d',
    '--park': '#1e1d3c',
    '--hedge': '#19193b',
    '--bulb': '#ffd47e',
  },
};

const BALCONY: Record<Tone, Vars> = {
  day: {
    '--iron': '#3a3346',
    '--iron-hi': '#615770',
    '--leaf': '#6e8763',
    '--leaf-2': '#5a7250',
    '--flower': '#c2477a',
    '--flower-2': '#e68fb2',
  },
  dusk: {
    '--iron': '#2a2238',
    '--iron-hi': '#4b3e5d',
    '--leaf': '#403d59',
    '--leaf-2': '#363351',
    '--flower': '#8f406b',
    '--flower-2': '#a9618b',
  },
  night: {
    '--iron': '#0f0f24',
    '--iron-hi': '#2b2b49',
    '--leaf': '#18192f',
    '--leaf-2': '#141529',
    '--flower': '#3e2448',
    '--flower-2': '#4b2d56',
  },
};

// ---------- Primitivas ----------

/** Ventana con arco de medio punto (las casas coloniales). */
const archWindow = (x: number, y: number, w: number, h: number) => {
  const r = w / 2;
  return `M${x} ${y + h}V${y + r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h}Z`;
};

const FACADES = ['--b0', '--b1', '--b2'];
const LIT = (r: number) => (r < 0.22 ? '--lit1' : r < 0.46 ? '--lit2' : '--win');

function tank(key: string, x: number, roof: number) {
  return (
    <g key={key} style={f('--dark')}>
      <rect x={x + 2} y={roof - 8} width={1.4} height={8} />
      <rect x={x + 11} y={roof - 8} width={1.4} height={8} />
      <rect x={x} y={roof - 18} width={15} height={10.5} rx={1.6} />
      <rect x={x - 0.8} y={roof - 19.2} width={16.6} height={2} rx={1} />
    </g>
  );
}

function antenna(key: string, x: number, roof: number) {
  return (
    <path
      key={key}
      d={`M${x} ${roof}V${roof - 17}M${x - 6} ${roof - 13}H${x + 6}M${x - 4} ${roof - 9}H${x + 4}M${x - 2.5} ${roof - 5.5}H${x + 2.5}`}
      style={{ stroke: 'var(--dark)', strokeWidth: 1, fill: 'none' }}
    />
  );
}

function farHouse(key: string, x: number, top: number, w: number, bottom: number, rand: () => number) {
  const els: ReactNode[] = [
    <rect key="f" x={x} y={top} width={w} height={bottom - top} style={f(FACADES[Math.floor(rand() * 3)])} />,
    <rect key="c" x={x - 1.5} y={top - 2} width={w + 3} height={2.6} style={f('--trim')} />,
  ];
  const roof = rand();
  if (roof < 0.28) {
    const rh = 5 + rand() * 5;
    els.push(
      <path key="r" d={`M${x - 2} ${top - 1.5}L${x + w * 0.16} ${top - rh}H${x + w * 0.84}L${x + w + 2} ${top - 1.5}Z`} style={f('--roof')} />,
    );
  } else if (roof < 0.52) {
    els.push(<rect key="p" x={x + 1} y={top - 8} width={w - 2} height={1.8} style={f('--trim')} />);
    for (let bx = x + 3, i = 0; bx < x + w - 3; bx += 4.4, i++) {
      els.push(<rect key={`b${i}`} x={bx} y={top - 6.4} width={1.5} height={4.6} style={f('--trim')} />);
    }
  }
  const cols = Math.max(1, Math.floor((w - 6) / 15));
  const cell = (w - 6) / cols;
  for (let floor = 0; floor < 3; floor++) {
    for (let c = 0; c < cols; c++) {
      const wx = x + 3 + c * cell + (cell - 6) / 2;
      els.push(<path key={`w${floor}-${c}`} d={archWindow(wx, top + 8 + floor * 24, 6, 11)} style={f(LIT(rand()))} />);
    }
  }
  const extra = rand();
  if (extra < 0.3) els.push(tank('t', x + w * (0.2 + rand() * 0.5), top - (roof < 0.52 && roof >= 0.28 ? 8 : 1)));
  else if (extra < 0.46) els.push(antenna('a', x + w * (0.25 + rand() * 0.5), top - 1));
  return <g key={key}>{els}</g>;
}

/** El hotel alto del centro: el único edificio moderno del horizonte. */
function hotel({ x, width: w, top }: CityLayout['hotel'], bottom: number, rand: () => number) {
  const left = x - w / 2;
  const els: ReactNode[] = [
    <rect key="f" x={left} y={top} width={w} height={bottom - top} style={f('--tall')} />,
    <rect key="c" x={left - 2} y={top - 3} width={w + 4} height={3.5} style={f('--trim')} />,
    <rect key="m" x={x - 5} y={top - 12} width={10} height={9} style={f('--tall')} />,
    antenna('a', x + w * 0.3, top - 3),
  ];
  const cols = Math.max(3, Math.round(w / 15));
  const cell = (w - 8) / cols;
  for (let row = 0; top + 9 + row * 13 < bottom - 10; row++) {
    for (let c = 0; c < cols; c++) {
      els.push(
        <rect key={`w${row}-${c}`} x={left + 4 + c * cell + (cell - 5) / 2} y={top + 9 + row * 13} width={5} height={7} style={f(LIT(rand()))} />,
      );
    }
  }
  return <g key="hotel">{els}</g>;
}

/** El campanario: cuerpo, campanas en su arco, cúpula y cruz. */
function tower({ x, top }: CityLayout['tower'], bottom: number) {
  const belfry = top + 24;
  const body = belfry + 26;
  return (
    <g key="tower">
      <rect x={x - 14} y={body} width={28} height={bottom - body} style={f('--tower')} />
      <rect x={x - 16} y={body - 2.5} width={32} height={3} style={f('--trim')} />
      <rect x={x - 12} y={belfry} width={24} height={body - belfry} style={f('--tower')} />
      <path d={archWindow(x - 5.5, belfry + 6, 11, 16)} style={f('--win')} />
      <path d={`M${x - 3} ${belfry + 17}Q${x} ${belfry + 9} ${x + 3} ${belfry + 17}Z`} style={f('--dark')} />
      <rect x={x - 14} y={belfry - 2.5} width={28} height={3} style={f('--trim')} />
      <path d={`M${x - 12} ${belfry - 1}Q${x - 12} ${top + 12} ${x} ${top + 9}Q${x + 12} ${top + 12} ${x + 12} ${belfry - 1}Z`} style={f('--tower')} />
      <rect x={x - 0.9} y={top} width={1.8} height={10} style={f('--dark')} />
      <rect x={x - 3.4} y={top + 2.6} width={6.8} height={1.5} style={f('--dark')} />
      <path d={archWindow(x - 3.5, body + 14, 7, 12)} style={f('--lit1')} />
      <path d={archWindow(x - 3.5, body + 40, 7, 12)} style={f('--win')} />
    </g>
  );
}

function palmShape(key: string, x: number, top: number, lean: number, ground: number, size: number) {
  const cx = x + lean;
  const crown = top + 6 * size;
  const fronds: ReactNode[] = [];
  const angles = [-172, -150, -128, -106, -84, -62, -40, -18, 4];
  angles.forEach((deg, i) => {
    const a = (deg * Math.PI) / 180;
    const len = (24 + (i % 3) * 5) * size;
    const ex = cx + Math.cos(a) * len;
    // Las hojas de los lados caen más, como las de la palma real.
    const droop = (Math.abs(Math.cos(a)) * 0.55 + 0.1) * len;
    const ey = crown + Math.sin(a) * len + droop;
    const mx = (cx + ex) / 2;
    const my = (crown + ey) / 2 - len * 0.22;
    const nx = -(ey - crown) / len;
    const ny = (ex - cx) / len;
    const t = 2.6 * size;
    fronds.push(
      <path
        key={i}
        d={`M${cx} ${crown}Q${mx + nx * t} ${my + ny * t} ${ex} ${ey}Q${mx - nx * t} ${my - ny * t} ${cx} ${crown}Z`}
        style={f('--palm')}
      />,
    );
  });
  return {
    trunk: (
      <g key={`${key}-t`}>
        <path
          d={`M${x - 3.2 * size} ${ground}Q${x - 2.6 * size + lean * 0.3} ${(ground + top) / 2} ${cx - 1.8 * size} ${crown + 9 * size}L${cx + 1.8 * size} ${crown + 9 * size}Q${x + 2.6 * size + lean * 0.3} ${(ground + top) / 2} ${x + 3.2 * size} ${ground}Z`}
          style={f('--trunk')}
        />
        <rect x={cx - 2.4 * size} y={crown + 1} width={4.8 * size} height={9 * size} rx={2} style={f('--shaft')} />
      </g>
    ),
    crown: fronds,
    origin: `${cx}px ${crown}px`,
  };
}

function tree(key: string, x: number, r: number, ground: number, flame: boolean, rand: () => number) {
  const cy = ground - r * 1.55;
  const blobs = flame
    ? [
        [-0.95, 0.15, 0.55],
        [-0.45, -0.12, 0.66],
        [0.1, -0.2, 0.72],
        [0.62, -0.05, 0.62],
        [1.02, 0.18, 0.5],
      ]
    : [
        [-0.5, 0.1, 0.62],
        [0, -0.25, 0.72],
        [0.5, 0.05, 0.64],
        [0.05, 0.25, 0.6],
      ];
  const els: ReactNode[] = [
    <path
      key="trunk"
      d={`M${x - 3} ${ground}L${x - 2} ${cy + r * 0.3}L${x - 9} ${cy + r * 0.1}M${x + 2} ${cy + r * 0.3}L${x + 10} ${cy + r * 0.05}M${x + 3} ${ground}L${x + 2} ${cy + r * 0.3}`}
      style={{ stroke: 'var(--trunk)', strokeWidth: 4, fill: 'none', strokeLinecap: 'round' }}
    />,
    ...blobs.map(([dx, dy, s], i) => (
      <circle key={`c${i}`} cx={x + dx * r} cy={cy + dy * r} r={s * r} style={f(i % 2 ? '--tree-dark' : '--tree')} />
    )),
  ];
  if (flame) {
    // El flamboyán: la copa se llena de flores rojas.
    for (let i = 0; i < 26; i++) {
      const a = rand() * Math.PI;
      const d = Math.sqrt(rand()) * r * 0.95;
      els.push(
        <circle key={`fl${i}`} cx={x + Math.cos(a) * d * 1.35} cy={cy - Math.sin(a) * d * 0.55 + r * 0.05} r={2 + rand() * 3.2} style={f(i % 3 ? '--flame' : '--flame-2')} />,
      );
    }
  }
  return <g key={key}>{els}</g>;
}

function farola(key: string, x: number, top: number, ground: number) {
  return (
    <g key={key}>
      <path d={`M${x - 5} ${ground}L${x - 3} ${ground - 11}H${x + 3}L${x + 5} ${ground}Z`} style={f('--iron')} />
      <rect x={x - 1.4} y={top + 17} width={2.8} height={ground - top - 17} style={f('--iron')} />
      <rect x={x - 2.6} y={top + 38} width={5.2} height={2.2} style={f('--iron')} />
      <rect x={x - 3.6} y={top + 15} width={7.2} height={2.4} style={f('--iron')} />
      <path d={`M${x - 4.6} ${top + 5}H${x + 4.6}L${x + 3.6} ${top + 15}H${x - 3.6}Z`} style={f('--glass')} />
      <path d={`M${x - 4.6} ${top + 5}H${x + 4.6}L${x + 3.6} ${top + 15}H${x - 3.6}ZM${x} ${top + 5}V${top + 15}`} style={{ stroke: 'var(--iron)', strokeWidth: 0.9, fill: 'none' }} />
      <path d={`M${x - 6.2} ${top + 5.2}L${x} ${top}L${x + 6.2} ${top + 5.2}Z`} style={f('--iron')} />
    </g>
  );
}

/**
 * La glorieta del Parque Vidal: plataforma, columnas, barandilla y techo de campana con bombillos.
 * Si cambian sus proporciones, hay que ajustar `glorietaHeight` (layout.ts), que la apoya en el suelo.
 */
function glorieta({ x, width: w, top }: CityLayout['glorieta']) {
  const half = w / 2;
  const roofH = w * 0.34;
  const roofBase = top + roofH;
  const colTop = roofBase + 5;
  const colBottom = colTop + w * 0.34;
  const cols = 6;
  const els: ReactNode[] = [
    <rect key="in" x={x - half * 0.92} y={colTop} width={w * 0.92} height={colBottom - colTop} style={f('--shade')} />,
    <rect key="steps" x={x - half - 7} y={colBottom + 8} width={w + 14} height={6} style={f('--stone')} />,
    <rect key="base" x={x - half - 2} y={colBottom} width={w + 4} height={9} style={f('--stone')} />,
    <rect key="rail" x={x - half * 0.92} y={colBottom - 11} width={w * 0.92} height={1.6} style={f('--stone')} />,
  ];
  for (let i = 0; i < cols; i++) {
    const cx = x - half * 0.88 + (i * w * 0.88) / (cols - 1);
    els.push(<rect key={`c${i}`} x={cx - 1.6} y={colTop} width={3.2} height={colBottom - colTop} style={f('--stone')} />);
    if (i < cols - 1) {
      const nx = x - half * 0.88 + ((i + 1) * w * 0.88) / (cols - 1);
      for (let p = 1; p < 4; p++) {
        const px = cx + ((nx - cx) * p) / 4;
        els.push(<rect key={`p${i}-${p}`} x={px - 0.5} y={colBottom - 10} width={1} height={10} style={f('--stone')} />);
      }
    }
  }
  els.push(
    <rect key="ent" x={x - half - 3} y={roofBase} width={w + 6} height={5.5} style={f('--stone')} />,
    <path
      key="roof"
      d={`M${x - half - 3} ${roofBase}Q${x - half * 0.78} ${roofBase - roofH * 0.62} ${x - w * 0.07} ${top + 7}L${x} ${top + 3}L${x + w * 0.07} ${top + 7}Q${x + half * 0.78} ${roofBase - roofH * 0.62} ${x + half + 3} ${roofBase}Z`}
      style={f('--roof')}
    />,
    <circle key="ball" cx={x} cy={top + 3} r={2.4} style={f('--stone')} />,
    <rect key="spike" x={x - 0.6} y={top - 6} width={1.2} height={7} style={f('--stone')} />,
  );
  // Bombillos en el borde del techo: apagados de día, encendidos al caer la tarde.
  for (let bx = x - half; bx <= x + half; bx += w / 14) {
    els.push(<circle key={`bulb${bx.toFixed(1)}`} cx={bx} cy={roofBase + 7.5} r={1.5} style={f('--bulb')} />);
  }
  return <g key="glorieta">{els}</g>;
}

// ---------- Capas ----------

function useFarGeometry(layout: CityLayout) {
  const { width: W, height: H, roofs } = layout;
  return useMemo(() => {
    const rand = seeded(31);
    const els: ReactNode[] = [];
    let x = -OVERSCAN;
    let i = 0;
    while (x < W + OVERSCAN) {
      const w = 44 + rand() * 50;
      const top = roofs.min + rand() * (roofs.max - roofs.min);
      els.push(farHouse(`h${i++}`, x, top, w, H, rand));
      x += w + (rand() < 0.35 ? 3 : 0);
    }
    els.push(hotel(layout.hotel, H, rand), tower(layout.tower, H));
    // Un par de palmas lejanas asoman entre los tejados.
    for (const px of [0.36, 0.68]) {
      const palm = palmShape(`fp${px}`, W * px, roofs.min - H * 0.045, 1, roofs.max + 10, 0.62);
      els.push(palm.trunk, <g key={`fp${px}-c`}>{palm.crown}</g>);
    }
    return els;
    // La geometría solo depende del tamaño (y de la semilla).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [W, H]);
}

/** Los edificios que rodean el parque: casas coloniales, el hotel alto y el campanario. */
export const FarLayer = memo(function FarLayer({ layout }: { layout: CityLayout }) {
  const geometry = useFarGeometry(layout);
  const { width: W, height: H } = layout;
  return (
    <svg className="city-layer city-layer--far" viewBox={`${-OVERSCAN} 0 ${W + OVERSCAN * 2} ${H}`} width={W + OVERSCAN * 2} height={H}>
      <defs>
        <g id="city-far">{geometry}</g>
      </defs>
      {TONES.map((tone) => (
        <use key={tone} href="#city-far" className={`tone tone--${tone}`} style={toneStyle(FAR[tone])} />
      ))}
    </svg>
  );
});

/** El Parque Vidal: la glorieta, árboles, farolas y palmas reales que se mecen. */
export const ParkLayer = memo(function ParkLayer({ layout }: { layout: CityLayout }) {
  const { width: W, height: H, ground } = layout;
  const size = layout.desktop ? 1.25 : 1;
  const { still, palms } = useMemo(() => {
    const rand = seeded(53);
    const still: ReactNode[] = [
      <rect key="park" x={-OVERSCAN} y={ground} width={W + OVERSCAN * 2} height={H - ground} style={f('--park')} />,
      <path
        key="hedge"
        d={`M${-OVERSCAN} ${ground + 2}${Array.from({ length: Math.ceil((W + OVERSCAN * 2) / 18) }, (_, i) => `Q${-OVERSCAN + i * 18 + 9} ${ground - 7} ${-OVERSCAN + (i + 1) * 18} ${ground + 2}`).join('')}V${ground + 8}H${-OVERSCAN}Z`}
        style={f('--hedge')}
      />,
      ...layout.trees.map((t, i) => tree(`tree${i}`, t.x, t.r, ground + 4, Boolean(t.flame), rand)),
      glorieta(layout.glorieta),
      ...layout.lamps.map((l, i) => farola(`lamp${i}`, l.x, l.top, ground + 6)),
    ];
    const palms = layout.palms.map((p, i) => palmShape(`palm${i}`, p.x, p.top, p.lean, ground + 6, size));
    return { still, palms };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [W, H]);

  return (
    <svg className="city-layer city-layer--park" viewBox={`${-OVERSCAN} 0 ${W + OVERSCAN * 2} ${H}`} width={W + OVERSCAN * 2} height={H}>
      <defs>
        <g id="city-park">{still}</g>
        <g id="city-trunks">{palms.map((p) => p.trunk)}</g>
      </defs>
      {TONES.map((tone) => (
        <g key={tone} className={`tone tone--${tone}`} style={toneStyle(PARK[tone])}>
          <use href="#city-trunks" />
          {palms.map((p, i) => (
            <g key={i} className="palm-crown" style={{ transformOrigin: p.origin, animationDelay: `${-i * 1.7}s` }}>
              {p.crown}
            </g>
          ))}
          <use href="#city-park" />
        </g>
      ))}
    </svg>
  );
});

/** El balcón desde el que se mira: hierro forjado con volutas y buganvillas en las esquinas. */
export const BalconyLayer = memo(function BalconyLayer({ layout }: { layout: CityLayout }) {
  const { width: W, height: H, railTop, desktop } = layout;
  const geometry = useMemo(() => {
    const rand = seeded(77);
    const els: ReactNode[] = [];
    const band = railTop + 9;
    const lower = railTop + (desktop ? 58 : 50);
    const step = desktop ? 30 : 26;
    for (let x = -OVERSCAN, i = 0; x < W + OVERSCAN; x += step, i++) {
      els.push(<rect key={`bar${i}`} x={x} y={band} width={3} height={H - band} style={f('--iron')} />);
      // Volutas en forma de C entre barrote y barrote, como el hierro colonial.
      const cx = x + step / 2 + 1.5;
      const mid = (band + lower) / 2;
      const r = (lower - band) / 4.4;
      els.push(
        <path
          key={`s${i}`}
          d={`M${cx} ${band + 2}C${cx + r * 1.5} ${band + 2} ${cx + r * 1.5} ${mid - 1} ${cx} ${mid - 1}C${cx - r * 0.9} ${mid - 1} ${cx - r * 0.9} ${mid - r * 1.1} ${cx} ${mid - r * 1.1}M${cx} ${lower - 2}C${cx - r * 1.5} ${lower - 2} ${cx - r * 1.5} ${mid + 1} ${cx} ${mid + 1}C${cx + r * 0.9} ${mid + 1} ${cx + r * 0.9} ${mid + r * 1.1} ${cx} ${mid + r * 1.1}`}
          style={{ stroke: 'var(--iron)', strokeWidth: 2.2, fill: 'none', strokeLinecap: 'round' }}
        />,
      );
    }
    els.push(
      <rect key="lower" x={-OVERSCAN} y={lower} width={W + OVERSCAN * 2} height={4.5} style={f('--iron')} />,
      <rect key="band" x={-OVERSCAN} y={band - 2} width={W + OVERSCAN * 2} height={3} style={f('--iron')} />,
      <rect key="rail" x={-OVERSCAN} y={railTop} width={W + OVERSCAN * 2} height={8} rx={3} style={f('--iron')} />,
      <rect key="rail-hi" x={-OVERSCAN} y={railTop + 1.2} width={W + OVERSCAN * 2} height={1.6} style={f('--iron-hi')} />,
    );
    // Buganvillas que trepan por las dos esquinas y caen sobre el pasamanos.
    const reach = desktop ? Math.min(W * 0.13, 190) : W * 0.2;
    for (const side of [0, 1] as const) {
      for (let i = 0; i < (desktop ? 64 : 44); i++) {
        const along = Math.pow(rand(), 1.7) * reach;
        const x = side === 0 ? along - 6 : W - along + 6;
        const y = railTop - 30 + rand() * 90 + along * 0.18;
        const leaf = rand() < 0.42;
        if (leaf) {
          const rot = rand() * 180;
          els.push(
            <ellipse key={`l${side}-${i}`} cx={x} cy={y} rx={5.5} ry={2.8} transform={`rotate(${rot} ${x} ${y})`} style={f(rand() < 0.5 ? '--leaf' : '--leaf-2')} />,
          );
        } else {
          els.push(<circle key={`f${side}-${i}`} cx={x} cy={y} r={2.6 + rand() * 3.6} style={f(rand() < 0.55 ? '--flower' : '--flower-2')} />);
        }
      }
    }
    return els;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [W, H]);

  return (
    <svg className="city-layer city-layer--balcony" viewBox={`${-OVERSCAN} 0 ${W + OVERSCAN * 2} ${H}`} width={W + OVERSCAN * 2} height={H}>
      <defs>
        <g id="city-balcony">{geometry}</g>
      </defs>
      {TONES.map((tone) => (
        <use key={tone} href="#city-balcony" className={`tone tone--${tone}`} style={toneStyle(BALCONY[tone])} />
      ))}
    </svg>
  );
});
