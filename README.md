# Te llegó una carta

Invitación web interactiva para una cita en Santa Clara: una paloma mensajera cruza los tejados al
atardecer, se posa en un balcón de hierro con una carta lacrada, ella la abre y al final elige el plan,
que se confirma por WhatsApp. Estática, ligera y pensada para el móvil (con diseño propio para escritorio).

Dirección pública: **https://felixpaez.github.io/mi_ciudad/**

El plan completo y las decisiones de diseño están en [docs/PLAN.md](docs/PLAN.md).
Es hermana de «Mensaje en una botella» (la versión del mar): misma base técnica, otra historia.

---

## 1. Editar el contenido

Todo lo que se lee y todos los datos del plan están en **`src/config.ts`**. No hace falta tocar nada más.

Mientras quede algún `TODO` en ese archivo, la web muestra una cinta de **BORRADOR** en una esquina.
Cuando desaparece, está lista para enviar.

| Sección | Qué es |
|---|---|
| `recipient.name` | Su nombre. Sale escrito a mano en el título y en el sobre: mejor corto |
| `sender.name` | Tu nombre, como quieres firmar la carta |
| `sender.whatsapp` | Tu número en formato internacional, solo dígitos: Cuba = `53` + 8 cifras → `'5351234567'` |
| `meta` | Título y frase de la vista previa del enlace en WhatsApp |
| `intro` | El saludo y la frase de la primera pantalla, y la pista (solo indica: la carta se abre tocando la paloma) |
| `letter.envelope` | Lo que va escrito a mano en el sobre (`'Para {nombre}'`) |
| `letter.pages` | La carta: de 2 a 4 páginas. `advance` es el gesto para pasar: `'tap'` (tocar), `'hold'` (mantener: lo que sigue está en tinta invisible y solo aparece mientras ella calienta el papel) o `'swipe'` (deslizar) |
| `question` | La pregunta y los textos de Sí / No |
| `noButton` | Las frases del No que huye, cuántos intentos (`maxAttempts`) y si después aparece «Mejor otro día» |
| `celebration`, `decline`, `farewell` | Textos tras el Sí, tras «Mejor otro día» y de la despedida final |
| `places` | Los planes (ver la sección 2) |
| `schedule` | Días y horarios (ver la sección 3) |
| `whatsapp.template` | El mensaje que ella te enviará al confirmar |
| `quips` | Los guiños según el día elegido (luna llena, fin de semana…) |
| `sound` | `enabled: false` quita el sonido del todo; `startMuted: true` empieza en silencio |
| `serviceWorker` | Caché para reabrir rápido y sin red (ver la sección 6) |

Huecos que se rellenan solos: `{nombre}` (su nombre) y `{remitente}` (el tuyo) en cualquier texto;
`{fecha}` en el título de la despedida; `{lugar}`, `{fecha}`, `{hora}` y `{nota}` en el mensaje de WhatsApp.

> Si te equivocas en algo (una hora mal escrita, un día de la semana inexistente…), al abrir `npm run dev`
> la consola del navegador lo avisa con el sitio exacto.

## 2. Los planes

Cada plan es una foto de las de antes. Funciona igual con 3, 6 u 8 (ahora son seis: D’Rolando, Pati,
la Bodeguita, Don Isaac, el lugar sorpresa y el pasadía). Copia un bloque dentro de `places` y cámbialo:

```ts
{
  id: 'drolando',                     // único, sin espacios ni tildes
  name: 'D’Rolando',                  // va escrito a mano bajo la foto y sale en el mensaje
  tagline: 'Una cena rica, sin mirar el reloj',
  description: 'Parrillada de cocina criolla y de tradición: …',
  illustration: 'restaurant',         // dibujo de respaldo: restaurant · icecream · bodeguita · mystery-city · pasadia
  image: 'places/drolando.webp',      // opcional: la foto (ver abajo)
  imageAlt: 'La terraza de D’Rolando…', // opcional: descripción de la foto
  imageFocus: 'center 30%',           // opcional: qué parte de la foto se ve
  link: { label: 'Ver el menú en El Yerro', url: 'https://elyerromenu.com/b/restaurante-d-rolando/seller/bazar-ym' },
  times: { from: '19:00', to: '23:30' }, // opcional: la franja en la que puedes (ver abajo)
},
```

- `link` pone un enlace al pie de la foto y en el resumen (D’Rolando, Pati y Don Isaac llevan su menú en
  El Yerro). Se abre en otra pestaña, así que la invitación sigue donde estaba; tocarlo no elige el plan.

- `times` es **la franja en la que puedes quedar**. Ella elige la hora exacta deslizando el sol por un arco,
  de 15 en 15 minutos (`schedule.stepMinutes`), y el cielo cambia a esa hora mientras lo mueve.
  - `{ from: '19:00', to: '23:30' }`: cualquier hora dentro (formato 24 h; medianoche es `'24:00'`).
  - `'sunset'`: la franja se calcula sola cada día con la **puesta de sol real** (de 90 a 15 minutos antes).
  - `['16:00', '17:30']`: solo esas horas, si prefieres horas fijas.
  - Sin `times`: la franja por defecto (`schedule.defaultWindow`, ahora del mediodía a medianoche).
- `days: ['sábado', 'domingo']` deja ese plan solo esos días (los demás aparecen tachados).
- `badge: 'Solo fines de semana'` pone una etiqueta pequeña sobre la foto.
- `mystery: true` deja la foto boca abajo hasta que ella la toca (así son «Un lugar sorpresa» y el pasadía).
- Para quitar un plan, borra su bloque entero.

### Fotos

