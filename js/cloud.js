// Kont ak senkronizasyon ak Supabase, san bibliyotèk (fetch sèlman, ~6 Ko).
// - Kont ak imèl + modpas (Supabase kenbe modpas la chifre ak bcrypt: nou pa janm wè l).
// - Pwogrè a sove nan tab "progress" (yon liy pa itilizatè, RLS: chak moun wè pa l sèlman).
import { SUPABASE_URL, SUPABASE_ANON_KEY, GOOGLE_LOGIN } from './config.js';

export const cloudReady = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
export const googleReady = cloudReady && GOOGLE_LOGIN;
const KEY = 'koze.session';
const LOCK = 'koze.lock';

let sess = (() => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } })();
const persist = () => {
  try { if (sess) localStorage.setItem(KEY, JSON.stringify(sess)); else localStorage.removeItem(KEY); } catch { /* */ }
};
const backUrl = () => encodeURIComponent(location.origin + location.pathname);

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
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
  });
  const text = await r.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { /* */ }
  if (!r.ok) {
    const err = new Error(data.msg || data.error_description || data.message || `HTTP ${r.status}`);
    err.status = r.status;
    err.code = data.error_code || (typeof data.code === 'string' ? data.code : '') || data.error || '';
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

// ---------------------------------------------------------------- règ modpas
// Menm règ yo sou telefòn nan ak nan Supabase (Authentication → Providers → Email).
export const PW_MIN = 8;
export const PW_MAX = 72; // bcrypt pa gade sa ki apre 72 oktè
const COMMON = new Set(['password', 'password1', 'password123', 'motdepasse', 'modpas123', '12345678', '123456789', '1234567890', '87654321',
  'qwerty123', 'azerty123', 'azertyuiop', 'qwertyuiop', 'iloveyou1', 'abc12345', 'abcd1234', 'aaaa1111', '11111111', '00000000',
  'haiti123', 'haiti1804', 'ayiti123', 'ayiti1804', 'jezi1234', 'jesus123', 'bondye123', 'koze1234', 'welcome1', 'letmein1', 'admin123']);
export function passwordRules(pw, email = '') {
  const local = email.split('@')[0].toLowerCase();
  const len = pw.length >= PW_MIN && new TextEncoder().encode(pw).length <= PW_MAX;
  const mix = /\p{L}/u.test(pw) && /\d/.test(pw);
  const safe = pw.length > 0 && !COMMON.has(pw.toLowerCase()) && !(local.length >= 4 && pw.toLowerCase().includes(local)) && !/^(.)\1+$/.test(pw);
  return { len, mix, safe, ok: len && mix && safe };
}

// ---------------------------------------------------------------- limit esè (sou telefòn nan)
// Supabase gen pwòp limit pa li sou sèvè a; sa a anpeche moun eseye modpas youn dèyè lòt sou menm telefòn nan.
const readLock = () => { try { return JSON.parse(localStorage.getItem(LOCK)) || { n: 0, until: 0 }; } catch { return { n: 0, until: 0 }; } };
const writeLock = (l) => { try { if (l.n) localStorage.setItem(LOCK, JSON.stringify(l)); else localStorage.removeItem(LOCK); } catch { /* */ } };
export const lockedFor = () => Math.max(0, Math.ceil((readLock().until - Date.now()) / 1000));
function failed() {
  const l = readLock();
  l.n += 1;
  if (l.n >= 5) l.until = Date.now() + Math.min(15 * 60, 30 * 2 ** (l.n - 5)) * 1000; // 30 s, 60 s, 2 min… jiska 15 min
  writeLock(l);
}

// ---------------------------------------------------------------- kont
// Kreye kont. Retounen 'session' si moun nan konekte touswit, 'confirm' si l dwe peze lyen nan imèl la.
// (Si imèl la gen kont deja, Supabase reponn menm jan an, pou pèsonn pa ka devine ki imèl ki gen kont.)
export async function signUp(email, password) {
  const b = await api(`/auth/v1/signup?redirect_to=${backUrl()}`, { method: 'POST', body: { email, password } });
  if (b.access_token) { setSession(b); return 'session'; }
  return 'confirm';
}

export async function signIn(email, password) {
  const wait = lockedFor();
  if (wait) { const e = new Error('locked'); e.code = 'local_lock'; e.wait = wait; throw e; }
  try {
    setSession(await api('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } }));
    writeLock({ n: 0, until: 0 });
    return sess.user;
  } catch (e) {
    if (e.status === 400 && /invalid_credentials|invalid_grant|invalid login/i.test(e.code + e.message)) failed();
    throw e;
  }
}

export const resendConfirm = (email) => api(`/auth/v1/resend?redirect_to=${backUrl()}`, { method: 'POST', body: { type: 'signup', email } });
export const sendReset = (email) => api(`/auth/v1/recover?redirect_to=${backUrl()}`, { method: 'POST', body: { email } });

// Verifye modpas aktyèl la (pou chanje modpas oswa efase kont), san chanje sesyon an.
export async function checkPassword(password) {
  const wait = lockedFor();
  if (wait) { const e = new Error('locked'); e.code = 'local_lock'; e.wait = wait; throw e; }
  try {
    await api('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: sess.user.email, password } });
    writeLock({ n: 0, until: 0 });
  } catch (e) {
    if (e.status === 400) failed();
    throw e;
  }
}

export async function setPassword(password) {
  const t = await token();
  if (!t) { const e = new Error('session'); e.code = 'no_session'; throw e; }
  await api('/auth/v1/user', { method: 'PUT', token: t, body: { password } });
}

// Efase kont lan nèt (fonksyon delete_account nan Supabase: efase moun nan ak pwogrè l).
export async function deleteAccount() {
  const t = await token();
  if (!t) { const e = new Error('session'); e.code = 'no_session'; throw e; }
  await api('/rest/v1/rpc/delete_account', { method: 'POST', token: t, body: {} });
  sess = null;
  persist();
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
  return `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${backUrl()}`;
}

// Lyen nan imèl la (konfime kont, chanje modpas) oswa Google retounen ak #access_token=… nan adrès la.
// Rele l anvan routeur la: li retire token yo nan adrès la touswit (pou yo pa rete nan istwa a).
export function grabOAuthHash() {
  if (!cloudReady || !/access_token=|error_code=/.test(location.hash)) return null;
  const h = location.hash;
  history.replaceState(null, '', location.pathname + location.search);
  return h;
}
// Retounen 'error', 'recovery' (moun nan dwe chwazi yon nouvo modpas), 'signup', true, oswa false.
export async function takeOAuthRedirect(hash) {
  if (!hash) return false;
  const p = new URLSearchParams(hash.slice(1));
  if (p.get('error_code') || p.get('error')) return 'error';
  try {
    const u = await api('/auth/v1/user', { token: p.get('access_token') });
    setSession({ access_token: p.get('access_token'), refresh_token: p.get('refresh_token'), expires_in: +p.get('expires_in') || 3600, user: u });
    const type = p.get('type');
    return type === 'recovery' || type === 'signup' ? type : true;
  } catch { return false; }
}

export async function signOut() {
  const t = sess?.access_token;
  sess = null;
  persist();
  try { localStorage.removeItem('koze.synced'); } catch { /* */ }
  if (t) api('/auth/v1/logout', { method: 'POST', token: t }).catch(() => {});
}

export async function pull() {
  const t = await token();
  if (!t) return null;
  const rows = await api(`/rest/v1/progress?select=data,updated_at&user_id=eq.${encodeURIComponent(sess.user.id)}`, { token: t });
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
  await api(`/rest/v1/progress?user_id=eq.${encodeURIComponent(sess.user.id)}`, { method: 'DELETE', token: t }).catch(() => {});
}

// Mesaj erè an kreyòl pou moun nan.
export function errorText(e) {
  const s = `${e.code} ${e.message}`;
  if (e.code === 'local_lock') return `Twòp esè. Tann ${e.wait > 90 ? `${Math.ceil(e.wait / 60)} minit` : `${e.wait} segonn`} epi eseye ankò.`;
  if (navigator.onLine === false || e instanceof TypeError) return 'Pa gen entènèt. Konekte w epi eseye ankò.';
  if (e.status === 429 || /rate.?limit|over_/i.test(s)) return 'Twòp esè. Tann kèk minit epi eseye ankò.';
  if (/invalid_credentials|invalid_grant|invalid login/i.test(s)) return 'Imèl la oswa modpas la pa bon.';
  if (/email_not_confirmed|not confirmed/i.test(s)) return 'Ou poko konfime imèl ou. Peze lyen nou te voye a, oswa mande yon lòt.';
  if (/same_password|different from the old/i.test(s)) return 'Chwazi yon modpas ki diferan de sa ou te genyen an.';
  if (/weak_password|pwned|password should/i.test(s)) return 'Modpas sa a twò fasil pou devine. Chwazi yon lòt.';
  if (/user_already_exists|already registered/i.test(s)) return 'Gen yon kont deja ak imèl sa a. Konekte oswa chanje modpas la.';
  if (/signup_disabled/i.test(s)) return 'Nou pa ka kreye nouvo kont kounye a. Eseye ankò pita.';
  if (e.code === 'no_session' || e.status === 401) return 'Sesyon ou fini. Konekte ankò.';
  if (/otp_expired|expired/i.test(s)) return 'Lyen an ekspire. Mande yon nouvo.';
  if (/email/i.test(s)) return 'Adrès imèl sa a pa bon. Tcheke l epi eseye ankò.';
  return 'Sa pa mache kounye a. Eseye ankò pita.';
}
