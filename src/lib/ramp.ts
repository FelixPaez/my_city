/** De 0 a 1, con arranque y final suaves, mientras `v` va de `from` a `to` (smoothstep). */
export function ramp(v: number, from: number, to: number) {
  const x = Math.min(1, Math.max(0, (v - from) / (to - from)));
  return x * x * (3 - 2 * x);
}
