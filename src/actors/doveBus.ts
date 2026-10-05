/** Dónde está el sobre en el pico de la paloma (px de pantalla): centro, ancho e inclinación. */
export type EnvelopeInfo = { x: number; y: number; width: number; angle: number };

/**
 * Canal de avisos. Los "persistentes" recuerdan que ya ocurrieron: quien se
 * suscribe tarde recibe el aviso igual (útil cuando no se sabe quién llega antes).
 */
function channel<T = void>(sticky = false) {
  const listeners = new Set<(value: T) => void>();
  let fired: { value: T } | null = null;
  return {
    emit(value: T) {
      if (sticky) fired = { value };
      listeners.forEach((fn) => fn(value));
    },
    on(fn: (value: T) => void) {
      listeners.add(fn);
      if (fired) fn(fired.value);
      return () => void listeners.delete(fn);
    },
    reset() {
      fired = null;
    },
  };
}

/** Coordinación entre la paloma (vive en la ciudad) y la carta (vive en la pantalla). */
export const doveBus = {
  /** Apertura: la paloma suelta el sobre. */
  launch: channel<EnvelopeInfo>(),
  /** Cierre: la paloma volvió al balcón y espera el sobre. */
  arrived: channel(true),
  /** Cierre: el sobre ya está en su pico. */
  deliver: channel(true),
  /** Cierre: la paloma se fue volando. */
  gone: channel(true),
  /** Dónde estaría ahora el sobre en el pico (lo registra la paloma). */
  beak: null as null | (() => EnvelopeInfo | null),
  resetClosing() {
    this.arrived.reset();
    this.deliver.reset();
    this.gone.reset();
  },
};
