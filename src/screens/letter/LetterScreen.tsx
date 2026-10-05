import { animate, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { doveBus, type EnvelopeInfo } from '../../actors/doveBus.ts';
import { config } from '../../config.ts';
import { feedback } from '../../design/feedback.ts';
import { dur, ease, spring, transition } from '../../design/motion.ts';
import { formatDateLong } from '../../lib/dates.ts';
import { fill } from '../../lib/format.ts';
import { useFlow } from '../../state/flowContext.ts';
import { RevealText } from '../../ui/RevealText.tsx';
import { Envelope } from './Envelope.tsx';
import { LetterContent } from './LetterPages.tsx';

/**
 * Apertura: waiting → flying → opening → unfolding → open
 *   (el sobre vuela del pico al centro, se rompe el lacre, se abre la solapa y la carta se despliega).
 * Cierre: folding → sealing → returning → gone (con «Mejor otro día»)
 *         sealed → returning → gone (tras mandar el WhatsApp: el sobre ya aparece sellado).
 */
type Phase = 'waiting' | 'flying' | 'opening' | 'unfolding' | 'open' | 'folding' | 'sealing' | 'sealed' | 'returning' | 'gone';

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** El sobre (300 × 200) dentro de su SVG (viewBox -20 -150 340 370): centro y ancho del cuerpo. */
const BODY = { cx: (150 + 20) / 340, cy: (100 + 150) / 370, width: 300 / 340 };

/** Desde el sobre en reposo (centro de la pantalla) hasta un punto de la pantalla. */
function offsetTo(el: HTMLElement, info: EnvelopeInfo) {
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width * BODY.cx;
  const cy = rect.top + rect.height * BODY.cy;
  return { x: info.x - cx, y: info.y - cy, scale: Math.max(0.05, info.width / (rect.width * BODY.width)) };
}

/**
 * La carta: llega en un sobre lacrado desde el pico de la paloma, se abre y se despliega
 * (wipe con doble transform y la sombra del doblez bajando). Al final, o con «Mejor otro
 * día», se dobla, vuelve al sobre, se sella y se va con la paloma.
 */
export function LetterScreen() {
  const { state, dispatch, initialStep } = useFlow();
  const reduced = Boolean(useReducedMotion());
  const closingStep = state.step === 'declined' || state.step === 'farewell';
  const [phase, setPhase] = useState<Phase>(() => {
    if (state.step === 'opening') return 'waiting';
    // Si se recarga ya en el final, se muestra el final tal cual (sin repetir la animación).
    if (closingStep) return state.step === initialStep ? 'gone' : 'sealed';
    return 'open';
  });
  const [showMessage, setShowMessage] = useState(closingStep && state.step === initialStep);
  // Cierre desde la carta abierta («Mejor otro día»): el texto se desvanece y se dobla.
  if (closingStep && phase === 'open') setPhase('folding');

  const unroll = useMotionValue(phase === 'open' ? 1 : 0);
  const contentOpacity = useMotionValue(1);
  const envX = useMotionValue(0);
  const envY = useMotionValue(0);
  const envScale = useMotionValue(1);
  const envRotate = useMotionValue(0);
  const envOpacity = useMotionValue(0);
  const flap = useMotionValue(0);
  const breakSeal = useMotionValue(0);
  const seal = useMotionValue(1);
  const slide = useMotionValue(0);
  const launch = useRef<EnvelopeInfo | null>(null);
  const envRef = useRef<HTMLDivElement>(null);

  const openLetter = () => {
    setPhase('open');
    dispatch({ type: 'OPENED' });
  };

  // 1. Esperar a que la paloma suelte el sobre (o seguir sin él si no llega).
  useEffect(() => {
    if (phase !== 'waiting') return;
    if (reduced) {
      unroll.set(1);
      const id = window.setTimeout(openLetter, 450);
      return () => window.clearTimeout(id);
    }
    const off = doveBus.launch.on((info) => {
      launch.current = info;
      setPhase('flying');
    });
    const fallback = window.setTimeout(() => setPhase('flying'), 1800);
    return () => {
      off();
      window.clearTimeout(fallback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reduced]);

  // 2. Vuelo: del pico de la paloma al centro, creciendo y enderezándose.
  useLayoutEffect(() => {
    if (phase !== 'flying' || !envRef.current) return;
    const info = launch.current;
    if (info) {
      const start = offsetTo(envRef.current, info);
      envX.set(start.x);
      envY.set(start.y);
      envScale.set(start.scale);
      envRotate.set(info.angle);
    } else {
      envY.set(window.innerHeight * 0.3);
      envScale.set(0.2);
    }
    envOpacity.set(1);
    const opts = { duration: 0.95, ease: ease.surface };
    const controls = [
      animate(envX, 0, opts),
      animate(envY, 0, opts),
      animate(envScale, 1, opts),
      animate(envRotate, 0, { ...opts, onComplete: () => setPhase('opening') }),
    ];
    return () => controls.forEach((c) => c.stop());
  }, [phase, envX, envY, envScale, envRotate, envOpacity]);

  // 3. Se rompe el lacre, se abre la solapa y la carta asoma.
  useEffect(() => {
    if (phase !== 'opening') return;
    let cancelled = false;
    void (async () => {
      await wait(180);
      if (cancelled) return;
      feedback('seal');
      seal.set(0);
      animate(breakSeal, 1, { duration: 0.75, ease: ease.sink });
      await wait(260);
      if (cancelled) return;
      animate(flap, 1, { duration: 0.5, ease: ease.swell });
      await wait(420);
      if (cancelled) return;
      feedback('paper');
      animate(slide, 1, { duration: 0.7, ease: ease.surface });
      await wait(560);
      if (!cancelled) setPhase('unfolding');
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, seal, breakSeal, flap, slide]);

  // 4. El sobre se retira y la carta se despliega de arriba abajo.
  useEffect(() => {
    if (phase !== 'unfolding') return;
    const controls = [
      animate(envOpacity, 0, { duration: 0.45, ease: ease.swell }),
      animate(envY, 60, { duration: 0.6, ease: ease.sink }),
      animate(unroll, 1, { duration: dur.tide, ease: ease.surface, delay: 0.1, onComplete: openLetter }),
    ];
    return () => controls.forEach((c) => c.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // 5. Cierre desde la carta abierta: el texto se va y la carta se dobla.
  useEffect(() => {
    if (phase !== 'folding') return;
    doveBus.resetClosing();
    if (reduced) {
      contentOpacity.set(0);
      unroll.set(0);
      const id = window.setTimeout(() => setPhase('returning'), 0);
      return () => window.clearTimeout(id);
    }
    feedback('paper');
    const controls = [
      animate(contentOpacity, 0, transition.exit),
      animate(unroll, 0, { duration: dur.tide, ease: ease.swell, delay: 0.25, onComplete: () => setPhase('sealing') }),
    ];
    return () => controls.forEach((c) => c.stop());
  }, [phase, reduced, contentOpacity, unroll]);

  // 6. La carta entra en el sobre, la solapa se cierra y cae un lacre nuevo.
  useEffect(() => {
    if (phase !== 'sealing') return;
    let cancelled = false;
    envX.set(0);
    envY.set(0);
    envScale.set(1);
    envRotate.set(0);
    flap.set(1);
    slide.set(1);
    breakSeal.set(0);
    seal.set(0);
    void (async () => {
      animate(envOpacity, 1, transition.enter);
      await wait(250);
      if (cancelled) return;
      animate(slide, 0, { duration: 0.6, ease: ease.swell });
      await wait(520);
      if (cancelled) return;
      animate(flap, 0, { duration: 0.45, ease: ease.swell });
      await wait(450);
      if (cancelled) return;
      animate(seal, 1, { ...spring.stamp, onComplete: () => feedback('stamp') });
      await wait(650);
      if (!cancelled) setPhase('returning');
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, envX, envY, envScale, envRotate, envOpacity, flap, slide, breakSeal, seal]);

  // 6 bis. Tras mandar el WhatsApp: el sobre aparece ya sellado.
  useEffect(() => {
    if (phase !== 'sealed') return;
    doveBus.resetClosing();
    if (reduced) {
      envOpacity.set(1);
      const id = window.setTimeout(() => setPhase('returning'), 0);
      return () => window.clearTimeout(id);
    }
    const start = () => {
      envScale.set(0.82);
      animate(envOpacity, 1, transition.enter);
      animate(envScale, 1, { ...transition.enter, onComplete: () => setPhase('returning') });
    };
    if (!document.hidden) {
      start();
      return;
    }
    // Ella está en WhatsApp: la despedida espera a que vuelva para que no se la pierda.
    const onVisible = () => {
      if (document.hidden) return;
      document.removeEventListener('visibilitychange', onVisible);
      window.setTimeout(start, 500);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [phase, reduced, envOpacity, envScale]);

  // 7. Cuando la paloma vuelve al balcón, el sobre vuela hasta su pico.
  useEffect(() => {
    if (phase !== 'returning') return;
    let started = false;
    const flyIn = () => {
      if (started) return;
      started = true;
      const el = envRef.current;
      const beak = doveBus.beak?.();
      const finish = () => {
        doveBus.deliver.emit();
        setPhase('gone');
      };
      if (reduced || !el || !beak) {
        animate(envOpacity, 0, { ...transition.reduced, onComplete: finish });
        return;
      }
      const target = offsetTo(el, beak);
      const opts = { duration: 1.05, ease: ease.surface };
      feedback('whoosh');
      animate(envX, target.x, opts);
      animate(envY, target.y, opts);
      animate(envScale, target.scale, opts);
      animate(envRotate, beak.angle, {
        ...opts,
        onComplete: () => animate(envOpacity, 0, { duration: 0.15, onComplete: finish }),
      });
    };
    const off = doveBus.arrived.on(flyIn);
    const fallback = window.setTimeout(flyIn, 4500);
    return () => {
      off();
      window.clearTimeout(fallback);
    };
  }, [phase, reduced, envX, envY, envScale, envRotate, envOpacity]);

  // 8. Con la paloma ya lejos, aparece el mensaje final.
  useEffect(() => {
    if (!closingStep || phase !== 'gone') return;
    const off = doveBus.gone.on(() => setShowMessage(true));
    const fallback = window.setTimeout(() => setShowMessage(true), 4000);
    return () => {
      off();
      window.clearTimeout(fallback);
    };
  }, [closingStep, phase]);

  const outerY = useTransform(unroll, (p) => `${(p - 1) * 100}%`);
  const innerY = useTransform(unroll, (p) => `${(1 - p) * 100}%`);
  const foldY = useTransform(unroll, (p) => `${p * 100}%`);
  const foldOpacity = useTransform(unroll, [0, 0.04, 0.94, 1], [0, 1, 1, 0]);

  const closing =
    state.step === 'farewell'
      ? {
          title: config.farewell.title.replaceAll('{fecha}', formatDateLong(state.choice.date, true)),
          message: fill(config.farewell.message),
        }
      : { title: fill(config.decline.title), message: fill(config.decline.message) };

  return (
    <m.div className="screen-fixed" exit={{ opacity: 0, y: 26, transition: transition.exit }}>
      <div className="letter-wrap">
        <div className="letter">
          <m.div className="letter__shadow" style={{ scaleY: unroll }} />
          <m.div className="letter__paper-outer" style={{ y: outerY }}>
            <m.div className="letter__paper paper" style={{ y: innerY }}>
              <span className="letter__creases" aria-hidden="true" />
              <m.div className="letter__fade" style={{ opacity: contentOpacity }}>
                {state.step !== 'opening' && <LetterContent />}
              </m.div>
            </m.div>
          </m.div>
          <m.div className="letter__fold" style={{ y: foldY, opacity: foldOpacity }} aria-hidden="true" />
        </div>
        <m.div
          ref={envRef}
          className="envelope-flight"
          style={{ x: envX, y: envY, scale: envScale, rotate: envRotate, opacity: envOpacity }}
        >
          <Envelope flap={flap} breakSeal={breakSeal} seal={seal} slide={slide} name={fill(config.intro.title)} />
        </m.div>
      </div>
      {showMessage && <ClosingMessage title={closing.title} message={closing.message} />}
    </m.div>
  );
}

/** Mensaje final, en el cielo, mientras la paloma se aleja. */
function ClosingMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="closing" role="status">
      <div className="closing__text veil">
        <RevealText as="h2" text={title} className="font-serif text-display font-medium text-on-sea" />
        <m.p
          className="closing__message text-body text-on-sea-soft"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transition.enter, delay: 0.9 }}
        >
          {message}
        </m.p>
      </div>
    </div>
  );
}
