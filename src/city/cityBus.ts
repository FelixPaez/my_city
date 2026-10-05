/** Efectos puntuales que cualquier pantalla puede pedirle a la ciudad (coordenadas de pantalla). */
export type CityEvent =
  /** Un toque: unas lucecitas suben desde el dedo, como cocuyos. */
  | { type: 'touch'; x: number; y: number }
  /** El sí: palomas que alzan el vuelo, pétalos de buganvilla y lucecitas. */
  | { type: 'celebrate' };

const listeners = new Set<(event: CityEvent) => void>();

export const cityBus = {
  emit(event: CityEvent) {
    listeners.forEach((fn) => fn(event));
  },
  on(fn: (event: CityEvent) => void) {
    listeners.add(fn);
    return () => void listeners.delete(fn);
  },
};
