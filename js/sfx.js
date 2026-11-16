// Son efè (SFX) fèt an kòd ak Web Audio: pa gen fichye, mache san entènèt.
//   sfx('ok')   bon repons: de nòt k ap monte
//   sfx('bad')  move repons: de nòt dous k ap desann (pa agresif)
//   sfx('tap')  ti klik lè w chwazi yon repons oswa yon mo
//   sfx('done') fen leson: ti fanfa
const KEY = 'koze.sfx';
let ctx = null;

export function sfxOn() {
  try { return localStorage.getItem(KEY) !== '0'; } catch { return true; }
}
export function setSfx(on) {
  try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* */ }
}

function audio() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(c, freq, at, dur, { type = 'sine', gain = 0.16, to } = {}) {
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.03);
}

const SOUNDS = {
  ok: (c) => { tone(c, 784, 0, 0.13); tone(c, 1175, 0.1, 0.28); tone(c, 2350, 0.1, 0.2, { gain: 0.03 }); },
  bad: (c) => { tone(c, 311, 0, 0.17, { type: 'triangle', gain: 0.17 }); tone(c, 233, 0.15, 0.3, { type: 'triangle', gain: 0.17 }); },
  tap: (c) => { tone(c, 900, 0, 0.045, { gain: 0.05, to: 700 }); },
  done: (c) => {
    [523, 659, 784, 1047].forEach((f, i) => tone(c, f, i * 0.11, 0.32, { gain: 0.13 }));
    tone(c, 1568, 0.46, 0.6, { gain: 0.07 });
  },
};

export function sfx(name) {
  if (!sfxOn()) return;
  try {
    const c = audio();
    if (c) SOUNDS[name]?.(c);
  } catch { /* son pa disponib: pa grav */ }
}
