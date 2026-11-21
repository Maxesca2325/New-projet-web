// Lojik rapèl yo (san rezo, pou n ka teste l). Itilize pa index.ts.

// Jou ak lè lokal moun nan, nan zòn lè pa l (pa egzanp America/Port-au-Prince, America/New_York).
export function localNow(tz, now = new Date()) {
  let parts;
  try {
    parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  } catch {
    return localNow('America/Port-au-Prince', now);
  }
  const g = (t) => parts.find((p) => p.type === t)?.value;
  return { day: `${g('year')}-${g('month')}-${g('day')}`, hour: Number(g('hour')) };
}

// Èske fòk nou voye yon rapèl bay abònman sa a kounye a?
// Wi si: se lè li chwazi a, li poko pratike jodi a, epi nou poko voye youn jodi a.
export function isDue(sub, now = new Date()) {
  const { day, hour } = localNow(sub.tz, now);
  const iso = (d) => (d ? String(d instanceof Date ? d.toISOString() : d).slice(0, 10) : null);
  return hour === Number(sub.hour) && iso(sub.last_day) !== day && iso(sub.last_sent) !== day;
}

// Seri a toujou vivan si moun nan te pratike yè (jou lokal li).
export function streakAlive(sub, now = new Date()) {
  if (!sub.last_day || !sub.streak) return false;
  const { day } = localNow(sub.tz, now);
  const y = new Date(`${day}T12:00:00Z`);
  y.setUTCDate(y.getUTCDate() - 1);
  return String(sub.last_day).slice(0, 10) === y.toISOString().slice(0, 10);
}

// Mesaj la, an kreyòl. Nou chanje fraz la chak jou pou l pa vin anwiye.
export function message(sub, now = new Date()) {
  const { day } = localNow(sub.tz, now);
  const n = Number(day.slice(-2));
  if (streakAlive(sub, now)) {
    const s = sub.streak;
    const lines = [
      `Seri ${s} jou ou a ap tann ou. 5 minit sèlman pou w kenbe l.`,
      `Pa kite seri ${s} jou ou a tonbe! Yon ti leson, epi w fini.`,
      `${s} jou youn dèyè lòt: ou fò! Fè jodi a tou.`,
    ];
    return { title: 'Koze', body: lines[n % lines.length], url: './?src=push#aprann' };
  }
  const lines = [
    'Lè pou w pratike anglè! Yon leson 5 minit ap tann ou.',
    'Kèk fraz anglè jodi a? Ou ka fè l nan 5 minit.',
    'Ti zwazo Koze a ap tann ou. Vin aprann yon nouvo fraz.',
  ];
  return { title: 'Koze', body: lines[n % lines.length], url: './?src=push#aprann' };
}
