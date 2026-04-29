let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
  }
  return ctx;
}

/** Resume audio after a user gesture (Safari). */
export function primeAudio(): void {
  const c = getCtx();
  void c?.resume().catch(() => {});
}

function beep(freq: number, durMs: number, gain = 0.06) {
  const c = getCtx();
  if (!c || c.state !== "running") return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.value = freq;
  g.gain.value = gain;
  o.connect(g);
  g.connect(c.destination);
  const t0 = c.currentTime;
  o.start(t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000);
  o.stop(t0 + durMs / 1000 + 0.02);
}

export function sfxHit() {
  beep(440, 45, 0.05);
}

export function sfxDeath() {
  beep(180, 120, 0.07);
}

export function sfxWin() {
  beep(523, 70, 0.05);
  setTimeout(() => beep(784, 90, 0.05), 80);
}
