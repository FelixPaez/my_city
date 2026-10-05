import { useEffect, useRef } from 'react';
import { cssEase, ease } from '../design/motion.ts';
import { prefersReducedMotion } from '../lib/device.ts';
import { cityBus } from './cityBus.ts';

/** Palomita en vuelo para la celebración (alas en V que aletean por CSS). */
const MINI_DOVE =
  '<svg viewBox="0 0 30 22" width="30" height="22"><g class="mini-dove__wings"><path d="M15 12C12 5 7 2 1 3c4 3 8 6 14 11 6-5 10-8 14-11-6-1-11 2-14 9z" fill="#fffdf8"/></g><ellipse cx="15" cy="13.5" rx="3.4" ry="5.5" fill="#fffdf8"/><circle cx="15" cy="8.6" r="2.3" fill="#fffdf8"/></svg>';

/**
 * Lo que pasa por encima de la ciudad: lucecitas al tocar (como cocuyos) y, con el sí,
 * palomas que alzan el vuelo y pétalos de buganvilla. Los elementos se reutilizan (pool)
 * y se animan con la Web Animations API: sin React, sin basura.
 */
export function Lights({ lite }: { lite: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = ref.current;
    if (!layer) return;
    const make = (className: string, count: number, html = '') =>
      Array.from({ length: count }, () => {
        const el = document.createElement('div');
        el.className = className;
        el.innerHTML = html;
        layer.appendChild(el);
        return el;
      });
    const sparks = make('firefly', 24);
    const petals = make('petal', lite ? 18 : 36);
    petals.forEach((p, i) => p.classList.toggle('petal--light', i % 3 === 0));
    const doves = make('mini-dove', lite ? 4 : 7, MINI_DOVE);
    let s = 0;
    const reduced = prefersReducedMotion();
    const at = (x: number, y: number, scale = 1, rotate = 0) =>
      `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${rotate}deg)`;

    const spark = (x: number, y: number, delay = 0, rise = 70) => {
      const el = sparks[s++ % sparks.length];
      if (reduced) {
        el.animate([{ opacity: 0.9, transform: at(x, y) }, { opacity: 0, transform: at(x, y) }], { duration: 700, delay });
        return;
      }
      const dx = (Math.random() - 0.5) * 40;
      const size = 0.6 + Math.random() * 0.7;
      el.animate(
        [
          { opacity: 0, transform: at(x, y, size) },
          { opacity: 1, transform: at(x + dx * 0.3, y - rise * 0.25, size), offset: 0.2 },
          { opacity: 0.8, transform: at(x - dx * 0.2, y - rise * 0.65, size * 0.9), offset: 0.6 },
          { opacity: 0, transform: at(x + dx, y - rise, size * 0.6) },
        ],
        { duration: 1400 + Math.random() * 700, delay, easing: cssEase(ease.swell) },
      );
    };

    const touch = (x: number, y: number) => {
      for (let i = 0; i < (lite ? 2 : 3); i++) spark(x, y, i * 90, 50 + Math.random() * 60);
    };

    /** El sí: palomas que salen del balcón y se van al cielo, pétalos y lucecitas. */
    const celebrate = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      if (reduced) {
        for (let i = 0; i < 8; i++) spark(Math.random() * W, H * (0.2 + Math.random() * 0.4), i * 120);
        return;
      }
      doves.forEach((el, i) => {
        const fromX = W * (0.15 + Math.random() * 0.7);
        const fromY = H * (0.78 + Math.random() * 0.08);
        const toX = fromX + (Math.random() < 0.5 ? -1 : 1) * W * (0.25 + Math.random() * 0.35);
        const toY = -60 - Math.random() * 80;
        const size = 0.8 + Math.random() * 0.7;
        el.animate(
          [
            { opacity: 0, transform: at(fromX, fromY, size * 0.6) },
            { opacity: 1, transform: at(fromX + (toX - fromX) * 0.15, fromY - H * 0.12, size), offset: 0.15 },
            { opacity: 1, transform: at(fromX + (toX - fromX) * 0.6, fromY - (fromY - toY) * 0.62, size * 0.85), offset: 0.7 },
            { opacity: 0, transform: at(toX, toY, size * 0.6) },
          ],
          { duration: 2600 + Math.random() * 900, delay: i * 140 + Math.random() * 200, easing: cssEase(ease.swell) },
        );
      });
      petals.forEach((el, i) => {
        const x = Math.random() * W;
        const sway = (Math.random() - 0.5) * 90;
        const spin = (Math.random() - 0.5) * 720;
        const fall = H * (0.55 + Math.random() * 0.4);
        const size = 0.7 + Math.random() * 0.8;
        el.animate(
          [
            { opacity: 0, transform: at(x, -30, size, 0) },
            { opacity: 1, transform: at(x + sway * 0.6, fall * 0.3, size, spin * 0.3), offset: 0.25 },
            { opacity: 1, transform: at(x - sway * 0.4, fall * 0.7, size, spin * 0.7), offset: 0.7 },
            { opacity: 0, transform: at(x + sway, fall, size, spin) },
          ],
          { duration: 3400 + Math.random() * 1800, delay: Math.random() * 1400 + (i % 4) * 120, easing: 'linear' },
        );
      });
      for (let i = 0; i < (lite ? 6 : 12); i++) spark(Math.random() * W, H * (0.3 + Math.random() * 0.45), 300 + i * 110, 90);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      touch(e.clientX, e.clientY);
    };
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    const off = cityBus.on((event) => {
      if (event.type === 'touch') touch(event.x, event.y);
      if (event.type === 'celebrate') celebrate();
    });

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      off();
      layer.replaceChildren();
    };
  }, [lite]);

  return <div ref={ref} className="lights" />;
}
