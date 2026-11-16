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

// Retounen yon lis sa navigatè a kwè moun nan di.
export function listen() {
  return new Promise((resolve, reject) => {
    stopSpeaking();
    const r = new SR();
    r.lang = 'en-US';
    r.interimResults = false;
    r.maxAlternatives = 5;
    let finished = false;
    r.onresult = (e) => { finished = true; resolve([...e.results[0]].map((a) => a.transcript)); };
    r.onerror = (e) => { if (!finished) { finished = true; reject(e.error); } };
    r.onend = () => { if (!finished) { finished = true; resolve([]); } };
    r.start();
  });
}
