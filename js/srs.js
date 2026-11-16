// Repetisyon espase (sistèm bwat Leitner).
// Chak fwa ou konnen yon fraz, li monte nan yon bwat ki tann pi lontan anvan revizyon.
// Si ou rate l, li tounen nan bwat 1 (revizyon demen).
const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30, 60];
const DAY = 86400000;

export function grade(rec, correct, now = Date.now()) {
  const r = rec ? { ...rec } : { box: 0, due: now, seen: 0, miss: 0 };
  r.seen += 1;
  if (correct) r.box = Math.min(r.box + 1, INTERVAL_DAYS.length - 1);
  else { r.box = 1; r.miss += 1; }
  r.due = now + INTERVAL_DAYS[r.box] * DAY;
  return r;
}

export function dueIds(records, now = Date.now()) {
  return Object.entries(records)
    .filter(([, r]) => r.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([id]) => id);
}

export const MASTERED_BOX = 3;
