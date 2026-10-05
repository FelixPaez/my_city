import { animate, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useRef, useState } from 'react';
import { config } from '../../config.ts';
import { feedback } from '../../design/feedback.ts';
import { ease, transition } from '../../design/motion.ts';
import { usePointerFine } from '../../hooks/useMediaQuery.ts';
import { useSwipeUp } from '../../hooks/useSwipeUp.ts';
import { fill } from '../../lib/format.ts';
import { useFlow } from '../../state/flowContext.ts';
import { HintButton } from '../../ui/HintButton.tsx';
import { HoldButton } from '../../ui/HoldButton.tsx';
import { RevealText } from '../../ui/RevealText.tsx';
import { InkWarmth } from './InvisibleInk.tsx';
import { QuestionPage } from './QuestionPage.tsx';

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
  const hold = useMotionValue(0);
  /** 0 → 1: el texto leído se va y asoma el rastro de la tinta invisible. */
  const ink = useMotionValue(0);

  const swipeFade = useTransform(y, [-170, 0], [0, 1]);
  const textOpacity = useTransform([fade, swipeFade, ink], ([f, s, g]: number[]) => f * s * (1 - g));
  // La tinta de limón casi no se ve… hasta que el calor la oscurece.
  const ghostOpacity = useTransform([ink, hold], ([g, h]: number[]) => g * (1 - h) * 0.2);
  const nextOpacity = useTransform([ink, hold], ([g, h]: number[]) => g * h);
  const noteOpacity = useTransform([ink, hold], ([g, h]: number[]) => g * (1 - h * 2.2));

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

  // La tinta invisible asoma sola cuando ya hubo tiempo de leer (o al primer toque, lo que ocurra antes).
  useEffect(() => {
    if (!ready || advance !== 'hold') return;
    const words = text.split(/\s+/).length;
    const id = window.setTimeout(
      () => {
        if (ink.get() === 0) animate(ink, 1, { duration: 1.6, ease: ease.swell });
      },
      (1.5 + words * 0.15) * 1000,
    );
    return () => window.clearTimeout(id);
  }, [ready, advance, text, ink]);

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
          <m.div className="letter__text" style={{ y, opacity: textOpacity }}>
            {page === 0 && (
              <RevealText text={fill(config.letter.greeting)} className="letter__greeting" complete={complete} />
            )}
            <RevealText
              text={fill(text)}
              className="letter__words"
              delay={page === 0 ? 0.55 : 0.1}
              complete={complete}
              onDone={() => setComplete(true)}
            />
          </m.div>
          {advance === 'hold' && (
            <>
              <InkWarmth progress={hold} />
              <m.div className="letter__text letter__text--ghost" style={{ opacity: ghostOpacity }} aria-hidden="true">
                <p className={isLast ? 'letter__question' : 'letter__words'}>{fill(nextText)}</p>
              </m.div>
              <m.div className="letter__text letter__text--ink" style={{ opacity: nextOpacity }} aria-hidden="true">
                <p className={isLast ? 'letter__question' : 'letter__words'}>{fill(nextText)}</p>
              </m.div>
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
              icon={<CandleIcon />}
              onPressStart={() => {
                if (ink.get() < 1) animate(ink, 1, { duration: 0.45, ease: ease.surface });
              }}
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

/** Una vela: el calor que revela la tinta invisible. */
function CandleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.2c2 2.2 2.6 3.7 2.6 5a2.6 2.6 0 0 1-5.2 0c0-1.3.6-2.8 2.6-5z" fill="currentColor" fillOpacity="0.18" />
      <path d="M12 10.6v2.2M8.6 13h6.8v7.4H8.6z" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5 10 7.5l5 5" />
    </svg>
  );
}
