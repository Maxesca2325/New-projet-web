// Konstwi etap yon leson oswa yon revizyon.
import { shuffle, pick, words } from './util.js';
import { canSpeak, canListen } from './speech.js';

// Si telefòn nan pa ka pale, "koute" vin "chwazi anglè a".
// Fraz ki gen mwens pase 3 mo twò fasil pou "mete nan lòd": nou fè l ekri.
function fix(s) {
  if (s.type === 'order' && words(s.item.en).length < 3) s = { ...s, type: 'type' };
  if (s.type === 'listen' && !canSpeak) s = { ...s, type: 'choose_en' };
  return s;
}

export function buildLesson(lesson, profile) {
  const items = lesson.items;
  const steps = [{ type: 'situation', lesson }];

  // 1. Aprann 2 fraz alafwa, epi tcheke yo touswit (rapèl aktif).
  for (let i = 0; i < items.length; i += 2) {
    const chunk = items.slice(i, i + 2);
    chunk.forEach((item) => steps.push({ type: 'intro', item }));
    shuffle(chunk).forEach((item) => steps.push({ type: 'choose_ht', item }));
  }

  // 2. Pratike: egzèsis yo vin pi difisil selon nivo moun nan.
  const pool = {
    zewo: ['listen', 'order', 'choose_en'],
    pi: ['listen', 'order', 'type'],
    baz: ['order', 'type', 'listen'],
  }[profile.level] || ['listen', 'order', 'type'];
  const rounds = profile.minutes <= 5 ? 1 : 2;
  for (let r = 0; r < rounds; r++) {
    shuffle(items).forEach((item, k) => steps.push({ type: pool[(k + r) % pool.length], item }));
  }

  // 3. Pale: di 2 fraz byen fò.
  if (canListen) shuffle(items).slice(0, 2).forEach((item) => steps.push({ type: 'speak', item }));

  return steps.map(fix);
}

// Revizyon: plis yon fraz fò nan memwa w, plis egzèsis la mande w pwodui l.
export function buildReview(items, records) {
  return shuffle(items).map((item) => {
    const box = records[item.id]?.box ?? 0;
    const type = box <= 1 ? pick(['choose_ht', 'listen', 'order'])
      : box <= 3 ? pick(['order', 'type', 'listen'])
      : pick(['type', 'type', 'order']);
    return fix({ type, item });
  });
}
