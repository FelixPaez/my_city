/**
 * Lacre vino con borde irregular y un corazón en relieve. Dibujado centrado en (150, 112)
 * para encajar en el sobre; `WaxSealMark` lo recorta como pieza suelta.
 */
export function WaxSeal() {
  return (
    <g>
      <path
        d="M150 88c5 0 7 3 11 4s7 4 8 8 4 6 3 11-2 8-5 11-5 6-10 7-8 3-13 1-9-1-12-5-6-6-6-11 0-8 3-11 4-7 8-9 6-6 13-6z"
        fill="#7e2333"
      />
      <circle cx="150" cy="112" r="15.5" fill="none" stroke="#5f1824" strokeWidth="1.6" opacity="0.7" />
      <circle cx="150" cy="112" r="17" fill="none" stroke="#a03a4c" strokeWidth="0.8" opacity="0.6" />
      <path
        d="M150 121c-8-5-11-10-8-13.6 2-2.4 5.6-1.4 8 1.6 2.4-3 6-4 8-1.6 3 3.6 0 8.6-8 13.6z"
        fill="#5f1824"
        opacity="0.85"
      />
      <path d="M143 103c3-3 7-3.6 10-3" stroke="#c45a6c" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.7" />
    </g>
  );
}

/** El lacre suelto (para marcar el plan elegido). */
export function WaxSealMark({ size = 56, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="124 86 52 52" width={size} height={size} className={`wax-seal ${className}`} aria-hidden="true">
      <WaxSeal />
    </svg>
  );
}
