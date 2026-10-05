import { animate, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { config } from '../../config.ts';
import { feedback } from '../../design/feedback.ts';
import { spring } from '../../design/motion.ts';
import { usePointerFine } from '../../hooks/useMediaQuery.ts';
import { fill } from '../../lib/format.ts';
import { daypartSpoken, formatEdge, formatSlot, formatTimeSpoken, moodForChoice } from '../../lib/dates.ts';
import type { Mood } from '../../lib/mood.ts';

type Props = {
  /** Horas que se pueden elegir ese día, ordenadas. */
  times: string[];
  value: string | null;
  date: string;
  /** Hora de la puesta de sol, para los planes de atardecer. */
  sunset?: string | null;
  onChange: (time: string) => void;
};

// Geometría del arco (unidades del viewBox): un trozo de cielo de izquierda a derecha.
const W = 320;
const H = 176;
const CX = 160;
const CY = 166;
const R = 138;
const START = Math.PI * 0.94;
const END = Math.PI * 0.06;

const angleAt = (f: number) => START - f * (START - END);

/** Silueta mínima de la ciudad (casas, campanario, glorieta y una palma) sobre la base del arco. */
const SKYLINE =
  'M24 166V152H52V166ZM54 166V146H80V166ZM60 146V140H70V146ZM92 166V128H104V166ZM90 128L98 116L106 128ZM97.2 108H98.8V117H97.2ZM94.5 111H101.5V112.6H94.5Z' +
  'M108 166V150H140V166ZM148 166V160H200V166ZM146 147Q160 140 174 124Q188 140 202 147ZM150 147H153V160H150ZM161 147H164V160H161ZM172.5 147H175.5V160H172.5ZM184 147H187V160H184ZM195 147H198V160H195Z' +
  'M206 166V146H232V166ZM244 166L246.2 128H248.2L250.4 166ZM247 128Q236 122 230 130Q238 124 247 129ZM247 128Q258 122 264 130Q256 124 247 129ZM247 128Q240 116 232 116Q241 118 247 128ZM247 128Q254 116 262 117Q253 118 247 128Z' +
  'M256 166V152H296V166Z';
/** Fracción del arco de la hora i de n (una sola hora va en el centro). */
const fractionOf = (i: number, last: number) => (last > 0 ? i / last : 0.5);
const pointAt = (angle: number) => ({ x: CX + R * Math.cos(angle), y: CY - R * Math.sin(angle) });

/** Color del cielo de cada tramo del arco y del astro que se arrastra. */
const TRACK: Record<Mood, string> = { morning: '#f0c08a', day: '#84b2e2', sunset: '#e0908a', night: '#3d3b70' };
const BODY: Record<Mood, string> = { morning: '#ffe2a6', day: '#fff1bd', sunset: '#ffc27f', night: '#f7f1e4' };

/**
 * El arco del cielo: ella arrastra el sol (o la luna) para elegir la hora dentro de la franja
 * del plan. Se ajusta a los pasos de `schedule.stepMinutes`, suena un «tic» en cada uno y el
 * cielo de fondo cambia a la hora que va eligiendo. También funciona con teclado (es un slider).
 */
export function TimeArc({ times, value, date, sunset, onChange }: Props) {
  const reduced = Boolean(useReducedMotion());
  const pointerFine = usePointerFine();
  const svgRef = useRef<SVGSVGElement>(null);
  const moonMask = `luna-${useId().replace(/[^\w-]/g, '')}`;
  const [dragging, setDragging] = useState(false);
  const last = times.length - 1;
  const index = Math.max(0, value ? times.indexOf(value) : 0);

  // Posición del astro: sigue el dedo de forma continua y, al soltar, se asienta en su hora.
  const progress = useMotionValue(fractionOf(index, last));
  const x = useTransform(progress, (f) => pointAt(angleAt(f)).x);
  const y = useTransform(progress, (f) => pointAt(angleAt(f)).y);

  useEffect(() => {
    if (dragging) return;
    const target = fractionOf(index, last);
    if (reduced) progress.set(target);
    else {
      const controls = animate(progress, target, spring.buoy);
      return () => controls.stop();
    }
  }, [index, last, dragging, reduced, progress]);

  const moods = useMemo(() => times.map((t) => moodForChoice(date, t)), [times, date]);
  const mood = moods[index] ?? 'day';

  const select = (i: number) => {
    const next = Math.min(last, Math.max(0, i));
    if (times[next] && times[next] !== value) {
      feedback('tick');
      onChange(times[next]);
    }
  };

  const fractionFromPointer = (e: PointerEvent) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(ctm.inverse());
    let angle = Math.atan2(CY - p.y, p.x - CX);
    if (angle < 0) angle = p.x < CX ? START : END; // por debajo del centro: el extremo más cercano
    angle = Math.min(START, Math.max(END, angle));
    return (START - angle) / (START - END);
  };

  const follow = (e: PointerEvent) => {
    const f = fractionFromPointer(e);
    if (f === null || last < 1) return;
    progress.set(f);
    select(Math.round(f * last));
  };

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (last < 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    follow(e);
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (dragging) follow(e);
  };
  const release = () => setDragging(false);

  const onKeyDown = (e: KeyboardEvent) => {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowUp: index + 1,
      ArrowLeft: index - 1,
      ArrowDown: index - 1,
      PageUp: index + 4,
      PageDown: index - 4,
      Home: 0,
      End: last,
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    select(moves[e.key]);
  };

  // Tramos del arco, cada uno con el color del cielo a esa hora ese día.
  const segments = useMemo(() => {
    if (last < 1) return [{ d: arcPath(0, 1), color: TRACK[moods[0] ?? 'day'] }];
    return times.slice(0, -1).map((_, i) => ({ d: arcPath(fractionOf(i, last), fractionOf(i + 1, last)), color: TRACK[moods[i]] }));
  }, [times, moods, last]);

  const current = times[index];
  const start = pointAt(START);
  const end = pointAt(END);

  return (
    <div className="time-arc">
      <div
        className="time-arc__dial"
        role="slider"
        tabIndex={0}
        aria-label={config.when.timeTitle}
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={index}
        aria-valuetext={current ? formatTimeSpoken(current) : undefined}
        onKeyDown={onKeyDown}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="time-arc__svg"
          data-dragging={dragging || undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={release}
          onPointerCancel={release}
          aria-hidden="true"
        >
          <defs>
            {/* La luna, creciente: el disco menos otro desplazado. */}
            <mask id={moonMask} maskUnits="userSpaceOnUse" x={-20} y={-20} width={40} height={40}>
              <circle r={13} fill="#fff" />
              <circle cx={6} cy={-4} r={11} fill="#000" />
            </mask>
          </defs>
          {/* Santa Clara bajo el arco: el sol (o la luna) cruza por encima de los tejados. */}
          <path d={SKYLINE} className="time-arc__city" />
          {/* Zona de toque generosa a lo largo del arco. */}
          <path d={arcPath(0, 1)} className="time-arc__hit" />
          <path d={arcPath(0, 1)} className="time-arc__rail" />
          {segments.map((s, i) => (
            <path key={i} d={s.d} stroke={s.color} className="time-arc__track" />
          ))}
          {last > 0 &&
            times.map((t, i) =>
              t.endsWith(':00') ? <circle key={t} {...tickAt(fractionOf(i, last))} r={1.6} className="time-arc__tick" /> : null,
            )}
          <m.g style={{ x, y }}>
            <m.g animate={{ scale: dragging ? 1.18 : 1 }} transition={spring.buoy}>
              <circle r={22} fill={BODY[mood]} opacity={0.4} />
              <circle r={13.5} cy={2} className="time-arc__shade" />
              <circle r={13} fill={BODY[mood]} className="time-arc__body" mask={mood === 'night' ? `url(#${moonMask})` : undefined} />
            </m.g>
          </m.g>
        </svg>

        <div className="time-arc__readout" aria-hidden="true">
          <span className="time-arc__clock">{current ? formatSlot(current) : '—'}</span>
          {current && daypartSpoken(current) && <span className="time-arc__daypart">{daypartSpoken(current)}</span>}
        </div>
        <span className="time-arc__end" style={{ left: `${(start.x / W) * 100}%` }} aria-hidden="true">
          {formatEdge(times[0])}
        </span>
        <span className="time-arc__end" style={{ left: `${(end.x / W) * 100}%` }} aria-hidden="true">
          {formatEdge(times[last])}
        </span>
      </div>

      {sunset && <p className="time-arc__sunset">{fill(config.when.sunsetAt).replace('{hora}', formatTimeSpoken(sunset))}</p>}
      {last > 0 && <p className="time-arc__hint">{config.when.dragHint[pointerFine ? 'mouse' : 'touch']}</p>}
    </div>
  );
}

/** Trozo de arco entre dos fracciones (0 = izquierda, 1 = derecha). */
function arcPath(from: number, to: number) {
  const a = pointAt(angleAt(from));
  const b = pointAt(angleAt(to));
  return `M${a.x.toFixed(2)} ${a.y.toFixed(2)}A${R} ${R} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

/** Marca de cada hora en punto, por fuera del arco, como en un reloj. */
function tickAt(f: number) {
  const angle = angleAt(f);
  return { cx: CX + (R + 14) * Math.cos(angle), cy: CY - (R + 14) * Math.sin(angle) };
}
