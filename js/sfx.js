// Son efè (SFX). Nou kalkile son yo an kòd (pa gen fichye pou telechaje, mache san
// entènèt), epi nou jwe yo ak Web Audio (js/audio.js), menm jan ak vwa a.
//   sfx('ok')   bon repons: de nòt k ap monte
//   sfx('bad')  move repons: de nòt dous k ap desann (pa agresif)
//   sfx('tap')  ti klik lè w chwazi yon repons oswa yon mo
//   sfx('done') fen leson: ti fanfa
import { audioCtx, playBuffer } from './audio.js';

const KEY = 'koze.sfx';
const SR = 22050;

export function sfxOn() {
  try { return localStorage.getItem(KEY) !== '0'; } catch { return true; }
}
export function setSfx(on) {
  try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* */ }
}

// [frekans (Hz), kòmansman (s), dire (s), volim, fòm]
const NOTES = {
  ok: [[784, 0, 0.13, 0.5, 'sine'], [1175, 0.1, 0.3, 0.5, 'sine'], [2350, 0.1, 0.2, 0.08, 'sine']],
  bad: [[311, 0, 0.17, 0.45, 'tri'], [233, 0.15, 0.32, 0.45, 'tri']],
  tap: [[900, 0, 0.05, 0.18, 'sine']],
  done: [[523, 0, 0.32, 0.38, 'sine'], [659, 0.11, 0.32, 0.38, 'sine'], [784, 0.22, 0.32, 0.38, 'sine'],
    [1047, 0.33, 0.4, 0.38, 'sine'], [1568, 0.46, 0.6, 0.18, 'sine']],
};

function render(notes) {
  const len = Math.ceil(SR * Math.max(...notes.map(([, at, d]) => at + d + 0.03)));
  const buf = new Float32Array(len);
  for (const [f, at, d, vol, shape] of notes) {
    const s0 = Math.floor(at * SR);
    const n = Math.floor(d * SR);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const ph = 2 * Math.PI * f * t;
      const w = shape === 'tri' ? (2 / Math.PI) * Math.asin(Math.sin(ph)) : Math.sin(ph);
      const env = Math.min(1, t / 0.012) * Math.exp((-5 * t) / d); // atak rapid, desant dous
      buf[s0 + i] += w * vol * env;
    }
  }
  return buf;
}

// Son yo jwe ak Web Audio (gade js/audio.js: <audio> te kase mikwofòn nan sou iPhone).
const cache = {};
function buffer(name) {
  const c = audioCtx();
  if (!c) return null;
  if (!cache[name]) {
    const data = render(NOTES[name]);
    const b = c.createBuffer(1, data.length, SR);
    b.getChannelData(0).set(data);
    cache[name] = b;
  }
  return cache[name];
}

export function sfx(name) {
  if (!sfxOn() || !NOTES[name]) return;
  try { playBuffer(buffer(name), name === 'tap' ? 0.6 : 1); } catch { /* son pa disponib: pa grav */ }
}
