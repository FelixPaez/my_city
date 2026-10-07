import { animate, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useRef, useState } from 'react';
import { config } from '../../config.ts';
import { feedback } from '../../design/feedback.ts';
import { ease, transition } from '../../design/motion.ts';
import { usePointerFine } from '../../hooks/useMediaQuery.ts';
import { useSwipeUp } from '../../hooks/useSwipeUp.ts';
import { fill } from '../../lib/format.ts';
import { ramp } from '../../lib/ramp.ts';
import { useFlow } from '../../state/flowContext.ts';
import { HintButton } from '../../ui/HintButton.tsx';
import { HoldButton } from '../../ui/HoldButton.tsx';
import { RevealText } from '../../ui/RevealText.tsx';
import { CandleIcon, InkText, InkWarmth } from './InvisibleInk.tsx';
import { QuestionPage } from './QuestionPage.tsx';

/** Segundos que hay que mantener la vela para revelar la tinta invisible. */
const INK_HOLD = 2.1;

type How = 'tap' | 'swipe' | 'ink' | 'ink-held';

/** Contenido de la carta: una página cada vez (cada una con su gesto) y, al final, la pregunta. */
export function LetterContent() {
  const { state, dispatch } = useFlow();
  // Si la página llega revelando la tinta invisible, su texto ya está a la vista: no se vuelve a revelar.
  const [arrivedBy, setArrivedBy] = useState<How | null>(null);
  const next = (how: How) => {
    setArrivedBy(how);
    dispatch({ type: 'NEXT_PAGE' });
  };
  const revealed = arrivedBy === 'ink' || arrivedBy === 'ink-held';
  if (state.step === 'farewell') return null;
  if (state.step !== 'letter') return <QuestionPage key="question" revealed={revealed} />;
  return (
    <LetterPage
      key={`page-${state.page}`}
      page={state.page}
      revealed={revealed}
      waitForRelease={arrivedBy === 'ink-held'}
      onNext={next}
    />
  );
}

type LetterPageProps = {
  page: number;
  /** El texto ya está a la vista (llegó revelando la tinta invisible). */
  revealed: boolean;
  /** El dedo sigue apoyado del gesto anterior: no aceptar toques hasta que se levante. */
  waitForRelease: boolean;
  onNext: (how: How) => void;
};

