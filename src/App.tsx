import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import { useEffect, type ReactNode } from 'react';
import { config } from './config.ts';
import { TopBar } from './layout/TopBar.tsx';
import { getDeviceProfile } from './lib/device.ts';
import type { Mood } from './lib/mood.ts';
import { atTime, moodForChoice } from './lib/dates.ts';
import { moonPhase } from './lib/moon.ts';
import { Experience } from './screens/Experience.tsx';
import { DoveActor } from './actors/DoveActor.tsx';
import { City } from './city/City.tsx';
import { sound } from './sound/index.ts';
import { FlowProvider } from './state/FlowProvider.tsx';
import { useFlow } from './state/flowContext.ts';
import { useRealMood } from './state/scene.tsx';
import { breezeFor, dovePoseFor, progressOf, type Progress } from './state/selectors.ts';
import { DraftRibbon } from './ui/DraftRibbon.tsx';

const PARAMS = new URLSearchParams(window.location.search);
/** ?hora=manana|dia|atardecer|noche fuerza la hora del cielo (para revisar cada una). */
const HOUR_PARAM: Record<string, Mood> = { manana: 'morning', dia: 'day', atardecer: 'sunset', noche: 'night' };
const FORCED_MOOD: Mood | undefined = HOUR_PARAM[PARAMS.get('hora') ?? ''];

const PAGES = config.letter.pages.length;
const DEVICE = getDeviceProfile();
/** La luna del cielo nocturno: la fase real de hoy. */
const MOON_TODAY = moonPhase(new Date());

export function App() {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <ExperienceRoot />
      </MotionConfig>
    </LazyMotion>
  );
}

type ShellProps = {
  mood: Mood;
  breeze: number;
  progress: Progress;
  /** Fase de la luna del cielo nocturno (la del día elegido, o la de hoy). */
  moon?: number;
  actors?: ReactNode;
  children: ReactNode;
};

/** Lo que nunca se desmonta: la ciudad, la fila de farolas del progreso y la cinta de borrador. */
function SceneShell({ mood, breeze, progress, moon = MOON_TODAY, actors, children }: ShellProps) {
  // El sonido de la tarde sigue a la hora que se ve.
  useEffect(() => sound.setAmbient({ mood, breeze }), [mood, breeze]);
  return (
    <>
      <City
        mood={mood}
        breeze={breeze}
        moonPhase={moon}
        south={config.location.latitude < 0}
        lite={DEVICE.lite}
        actors={actors}
      />
      <TopBar progress={progress} />
      <main>{children}</main>
      <DraftRibbon />
    </>
  );
}

function ExperienceRoot() {
  return (
    <FlowProvider>
      <ExperienceScene />
    </FlowProvider>
  );
}

/** Pasos en los que el cielo ya anticipa la hora de la cita. */
const CHOSEN_SKY = new Set(['datetime', 'summary', 'farewell']);

function ExperienceScene() {
  const { state } = useFlow();
  const realMood = useRealMood();
  const { date, time } = state.choice;
  const chosen = date && time && CHOSEN_SKY.has(state.step) ? { date, time } : null;
  return (
    <SceneShell
      mood={FORCED_MOOD ?? (chosen ? moodForChoice(chosen.date, chosen.time) : realMood)}
      moon={chosen ? moonPhase(atTime(chosen.date, '21:00')) : MOON_TODAY}
      breeze={breezeFor(state.step)}
      progress={progressOf(state, PAGES)}
      actors={<DoveActor pose={dovePoseFor(state.step)} />}
    >
      <Experience />
    </SceneShell>
  );
}
