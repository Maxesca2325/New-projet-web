// Rapèl chak jou (Web Push). Moun nan chwazi yon lè; si li poko pratike jodi a, telefòn nan resevwa
// yon ti notifikasyon an kreyòl. Fonksyon Supabase « koze-push » la voye yo (supabase/functions/koze-push).
// - Android (Chrome): mache nan navigatè a.
// - iPhone (iOS 16.4+): mache SÈLMAN si Koze sou ekran akèy la (louvri tankou yon app).
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const KEY = 'koze.push'; // { endpoint, hour }
const FN = `${SUPABASE_URL}/functions/v1/koze-push`;
const get = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
const put = (v) => { try { if (v) localStorage.setItem(KEY, JSON.stringify(v)); else localStorage.removeItem(KEY); } catch { /* */ } };

const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
export const isIOS = /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1);
export const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

// 'ok' · 'ios-install' (iPhone: mete Koze sou ekran akèy la anvan) · 'denied' (moun nan te refize) · 'no' (telefòn nan pa ka)
export function pushStatus() {
  if (!SUPABASE_URL) return 'no';
  if (isIOS && !isStandalone()) return 'ios-install';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'no';
  if (Notification.permission === 'denied') return 'denied';
  return 'ok';
}
export const reminder = () => get(); // null si rapèl yo etenn

const b64ToBytes = (s) => {
  const b = atob((s + '='.repeat((4 - (s.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};
const bytesToB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function rpc(name, args) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
    credentials: 'omit',
  });
  if (!r.ok) throw new Error(`rpc ${name} ${r.status}`);
}

const tz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Port-au-Prince'; } catch { return 'America/Port-au-Prince'; } };

// Limen rapèl yo. Rele l nan yon klik moun nan (navigatè a mande pèmisyon an).
// Retounen 'ok', 'denied', 'ios-install', 'no' oswa 'error'.
export async function enable(hour, { lastDay = null, streak = 0 } = {}) {
  const st = pushStatus();
  if (st !== 'ok') return st;
  const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (perm !== 'granted') return 'denied';
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const r = await fetch(`${FN}?key=1`, { headers: { apikey: SUPABASE_ANON_KEY }, credentials: 'omit' });
      const { publicKey } = await r.json();
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(publicKey) });
    }
    await rpc('push_save', {
      p_endpoint: sub.endpoint, p_p256dh: bytesToB64(sub.getKey('p256dh')), p_auth: bytesToB64(sub.getKey('auth')),
      p_hour: hour, p_tz: tz(), p_last_day: lastDay, p_streak: streak,
    });
    put({ endpoint: sub.endpoint, hour });
    return 'ok';
  } catch {
    return 'error';
  }
}

export async function disable() {
  const r = get();
  put(null);
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    await sub?.unsubscribe();
  } catch { /* */ }
  if (r?.endpoint) rpc('push_remove', { p_endpoint: r.endpoint }).catch(() => {});
}

// Apre chak leson: di sèvè a moun nan te pratike jodi a (pou l pa resevwa rapèl la pou gremesi).
export function touch(lastDay, streak) {
  const r = get();
  if (r?.endpoint) rpc('push_touch', { p_endpoint: r.endpoint, p_last_day: lastDay, p_streak: streak }).catch(() => {});
}
