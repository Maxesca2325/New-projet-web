// Tout son Koze yo (vwa ak son efè) pase pa Web Audio, PA pa <audio>.
// Poukisa: sou iPhone (bug WebKit 321436), lè yon <audio> fin jwe, PWOCHEN mikwofòn nan
// (SpeechRecognition) mouri san okenn erè. Se sa ki te bloke dezyèm egzèsis pale a.
// Web Audio pa gen pwoblèm sa a.
// Bouton silans iPhone: navigator.audioSession.type = 'playback' (Safari 16.4+) pou son yo soti kanmenm.

const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
export const hasWebAudio = !!AC;
let ctx = null;

export function audioCtx() {
  if (!AC) return null;
  if (!ctx) {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* */ }
    ctx = new AC();
  }
  return ctx;
}

// iPhone: kontèks la kòmanse « suspended »; li dwe reveye nan yon klik moun nan.
function unlock() {
  const c = audioCtx();
  if (!c) return;
  if (c.state !== 'running') c.resume().catch(() => {});
  try { // ti son vid: sa debloke son an sou ansyen iPhone
    const s = c.createBufferSource();
    s.buffer = c.createBuffer(1, 1, 22050);
    s.connect(c.destination);
    s.start(0);
  } catch { /* */ }
}
if (typeof window !== 'undefined') {
  for (const ev of ['pointerdown', 'touchend', 'keydown']) window.addEventListener(ev, unlock, { capture: true, passive: true });
  // Lè moun nan tounen nan app la, iPhone ka te mete kontèks la an pòz.
  document.addEventListener('visibilitychange', () => { if (!document.hidden && ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); });
}

// Chaje + dekode yon fichye (mp3) yon sèl fwa.
const buffers = new Map();
export function loadBuffer(url) {
  const c = audioCtx();
  if (!c) return Promise.reject(new Error('no webaudio'));
  if (!buffers.has(url)) {
    const p = fetch(url)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      // Safari ansyen: decodeAudioData ak callback sèlman
      .then((ab) => new Promise((res, rej) => { const q = c.decodeAudioData(ab, res, rej); q?.then?.(res, rej); }));
    p.catch(() => buffers.delete(url));
    buffers.set(url, p);
  }
  return buffers.get(url);
}

// Jwe yon AudioBuffer. Retounen yon fonksyon pou kanpe l.
export function playBuffer(buf, volume = 1) {
  const c = audioCtx();
  if (!c || !buf) return () => {};
  if (c.state !== 'running') c.resume().catch(() => {});
  const src = c.createBufferSource();
  src.buffer = buf;
  let out = src;
  if (volume !== 1) { const g = c.createGain(); g.gain.value = volume; src.connect(g); out = g; }
  out.connect(c.destination);
  src.start(0);
  return () => { try { src.stop(); } catch { /* */ } };
}
