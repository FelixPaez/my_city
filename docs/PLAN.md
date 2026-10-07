# Plan — «Te llegó una carta» (Santa Clara)

Invitación web, estática y mobile-first, para una cita en Santa Clara, Cuba. Tono cálido, nostálgico y
romántico, con humor ligero: una invitación a conocerse, no una declaración. Se abre desde un enlace de
WhatsApp. Es hermana de «Mensaje en una botella» (mismo flujo y misma base técnica; otra historia).

## La idea

Una **paloma mensajera** cruza los tejados de Santa Clara y se posa en un **balcón de hierro** con una
**carta lacrada** en el pico. Ella toca la paloma: el sobre vuela hasta ella, se rompe el lacre, se abre
la solapa y la carta se despliega. Al final elige el plan, el día y la hora; la respuesta vuelve al sobre,
se sella y la paloma se la lleva volando. De fondo, la ciudad con el cielo real de Santa Clara.

Decisiones del autor (octubre de 2026): idea «Carta por paloma», paleta «atardecer colonial» y el pasadía
solo los sábados y domingos. Después: la intro saluda («Holaaa Marcia, hay una paloma por ahí con una
carta…») y su pista solo indica (la carta se abre tocando la paloma); la tinta invisible no se ve en
absoluto hasta que ella aprieta, y aparece a medida que calienta el papel; Don Isaac ocupa el sitio del
lugar sorpresa (esa tarjeta se quitó) y los lugares con menú en El Yerro llevan su enlace.

## Flujo (el mismo de la botella)

```
intro (paloma en el balcón) ─toca─▶ opening (sobre → lacre → solapa → carta) ─▶ letter[0..n] ─▶ question
question ─No ×N → «Mejor otro día»─▶ declined (la carta vuelve al sobre y la paloma se va)
question ─Sí─▶ celebration (campanas, palomas, buganvillas) ─▶ plan ⇄ datetime ⇄ summary ─WhatsApp─▶ farewell
```

## Sistema de diseño

**Paleta «atardecer colonial»** (`src/styles/theme.css`): `cream #FBF6EC`, `paper #F6EFE2`, `linen #EFE6D6`,
`haze #E9E2EE`, `blush #F3DCD3`, `peach #F2B48F`, `lavender #B7A8CF`, `rose #D98A8F`, `dusk #66558A`,
`indigo #2A2F4F` (la tinta), `night #1B2140`, `ink-soft #5B566F`, `sand #F2E8D8`, `lamp #FFD58A`,
`terracotta #B4553A`, `ochre #E2B866`, `wine #7E2333` (el lacre).

Contrastes WCAG verificados (todos ≥ 4,5:1): indigo sobre cream 12,1 · ink-soft sobre cream 6,5 ·
dusk sobre cream 6,0 · wine sobre cream 9,0 · cream sobre indigo 12,1 · indigo sobre el cielo de día 5,8 ·
cream sobre el cielo del atardecer 10,8 · marrón sobre la cartulina del reverso 5,8.
De mañana y de día el texto sobre el cielo es índigo; al atardecer y de noche, crema.

**Tipografía** (autoalojada, ~107 KB): Cormorant Garamond 600 (títulos y pregunta) y 500 cursiva (el texto
de la carta), Parisienne (lo escrito a mano: su nombre, el saludo, la firma y los nombres de los planes) y
DM Sans (interfaz). Nunca menos de 16 px en campos (iOS no hace zoom).

**Movimiento**: los mismos tokens que la botella (`src/design/motion.ts`). Solo se anima `transform` y
`opacity`; los cambios de hora se resuelven con capas que se funden.

## Arquitectura

- **La ciudad** (`src/city/`): cielo (cuatro horas que se funden, sol y luna reales, nubes, bandada),
  edificios del fondo (casas coloniales, el hotel alto, el campanario, tanques de agua y antenas), el
  Parque Vidal (glorieta con bombillos, palmas reales que se mecen, farolas, flamboyán) y el balcón de
  hierro con buganvillas. Cada capa se dibuja una vez en `<defs>` y se repite en tres tonos (día,
  crepúsculo y noche) con variables CSS; el tono de día queda siempre debajo para que no se vea el cielo
  a través durante el fundido. Las farolas y ventanas se encienden al caer la tarde.
- **La paloma** (`src/actors/`): personaje persistente. Poses: posada en el balcón · suelta la carta ·
  espera sobre una farola · vuelve, recoge la respuesta y se va. Posición estable por CSS y vuelos en
  curva solo con transform (FLIP). Coordina con la carta por `doveBus` (pico, llegada, entrega, ida).
- **La carta** (`src/screens/letter/`): sobre con lacre que se rompe en dos mitades y solapa que se abre;
  la carta se despliega con un wipe de doble transform y la sombra del doblez, y conserva los dobleces
  marcados. Gestos: tocar, mantener y deslizar. Al mantener, una vela calienta el papel por detrás: la
  luz lo atraviesa y tiembla, el papel se tuesta, y lo escrito en tinta invisible aparece palabra a
  palabra del centro hacia afuera, primero dorado y luego sepia; si ella suelta, se enfría y se esconde.
- **Transiciones**: una persiana colonial (`ShutterStage`) cuyas tablillas giran entre pantallas.
- **Progreso**: una fila de farolas que se encienden; una palomita salta de una a otra y al final se
  ilumina la glorieta.
- **Planes**: D’Rolando, Heladería Pati, La Bodeguita del Medio, Don Isaac y un pasadía sorpresa. Fotos
  de las de antes (borde ondulado con máscara CSS, viñeta), nombre escrito a mano y un lacre que cae al
  elegir. El pasadía está boca abajo (cartulina con una «?» a mano) hasta que ella lo voltea. Al pie de la
  foto, el enlace a su menú en El Yerro (fuera de la opción elegible: tocarlo no elige el plan).
- **Fecha y hora**: hojitas de almanaque con la luna de cada noche y el arco del sol sobre la silueta de
  la ciudad (de 15 en 15 minutos; el cielo cambia mientras se arrastra).
- **Resumen**: la foto con su lacre y un matasellos «CORREO DE PALOMAS · SANTA CLARA, CUBA».
- **Sonido** (sintetizado): brisa, pájaros de día, grillos de noche, aleteo, arrullo, papel, lacre,
  campanas del sí y el clac de las persianas.

## Cuba: compatibilidad y datos

- El build apunta a Chrome 88+, Safari/iOS 15+, Firefox 90+; las capas `@layer` de Tailwind se traducen
  a especificidad normal para los navegadores viejos.
- Cero peticiones a otros dominios. Presupuesto: JS inicial < 150 KB gzip, fuentes ≤ 120 KB.
- Todas las horas se calculan en `America/Havana`, no en la zona del dispositivo (los tests corren con
  el reloj en Tokio a propósito). El cambio de hora de noviembre está cubierto.
- Service worker propio y prudente (HTML primero de la red, sin precarga; si la caché falla, todo sigue
  por la red; `serviceWorker: false` lo desinstala).

## Estado

| Parte | Estado |
|---|---|
| Base técnica (copiada de la botella y adaptada) | ✅ |
| Ciudad, paloma, sobre y carta, persianas, farolas, planes, almanaque, resumen, despedida | ✅ |
| Contenido real: nombres, número, la carta, fotos y enlaces de cada lugar | ✅ |
| Franjas horarias propias de cada lugar (hoy todos de 12 a 12) | ⏳ si el autor las quiere |
| Activar GitHub Pages en el repositorio (una sola vez) | ⏳ pendiente del autor |
