// Synthesized sounds via Web Audio API — no external assets needed.

let ctx: AudioContext | null = null;
function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as
      | typeof AudioContext
      | undefined;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

/** Short "ding" for a new incoming message. */
export function playNotificationSound() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const tones = [880, 1320];
  tones.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = now + i * 0.12;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.25, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
    osc.connect(gain).connect(ac.destination);
    osc.start(start);
    osc.stop(start + 0.3);
  });
}

/** Looping ringtone for incoming calls. Returns a stop() handle. */
export function startRingtone(): () => void {
  const ac = getCtx();
  if (!ac) return () => {};
  let stopped = false;
  let timer: number | null = null;

  const playPattern = () => {
    if (stopped || !ac) return;
    const now = ac.currentTime;
    // Two short rings (classic phone style)
    for (let r = 0; r < 2; r++) {
      const base = now + r * 0.45;
      [800, 1000].forEach((freq, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const start = base + i * 0.18;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
        osc.connect(gain).connect(ac.destination);
        osc.start(start);
        osc.stop(start + 0.22);
      });
    }
    timer = window.setTimeout(playPattern, 2000);
  };

  playPattern();
  return () => {
    stopped = true;
    if (timer) window.clearTimeout(timer);
  };
}
