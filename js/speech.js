// Vwa anglè (son telefòn nan) ak mikwofòn (rekonesans vwa nan navigatè a).
export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

let voice = null;
function pickVoice() {
  const vs = speechSynthesis.getVoices();
  voice =
    vs.find((v) => /en[-_]US/i.test(v.lang) && /google|samantha|natural|aria|jenny/i.test(v.name)) ||
    vs.find((v) => /en[-_]US/i.test(v.lang)) ||
    vs.find((v) => /^en/i.test(v.lang)) ||
    null;
}
if (canSpeak) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export function say(text, slow = false) {
  if (!canSpeak) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    if (voice) u.voice = voice;
    u.rate = slow ? 0.6 : 0.9;
    speechSynthesis.speak(u);
  } catch { /* */ }
}

const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
export const canListen = !!SR;

// Retounen yon lis sa navigatè a kwè moun nan di.
export function listen() {
  return new Promise((resolve, reject) => {
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
