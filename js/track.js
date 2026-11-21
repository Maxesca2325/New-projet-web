// Mezi anonim: kisa moun yo fè nan Koze (louvri app la, kòmanse/fini/kite yon leson, mikwo, rapèl…),
// pou nou konnen kote moun yo bloke epi si yo tounen. Pa gen imèl, non, kont ni tèks moun nan ekri.
// - Yon nimewo o aza pa telefòn (koze.anon), pa lye ak kont lan.
// - Evènman yo rete nan yon ti keu sou telefòn nan, epi yo pati an pakèt lè gen entènèt (mache san entènèt).
// - Moun nan ka etenn sa nan Pwofil (koze.track = '0').
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const Q = 'koze.events';
const MAX = 300;
const APP = 'v1.1';
const ready = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, v); } catch { /* */ } };

export const trackOn = () => get('koze.track') !== '0';
export function setTrack(on) {
  set('koze.track', on ? '1' : '0');
  if (!on) set(Q, '[]'); // efase sa ki t ap tann
}

function anonId() {
  let id = get('koze.anon');
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
    set('koze.anon', id);
  }
  return id;
}

const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
const platform = /android/i.test(ua) ? 'android' : /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'ios' : /Windows|Macintosh|Linux|CrOS/.test(ua) ? 'desktop' : 'other';
const standalone = typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true);

const load = () => { try { return JSON.parse(get(Q)) || []; } catch { return []; } };

// Anrejistre yon evènman. props: ti done senp sèlman (chif, id leson, kòd erè) — pa janm tèks moun nan.
export function track(name, props = {}) {
  if (!ready || !trackOn()) return;
  const q = load();
  q.push({ anon_id: anonId(), name, props, app: APP, platform, standalone, client_at: new Date().toISOString() });
  set(Q, JSON.stringify(q.slice(-MAX)));
  schedule();
}

let timer = null;
let sending = false;
function schedule() {
  clearTimeout(timer);
  timer = setTimeout(flush, 4000);
}

// Voye keu a (an pakèt de 50). Si sa pa mache, n ap eseye ankò pita: anyen pa pèdi.
export async function flush() {
  if (!ready || sending || navigator.onLine === false) return;
  const q = load();
  if (!q.length) return;
  sending = true;
  const batch = q.slice(0, 50);
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(batch),
      keepalive: true,
      credentials: 'omit',
    });
    if (r.ok || r.status === 400) { // 400: done ki pa bon, pa eseye yo ankò
      const rest = load().slice(batch.length);
      set(Q, JSON.stringify(rest));
      if (rest.length) schedule();
    }
  } catch { /* pa gen rezo: n ap eseye ankò */ }
  sending = false;
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => flush());
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
}
