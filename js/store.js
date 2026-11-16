// Tout pwogrè a rete sou telefòn moun nan (localStorage). Pa gen kont, pa gen sèvè.
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
