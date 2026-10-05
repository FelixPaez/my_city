import type { Config } from './config.types.ts';

/**
 * ✏️  CONTENIDO EDITABLE
 *
 * Todo lo que ella va a leer y todos los datos del plan viven aquí.
 * Puedes cambiar cualquier texto sin tocar los componentes.
 *
 * Los valores marcados con "TODO" son provisionales: mientras quede alguno,
 * la web muestra una cinta de BORRADOR para que no se te escape enviarla así.
 *
 * Huecos que se rellenan solos en los textos:
 *   {nombre}     → recipient.name
 *   {remitente}  → sender.name
 */
export const config: Config = {
  recipient: {
    name: 'TODO', // TODO: su nombre (corto: va escrito a mano en el sobre)
  },

  sender: {
    name: 'TODO', // TODO: tu nombre, tal como quieres firmar la carta
    // Tu WhatsApp en formato internacional, solo dígitos y sin "+".
    // Cuba: 53 + tu número de 8 cifras → '5351234567'.
    whatsapp: 'TODO', // TODO: tu número
  },

  // Vista previa del enlace en WhatsApp: genera curiosidad sin revelar la pregunta.
  meta: {
    title: 'Te llegó una carta',
    description: 'Una paloma la trajo desde el parque. Ábrela cuando tengas un ratico tranquilo.',
  },

  // Se usa para la luna, la hora real del cielo y los horarios.
  // Las horas son siempre las de esta zona, aunque el móvil esté en otra.
  location: { name: 'Santa Clara, Cuba', latitude: 22.41, longitude: -79.96, timeZone: 'America/Havana' },

  // '12h' → «6:30 de la tarde» · '24h' → «18:30»
  timeFormat: '12h',

  intro: {
    title: 'Para {nombre}',
    subtitle: 'Te llegó carta. La trajo una paloma, imagínate.',
    hint: {
      touch: 'Toca la paloma',
      mouse: 'Haz clic en la paloma',
    },
  },

  letter: {
    greeting: '¡Hola, {nombre}!',
    // TODO: borrador sugerido; reescríbelo con tus palabras (2 a 4 páginas).
    // `advance` es el gesto con el que se pasa a lo siguiente: 'tap' (tocar),
    // 'hold' (mantener presionado: lo que sigue está en tinta invisible) o 'swipe' (deslizar).
    pages: [
      {
        text: 'Dicen que ya nadie escribe cartas, así que te mandé esta con una paloma. Un poco dramático, lo sé.',
        advance: 'tap',
      },
      {
        text: 'Me encanta hablar contigo, y pensé que sería todavía mejor en persona, con Santa Clara de fondo.',
        advance: 'hold',
      },
      {
        text: 'Así que, antes de que la paloma se canse de esperar, te tengo una pregunta…',
        advance: 'swipe',
      },
    ],
    hints: {
      tap: { touch: 'Toca para seguir', mouse: 'Haz clic para seguir' },
      hold: {
        touch: 'Deja el dedo un momento para calentar el papel',
        mouse: 'Mantén el clic un momento para calentar el papel',
      },
      swipe: { touch: 'Desliza hacia arriba', mouse: 'Arrastra hacia arriba o usa la rueda' },
    },
    inkNote: 'Lo que sigue lo escribí con tinta invisible.',
    signature: '— {remitente}',
  },

  question: {
    text: '¿Te animas a salir conmigo un día de estos?',
    yes: 'Sí',
    no: 'No',
  },

  noButton: {
    // Una frase por intento; si se acaban, vuelve a empezar.
    phrases: ['¿Segura?', 'Piénsalo bien…', 'La paloma se puso triste', 'Casi lo agarras'],
    // Intentos antes de que el "No" se convierta en una salida amable.
    maxAttempts: 4,
    // true = tras esos intentos aparece "Mejor otro día" y se puede pulsar.
    allowGracefulDecline: true,
    declineLabel: 'Mejor otro día',
  },

  celebration: {
    title: '¡Hasta las campanas se enteraron!',
    subtitle: 'Ahora lo mejor: escoger el plan.',
  },

  decline: {
    title: 'Gracias por leerla, de verdad',
    message: 'Todo bien, sin drama. La paloma vuelve al parque, y si algún día cambia el viento, ya sabes dónde encontrarme.',
  },

  // Cada lugar es una foto de las de antes. Funciona igual con 3, 5 u 8.
  // `times`: la franja en la que se puede quedar; ella elige la hora exacta deslizando el sol.
  // Sin `times`, de 12 del mediodía a 12 de la noche (`schedule.defaultWindow`).
  // Fotos: WebP de 1000×800 px y menos de 150 KB en `public/places/`.
  places: [
    {
      id: 'drolando',
      name: 'D’Rolando',
      tagline: 'Una cena rica, sin mirar el reloj',
      description: 'Mesa para dos, buena comida y toda la conversación que haga falta.',
      illustration: 'restaurant',
    },
    {
      id: 'pati',
      name: 'Heladería Pati',
      tagline: 'Primero el helado, después la conversación (o al revés)',
      description: 'Un helado bien frío, un banquito cerca y la tarde por delante.',
      illustration: 'icecream',
    },
    {
      id: 'bodeguita',
      name: 'La Bodeguita del Medio',
      tagline: 'Un traguito, algo de picar y buena compañía',
      description: 'De esos lugares con alma, perfecto para brindar porque dijiste que sí.',
      illustration: 'bodeguita',
    },
    {
      id: 'sorpresa',
      name: 'Un lugar sorpresa',
      tagline: 'Tú escoges el día; el lugar lo pongo yo',
      description: 'Queda en Santa Clara y te va a gustar. No pregunto más: confía.',
      illustration: 'mystery-city',
      mystery: true,
    },
    {
      id: 'pasadia',
      name: 'Pasadía sorpresa',
      tagline: 'Un día entero para desconectar',
      description: 'Sol, agua y cero apuro. Te digo a dónde vamos cuando llegue el día.',
      illustration: 'pasadia',
      mystery: true,
      days: ['sábado', 'domingo'],
      badge: 'Solo fines de semana',
      times: { from: '08:00', to: '11:00' }, // la hora de salida
    },
  ],

  schedule: {
    daysAhead: 14,
    excludedWeekdays: [], // ej. ['lunes', 'martes']
    excludedDates: [], // ej. ['2026-10-12']
    minHoursAhead: 2,
    stepMinutes: 15, // ella elige la hora de 15 en 15 minutos
    defaultWindow: { from: '12:00', to: '24:00' }, // del mediodía a medianoche, para los lugares sin `times`
    sunsetMinutesBefore: { from: 90, to: 15 }, // para un plan con times: 'sunset'
    dayparts: { morning: '05:00', afternoon: '12:00', night: '19:00' },
  },

  note: {
    enabled: true,
    maxLength: 140,
    label: 'Una nota (si quieres)',
    placeholder: '¿Algo que deba saber? Antojos, alergias, chistes malos…',
  },

  // Textos de las pantallas del plan (títulos y botones).
  plan: {
    label: 'El plan',
    title: '¿Qué plan te gusta más?',
    next: 'Escoger el día',
    save: 'Guardar',
    cancel: 'Volver al resumen',
    flipHint: 'Toca para descubrirlo',
    chosen: 'Elegido',
  },

  when: {
    label: 'La fecha',
    title: '¿Qué día te cuadra?',
    timeTitle: '¿A qué hora?',
    dragHint: { touch: 'Desliza el sol por el arco para cambiar la hora', mouse: 'Arrastra el sol por el arco o usa las flechas' },
    sunsetAt: 'El sol se pone a las {hora}',
    pickDayFirst: 'Primero escoge un día.',
    today: 'Hoy',
    tomorrow: 'Mañana',
    back: 'Volver',
    next: 'Ver el resumen',
    save: 'Guardar',
  },

  summary: {
    label: 'La respuesta',
    title: 'Así quedó nuestra cita',
    planLabel: 'Plan',
    dateLabel: 'Día',
    timeLabel: 'Hora',
    noteLabel: 'Nota',
    noNote: 'Sin nota',
    edit: 'Cambiar',
    confirm: 'Mandar por WhatsApp',
    copy: '¿No se abrió WhatsApp? Copiar el mensaje',
    copied: 'Copiado. Pégalo en nuestro chat.',
    back: 'Volver',
  },

  whatsapp: {
    // El mensaje que ella te enviará. Las líneas con {nota} desaparecen si no escribe nada.
    template: [
      '¡Me llegó la paloma! 🕊️ Y la respuesta es sí.',
      '',
      '📍 {lugar}',
      '📅 {fecha}',
      '🕰️ {hora}',
      '📝 {nota}',
      '',
      '¡Nos vemos!',
    ],
  },

  farewell: {
    title: 'Nos vemos {fecha}',
    message: 'La paloma ya va de vuelta. Lo demás lo hablamos en persona.',
  },

  // Guiños que aparecen según lo que elija.
  quips: {
    fullMoon: 'Luna llena sobre el parque. Tienes buen ojo.',
    newMoon: 'Luna nueva: más estrellas para contar.',
    weekend: 'Fin de semana: cero apuro.',
    today: '¿Hoy mismo? Me gusta tu estilo.',
  },

  sound: {
    enabled: true, // false = la web no carga nada de sonido
    startMuted: false, // true = empieza en silencio y ella decide
    volume: 0.7,
  },

  // Guarda lo ya descargado para reabrir al instante y aguantar cortes de conexión.
  // false = se desinstala de los móviles que ya lo tenían (al abrir de nuevo el enlace).
  serviceWorker: true,

  // Si se corta la conexión justo al cargar los planes.
  connection: {
    lost: 'Se fue la conexión un momentico.',
    retry: 'Intentar de nuevo',
  },
};
