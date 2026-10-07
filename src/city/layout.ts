import type { Viewport } from '../hooks/useViewport.ts';

/**
 * Dónde va cada cosa de la ciudad, en px de pantalla. La escena y la paloma usan
 * esta misma función: así la paloma se posa justo en el balcón o en una farola.
 *
 * De atrás hacia delante: los edificios que rodean el parque (con el campanario y
 * el hotel alto), el Parque Vidal (glorieta, palmas reales, farolas, flamboyán)
 * y el balcón de hierro desde el que se mira.
 */
export type CityLayout = {
  width: number;
  height: number;
  desktop: boolean;
  /** Borde de arriba del pasamanos del balcón. */
  railTop: number;
  /** Suelo del parque. */
  ground: number;
  /** Tejados de los edificios del fondo (alto de la fila). */
  roofs: { min: number; max: number };
  hotel: { x: number; width: number; top: number };
  tower: { x: number; top: number };
  glorieta: { x: number; width: number; top: number };
  palms: { x: number; top: number; lean: number }[];
  lamps: { x: number; top: number }[];
  trees: { x: number; r: number; flame?: boolean }[];
  /** La paloma en el pasamanos del balcón. */
  perch: { x: number; y: number };
  /** La paloma esperando sobre una farola mientras ella lee. */
  away: { x: number; y: number; scale: number };
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Alto total de la glorieta según su ancho: techo, columnas, plataforma y escalones (ver `glorieta` en Skyline). */
export const glorietaHeight = (width: number) => width * 0.68 + 19;

export function cityLayout({ width: W, height: H }: Pick<Viewport, 'width' | 'height'>): CityLayout {
  const desktop = W >= 1024;
  const railTop = Math.round(H * (desktop ? 0.86 : 0.865));
  const ground = Math.round(H * 0.8);
  // La glorieta se apoya en el suelo del parque, como las farolas: su alto sale de su ancho.
  const onGround = (x: number, width: number) => ({ x, width, top: ground + 6 - glorietaHeight(width) });

  if (desktop) {
    const lamps = [0.16, 0.31, 0.5, 0.66, 0.8].map((f) => ({ x: W * f, top: H * 0.715 }));
    const waitLamp = lamps[0];
    return {
      width: W,
      height: H,
      desktop,
      railTop,
      ground,
      roofs: { min: H * 0.55, max: H * 0.63 },
      hotel: { x: W * 0.14, width: clamp(W * 0.055, 70, 96), top: H * 0.43 },
      tower: { x: W * 0.86, top: H * 0.385 },
      glorieta: onGround(W * 0.4, clamp(W * 0.13, 160, 220)),
      palms: [
        { x: W * 0.06, top: H * 0.47, lean: -3 },
        { x: W * 0.25, top: H * 0.5, lean: 2 },
        { x: W * 0.57, top: H * 0.46, lean: -2 },
        { x: W * 0.74, top: H * 0.49, lean: 3 },
        { x: W * 0.96, top: H * 0.47, lean: 4 },
      ],
      lamps,
      trees: [
        { x: W * 0.21, r: 44 },
        { x: W * 0.7, r: 58, flame: true },
        { x: W * 0.91, r: 42 },
      ],
      perch: { x: W * 0.72, y: railTop },
      away: { x: waitLamp.x, y: waitLamp.top, scale: 0.3 },
    };
  }

  const lamps = [0.47, 0.78].map((f) => ({ x: W * f, top: H * 0.705 }));
  const waitLamp = lamps[1];
  return {
    width: W,
    height: H,
    desktop,
    railTop,
    ground,
    roofs: { min: H * 0.56, max: H * 0.635 },
    hotel: { x: W * 0.17, width: clamp(W * 0.15, 52, 70), top: H * 0.445 },
    tower: { x: W * 0.8, top: H * 0.395 },
    glorieta: onGround(W * 0.3, clamp(W * 0.32, 100, 136)),
    palms: [
      { x: W * 0.07, top: H * 0.48, lean: -3 },
      { x: W * 0.62, top: H * 0.505, lean: 2 },
      { x: W * 0.96, top: H * 0.47, lean: 4 },
    ],
    lamps,
    trees: [
      { x: W * 0.13, r: 28 },
      { x: W * 0.87, r: 36, flame: true },
    ],
    perch: { x: W * 0.5, y: railTop },
    away: { x: waitLamp.x, y: waitLamp.top, scale: 0.34 },
  };
}
