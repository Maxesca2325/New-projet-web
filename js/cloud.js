// Kont ak senkronizasyon ak Supabase, san bibliyotèk (fetch sèlman, ~5 Ko).
// - Konekte ak yon kòd 6 chif ki rive pa imèl (pa gen modpas).
// - Pwogrè a sove nan tab "progress" (yon liy pa itilizatè, RLS: chak moun wè pa l sèlman).
import { SUPABASE_URL, SUPABASE_ANON_KEY, GOOGLE_LOGIN } from './config.js';

export const cloudReady = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
export const googleReady = cloudReady && GOOGLE_LOGIN;
const KEY = 'koze.session';

let sess = (() => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } })();
const persist = () => {
  try { if (sess) localStorage.setItem(KEY, JSON.stringify(sess)); else localStorage.removeItem(KEY); } catch { /* */ }
};

async function api(path, { method = 'GET', body, token, headers = {} } = {}) {
  const r = await fetch(SUPABASE_URL + path, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { /* */ }
  if (!r.ok) {
    const err = new Error(data.msg || data.error_description || data.message || `HTTP ${r.status}`);
    err.status = r.status;
    err.code = data.error_code || data.code || '';
    throw err;
  }
  return data;
}

function setSession(b) {
  sess = {
    access_token: b.access_token,
    refresh_token: b.refresh_token,
    expires_at: Date.now() + (b.expires_in || 3600) * 1000,
    user: { id: b.user.id, email: b.user.email },
  };
  persist();
}

export const currentUser = () => sess?.user || null;

export async function sendCode(email) {
  const back = encodeURIComponent(location.origin + location.pathname);
  await api(`/auth/v1/otp?redirect_to=${back}`, { method: 'POST', body: { email, create_user: true } });
}

export async function verifyCode(email, code) {
  const b = await api('/auth/v1/verify', { method: 'POST', body: { type: 'email', email, token: code } });
  setSession(b);
  return sess.user;
}

// Token valid, ak renouvèlman otomatik. null si moun nan pa konekte (oswa sesyon an fini).
async function token() {
  if (!sess) return null;
  if (Date.now() > sess.expires_at - 60_000) {
    try {
      setSession(await api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: sess.refresh_token } }));
    } catch (e) {
      if (e.status === 400 || e.status === 401 || e.status === 403) { sess = null; persist(); }
      return null;
    }
  }
  return sess.access_token;
}

export function googleUrl() {
  const back = location.origin + location.pathname;
  return `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(back)}`;
}

// Apre Google, Supabase retounen ak #access_token=… nan adrès la.
// Rele l anvan routeur la: li retire token yo nan adrès la touswit.
export function grabOAuthHash() {
  if (!cloudReady || !location.hash.includes('access_token=')) return null;
  const h = location.hash;
  history.replaceState(null, '', location.pathname + location.search);
  return h;
}
export async function takeOAuthRedirect(hash) {
  if (!hash) return false;
  const p = new URLSearchParams(hash.slice(1));
  try {
    const u = await api('/auth/v1/user', { token: p.get('access_token') });
    setSession({ access_token: p.get('access_token'), refresh_token: p.get('refresh_token'), expires_in: +p.get('expires_in') || 3600, user: u });
    return true;
  } catch { return false; }
}

export async function signOut() {
  const t = sess?.access_token;
  sess = null;
  persist();
  if (t) api('/auth/v1/logout', { method: 'POST', token: t }).catch(() => {});
}

export async function pull() {
  const t = await token();
  if (!t) return null;
  const rows = await api(`/rest/v1/progress?select=data,updated_at&user_id=eq.${sess.user.id}`, { token: t });
  return rows[0]?.data || null;
}

export async function push(data) {
  const t = await token();
  if (!t) return false;
  await api('/rest/v1/progress', {
    method: 'POST', token: t,
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: { user_id: sess.user.id, data, updated_at: new Date().toISOString() },
  });
  return true;
}

export async function removeRemote() {
  const t = await token();
  if (!t) return;
  await api(`/rest/v1/progress?user_id=eq.${sess.user.id}`, { method: 'DELETE', token: t }).catch(() => {});
}

// Mesaj erè an kreyòl pou moun nan.
export function errorText(e) {
  if (navigator.onLine === false || e instanceof TypeError) return 'Pa gen entènèt. Konekte w epi eseye ankò.';
  if (e.status === 429 || /rate|limit/i.test(e.code)) return 'Twòp esè. Tann kèk minit epi eseye ankò.';
  if (/otp_expired|expired/i.test(e.code + e.message)) return 'Kòd la ekspire. Mande yon nouvo kòd.';
  if (e.status === 401 || e.status === 403 || /invalid|token/i.test(e.code + e.message)) return 'Kòd la pa bon. Tcheke l epi eseye ankò.';
  if (/email/i.test(e.code + e.message)) return 'Adrès imèl sa a pa bon. Tcheke l epi eseye ankò.';
  return 'Sa pa mache kounye a. Eseye ankò pita.';
}
