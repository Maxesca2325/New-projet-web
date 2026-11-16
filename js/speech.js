// Vwa anglè ak mikwofòn.
// 1. Odyo Kokoro (audio/*.mp3) lè fraz la genyen youn: vwa natirèl, mache san entènèt.
// 2. Sinon vwa telefòn nan (speechSynthesis).

const hasTTS = typeof window !== 'undefined' && 'speechSynthesis' in window;
const hasAudio = typeof Audio !== 'undefined';
let audioIndex = new Map(); // tèks anglè -> url mp3
export let canSpeak = hasTTS;

export function setAudioIndex(map) {
  audioIndex = map;
  if (hasAudio && map.size) canSpeak = true;
}

let voice = null;
function pickVoice() {
  const vs = speechSynthesis.getVoices();
  voice =
    vs.find((v) => /en[-_]US/i.test(v.lang) && /google|samantha|natural|aria|jenny/i.test(v.name)) ||
    vs.find((v) => /en[-_]US/i.test(v.lang)) ||
    vs.find((v) => /^en/i.test(v.lang)) ||
    null;
}
if (hasTTS) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

function ttsSay(text, slow) {
  if (!hasTTS) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    if (voice) u.voice = voice;
    u.rate = slow ? 0.6 : 0.9;
    speechSynthesis.speak(u);
  } catch { /* */ }
}

// Nou chaje mp3 a an "blob": sa evite pwoblèm Safari ak fichye ki nan cache san entènèt.
const blobs = new Map();
async function blobUrl(url) {
  if (!blobs.has(url)) {
    blobs.set(url, fetch(url).then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.blob();
    }).then((b) => URL.createObjectURL(b)).catch((e) => { blobs.delete(url); throw e; }));
  }
  return blobs.get(url);
}

let current = null;
export async function say(text, slow = false) {
  const url = hasAudio && audioIndex.get(text);
  if (!url) return ttsSay(text, slow);
  try {
    current?.pause();
    if (hasTTS) speechSynthesis.cancel();
    const a = new Audio(await blobUrl(url));
    a.playbackRate = slow ? 0.7 : 1;
    a.preservesPitch = true;
    current = a;
    await a.play();
  } catch {
    ttsSay(text, slow); // fichye a pa la oswa navigatè a refize jwe l
  }
}

export function stopSpeaking() {
  current?.pause();
  if (hasTTS) speechSynthesis.cancel();
}

// Chaje odyo yon leson davans (pou l mache san entènèt epi san tann).
export function preload(texts) {
  for (const t of texts) {
    const url = audioIndex.get(t);
    if (url) blobUrl(url).catch(() => {});
  }
}

// Mòd son iPhone (Safari 16.4+): « playback » pou vwa a ak son efè yo (bouton silans pa koupe yo),
// « play-and-record » pandan mikwofòn nan louvri. Nou pa janm kite « playback » pandan n ap koute:
// iPhone refize louvri mikwofòn nan nan mòd sa a.
function audioMode(type) {
  try { if (navigator.audioSession && navigator.audioSession.type !== type) navigator.audioSession.type = type; } catch { /* */ }
}
export const restoreAudio = () => audioMode('playback');

const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
export const canListen = !!SR;

// Yon sèl sesyon mikwofòn alafwa.
// iPhone (Safari): mikwofòn nan louvri SÈLMAN si nou rele start() touswit nan menm klik la (san tann).
// Kidonk: si pa gen ansyen sesyon, nou kòmanse touswit. Si gen youn (ra), nou fèmen l anvan.
let active = null; // { r, ended: Promise }
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function closeActive() {
  const a = active;
  if (!a) return;
  try { a.r.abort(); } catch { /* */ }
  await Promise.race([a.ended, wait(800)]);
  if (active === a) active = null;
}

export async function stopListening() {
  if (!active) return;
  await closeActive();
  restoreAudio();
}

// Koute moun nan. Retounen { done: Promise<string[]>, stop() }.
// onInterim(tèks) montre sa navigatè a ap tande pandan moun nan ap pale.
// Erè yo (rejeksyon done): 'not-allowed', 'network', 'no-speech', 'audio-capture', 'start'…
// 'start' = mikwofòn nan pa t louvri: moun nan peze l ankò (yon nouvo klik, sa iPhone bezwen).
export function listen({ onInterim, maxMs = 9000 } = {}) {
  let r = null;
  let stopped = false;
  stopSpeaking();

  async function release() {
    const a = active;
    if (a) {
      await Promise.race([a.ended, wait(700)]);
      if (active === a) { try { a.r.abort(); } catch { /* */ } active = null; } // li pa t fèmen: fòse l
    }
    restoreAudio();
  }

  function once() {
    audioMode('play-and-record');
    r = new SR();
    r.lang = 'en-US';
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 5;
    let markEnded;
    const me = { r, ended: new Promise((res) => { markEnded = res; }) };
    active = me;
    return new Promise((resolve, reject) => {
      let finished = false;
      let started = false;
      let interim = '';
      let quiet = null;
      const timers = [];
      const end = (fn, v) => {
        if (finished) return;
        finished = true;
        timers.forEach(clearTimeout);
        clearTimeout(quiet);
        try { r.stop(); } catch { /* */ } // fèmen sesyon an touswit
        fn(v);
      };
      r.onstart = () => { started = true; };
      r.onaudiostart = () => { started = true; };
      r.onresult = (e) => {
        started = true;
        const res = e.results[e.results.length - 1];
        if (res.isFinal) end(resolve, [...res].map((a) => a.transcript));
        else {
          interim = res[0].transcript;
          onInterim?.(interim);
          // Safari pa toujou bay yon rezilta final: si moun nan sispann pale 1,5 s, nou pran sa n tande a.
          clearTimeout(quiet);
          quiet = setTimeout(() => end(resolve, [interim]), 1500);
        }
      };
      r.onerror = (e) => end(reject, e.error === 'aborted' && !started ? 'start' : (e.error || 'unknown'));
      r.onend = () => {
        markEnded();
        if (active === me) active = null;
        end(resolve, interim ? [interim] : []); // kèk telefòn fini san rezilta final
      };
      timers.push(setTimeout(() => end(interim ? resolve : reject, interim ? [interim] : 'no-speech'), maxMs));
      timers.push(setTimeout(() => { if (!started) end(reject, 'start'); }, 4000)); // mikwofòn nan pa janm louvri
      try { r.start(); } catch { markEnded(); end(reject, 'start'); }
    });
  }

  // Premye esè a kòmanse touswit (nan klik la). Sèlman si yon ansyen sesyon te toujou louvri, nou tann.
  const first = active ? closeActive().then(() => (stopped ? Promise.reject('aborted') : once())) : once();
  const done = first
    .then(async (alts) => { await release(); return alts; })
    .catch(async (e) => { await release(); throw e; });

  return { done, stop: () => { stopped = true; try { r?.stop(); } catch { /* */ } } };
}

// Si moun nan kite app la (lòt app, ekran etenn), fèmen mikwofòn nan touswit.
if (typeof document !== 'undefined') {
  const off = () => { if (active) stopListening(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) off(); });
  window.addEventListener('pagehide', off);
}