function LetterPage({ page, revealed, waitForRelease, onNext }: LetterPageProps) {
  const pages = config.letter.pages;
  const { text, advance } = pages[page];
  const pointerFine = usePointerFine();
  const reduced = Boolean(useReducedMotion());
  const hint = config.letter.hints[advance][pointerFine ? 'mouse' : 'touch'];
  const isLast = page === pages.length - 1;
  const nextText = isLast ? config.question.text : pages[page + 1].text;

  const [complete, setComplete] = useState(revealed);
  const [armed, setArmed] = useState(!waitForRelease);
  const leaving = useRef(false);
  const ready = armed && complete;
  const swipeable = ready && advance === 'swipe';

  // Si el dedo sigue apoyado, el clic que el navegador genera al levantarlo caería en esta
  // página (por ejemplo, en el botón de deslizar). Hasta que se levante, nada responde.
  useEffect(() => {
    if (armed) return;
    let timer = 0;
    const release = () => {
      timer = window.setTimeout(() => setArmed(true), 120);
    };
    window.addEventListener('pointerup', release, { once: true });
    window.addEventListener('pointercancel', release, { once: true });
    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.clearTimeout(timer);
    };
  }, [armed]);
  const bodyRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const fade = useMotionValue(1);
  /** 0 → 1: el calor de la vela mientras ella mantiene presionado (vuelve a 0 si suelta). */
  const hold = useMotionValue(0);
  /** 0 → 1: aparece el aviso de que lo que sigue va en tinta invisible. */
  const noteIn = useMotionValue(0);
  /** Si la página llegó revelando la tinta, el papel sigue caliente un momento y se enfría. */
  const cooling = useMotionValue(revealed ? 1 : 0);

  const swipeFade = useTransform(y, [-170, 0], [0, 1]);
  // Al calentar el papel, lo ya leído se retira para dejar sitio a la tinta invisible.
  const textOpacity = useTransform([fade, swipeFade, hold], ([f, s, h]: number[]) => f * s * (1 - ramp(h, 0.02, 0.3)));
  const noteOpacity = useTransform([noteIn, hold], ([n, h]: number[]) => n * (1 - ramp(h, 0, 0.12)));

  const swipe = useSwipeUp({
    y,
    enabled: swipeable,
    wheelTarget: bodyRef,
    onComplete: () => {
      feedback('whoosh');
      onNext('swipe');
    },
  });

  const leaveByTap = () => {
    if (leaving.current) return;
    leaving.current = true;
    feedback('tick');
    animate(y, -14, transition.exit);
    animate(fade, 0, { ...transition.exit, onComplete: () => onNext('tap') });
  };

  // Un toque mientras se revela lo completa; en las páginas de "tocar", el siguiente avanza.
  const onLetterClick = () => {
    if (!armed) return;
    if (!complete) setComplete(true);
    else if (advance === 'tap') leaveByTap();
  };

  useEffect(() => {
    if (!revealed) return;
    const controls = animate(cooling, 0, { duration: 2, ease: ease.swell, delay: 0.3 });
    return () => controls.stop();
  }, [revealed, cooling]);

  // Terminada la página, una nota avisa de la tinta invisible. Lo escrito con ella no se ve
  // en absoluto hasta que ella calienta el papel.
  useEffect(() => {
    if (!ready || advance !== 'hold') return;
    const id = window.setTimeout(() => animate(noteIn, 1, { duration: 0.9, ease: ease.swell }), 900);
    return () => window.clearTimeout(id);
  }, [ready, advance, noteIn]);

  // Si no hay gesto, el papel hace un amago hacia arriba como pista.
  useEffect(() => {
    if (!complete || advance !== 'swipe' || reduced) return;
    const id = window.setInterval(() => {
      if (y.get() !== 0 || y.isAnimating()) return;
      animate(y, [0, -18, 0], { duration: 1.1, ease: ease.swell });
    }, 4200);
    return () => window.clearInterval(id);
  }, [complete, advance, reduced, y]);


  return (
    <div className="letter__content">
      <div
        ref={bodyRef}
        className={`letter__body ${swipeable ? 'is-swipeable' : ''} ${complete && advance === 'tap' ? 'is-tappable' : ''}`}
        onClick={onLetterClick}
        {...(advance === 'swipe' ? swipe.handlers : {})}
      >
        <div className="letter__stack" aria-live="polite">
          {revealed && <InkWarmth progress={cooling} />}
          <m.div className="letter__text" style={{ y, opacity: textOpacity }}>
            {page === 0 && (
              <RevealText text={fill(config.letter.greeting)} className="letter__greeting" complete={complete} />
            )}
            <RevealText
              text={fill(text)}
              // Si esta página se reveló con calor, conserva el color de la tinta de limón tostada.
              className={revealed ? 'letter__words letter__words--ink' : 'letter__words'}
              delay={page === 0 ? 0.55 : 0.1}
              complete={complete}
              onDone={() => setComplete(true)}
            />
          </m.div>
          {advance === 'hold' && (
            <>
              <InkWarmth progress={hold} />
              <InkText
                text={fill(nextText)}
                className={isLast ? 'letter__question letter__question--ink' : 'letter__words letter__words--ink'}
                progress={hold}
              />
              <m.p className="letter__ink-note" style={{ opacity: noteOpacity }}>
                {config.letter.inkNote}
              </m.p>
            </>
          )}
        </div>
      </div>

      <m.div
        className="letter__footer"
        initial={false}
        animate={{ opacity: complete ? 1 : 0, y: complete ? 0 : 8 }}
        transition={transition.enter}
        inert={!ready}
      >
        {advance === 'tap' && (
          <HintButton icon={<span className="pulse-dot" />} onClick={leaveByTap}>
            {hint}
          </HintButton>
        )}
        {advance === 'hold' && (
          <div className="letter__hold">
            <HoldButton
              label={hint}
              progress={hold}
              duration={INK_HOLD}
              // Si suelta antes de tiempo, el papel se enfría despacio y la tinta se vuelve a esconder.
              release={{ duration: 0.8, ease: ease.swell }}
              icon={<CandleIcon progress={hold} />}
              onComplete={(pointerDown) => {
                feedback('paper');
                onNext(pointerDown ? 'ink-held' : 'ink');
              }}
            />
            <p className="letter__hint-text">{hint}</p>
          </div>
        )}
        {advance === 'swipe' && (
          <HintButton icon={<ChevronUpIcon />} className="hint-button--swipe" onClick={swipe.complete}>
            {hint}
          </HintButton>
        )}
      </m.div>
    </div>
  );
}

function ChevronUpIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5 10 7.5l5 5" />
    </svg>
  );
}
