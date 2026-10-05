import type { ReactNode } from 'react';

type PhotoCardProps = {
  /** Foto o ilustración (área 5:4). */
  art: ReactNode;
  title: string;
  tagline?: string;
  description?: string;
  /** Etiqueta pequeña sobre la foto (ej. «Solo fines de semana»). */
  badge?: string;
  /** El lacre del plan elegido (o su hueco). */
  seal?: ReactNode;
  className?: string;
};

/**
 * Una foto de las de antes: borde blanco ondulado, la imagen con viñeta y, debajo,
 * el nombre escrito a mano, una frase y la descripción.
 */
export function PhotoCard({ art, title, tagline, description, badge, seal, className = '' }: PhotoCardProps) {
  return (
    <article className={`photo-card ${className}`}>
      <div className="photo-card__paper">
        <div className="photo-card__inner">
          <div className="photo-card__image">
            {art}
            {badge && <span className="photo-card__badge label-caps">{badge}</span>}
          </div>
          <div className="photo-card__caption">
            {seal && <div className="photo-card__seal">{seal}</div>}
            <h3 className="photo-card__title">{title}</h3>
            {tagline && <p className="photo-card__tagline">{tagline}</p>}
            {description && <p className="photo-card__description">{description}</p>}
          </div>
        </div>
      </div>
    </article>
  );
}
