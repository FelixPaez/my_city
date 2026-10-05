import type { Mood } from '../lib/mood.ts';

/** Mismos nombres que los hápticos: un único lenguaje de respuesta en toda la app. */
export type SoundName =
  | 'tick'
  | 'nudge'
  | 'pop'
  | 'paper'
  | 'seal'
  | 'flutter'
  | 'coo'
  | 'bell'
  | 'stamp'
  | 'yes'
  | 'whoosh'
  | 'shutter';

export type AmbientParams = { mood: Mood; breeze: number };

export interface SoundEngine {
  play(name: SoundName): void;
  setAmbient(params: AmbientParams): void;
  /** Apaga solo el fondo (brisa, pájaros y grillos); los efectos cortos siguen. */
  setAmbientEnabled(enabled: boolean): void;
  setMuted(muted: boolean): void;
  suspend(): void;
  resume(): void;
}
