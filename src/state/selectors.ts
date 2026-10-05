import type { DovePose } from '../actors/geometry.ts';
import type { FlowState, Step } from './flow.ts';

/** Brisa de cada paso: media en la intro, un soplo al abrir la carta y calma para leer. */
export function breezeFor(step: Step): number {
  switch (step) {
    case 'intro':
      return 0.5;
    case 'opening':
      return 0.72;
    case 'letter':
    case 'question':
      return 0.22;
    case 'celebration':
      return 0.95;
    case 'declined':
    case 'farewell':
      return 0.18;
    default:
      return 0.4;
  }
}

/** Dónde está la paloma en cada paso. */
export function dovePoseFor(step: Step): DovePose {
  if (step === 'intro') return 'perched';
  if (step === 'opening') return 'opening';
  if (step === 'declined' || step === 'farewell') return 'closing';
  return 'away';
}

export type Progress = {
  visible: boolean;
  /** Hasta qué farola está encendida la fila, de 0 a `total`. */
  index: number;
  total: number;
  /** Llegó al final: todas las farolas encendidas. */
  arrived: boolean;
  /** Etiquetas (solo escritorio): en qué índice empieza cada etapa. */
  labels: { at: number; text: string }[];
};

/** Progreso del viaje: páginas de la carta, pregunta, plan, fecha y resumen. */
export function progressOf(state: FlowState, pages: number): Progress {
  const total = pages + 4;
  const labels = [
    { at: 0, text: 'Carta' },
    { at: pages, text: 'Pregunta' },
    { at: pages + 1, text: 'Plan' },
    { at: pages + 2, text: 'Fecha' },
    { at: pages + 3, text: 'Resumen' },
  ];
  const at = (index: number, extra: Partial<Progress> = {}): Progress => ({
    visible: true,
    index,
    total,
    arrived: false,
    labels,
    ...extra,
  });

  switch (state.step) {
    case 'intro':
    case 'opening':
      return at(0, { visible: false });
    case 'letter':
      return at(state.page);
    case 'question':
    case 'celebration':
      return at(pages);
    case 'declined':
      return at(pages, { visible: false });
    case 'plan':
      return at(pages + 1);
    case 'datetime':
      return at(pages + 2);
    case 'summary':
      return at(pages + 3);
    case 'farewell':
      return at(total, { arrived: true });
  }
}
