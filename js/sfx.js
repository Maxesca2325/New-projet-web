// Son efè (SFX). Nou kalkile son yo an kòd (pa gen fichye pou telechaje, mache san
// entènèt), nou fè yo tounen yon ti fichye WAV nan memwa, epi nou jwe yo ak yon
// <audio>, menm jan ak vwa a. Konsa yo jwe sou iPhone menm lè bouton silans lan
// aktive (Web Audio te koupe pa bouton sa a), epi sou tout navigatè.
//   sfx('ok')   bon repons: de nòt k ap monte
//   sfx('bad')  move repons: de nòt dous k ap desann (pa agresif)
//   sfx('tap')  ti klik lè w chwazi yon repons oswa yon mo
//   sfx('done') fen leson: ti fanfa
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
  // WAV 16 bit mono
  const out = new DataView(new ArrayBuffer(44 + len * 2));
  const str = (o, x) => [...x].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); out.setUint32(4, 36 + len * 2, true); str(8, 'WAVEfmt ');
  out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true);
  out.setUint32(24, SR, true); out.setUint32(28, SR * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true);
  str(36, 'data'); out.setUint32(40, len * 2, true);
  for (let i = 0; i < len; i++) out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, buf[i])) * 32767, true);
  return URL.createObjectURL(new Blob([out], { type: 'audio/wav' }));
}

const urls = {};
const pool = {};
function player(name) {
  urls[name] ??= render(NOTES[name]);
  // 2 lektè pa son, pou de klik rapid pa koupe youn lòt
  pool[name] ??= [new Audio(urls[name]), new Audio(urls[name])];
  const [a, b] = pool[name];
  const p = a.paused || a.ended ? a : b;
  return p;
}

// iPhone (Safari 16.4+): mete son app la an mòd "playback" pou bouton silans lan pa koupe l.
try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* */ }

export function sfx(name) {
  if (!sfxOn() || !NOTES[name] || typeof Audio === 'undefined') return;
  try {
    const a = player(name);
    a.currentTime = 0;
    a.volume = name === 'tap' ? 0.6 : 1;
    a.play().catch(() => {});
  } catch { /* son pa disponib: pa grav */ }
}
