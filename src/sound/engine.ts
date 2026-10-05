/**
 * Motor de sonido: todo sintetizado con Web Audio, sin archivos que descargar.
 * Se carga aparte (import dinámico) y solo cuando el sonido está activado.
 *
 * Fondo: la tarde en Santa Clara. Brisa suave, pajaritos de mañana y de día,
 * grillos al caer la tarde y de noche.
 */
import type { Mood } from '../lib/mood.ts';
import type { AmbientParams, SoundEngine, SoundName } from './types.ts';

/** Brisa, pájaros y grillos según la hora. */
const TONE: Record<Mood, { cutoff: number; level: number; birds: number; crickets: number }> = {
  morning: { cutoff: 720, level: 0.75, birds: 1, crickets: 0 },
  day: { cutoff: 820, level: 0.85, birds: 0.6, crickets: 0 },
  sunset: { cutoff: 640, level: 0.75, birds: 0.15, crickets: 0.6 },
  night: { cutoff: 520, level: 0.6, birds: 0, crickets: 1 },
};

/** Constante de tiempo (s) de los cambios del fondo: lentos, como la tarde. */
const SMOOTH = 1.2;

const rand = (n: number) => Math.random() * n;

/** Ruido rosa (filtro de Paul Kellet) con fundido en el bucle para que no haga clic. */
function makeNoise(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const fade = 4096;
  const raw = new Float32Array(length + fade);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < raw.length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    raw[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  data.set(raw.subarray(0, length));
  // El principio se funde con la continuación natural del final: bucle sin costura.
  for (let i = 0; i < fade; i++) {
    const w = i / fade;
    data[i] = raw[i] * w + raw[length + i] * (1 - w);
  }
  return buffer;
}

type AmbientGraph = { apply(params: AmbientParams, at: number): void; stop(): void };

function createAmbient(ctx: AudioContext, noise: AudioBuffer, out: AudioNode): AmbientGraph {
  const t0 = ctx.currentTime;
  const stoppable: AudioScheduledSourceNode[] = [];
  let tone = TONE.day;

  // Brisa: ruido grave en estéreo con ráfagas lentas.
  const gains: GainNode[] = [];
  const filters: BiquadFilterNode[] = [];
  for (const [offset, pan] of [
    [0, -0.6],
    [1.9, 0.6],
  ]) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    src.start(t0, offset);
    stoppable.push(src);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    lp.Q.value = 0.4;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(lp);
    lp.connect(gain);
    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      gain.connect(panner);
      panner.connect(out);
    } else {
      gain.connect(out);
    }
    gains.push(gain);
    filters.push(lp);
  }
  const gustA = ctx.createOscillator();
  gustA.frequency.value = 0.071;
  const gustB = ctx.createOscillator();
  gustB.frequency.value = 0.043;
  gustA.start(t0);
  gustB.start(t0);
  stoppable.push(gustA, gustB);
  const gustDepth = ctx.createGain();
  gustA.connect(gustDepth);
  gustB.connect(gustDepth);
  gains.forEach((g) => gustDepth.connect(g.gain));

  /** Un trino corto: dos barridos agudos. */
  const chirp = (t: number, level: number) => {
    const base = 2600 + rand(900);
    [
      [base, base * 1.3, 0.06],
      [base * 1.25, base * 0.95, 0.08],
    ].forEach(([from, to, length], i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      const start = t + i * 0.09;
      osc.frequency.setValueAtTime(from, start);
      osc.frequency.exponentialRampToValueAtTime(to, start + length);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(level, start + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, start + length);
      osc.connect(g);
      g.connect(out);
      osc.start(start);
      osc.stop(start + length + 0.02);
    });
  };

  /** Un grillo: tres pulsos muy agudos y muy suaves. */
  const cricket = (t: number, level: number, pitch: number) => {
    for (let i = 0; i < 3; i++) {
      const start = t + i * 0.045;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = pitch;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(level, start + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.03);
      osc.connect(g);
      g.connect(out);
      osc.start(start);
      osc.stop(start + 0.04);
    }
  };

  // Pájaros y grillos se programan poco a poco (y solo si el contexto está sonando).
  const timer = window.setInterval(() => {
    if (ctx.state !== 'running') return;
    const t = ctx.currentTime + 0.05;
    if (tone.crickets > 0 && Math.random() < 0.55 * tone.crickets) cricket(t + rand(0.2), 0.012 * tone.crickets, 4300 + rand(500));
    if (tone.crickets > 0.8 && Math.random() < 0.3) cricket(t + 0.21 + rand(0.15), 0.008, 5100 + rand(300));
    if (tone.birds > 0 && Math.random() < 0.06 * tone.birds) chirp(t + rand(0.3), 0.018 * tone.birds);
  }, 420);

  return {
    apply(params, at) {
      tone = TONE[params.mood];
      const base = 0.13 * tone.level * (0.5 + 0.7 * params.breeze);
      gains.forEach((g) => g.gain.setTargetAtTime(base, at, SMOOTH));
      // La suma de las dos ráfagas va de −2 a 2: la profundidad no puede pasar de base/2.
      gustDepth.gain.setTargetAtTime(base * (0.2 + 0.2 * params.breeze), at, SMOOTH);
      filters.forEach((f) => f.frequency.setTargetAtTime(tone.cutoff + 300 * params.breeze, at, SMOOTH));
    },
    stop() {
      window.clearInterval(timer);
      stoppable.forEach((node) => {
        try {
          node.stop();
        } catch {
          // ya estaba parado
        }
      });
    },
  };
}

