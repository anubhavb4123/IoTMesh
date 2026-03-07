// ─────────────────────────────────────────────
//  IoTMesh Sound Engine — Web Audio API
//  Usage: import { sounds } from "@/lib/sounds";
//         sounds.arm();
// ─────────────────────────────────────────────

const getCtx = (() => {
  let ctx: AudioContext | null = null;
  return () => {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };
})();

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.3,
  fadeOut = true
) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  if (fadeOut) gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, volume = 0.15) {
  const ctx = getCtx();
  const bufSize = Math.floor(ctx.sampleRate * duration);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start();
}

export const sounds = {

  // ── Ignition Page ──────────────────────────

  /** 🔓 System armed — ascending military beep */
  arm: () => {
    [440, 660, 880].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.12, "square", 0.25), i * 100)
    );
    setTimeout(() => playTone(1100, 0.3, "square", 0.3), 320);
  },

  /** 🔒 System disarmed — descending two-tone drop */
  disarm: () => {
    playTone(660, 0.15, "square", 0.2);
    setTimeout(() => playTone(330, 0.25, "square", 0.2), 160);
  },

  /** ❌ Wrong password — low error buzz */
  wrongPass: () => {
    [180, 160, 140].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.1, "sawtooth", 0.3), i * 100)
    );
  },

  /** 🖱 Hold tick — each second during 5s hold */
  holdTick: () => playTone(880, 0.05, "square", 0.15),

  /** 🚀 Hold complete — ignition trigger beep */
  holdComplete: () => {
    [1200, 1400, 1600].forEach((f, i) =>
      setTimeout(() => playTone(f, i === 2 ? 0.25 : 0.1, "square", 0.35 + i * 0.02), i * 120)
    );
  },

  /** 🔥 Ignition fire — deep rumble + noise burst */
  ignitionFire: () => {
    playNoise(0.4, 0.5);
    playTone(80, 0.6, "sawtooth", 0.5);
    setTimeout(() => playTone(60, 0.4, "sawtooth", 0.4), 200);
    setTimeout(() => playNoise(0.3, 0.3), 400);
  },

  /** ⏱ Countdown beep — higher pitch on last second */
  countdownBeep: (remaining: number) => {
    playTone(remaining === 1 ? 1400 : 900, 0.08, "square", remaining === 1 ? 0.4 : 0.25);
  },

  /** ✅ Sequence complete — success chime */
  complete: () => {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.15, "sine", 0.3), i * 100)
    );
  },

  // ── UI General ─────────────────────────────

  /** 📂 Modal / dialog open */
  modalOpen: () => playTone(600, 0.08, "sine", 0.15),

  /** ❎ Modal / dialog close */
  modalClose: () => playTone(400, 0.08, "sine", 0.12),

  /** 🔘 Toggle ON — device switched on */
  toggleOn: () => {
    playTone(440, 0.06, "sine", 0.2);
    setTimeout(() => playTone(660, 0.08, "sine", 0.2), 70);
  },

  /** 🔘 Toggle OFF — device switched off */
  toggleOff: () => {
    playTone(440, 0.06, "sine", 0.15);
    setTimeout(() => playTone(330, 0.08, "sine", 0.15), 70);
  },

  /** 🔔 Alert / notification received */
  alert: () => {
    playTone(880, 0.1, "sine", 0.25);
    setTimeout(() => playTone(880, 0.1, "sine", 0.25), 200);
  },

  /** ⚠️ Warning — sensor threshold exceeded */
  warning: () => {
    [500, 400, 500].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.1, "triangle", 0.2), i * 150)
    );
  },

  /** 🚨 Critical alert — gas / fire / door breach */
  critical: () => {
    [800, 600, 800, 600].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.12, "sawtooth", 0.35), i * 130)
    );
  },

  /** 🗑 Delete / remove action */
  delete: () => {
    playTone(300, 0.06, "square", 0.2);
    setTimeout(() => playTone(200, 0.15, "square", 0.2), 80);
  },

  /** ✔ Generic success */
  success: () => {
    playTone(523, 0.08, "sine", 0.25);
    setTimeout(() => playTone(784, 0.15, "sine", 0.25), 100);
  },

  /** ✖ Generic error */
  error: () => {
    playTone(200, 0.08, "sawtooth", 0.25);
    setTimeout(() => playTone(150, 0.2, "sawtooth", 0.25), 100);
  },

  /** 🖱 Soft UI click */
  click: () => playTone(600, 0.05, "sine", 0.1),

  /** 🔄 Page / data refresh */
  refresh: () => {
    playTone(440, 0.06, "sine", 0.15);
    setTimeout(() => playTone(550, 0.06, "sine", 0.15), 80);
    setTimeout(() => playTone(660, 0.1, "sine", 0.15), 160);
  },

  /** 🔐 Login success */
  loginSuccess: () => {
    [330, 440, 550, 660].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.1, "sine", 0.2), i * 80)
    );
  },

  /** 🔐 Logout */
  logout: () => {
    playTone(440, 0.1, "sine", 0.2);
    setTimeout(() => playTone(330, 0.15, "sine", 0.2), 100);
  },
};
