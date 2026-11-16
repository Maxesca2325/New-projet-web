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

const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
export const canListen = !!SR;

// Koute moun nan. Retounen { done: Promise<string[]>, stop() }.
// onInterim(tèks) montre sa navigatè a ap tande pandan moun nan ap pale.
// Erè yo (rejeksyon done): 'not-allowed', 'network', 'no-speech', 'audio-capture', 'timeout'…
export function listen({ onInterim, maxMs = 9000 } = {}) {
  stopSpeaking();
  const r = new SR();
  r.lang = 'en-US';
  r.interimResults = true;
  r.continuous = false;
  r.maxAlternatives = 5;
  let finished = false;
  let interim = '';
  let timer;
  const done = new Promise((resolve, reject) => {
    const end = (fn, v) => { if (!finished) { finished = true; clearTimeout(timer); fn(v); } };
    r.onresult = (e) => {
      const res = e.results[e.results.length - 1];
      if (res.isFinal) end(resolve, [...res].map((a) => a.transcript));
      else { interim = res[0].transcript; onInterim?.(interim); }
    };
    r.onerror = (e) => end(reject, e.error || 'unknown');
    // Kèk telefòn fini san rezilta final: nou pran sa nou te tande.
    r.onend = () => end(resolve, interim ? [interim] : []);
    timer = setTimeout(() => { try { r.stop(); } catch { /* */ } }, maxMs);
  });
  try { r.start(); } catch (e) { return { done: Promise.reject('start'), stop() {} }; }
  return { done, stop: () => { try { r.stop(); } catch { /* */ } } };
}
