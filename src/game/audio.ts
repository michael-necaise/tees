let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let lastCarve = 0;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
  }
  return ctx;
}

export function unlockAudio(): void {
  const audio = context();
  if (audio && audio.state === "suspended") void audio.resume();
}

export function resumeAudio(): void {
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number, when: number, slideTo?: number) {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), when + dur);
  amp.gain.setValueAtTime(0.0001, when);
  amp.gain.exponentialRampToValueAtTime(gain, when + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(amp);
  amp.connect(master);
  osc.start(when);
  osc.stop(when + dur + 0.02);
  osc.onended = () => {
    osc.disconnect();
    amp.disconnect();
  };
}

export function playCarve(enabled: boolean): void {
  if (!enabled) return;
  const audio = context();
  if (!audio || !master || audio.state !== "running") return;
  const now = audio.currentTime;
  if (now - lastCarve < 0.07) return;
  lastCarve = now;
  tone(170 + Math.random() * 50, 0.07, "triangle", 0.18, now, 55);
}

export function playBuy(enabled: boolean): void {
  if (!enabled) return;
  const audio = context();
  if (!audio || audio.state !== "running") return;
  const now = audio.currentTime;
  tone(520, 0.06, "sine", 0.1, now);
  tone(780, 0.08, "sine", 0.08, now + 0.05);
}

export function playFlag(enabled: boolean): void {
  if (!enabled) return;
  const audio = context();
  if (!audio || audio.state !== "running") return;
  const now = audio.currentTime;
  [523, 659, 784, 1046].forEach((freq, i) => {
    tone(freq, 0.18, "triangle", 0.12, now + i * 0.07);
  });
}
