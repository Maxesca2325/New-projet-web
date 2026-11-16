// Pwogrè a rete sou telefòn moun nan (localStorage). Si l gen yon kont, js/cloud.js
// senkronize l ak Supabase (merge() pi ba a mete de aparèy ansanm).
const KEY = 'koze.v1';

const defaults = () => ({
  profile: null,      // { goal, paths[], level, minutes }
  done: {},           // lessonId -> true
  items: {},          // itemId -> { box, due, seen, miss }
  xp: 0,
  streak: 0,
  lastDay: null,
  today: { day: null, xp: 0 },
});

export function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    return s ? { ...defaults(), ...s } : defaults();
  } catch {
    return defaults();
  }
}

export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* mòd prive */ }
}

export function reset() {
  try { localStorage.removeItem(KEY); } catch { /* */ }
  return defaults();
}

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const yesterdayKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d);
};

// Leson oswa revizyon ki an kou. Nou mete l nan sessionStorage: li rete la lè moun nan
// rafrechi paj la, men li efase poukont li lè l fèmen app la (oswa onglet la) → leson an
// rekòmanse a zewo.
const RUN_KEY = 'koze.run';
export function saveRun(run) {
  try { sessionStorage.setItem(RUN_KEY, JSON.stringify(run)); } catch { /* */ }
}
export function loadRun() {
  try { return JSON.parse(sessionStorage.getItem(RUN_KEY)); } catch { return null; }
}
export function clearRun() {
  try { sessionStorage.removeItem(RUN_KEY); localStorage.removeItem(RUN_KEY); } catch { /* */ }
}

// Mete ansanm pwogrè de aparèy (telefòn sa a + kont lan), san pèdi anyen:
// leson fini yo ajoute, chak fraz pran vèsyon ki pratike plis la, XP pi gwo a,
// seri ki pi resan an.
export function merge(local, remote) {
  if (!remote) return local;
  const r = { ...defaults(), ...remote };
  const out = { ...local };
  out.profile = local.profile || r.profile;
  out.done = { ...r.done, ...local.done };
  out.items = { ...r.items };
  for (const [id, rec] of Object.entries(local.items)) {
    const o = out.items[id];
    out.items[id] = !o || rec.seen > o.seen || (rec.seen === o.seen && rec.due >= o.due) ? rec : o;
  }
  out.xp = Math.max(local.xp, r.xp);
  if ((r.lastDay || '') > (local.lastDay || '')) { out.lastDay = r.lastDay; out.streak = r.streak; }
  else if (r.lastDay === local.lastDay) out.streak = Math.max(local.streak, r.streak);
  if (r.today.day === local.today.day) out.today = { day: local.today.day, xp: Math.max(local.today.xp, r.today.xp) };
  else if ((r.today.day || '') > (local.today.day || '')) out.today = r.today;
  return out;
}
