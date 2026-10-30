// Bible Quest sound effects, synthesized (no audio files, so they work offline).

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean) {
  muted = m;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.12) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = ctx.currentTime + start;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur);
}

const SOUNDS = {
  correct: () => {
    tone(660, 0, 0.12, "triangle");
    tone(990, 0.09, 0.18, "triangle");
  },
  wrong: () => {
    tone(180, 0, 0.25, "sawtooth", 0.08);
    tone(140, 0.12, 0.3, "sawtooth", 0.08);
  },
  tick: () => tone(1200, 0, 0.04, "square", 0.03),
  click: () => tone(500, 0, 0.05, "triangle", 0.06),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.25, "triangle")),
  levelup: () => [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.08, 0.3, "square", 0.06)),
};

export type SoundName = keyof typeof SOUNDS;

export function play(name: SoundName) {
  if (muted || typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    SOUNDS[name]();
  } catch {
    // Audio not available; the game is fine without it.
  }
}
