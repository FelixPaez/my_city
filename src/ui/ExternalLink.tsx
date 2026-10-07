import type { ReactNode } from 'react';
import { feedback } from '../design/feedback.ts';

type ExternalLinkProps = {
  href: string;
  children: ReactNode;
  /** Nombre completo para lectores de pantalla (ej. con el lugar al que lleva). */
  label?: string;
  className?: string;
  onFocus?: () => void;
};

/** Enlace a otra web (ej. el menú del lugar). Se abre en otra pestaña: la invitación sigue donde estaba. */
export function ExternalLink({ href, children, label, className = '', onFocus }: ExternalLinkProps) {
  return (
    <a
      className={`external-link ${className}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onFocus={onFocus}
      onClick={() => feedback('tick')}
    >
      <span>{children}</span>
      <svg aria-hidden="true" viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 4.5h-4v11h11v-4M11.5 3.5h5v5M16.5 3.5 9 11" />
      </svg>
    </a>
  );
}
