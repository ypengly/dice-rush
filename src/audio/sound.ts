/**
 * Tiny synthesized sound effects (Web Audio) so the game ships with no audio files.
 * Everything is optional: if audio is unavailable or muted, calls are silent no-ops.
 */
let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

function getCtx(): AudioContext | null {
  if (!enabled) return null;
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx ??= new Ctor();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, gain = 0.15, endFreq?: number) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(start: number, dur: number, gain = 0.12) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + start;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1800;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(c.destination);
  src.start(t0);
}

export const sfx = {
  click: () => tone(520, 0, 0.06, 'triangle', 0.08),
  roll: () => {
    for (let i = 0; i < 9; i++) noiseBurst(i * 0.13 + Math.random() * 0.04, 0.06, 0.1);
    noiseBurst(1.25, 0.1, 0.16);
  },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.28, 'triangle', 0.14)),
  lose: () => tone(300, 0, 0.5, 'sawtooth', 0.09, 110),
  push: () => {
    tone(440, 0, 0.14, 'sine', 0.1);
    tone(440, 0.18, 0.14, 'sine', 0.1);
  },
  bonus: () => [660, 880, 1320].forEach((f, i) => tone(f, i * 0.07, 0.2, 'sine', 0.12)),
};