- Horizontales **5:4**, unos **1000×800 px**, en formato **WebP** y de **menos de 150 KB**.
- Guárdalas en **`public/places/`** con un nombre sencillo, sin espacios ni tildes: `drolando.webp`.
- En el plan, `image: 'places/drolando.webp'` (sin `/` al principio).
- Para convertir y comprimir: [squoosh.app](https://squoosh.app) → WebP, calidad 70–80, ancho 1000.
- Las fotos tal como llegaron se guardan en `fotos-originales/` (en tu computadora; no se suben a GitHub).

Las fotos reales reciben un toque de foto antigua (viñeta y un punto de sepia) para que combinen con el resto.
Mientras un plan no tenga foto, se ve su ilustración, que además hace de fondo mientras la foto carga.

## 3. Días y horarios

En `schedule`:

| Campo | Qué hace |
|---|---|
| `daysAhead` | Cuántos días se ofrecen desde hoy (14 = dos semanas) |
| `excludedWeekdays` | Días de la semana que no puedes, ej. `['lunes', 'martes']` |
| `excludedDates` | Fechas concretas que no puedes, ej. `['2026-10-12']` |
| `minHoursAhead` | Si elige hoy, solo horas que empiecen dentro de al menos estas horas |
| `stepMinutes` | Cada cuántos minutos se puede elegir dentro de una franja (15 → 6:00, 6:15, 6:30…) |
| `defaultWindow` | Franja de los planes que no tienen la suya; hoy `{ from: '12:00', to: '24:00' }` |
| `sunsetMinutesBefore` | Para un plan con `times: 'sunset'`: desde y hasta cuántos minutos antes de la puesta |
| `dayparts` | A qué hora empiezan la mañana, la tarde y la noche (para decir «6:30 de la tarde») |

Al elegir un día, el arco propone la hora del medio de la franja; ella la mueve si quiere.
Las horas son siempre las de **Santa Clara** (`location.timeZone`), aunque alguien abra el enlace
con el móvil en otra zona horaria. El cambio de hora de Cuba está contemplado.

## 4. Probar en tu computadora

```bash
npm install        # solo la primera vez
npm run dev        # abre http://localhost:5173
npm run dev:movil  # igual, pero accesible desde tu móvil en la misma wifi
```

Parámetros para revisar cualquier pantalla (se añaden al final de la dirección):

| Parámetro | Qué hace |
|---|---|
| `?paso=inicio` | Empieza de cero (olvida el progreso guardado) |
| `?paso=carta` · `carta-2` · `carta-3` | Abre la carta en esa página |
| `?paso=pregunta` | Abre la pregunta |
| `?paso=plan` | Abre los planes |
| `?paso=fecha` · `resumen` · `final` | Fecha, resumen o despedida, con un plan de ejemplo |
| `?hora=manana` · `dia` · `atardecer` · `noche` | Fuerza la hora del cielo |

Se pueden combinar: `?paso=fecha&hora=noche`. También funcionan en la web publicada.

Si recargas a mitad de la experiencia, retoma donde estabas (se guarda solo en esa pestaña, sin cookies).
En Android, el gesto de «atrás» vuelve un paso dentro de la experiencia.

## 5. Publicar

Cada `git push` a `main` comprueba el código y publica la web en GitHub Pages en un par de minutos.

**Una sola vez:** en el repositorio, **Settings → Pages → Build and deployment → Source: GitHub Actions**.
(Hasta que lo actives, la primera publicación falla en el paso de Pages; después basta con relanzarla.)

```bash
git add -A
git commit -m "Textos y fotos reales"
git push
```

Antes de enviarle el enlace:

1. Que no quede ningún `TODO` en `src/config.ts` (la cinta de BORRADOR desaparece).
2. Recorre la experiencia entera en tu móvil, con `?paso=inicio` para empezar de cero.
3. Envíale la dirección **sin parámetros**: `https://felixpaez.github.io/mi_ciudad/`.
4. WhatsApp guarda la vista previa del enlace: compártelo primero contigo mismo para comprobar
   que se ve la paloma sobre los tejados al atardecer.

## 6. Rendimiento y datos móviles

- JS inicial ~134 KB gzip; las pantallas del plan (~13 KB) se descargan mientras ella lee la pregunta.
- Fuentes propias (sin Google Fonts), cero peticiones a otros dominios, sin cookies ni analítica
  (los menús de El Yerro solo se abren si ella toca su enlace).
- Las cuatro fotos pesan entre 39 y 50 KB cada una y solo se descargan al llegar a los planes.
- La ciudad es SVG dibujado en el móvil (0 KB de imágenes): cada capa se dibuja una vez y sus tres
  tonos (día, crepúsculo y noche) se funden solo con opacidad.
- El sonido se sintetiza en el móvil (0 KB de audio): brisa, pájaros, grillos, el arrullo de la paloma
  y las campanas. Con ahorro de datos, red 2G o un móvil modesto empieza en silencio; si va lento, el
  fondo se apaga solo.
- Funciona en Chrome 88+ y iOS 15+, pensando en móviles que no se actualizan.

### Service worker

Guarda lo que ella ya descargó para que, si vuelve a abrir el enlace (por ejemplo al regresar de
WhatsApp), cargue al instante y aguante cortes de conexión. No descarga nada por adelantado y la página
siempre se pide primero a la red, así que los cambios publicados se ven en cuanto se reabre.

**Quitar el service worker:** pon `serviceWorker: false` en `src/config.ts` y publica. Al abrir el enlace,
cada móvil que lo tenía lo desinstala y borra sus copias.

## 7. Comprobaciones

```bash
npm run check  # tipos + lint + tests (fechas, días del pasadía, zona horaria, máquina de estados…)
npm run build  # compila en dist/
npm run preview
```

El SEO sale bajo a propósito: la web lleva `noindex` para que no aparezca en buscadores.
