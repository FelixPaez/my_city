import * as m from 'motion/react-m';
import { transition } from '../design/motion.ts';
import type { Progress } from '../state/selectors.ts';
import { LampProgress } from '../ui/LampProgress.tsx';
import { SoundToggle } from '../ui/SoundToggle.tsx';

/** Barra superior fija: la fila de farolas del progreso y el botón de sonido. */
export function TopBar({ progress }: { progress: Progress }) {
  return (
    <header className="topbar">
      <m.div
        className="topbar__progress min-w-0"
        initial={false}
        animate={{ opacity: progress.visible ? 1 : 0, y: progress.visible ? 0 : -8 }}
        transition={transition.enter}
        aria-hidden={!progress.visible}
      >
        <LampProgress progress={progress} />
      </m.div>
      <div className="topbar__actions">
        <SoundToggle />
      </div>
    </header>
  );
}
