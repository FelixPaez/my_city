# Fotos de los planes

Aquí van las fotos reales de cada plan: `drolando.webp`, `pati.webp`, `bodeguita.webp` y `don-isaac.webp`.

- Formato **WebP**, horizontal **5:4** (unos 1000×800 px si la foto da para tanto) y **menos de 150 KB**.
- Nombre sencillo, sin espacios ni tildes: `drolando.webp`, `pati.webp`, `bodeguita.webp`…
- En `src/config.ts`, añade al plan `image: 'places/drolando.webp'` (sin "/" al principio).
- Opcional: `imageFocus: 'center 30%'` para elegir qué parte de la foto se ve.

Las fotos tal como llegaron están en `fotos-originales/`, en la raíz del proyecto (no se suben a GitHub).

Mientras un plan no tenga foto, se muestra su ilustración. Cuando la tenga, la ilustración
hará de fondo mientras la foto carga. Las fotos reciben un toque de foto antigua para combinar.
