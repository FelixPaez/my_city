import { cityLayout } from '../city/layout.ts';
import type { Viewport } from '../hooks/useViewport.ts';

/**
 * perched = en el balcón con la carta (intro) · opening = suelta la carta y vuela a la farola ·
 * away = esperando en la farola · closing = vuelve al balcón, recoge la carta y se va volando.
 */
export type DovePose = 'perched' | 'opening' | 'away' | 'closing';

export type DoveGeometry = {
  /** Ancho del dibujo en px. */
  width: number;
  /** Dónde apoya las patas en el balcón. */
  perch: { x: number; y: number };
  /** Dónde espera (sobre una farola), más pequeña por la distancia. */
  away: { x: number; y: number; scale: number };
  /** Por dónde entra volando al principio. */
  enter: { x: number; y: number };
  /** Por dónde se va al final, cielo arriba. */
  exit: { x: number; y: number };
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** La intro y la escena usan esta misma función: el botón invisible coincide con el dibujo. */
export function doveGeometry(viewport: Viewport): DoveGeometry {
  const layout = cityLayout(viewport);
  const { width: W, height: H } = viewport;
  const width = layout.desktop ? clamp(W * 0.1, 132, 170) : clamp(W * 0.31, 108, 130);
  return {
    width,
    perch: layout.perch,
    away: layout.away,
    enter: { x: W + width, y: H * 0.14 },
    exit: { x: layout.desktop ? W * 0.5 : -width, y: -width },
  };
}
