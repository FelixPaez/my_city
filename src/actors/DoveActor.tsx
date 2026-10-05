import { animate, useMotionValue, useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { feedback } from '../design/feedback.ts';
import { ease, spring, transition } from '../design/motion.ts';
import { useViewport } from '../hooks/useViewport.ts';
import { DoveArt } from './DoveArt.tsx';
import { DOVE_FEET, DOVE_VIEW } from './doveShape.ts';
import { doveBus } from './doveBus.ts';
import { doveGeometry, type DovePose } from './geometry.ts';

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** Dónde está: en el balcón, en la farola o ya lejos (cielo arriba). */
type Spot = 'perch' | 'away' | 'gone';
/** Cierre: vuelve → espera el sobre → lo toma → se va → ya lejos. */
type ClosingStage = 'returning' | 'waiting' | 'taking' | 'leaving' | 'done';

/**
 * La paloma: vive en la ciudad (delante del balcón) y nunca se desmonta.
 * perched → en el balcón con la carta · opening → salta, suelta el sobre y vuela a una farola ·
 * away → espera allí mientras ella lee y elige · closing → vuelve, toma la respuesta y se va.
 */
export function DoveActor({ pose }: { pose: DovePose }) {
  const geo = doveGeometry(useViewport());
  const reduced = Boolean(useReducedMotion());
  const [initialPose] = useState(pose);
  const [flown, setFlown] = useState(false);
  const [closing, setClosing] = useState<ClosingStage>(initialPose === 'closing' ? 'done' : 'returning');
  const arriving = initialPose === 'perched' && !reduced;
  const [flying, setFlying] = useState(arriving);
  /** 1 = mira a la izquierda (como el dibujo); -1 = a la derecha. */
  const [facing, setFacing] = useState<1 | -1>(1);

  const spot: Spot =
    pose === 'perched'
      ? 'perch'
      : pose === 'opening'
        ? flown
          ? 'away'
          : 'perch'
        : pose === 'closing'
          ? closing === 'leaving' || closing === 'done'
            ? 'gone'
            : 'perch'
          : 'away';
  const placeOf = (s: Spot) => (s === 'away' ? geo.away : s === 'gone' ? geo.exit : geo.perch);
  const scaleOf = (s: Spot) => (s === 'away' ? geo.away.scale : s === 'gone' ? 0.45 : 1);
  const place = placeOf(spot);

  const dx = useMotionValue(arriving ? geo.enter.x - geo.perch.x : 0);
  const dy = useMotionValue(arriving ? geo.enter.y - geo.perch.y : 0);
  const scale = useMotionValue(arriving ? 0.6 : scaleOf(spot));
  const opacity = useMotionValue(spot === 'gone' ? 0 : 1);
  const hop = useMotionValue(0);
  const envelope = useMotionValue(initialPose === 'perched' || initialPose === 'opening' ? 1 : 0);
  const envelopeRef = useRef<SVGGElement>(null);
  const geoRef = useRef(geo);
  const facingRef = useRef(facing);
  useLayoutEffect(() => {
    geoRef.current = geo;
    facingRef.current = facing;
  });

  // La carta necesita saber dónde está el sobre en el pico (para salir y para volver).
  useEffect(() => {
    doveBus.beak = () => {
      const r = envelopeRef.current?.getBoundingClientRect();
      if (!r) return null;
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, width: r.width, angle: -9 * facingRef.current };
    };
    return () => {
      doveBus.beak = null;
    };
  }, []);

  /** Vuela desde donde está (dx, dy) hasta su sitio (0, 0), en curva salvo al irse. */
  const flyHome = (target: Spot, onLand?: () => void) => {
    const sx = dx.get();
    const sy = dy.get();
    const distance = Math.hypot(sx, sy);
    const duration = Math.min(2.6, 1.1 + distance / 520);
    const lift = Math.min(90, 28 + distance * 0.12);
    setFacing(sx >= 0 ? 1 : -1);
    setFlying(true);
    const controls = [
      animate(dx, 0, { duration, ease: ease.swell }),
      target === 'gone'
        ? animate(dy, 0, { duration, ease: ease.surface })
        : animate(dy, [sy, Math.min(sy, 0) * 0.5 - lift, 0], { duration, times: [0, 0.55, 1], ease: [ease.surface, ease.swell] }),
      animate(scale, scaleOf(target), { duration, ease: ease.swell }),
    ];
    if (target === 'gone') controls.push(animate(opacity, 0, { duration: duration * 0.35, delay: duration * 0.65 }));
    void controls[1].then(() => {
      if (target !== 'gone') {
        setFlying(false);
        // Se posa: un saltito y se vuelve a mirar hacia el centro.
        animate(hop, [0, -5, 0], { duration: 0.35, ease: ease.swell });
        if (target === 'perch' && geoRef.current.perch.x > window.innerWidth * 0.6) setFacing(1);
      }
      onLand?.();
    });
    return controls;
  };

  // Llegada en la intro: entra volando desde la derecha y se posa en el balcón.
  useEffect(() => {
    if (!arriving) return;
    const controls = flyHome('perch', () => feedback('coo'));
    return () => controls.forEach((c) => c.stop());
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cambio de sitio: la posición cambia de golpe en CSS y el transform recorre la distancia.
  const prevSpot = useRef(spot);
  useLayoutEffect(() => {
    const from = prevSpot.current;
    if (from === spot) return;
    prevSpot.current = spot;
    const g = geoRef.current;
    const a = from === 'away' ? g.away : from === 'gone' ? g.exit : g.perch;
    const b = spot === 'away' ? g.away : spot === 'gone' ? g.exit : g.perch;
    dx.set(dx.get() + a.x - b.x);
    dy.set(dy.get() + a.y - b.y);
    const land = () => {
      if (pose !== 'closing') return;
      setClosing((stage) => (stage === 'returning' ? 'waiting' : stage === 'leaving' ? 'done' : stage));
    };
    if (reduced) {
      dx.set(0);
      dy.set(0);
      scale.set(scaleOf(spot));
      opacity.set(spot === 'gone' ? 0 : 1);
      if (spot !== 'gone') animate(opacity, [0, 1], transition.reduced);
      land();
      return;
    }
    opacity.set(1);
    feedback('flutter');
    flyHome(spot, land);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot]);

  // Apertura: un saltito, suelta el sobre (la carta lo recoge) y vuela a esperar en la farola.
  useEffect(() => {
    if (pose !== 'opening') return;
    let cancelled = false;
    const launch = () => {
      const info = doveBus.beak?.();
      if (info) doveBus.launch.emit(info);
    };
    void (async () => {
      if (reduced) {
        launch();
        envelope.set(0);
        await wait(300);
        if (!cancelled) setFlown(true);
        return;
      }
      feedback('coo');
      animate(hop, [0, -12, 0], { duration: 0.45, ease: ease.swell });
      await wait(380);
      if (cancelled) return;
      launch();
      animate(envelope, 0, { duration: 0.12 });
      await wait(520);
      if (!cancelled) setFlown(true);
    })();
    return () => {
      cancelled = true;
    };
    // `envelope` y `hop` son motion values estables.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pose, reduced]);

  // Cierre: al volver al balcón avisa a la carta; cuando el sobre llega a su pico, se va.
  useEffect(() => {
    if (pose !== 'closing' || initialPose === 'closing') return;
    if (closing === 'waiting') doveBus.arrived.emit();
    if (closing === 'done') doveBus.gone.emit();
  }, [pose, closing, initialPose]);

  useEffect(() => {
    if (pose !== 'closing' || initialPose === 'closing') return;
    let cancelled = false;
    const off = doveBus.deliver.on(() => {
      void (async () => {
        setClosing('taking');
        animate(envelope, 1, { duration: 0.25, ease: ease.surface });
        feedback('coo');
        if (!reduced) animate(hop, [0, -6, 0], { duration: 0.4, ease: ease.swell });
        await wait(reduced ? 300 : 900);
        if (!cancelled) setClosing('leaving');
      })();
    });
    return () => {
      cancelled = true;
      off();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pose, initialPose, reduced]);

  const height = (geo.width * DOVE_VIEW.height) / DOVE_VIEW.width;

  return (
    <m.div
      className="dove-actor"
      style={{
        left: place.x,
        top: place.y,
        width: geo.width,
        height,
        marginLeft: (-DOVE_FEET.x / DOVE_VIEW.width) * geo.width,
        marginTop: (-DOVE_FEET.y / DOVE_VIEW.height) * height,
        transformOrigin: `${(DOVE_FEET.x / DOVE_VIEW.width) * 100}% ${(DOVE_FEET.y / DOVE_VIEW.height) * 100}%`,
        x: dx,
        y: dy,
        scale,
        opacity,
      }}
    >
      <m.div className="dove-actor__hop" style={{ y: hop }}>
        <m.div
          className="dove-actor__face"
          initial={false}
          animate={{ scaleX: facing, rotate: flying ? -6 * facing : 0 }}
          transition={spring.buoy}
        >
          <DoveArt flying={flying} envelope={envelope} width={geo.width} envelopeRef={envelopeRef} />
        </m.div>
      </m.div>
    </m.div>
  );
}
