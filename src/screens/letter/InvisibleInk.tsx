import { useTransform, type MotionValue } from 'motion/react';
import * as m from 'motion/react-m';

type Props = {
  /** 0 → 1: progreso de mantener presionado (el calor que revela la tinta). */
  progress: MotionValue<number>;
};

/**
 * El calor de una vela detrás del papel: un resplandor ámbar que crece mientras ella
 * mantiene presionado, como cuando de niños se leía la tinta de limón al calor.
 */
export function InkWarmth({ progress }: Props) {
  const opacity = useTransform(progress, [0, 0.15, 1], [0, 0.55, 0.9]);
  const scale = useTransform(progress, [0, 1], [0.55, 1.15]);
  return (
    <m.div className="ink-warmth" style={{ opacity }} aria-hidden="true">
      <m.span className="ink-warmth__glow" style={{ scale }} />
    </m.div>
  );
}
