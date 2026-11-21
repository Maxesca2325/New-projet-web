// Vwa anglè ak mikwofòn.
// 1. Odyo Kokoro (audio/*.mp3) lè fraz la genyen youn: vwa natirèl, mache san entènèt.
// 2. Sinon vwa telefòn nan (speechSynthesis).

const hasTTS = typeof window !== 'undefined' && 'speechSynthesis' in window;
import { hasWebAudio, loadBuffer, playBuffer } from './audio.js';
let audioIndex = new Map(); // tèks anglè -> url mp3
export let canSpeak = hasTTS;

export function setAudioIndex(map) {
  audioIndex = map;
  if (hasWebAudio && map.size) canSpeak = true;
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

// Vwa a jwe ak Web Audio (js/audio.js), pa ak <audio>: sou iPhone, yon <audio> ki fin jwe
// te touye pwochen mikwofòn nan. Vèsyon dousman an se yon fichye apa (audio/slow/), ki pa chanje ton vwa a.
const slowUrl = (url) => url.replace('audio/', 'audio/slow/');
let stopCurrent = () => {};
let ticket = 0;
export async function say(text, slow = false) {
  const url = audioIndex.get(text);
  if (!url || !hasWebAudio) return ttsSay(text, slow);
  const me = ++ticket;
  stopSpeaking();
  try {
    const buf = await loadBuffer(slow ? slowUrl(url) : url);
    if (me !== ticket) return; // yon lòt fraz te mande pandan n t ap chaje
    stopCurrent = playBuffer(buf);
  } catch {
    if (me === ticket) ttsSay(text, slow); // fichye a pa la
  }
}

export function stopSpeaking() {
  stopCurrent();
  stopCurrent = () => {};
  if (hasTTS) speechSynthesis.cancel();
}

// Chaje odyo yon leson davans (pou l mache san entènèt epi san tann).
export function preload(texts) {
  if (!hasWebAudio) return;
  for (const t of texts) {
    const url = audioIndex.get(t);
    if (url) { loadBuffer(url).catch(() => {}); loadBuffer(slowUrl(url)).catch(() => {}); }
  }
}

// Mòd son iPhone: nou mete « playback » yon sèl fwa (js/audio.js) epi nou PA chanje l pandan mikwofòn nan
// louvri: chanje mòd la ka dezaktive sesyon son an pandan rekonesans lan (bug WebKit 317741).
function audioMode() { /* pa chanje anyen */ }
export const restoreAudio = () => {};

const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
export const canListen = !!SR;

// Yon sèl sesyon mikwofòn alafwa.
// iPhone (Safari): mikwofòn nan louvri SÈLMAN si nou rele start() touswit nan menm klik la (san tann).
// Kidonk: si pa gen ansyen sesyon, nou kòmanse touswit. Si gen youn (ra), nou fèmen l anvan.
let active = null; // { r, ended: Promise }

// Ti jounal mikwofòn nan (2 dènye sesyon yo), pou n konprann sa k pase sou yon telefòn nou pa genyen.
const log = [];
let n = 0;
const note = (txt) => { const s = log[log.length - 1]; if (s) s.ev.push(`${txt}@${Math.round(performance.now() - s.t0)}`); };
// Safari iPhone: kèk vèsyon refize yon DEZYÈM objè SpeechRecognition, lòt refize reitilize menm nan.
// Nou kòmanse ak yon nouvo objè chak fwa; si mikwofòn nan pa louvri, pwochen klik la eseye lòt metòd la.
let reuse = false;
let shared = null;
const makeSR = () => (reuse ? (shared ??= new SR()) : new SR());
export const micReport = () => log.map((s) => `#${s.n} ${s.ev.join(' ')}`).join(' | ');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Safari (iPhone/iPad/Mac): abort() ka kase mikwofòn nan pou tout rès paj la. La, nou sèvi ak stop() sèlman,
// epi nou kite Safari fèmen sesyon an poukont li.
const SAFARI = typeof navigator !== 'undefined' && (/iP(hone|ad|od)/.test(navigator.userAgent) || (/Safari/.test(navigator.userAgent) && !/Chrom|Android|Edg/.test(navigator.userAgent)));
const shut = (r) => { try { if (SAFARI) r.stop(); else r.abort(); } catch { /* */ } };

async function closeActive() {
  const a = active;
  if (!a) return;
  note(SAFARI ? 'close:stop' : 'close:abort');
  shut(a.r);
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
      if (active === a) {
        // Li poko fèmen. Sou Safari nou PA fòse l: nou tann li an silans (jiska 3 s), san bloke leson an.
        note('slow-end');
        if (SAFARI) {
          Promise.race([a.ended, wait(3000)]).then(() => { if (active === a) active = null; if (!active) restoreAudio(); });
          return;
        }
        shut(a.r);
        active = null;
      }
    }
    restoreAudio();
  }

  function once() {
    log.push({ n: ++n, t0: performance.now(), ev: [] });
    if (log.length > 2) log.shift();
    note(`gest=${navigator.userActivation ? +navigator.userActivation.isActive : '?'}`);
    note(`as=${navigator.audioSession?.type || '-'}`);
    note(reuse ? 'mode=reuse' : 'mode=new');
    audioMode('play-and-record');
    r = makeSR();
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
        if (!started) { reuse = !reuse; shared = null; } // mikwofòn nan pa t louvri: chanje metòd pou pwochen klik la
        timers.forEach(clearTimeout);
        clearTimeout(quiet);
        try { r.stop(); } catch { /* */ } // fèmen sesyon an touswit (stop, pa abort)
        fn(v);
      };
      r.onstart = () => { started = true; note('start'); };
      r.onaudiostart = () => { started = true; note('audio'); };
      r.onspeechstart = () => note('speech');
      r.onresult = (e) => {
        started = true;
        const res = e.results[e.results.length - 1];
        note(res.isFinal ? 'final' : 'interim');
        if (res.isFinal) end(resolve, [...res].map((a) => a.transcript));
        else {
          interim = res[0].transcript;
          onInterim?.(interim);
          // Safari pa toujou bay yon rezilta final: si moun nan sispann pale 1,5 s, nou pran sa n tande a.
          clearTimeout(quiet);
          quiet = setTimeout(() => end(resolve, [interim]), 1500);
        }
      };
      r.onerror = (e) => (note(`err:${e.error}`), end(reject, e.error === 'aborted' && !started ? 'start' : (e.error || 'unknown')));
      r.onend = () => {
        note('end');
        markEnded();
        if (active === me) active = null;
        end(resolve, interim ? [interim] : []); // kèk telefòn fini san rezilta final
      };
      timers.push(setTimeout(() => end(interim ? resolve : reject, interim ? [interim] : 'no-speech'), maxMs));
      timers.push(setTimeout(() => { if (!started) { note('timeout'); end(reject, 'start'); } }, 4000)); // mikwofòn nan pa janm louvri
      try { r.start(); note('start()'); } catch (x) { note(`throw:${x?.name}`); markEnded(); end(reject, 'start'); }
    });
  }

  // Premye esè a kòmanse touswit (nan klik la). Sèlman si yon ansyen sesyon te toujou louvri, nou tann.
  if (active) log.length && note('busy');
  // Sou Safari, si ansyen sesyon an poko fèmen, nou pa ka kòmanse apre yon tann (li ta deyò klik la):
  // nou fèmen l epi nou mande moun nan peze ankò.
  const first = !active ? once()
    : SAFARI ? closeActive().then(() => Promise.reject('start'))
      : closeActive().then(() => (stopped ? Promise.reject('aborted') : once()));
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