export function createEngine(ctx: AudioContext, volume: number): SoundEngine {
  const master = ctx.createGain();
  master.gain.value = 0;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -12;
  limiter.knee.value = 8;
  limiter.ratio.value = 6;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;
  master.connect(limiter);
  limiter.connect(ctx.destination);

  const sfx = ctx.createGain();
  sfx.connect(master);
  const ambientBus = ctx.createGain();
  ambientBus.connect(master);

  const noise = makeNoise(ctx, 4);
  let ambientGraph: AmbientGraph | null = createAmbient(ctx, noise, ambientBus);
  let params: AmbientParams = { mood: 'day', breeze: 0.5 };
  let firstStart = true;

  const env = (g: GainNode, t: number, attack: number, peak: number, decay: number) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  };

  const tone = (type: OscillatorType, from: number, to: number, t: number, length: number, peak: number, attack = 0.005) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + length);
    const g = ctx.createGain();
    env(g, t, attack, peak, length);
    osc.connect(g);
    g.connect(sfx);
    osc.start(t);
    osc.stop(t + attack + length + 0.05);
    return osc;
  };

  const hiss = (
    t: number,
    { attack = 0.004, length, peak, type, from, to, q = 0.8 }: {
      attack?: number;
      length: number;
      peak: number;
      type: BiquadFilterType;
      from: number;
      to?: number;
      q?: number;
    },
  ) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(from, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + attack + length);
    const g = ctx.createGain();
    env(g, t, attack, peak, length);
    src.connect(f);
    f.connect(g);
    g.connect(sfx);
    src.start(t, rand(3));
    src.stop(t + attack + length + 0.05);
  };

  /** Campana de iglesia: parciales inarmónicos que se apagan a distinto ritmo. */
  const bell = (t: number, f: number, peak: number) => {
    [
      [0.5, 1, 2.6],
      [1, 0.8, 2.1],
      [1.183, 0.45, 1.6],
      [1.506, 0.35, 1.2],
      [2, 0.3, 1],
      [2.514, 0.18, 0.7],
      [2.662, 0.14, 0.6],
    ].forEach(([ratio, level, decay]) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f * ratio;
      const g = ctx.createGain();
      env(g, t, 0.004, peak * level, decay);
      osc.connect(g);
      g.connect(sfx);
      osc.start(t);
      osc.stop(t + decay + 0.1);
    });
  };

  /** El arrullo de la paloma: notas graves con vibrato, «cu-curú». */
  const coo = (t: number, from: number, to: number, length: number, peak: number) => {
    const osc = tone('sine', from, to, t, length, peak, 0.05);
    const vibrato = ctx.createOscillator();
    vibrato.frequency.value = 7;
    const depth = ctx.createGain();
    depth.gain.value = 9;
    vibrato.connect(depth);
    depth.connect(osc.frequency);
    vibrato.start(t);
    vibrato.stop(t + length + 0.1);
  };

  const sounds: Record<SoundName, (t: number) => void> = {
    tick: (t) => tone('triangle', 1250, 940, t, 0.07, 0.05),
    nudge: (t) => {
      tone('sine', 520, 820, t, 0.1, 0.06);
      tone('triangle', 1100, 900, t + 0.06, 0.05, 0.03);
    },
    pop: (t) => {
      hiss(t, { length: 0.04, peak: 0.3, type: 'bandpass', from: 1500, q: 1.4 });
      tone('sine', 720, 170, t, 0.13, 0.26);
    },
    paper: (t) => {
      [0, 0.07, 0.16].forEach((d, i) =>
        hiss(t + d, { length: 0.09 + i * 0.03, peak: 0.12 - i * 0.02, type: 'bandpass', from: 3200 - i * 500, q: 0.7 }),
      );
    },
    seal: (t) => {
      hiss(t, { length: 0.018, peak: 0.35, type: 'highpass', from: 5200, q: 0.7 });
      tone('sine', 900, 300, t + 0.005, 0.05, 0.12);
    },
    flutter: (t) => {
      for (let i = 0; i < 7; i++) {
        hiss(t + i * 0.055, { attack: 0.01, length: 0.05, peak: 0.16 * (1 - i * 0.1), type: 'bandpass', from: 650 + rand(200), q: 1.1 });
      }
    },
    coo: (t) => {
      coo(t, 300, 284, 0.2, 0.09);
      coo(t + 0.26, 338, 292, 0.36, 0.11);
    },
    bell: (t) => {
      bell(t, 392, 0.06);
      bell(t + 0.62, 329.6, 0.055);
      bell(t + 1.24, 392, 0.04);
    },
    stamp: (t) => {
      tone('sine', 150, 52, t, 0.18, 0.42);
      hiss(t, { length: 0.06, peak: 0.2, type: 'lowpass', from: 800, q: 0.7 });
    },
    yes: (t) => {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        tone('sine', f, f * 0.999, t + i * 0.075, 1.5 - i * 0.15, 0.085 - i * 0.012),
      );
    },
    whoosh: (t) => hiss(t, { attack: 0.35, length: 0.6, peak: 0.16, type: 'bandpass', from: 320, to: 1500, q: 0.9 }),
    shutter: (t) => {
      for (let i = 0; i < 5; i++) hiss(t + i * 0.045, { length: 0.018, peak: 0.14, type: 'bandpass', from: 1300 + rand(300), q: 2.2 });
      tone('sine', 180, 90, t + 0.24, 0.1, 0.12);
    },
  };

  return {
    play(name) {
      if (ctx.state !== 'running') return;
      sounds[name](ctx.currentTime + 0.01);
    },
    setAmbient(next) {
      params = next;
      ambientGraph?.apply(next, ctx.currentTime);
    },
    setAmbientEnabled(enabled) {
      const t = ctx.currentTime;
      if (enabled && !ambientGraph) {
        ambientGraph = createAmbient(ctx, noise, ambientBus);
        ambientGraph.apply(params, t);
        ambientBus.gain.setTargetAtTime(1, t, 0.8);
      } else if (!enabled && ambientGraph) {
        const graph = ambientGraph;
        ambientGraph = null;
        ambientBus.gain.setTargetAtTime(0, t, 0.4);
        setTimeout(() => graph.stop(), 2500);
      }
    },
    setMuted(muted) {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      // La primera vez la tarde entra despacio, como quien sale al balcón.
      master.gain.setTargetAtTime(muted ? 0 : volume, t, muted ? 0.08 : firstStart ? 1.1 : 0.4);
      if (!muted) firstStart = false;
    },
    suspend() {
      void ctx.suspend().catch(() => undefined);
    },
    resume() {
      void ctx.resume().catch(() => undefined);
    },
  };
}
