import { PATHS, GOALS, GOAL_TO_PATH, LEVELS, MINUTES, LESSONS } from './data.js';
import * as store from './store.js';
import { grade, dueIds, MASTERED_BOX } from './srs.js';
import { say, canSpeak, canListen, listen } from './speech.js';
import { buildLesson, buildReview } from './lesson.js';
import { esc, shuffle, pick, typedMatch, spokenScore, norm, words } from './util.js';
import { SPRITE } from './icons.js';

document.body.insertAdjacentHTML('afterbegin', SPRITE);

// ================================================================ ti zouti

const ic = (name, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const LOGO = `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><clipPath id="kz-b"><path d="M14 8h36a10 10 0 0 1 10 10v22a10 10 0 0 1-10 10H30l-12 10v-10h-4A10 10 0 0 1 4 40V18A10 10 0 0 1 14 8z"/></clipPath></defs><g clip-path="url(#kz-b)"><rect width="64" height="29" fill="#0b2bb8"/><rect y="29" width="64" height="35" fill="#d21034"/></g><path d="M25 18v22M25 31l11-11M28.5 28l8.5 12" stroke="#fff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
const wordmark = (big = false) => `<span class="wordmark ${big ? 'big' : ''}">${LOGO}<span>koze</span></span>`;
const STRIPES = '<div class="stripes" aria-hidden="true"><i></i><i></i><i></i><i></i></div>';
const ptile = (p, cls = '') => `<span class="ptile t-${p.ton} ${cls}">${ic(p.ikon, 'lg')}</span>`;
const MASKOT = {
  bonjou: 'img/maskot.webp',
  kontan: 'img/maskot-kontan.webp',
  ankouraje: 'img/maskot-ankouraje.webp',
  dodo: 'img/maskot-dodo.webp',
};
const maskot = (pose, cls = '', alt = '') => `<img class="maskot ${cls}" src="${MASKOT[pose]}" width="480" height="480" alt="${esc(alt)}" decoding="async">`;
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const vibrate = (p) => { try { navigator.vibrate?.(p); } catch { /* */ } };

const app = document.getElementById('app');
const DEBUG = new URLSearchParams(location.search).has('debug');
let S = store.load();
const save = () => store.save(S);

const ALL_ITEMS = LESSONS.flatMap((l) => l.items);
const ITEM = new Map(ALL_ITEMS.map((it) => [it.id, it]));
const LESSON = new Map(LESSONS.map((l) => [l.id, l]));
const PATH = new Map(PATHS.map((p) => [p.id, p]));
const lessonOf = (itemId) => LESSON.get(itemId.split('.')[0]);
const PRAISE = ['Bravo!', 'Trè byen!', 'Ou fò!', 'Pafè!', 'Kontinye konsa!', 'Se sa!'];
const COMFORT = ['Pa tout afè!', 'Prèske!', 'Pa gen pwoblèm!'];
const REVIEW_SIZE = 12;

const $ = (sel, root = app) => root.querySelector(sel);
const $$ = (sel, root = app) => [...root.querySelectorAll(sel)];
function view(html, { keepScroll = false } = {}) {
  app.innerHTML = html;
  if (!keepScroll) window.scrollTo(0, 0);
  syncOnline();
}

// Fenèt konfimasyon andedan app la. Li remete fokis la kote l te ye apre.
function ask(msg, yes, danger = false) {
  return new Promise((resolve) => {
    const before = document.activeElement;
    const m = document.createElement('div');
    m.className = 'modal';
    m.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="ask-t"><p id="ask-t">${esc(msg)}</p>
      <div class="row"><button class="btn ghost" data-no>Non</button><button class="btn ${danger ? 'danger' : 'primary'}" data-yes>${esc(yes)}</button></div></div>`;
    const close = (v) => {
      m.remove();
      document.removeEventListener('keydown', onKey, true);
      if (!v) before?.focus?.();
      resolve(v);
    };
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(false); } };
    m.querySelector('[data-no]').onclick = () => close(false);
    m.querySelector('[data-yes]').onclick = () => close(true);
    m.onclick = (e) => { if (e.target === m) close(false); };
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(m);
    m.querySelector('[data-no]').focus();
  });
}

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

// ================================================================ pwogrè

function sequence() {
  const baz = LESSONS.filter((l) => l.path === 'baz');
  const lists = S.profile.paths.map((p) => LESSONS.filter((l) => l.path === p));
  const mixed = [];
  const max = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < max; i++) lists.forEach((l) => l[i] && mixed.push(l[i]));
  return [...baz, ...mixed];
}

function unlockedSet(seq = sequence()) {
  const skipBaz = S.profile.level === 'baz';
  const open = new Set();
  let ok = true;
  for (const l of seq) {
    if (skipBaz && l.path === 'baz') { open.add(l.id); continue; }
    if (ok) open.add(l.id);
    if (!S.done[l.id]) ok = false;
  }
  return open;
}

const streakNow = () => (S.lastDay === store.dayKey() || S.lastDay === store.yesterdayKey() ? S.streak : 0);
const todayXp = () => (S.today.day === store.dayKey() ? S.today.xp : 0);
const dailyGoal = () => (S.profile?.minutes || 10) * 10;
const dueNow = () => dueIds(S.items).filter((id) => ITEM.has(id));

function addXp(xp) {
  const today = store.dayKey();
  const goal = dailyGoal();
  const before = todayXp();
  const streakBefore = streakNow();
  if (S.today.day !== today) S.today = { day: today, xp: 0 };
  S.today.xp += xp;
  S.xp += xp;
  if (S.lastDay !== today) {
    S.streak = S.lastDay === store.yesterdayKey() ? S.streak + 1 : 1;
    S.lastDay = today;
  }
  save();
  return { goalReached: before < goal && S.today.xp >= goal, streakUp: S.streak > streakBefore };
}

// "demen", "nan 3 jou", "jodi a"
function whenLabel(ts) {
  const days = Math.ceil((ts - Date.now()) / 86400000);
  if (days <= 0) return 'jodi a';
  if (days === 1) return 'demen';
  return `nan ${days} jou`;
}

// ================================================================ routeur (#adrès)

// Chak ekran gen adrès pa l, pou bouton "retounen" telefòn nan mache.
let session = null;          // { hash, back, done } pandan yon leson oswa yon revizyon
let draft = null;            // repons kesyon premye fwa yo
let booting = true;

const go = (hash) => { if (location.hash === hash) render(); else location.hash = hash; };
const redirect = (hash) => { history.replaceState(null, '', hash); render(); };

window.addEventListener('hashchange', async () => {
  // Bouton retounen pandan yon leson: mande anvan.
  if (session && !session.done && location.hash !== session.hash) {
    const target = location.hash;
    history.pushState(null, '', session.hash);
    if (await ask('Ou vle kite? Pwogrè sa a ap pèdi.', 'Wi, kite')) {
      window.speechSynthesis?.cancel();
      session = null;
      redirect(target || '#aprann');
    }
    return;
  }
  if (session && location.hash !== session.hash) session = null;
  render();
});

function render() {
  const h = location.hash || '';
  const [name, ...rest] = h.slice(1).split('-');
  const arg = rest.join('-');

  if (!S.profile) {
    if (name === 'kesyon' && +arg >= 1 && +arg <= 4) return setup(+arg);
    if (h !== '#byenvini') return redirect('#byenvini');
    return welcome();
  }
  if (name === 'kesyon' && +arg >= 1 && +arg <= 4) return setup(+arg);
  if (name === 'leson') {
    const lesson = LESSON.get(arg);
    if (booting || !lesson || !unlockedSet().has(lesson.id)) return redirect('#aprann');
    if (session?.hash === h) return;
    return startLesson(lesson);
  }
  if (name === 'revizyon') {
    if (booting || !dueNow().length) return redirect('#revize');
    if (session?.hash === h) return;
    return startReview();
  }
  if (name === 'revize') return reviewTab();
  if (name === 'pwofil') return profileTab();
  if (name !== 'aprann') return redirect('#aprann');
  return learnTab();
}

// ================================================================ koki onglet yo

function shell(active, body, { title = '' } = {}) {
  const due = dueNow().length;
  const streak = streakNow();
  const tab = (id, icon, label, badge = '') => `
    <a class="tab ${active === id ? 'on' : ''}" href="#${id}" ${active === id ? 'aria-current="page"' : ''}>
      <span class="tab-ic">${ic(icon)}${badge}</span><span>${label}</span></a>`;
  view(`
  <header class="top">
    ${title ? `<h1 class="top-title">${esc(title)}</h1>` : `${wordmark()}<h1 class="sr">Aprann</h1>`}
    <div class="chips">
      <span class="chip fire ${streak ? 'on' : ''}" title="Jou youn dèyè lòt" aria-label="${streak} jou youn dèyè lòt">${ic('flame')} ${streak}</span>
      <span class="chip xp" title="Pwen XP" aria-label="${S.xp} XP">${ic('star')} ${S.xp}</span>
    </div>
  </header>
  <p class="offline" hidden>${ic('wifi-off')} San entènèt. Koze ap mache kanmenm.</p>
  <main class="tab-body">${body}</main>
  <nav class="tabbar" aria-label="Meni">
    ${tab('aprann', 'book-open', 'Aprann')}
    ${tab('revize', 'brain', 'Revize', due ? `<span class="badge" aria-label="${due} fraz pou revize">${due > 99 ? '99+' : due}</span>` : '')}
    ${tab('pwofil', 'user-round', 'Pwofil')}
  </nav>`);
}

function syncOnline() {
  const el = document.querySelector('.offline');
  if (el) el.hidden = navigator.onLine !== false;
}
window.addEventListener('online', () => { syncOnline(); toast('Entènèt la tounen.'); });
window.addEventListener('offline', syncOnline);

// ================================================================ premye fwa

function welcome() {
  view(`
  <main class="welcome">
    ${wordmark(true)}
    ${STRIPES}
    <div class="hero-row">
      <h1 class="hero">Pale anglè.<br>Aprann li <em>an kreyòl.</em></h1>
      ${maskot('bonjou', 'hero-maskot', 'Ti zwazo Koze a, yon trogon, zwazo nasyonal Ayiti')}
    </div>
    <p class="lead">Leson 5 a 10 minit ki swiv lavi ou: biznis, lekòl, vwayaj, chantye, lopital.</p>
    <div class="sample" aria-label="Egzanp yon fraz">
      <div class="sample-row"><span class="lang">EN</span><span class="en">Thank you very much.</span>
        ${canSpeak ? `<button class="mini-say" data-say aria-label="Koute">${ic('volume-2')}</button>` : ''}</div>
      <span class="say-as"><span class="lbl">Di l konsa</span><b>Tènk yu vèri moch</b></span>
      <div class="sample-row"><span class="lang kr">KR</span><span>Mèsi anpil.</span></div>
    </div>
    <ul class="perks">
      <li>${ic('target')} Leson pou travay ou ak lavi ou chak jou</li>
      <li>${ic('brain')} Revizyon nan bon moman pou w pa bliye</li>
      <li>${ic('wifi-off')} Mache menm san entènèt</li>
    </ul>
    <div class="grow"></div>
    <div class="sticky-foot"><button class="btn primary big" data-go>Kòmanse, se gratis</button></div>
  </main>`);
  $('[data-say]')?.addEventListener('click', () => say('Thank you very much.'));
  $('[data-go]').onclick = () => { draft = null; go('#kesyon-1'); };
}

function setup(step) {
  draft ??= S.profile
    ? { ...S.profile, paths: [...S.profile.paths] }
    : { goal: null, paths: [], level: null, minutes: null };
  // Pa sote kesyon: si yon repons anvan manke, retounen sou li.
  const firstMissing = !draft.goal ? 1 : !draft.paths.length ? 2 : !draft.level ? 3 : !draft.minutes ? 4 : 5;
  if (step > firstMissing) return redirect(`#kesyon-${firstMissing}`);
  const total = 4;
  const finish = () => {
    const first = !S.profile;
    S.profile = draft;
    draft = null;
    save();
    toast(first ? 'Chemen ou pare!' : 'Chanjman yo anrejistre.');
    redirect('#aprann');
  };

  const q = {
    1: {
      title: 'Poukisa ou vle aprann anglè?',
      options: GOALS, value: draft.goal,
      set: (id) => {
        draft.goal = id;
        const p = GOAL_TO_PATH[id];
        if (p && !draft.paths.includes(p)) draft.paths = [p, ...draft.paths];
      },
    },
    2: {
      title: 'Ki sa ou fè chak jou?',
      sub: 'Chwazi youn oswa plizyè. Leson ou yo ap swiv aktivite sa yo.',
      multi: true,
      options: PATHS.filter((p) => p.id !== 'baz').map((p) => ({ id: p.id, ikon: p.ikon, label: p.non, desc: p.dekri })),
      value: draft.paths,
      set: (id) => {
        draft.paths = draft.paths.includes(id) ? draft.paths.filter((x) => x !== id) : [...draft.paths, id];
      },
    },
    3: { title: 'Ki nivo ou an anglè?', options: LEVELS, value: draft.level, set: (id) => { draft.level = id; } },
    4: {
      title: 'Konbyen tan pa jou?',
      sub: 'Ou ka chanje sa nenpòt ki lè.',
      options: MINUTES, value: draft.minutes, set: (id) => { draft.minutes = id; },
    },
  }[step];

  const isSel = (id) => (q.multi ? q.value.includes(id) : q.value === id);
  const valid = q.multi ? draft.paths.length > 0 : q.value != null;
  view(`
  <main class="screen setup">
    <div class="run-top">
      <button class="icon-btn" data-back aria-label="Retounen">${ic('arrow-left', 'lg')}</button>
      <div class="bar" role="progressbar" aria-label="Kesyon ${step} sou ${total}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${step}"><i style="width:${(step / total) * 100}%"></i></div>
    </div>
    <p class="eyebrow">Kesyon ${step} sou ${total}</p>
    <h1>${esc(q.title)}</h1>
    ${q.sub ? `<p class="muted">${esc(q.sub)}</p>` : ''}
    <div class="choices">
      ${q.options.map((o) => `
        <button class="choice ${isSel(o.id) ? 'sel' : ''}" data-id="${esc(o.id)}" aria-pressed="${isSel(o.id)}">
          <span class="tile">${ic(o.ikon, 'lg')}</span>
          <span class="txt"><b>${esc(o.label)}</b>${o.desc ? `<small>${esc(o.desc)}</small>` : ''}</span>
          ${q.multi ? `<span class="check">${isSel(o.id) ? ic('check') : ''}</span>` : ''}
        </button>`).join('')}
    </div>
    <div class="grow"></div>
    <div class="sticky-foot">
      <button class="btn primary big" data-next ${valid ? '' : 'disabled'}>${step === total ? 'Fini' : 'Kontinye'}</button>
    </div>
  </main>`, { keepScroll: true });
  $$('.choice').forEach((b) => {
    b.onclick = () => {
      const id = isNaN(+b.dataset.id) ? b.dataset.id : +b.dataset.id;
      q.set(id);
      const focusId = b.dataset.id;
      render();
      $(`.choice[data-id="${focusId}"]`)?.focus();
    };
  });
  $('[data-back]').onclick = () => history.back();
  $('[data-next]').onclick = () => (step < total ? go(`#kesyon-${step + 1}`) : finish());
}

// ================================================================ onglet Aprann

function learnTab() {
  const seq = sequence();
  const open = unlockedSet(seq);
  const next = seq.find((l) => open.has(l.id) && !S.done[l.id]);
  const due = dueNow();
  const goal = dailyGoal();
  const tx = todayXp();
  const pct = Math.min(100, Math.round((tx / goal) * 100));
  const groups = ['baz', ...S.profile.paths].map((pid) => ({ p: PATH.get(pid), lessons: seq.filter((l) => l.path === pid) }));

  shell('aprann', `
    ${next ? `
    <section class="next-card">
      ${STRIPES}
      <div class="next-body">
        <p class="eyebrow">${esc(PATH.get(next.path).non)} · Pwochen leson</p>
        <h2>${esc(next.tit)}</h2>
        <p class="muted">${esc(next.sitiyasyon)}</p>
        <p class="goal-line">${ic('target')}<span>Apre leson sa a, ou ap ka ${esc(next.objektif)}</span></p>
        <a class="btn primary big" href="#leson-${next.id}">${ic('play')} Kòmanse leson an</a>
      </div>
    </section>` : `
    <section class="next-card">
      ${STRIPES}
      <div class="next-body empty-next">
        ${maskot('kontan', 'empty-maskot')}
        <h2>Ou fini tout leson ki disponib yo!</h2>
        <p class="muted">Nouvo leson ap vini byento. Pandan tan sa a, revize chak jou pou w kenbe sa w aprann.</p>
        <a class="btn secondary big" href="#revize">${ic('brain')} Ale nan Revize</a>
      </div>
    </section>`}

    <section class="goal ${pct >= 100 ? 'done' : ''}" aria-label="Objektif jodi a">
      <div class="goal-row"><b>Objektif jodi a</b><span>${tx} / ${goal} XP</span></div>
      <div class="bar" role="progressbar" aria-label="Objektif jodi a" aria-valuemin="0" aria-valuemax="${goal}" aria-valuenow="${Math.min(tx, goal)}"><i style="width:${pct}%"></i></div>
      ${pct >= 100 ? `<p class="goal-ok">${ic('check')} Ou rive nan objektif ou jodi a.</p>` : ''}
    </section>

    ${due.length ? `
    <a class="review-banner" href="#revize">
      ${ic('brain', 'lg')}
      <span><b>${due.length} fraz pou revize</b><small>Revize yo kounye a pou w pa bliye yo.</small></span>
      ${ic('chevron-down', 'go')}
    </a>` : ''}

    <h2 class="section-title">Chemen ou</h2>
    ${groups.map(({ p, lessons }) => {
      const doneN = lessons.filter((l) => S.done[l.id]).length;
      const all = doneN === lessons.length;
      return `
      <details class="path" ${all ? '' : 'open'}>
        <summary class="path-head">
          ${ptile(p)}
          <span class="path-txt"><b>${esc(p.non)}</b><small>${esc(p.dekri)}</small></span>
          <span class="path-count ${all ? 'all' : ''}">${all ? ic('check') : ''}${doneN}/${lessons.length}</span>
          ${ic('chevron-down', 'fold')}
        </summary>
        <ol class="track">
          ${lessons.map((l) => {
            const done = !!S.done[l.id];
            const isOpen = open.has(l.id);
            const state = done ? 'done' : isOpen ? 'open' : 'locked';
            const icon = done ? ic('check') : isOpen ? ic('play') : ic('lock');
            const label = `${esc(l.tit)}<span class="sr"> (${done ? 'fini' : isOpen ? 'louvri' : 'fèmen'})</span>`;
            return `<li>${isOpen
              ? `<a class="lesson ${state}" href="#leson-${l.id}"><span class="dot">${icon}</span><span class="lt">${label}</span><span class="n">${l.items.length} fraz</span></a>`
              : `<span class="lesson ${state}"><span class="dot">${icon}</span><span class="lt">${label}</span><span class="n">${l.items.length} fraz</span></span>`}</li>`;
          }).join('')}
        </ol>
      </details>`;
    }).join('')}`);
}

// ================================================================ onglet Revize

function reviewTab() {
  const recs = Object.entries(S.items).filter(([id]) => ITEM.has(id));
  const due = dueNow();
  const nNew = recs.filter(([, r]) => r.box <= 1).length;
  const nMid = recs.filter(([, r]) => r.box > 1 && r.box < MASTERED_BOX).length;
  const nTop = recs.filter(([, r]) => r.box >= MASTERED_BOX).length;
  const nextDue = recs.length ? Math.min(...recs.map(([, r]) => r.due)) : null;
  const level = (box) => (box >= MASTERED_BOX ? ['top', 'Metrize'] : box > 1 ? ['mid', 'Ap aprann'] : ['new', 'Nouvo']);

  // Fraz yo gwoupe pa leson, nan lòd leson yo.
  const byLesson = LESSONS.map((l) => ({ l, rows: l.items.filter((it) => S.items[it.id]) })).filter((g) => g.rows.length);

  const hero = !recs.length ? `
    <section class="review-hero empty">
      ${maskot('dodo', 'empty-maskot')}
      <h2>Ou poko gen fraz pou revize</h2>
      <p class="muted">Fini premye leson ou. Fraz ou aprann yo ap parèt isit la, epi Koze ap fè w revize yo nan bon moman.</p>
      <a class="btn primary big" href="#aprann">${ic('book-open')} Ale nan leson yo</a>
    </section>`
    : due.length ? `
    <section class="review-hero">
      <p class="eyebrow">${ic('brain')} Revizyon jodi a</p>
      <h2>${due.length} fraz ap tann ou</h2>
      <p class="muted">Revize yo kounye a, anvan memwa w kite yo ale. Sa pran ${Math.max(1, Math.round(Math.min(due.length, REVIEW_SIZE) / 3))} minit.</p>
      <a class="btn primary big" href="#revizyon">${ic('refresh-cw')} Revize kounye a</a>
    </section>`
    : `
    <section class="review-hero empty">
      ${maskot('dodo', 'empty-maskot')}
      <h2>Anyen pou revize jodi a</h2>
      <p class="muted">${ic('calendar')} Pwochen revizyon: <b>${whenLabel(nextDue)}</b>. Pandan tan sa a, fè yon nouvo leson.</p>
      <a class="btn secondary big" href="#aprann">${ic('book-open')} Fè yon leson</a>
    </section>`;

  shell('revize', `
    ${hero}
    ${recs.length ? `
    <section class="memory" aria-label="Fòs memwa ou">
      <div class="mem new"><b>${nNew}</b><span>Nouvo</span></div>
      <div class="mem mid"><b>${nMid}</b><span>Ap aprann</span></div>
      <div class="mem top"><b>${nTop}</b><span>Metrize</span></div>
    </section>
    <h2 class="section-title">Fraz ou aprann yo</h2>
    ${byLesson.map(({ l, rows }) => `
      <details class="phrase-group">
        <summary>${ptile(PATH.get(l.path), 'sm')}<span class="pg-t"><b>${esc(l.tit)}</b><small>${rows.length} fraz</small></span>${ic('chevron-down', 'fold')}</summary>
        <ul class="phrase-list">
          ${rows.map((it) => {
            const [cls, label] = level(S.items[it.id].box);
            return `<li class="pl-row">
              <div class="pl-txt">
                <span class="pl-en">${esc(it.en)}</span>
                <span class="pl-son">${esc(it.son)}</span>
                <span class="pl-kr">${esc(it.ht)}</span>
              </div>
              <span class="lvl ${cls}">${label}</span>
              ${canSpeak ? `<button class="mini-say" data-say="${esc(it.id)}" aria-label="Koute: ${esc(it.en)}">${ic('volume-2')}</button>` : ''}
            </li>`;
          }).join('')}
        </ul>
      </details>`).join('')}` : ''}`, { title: 'Revize' });
  $$('[data-say]').forEach((b) => (b.onclick = () => say(ITEM.get(b.dataset.say).en)));
}

// ================================================================ onglet Pwofil

function profileTab() {
  const mastered = Object.values(S.items).filter((r) => r.box >= MASTERED_BOX).length;
  const learning = Object.keys(S.items).length - mastered;
  const doneCount = Object.keys(S.done).length;
  const p = S.profile;
  shell('pwofil', `
    <section class="grid-stats">
      <div class="stat"><b>${ic('flame', 'fire-ic')} ${streakNow()}</b><span>Jou youn dèyè lòt</span></div>
      <div class="stat"><b>${ic('star', 'xp-ic')} ${S.xp}</b><span>XP total</span></div>
      <div class="stat"><b>${ic('check', 'ok-ic')} ${mastered}</b><span>Fraz ou metrize</span></div>
      <div class="stat"><b>${ic('book-open', 'blue-ic')} ${doneCount}/${LESSONS.length}</b><span>Leson fini</span></div>
    </section>
    <section class="panel">
      <h2>Chemen ou</h2>
      <ul class="my-paths">${p.paths.map((id) => `<li>${ptile(PATH.get(id), 'sm')}${esc(PATH.get(id).non)}</li>`).join('')}</ul>
      <p class="muted"><b>Nivo:</b> ${esc(LEVELS.find((l) => l.id === p.level)?.label || '')} · <b>${p.minutes} minit</b> pa jou · ${learning} fraz w ap aprann</p>
      <div class="row">
        <a class="btn secondary" href="#kesyon-2" data-edit>Chanje chemen</a>
        <a class="btn ghost" href="#kesyon-1" data-edit>Chanje tout preferans yo</a>
      </div>
    </section>
    <section class="panel device">
      <h2>Telefòn ou</h2>
      <p class="note ${canSpeak ? 'ok' : ''}">${ic('volume-2')}<span>${canSpeak ? 'Vwa anglè a mache.' : 'Telefòn ou pa ka li fraz anglè yo byen fò. Eseye ak Chrome (Android) oswa Safari (iPhone).'}</span></p>
      <p class="note ${canListen ? 'ok' : ''}">${ic('mic')}<span>${canListen ? 'Egzèsis pale yo mache.' : 'Egzèsis pale yo mache sèlman nan Chrome (Android) ak Safari (iPhone). Ou ka sote yo.'}</span></p>
    </section>
    <button class="btn ghost danger-text" data-reset>Efase tout pwogrè mwen</button>
    <p class="foot-note muted small">Koze v0.3 · Tout pwogrè ou rete sou telefòn ou.</p>`, { title: 'Pwofil' });
  $$('[data-edit]').forEach((a) => (a.onclick = () => { draft = null; }));
  $('[data-reset]').onclick = async () => {
    if (await ask('Ou sèten? Tout pwogrè ou ap efase.', 'Efase', true)) { S = store.reset(); redirect('#byenvini'); }
  };
}

// ================================================================ leson / revizyon

function startLesson(lesson) {
  session = { hash: `#leson-${lesson.id}`, back: '#aprann', done: false };
  run({ kind: 'lesson', lesson, steps: buildLesson(lesson, S.profile), items: lesson.items });
}

function startReview() {
  session = { hash: '#revizyon', back: '#revize', done: false };
  const items = dueNow().slice(0, REVIEW_SIZE).map((id) => ITEM.get(id));
  run({ kind: 'review', steps: buildReview(items, S.items), items });
}

function run({ kind, lesson, steps, items }) {
  const me = session;
  const queue = steps.slice();
  let pos = 0;
  let xp = 0;
  let firstTries = 0;
  let firstOk = 0;
  const missed = new Set();

  const frame = (body, foot) => {
    const pct = Math.round((pos / queue.length) * 100);
    view(`
    <main class="run">
      <h1 class="sr">${kind === 'lesson' ? `Leson: ${esc(lesson.tit)}` : 'Revizyon'}</h1>
      <div class="run-top">
        <button class="icon-btn" data-quit aria-label="Kite">${ic('x', 'lg')}</button>
        <div class="bar" role="progressbar" aria-label="Pwogrè" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div>
      </div>
      <p class="offline" hidden>${ic('wifi-off')} San entènèt. Koze ap mache kanmenm.</p>
      <div class="run-body">${body}</div>
      <div class="run-foot" aria-live="polite">${foot}</div>
    </main>`);
    $('[data-quit]').onclick = async () => {
      if (await ask('Ou vle kite? Pwogrè sa a ap pèdi.', 'Wi, kite')) {
        window.speechSynthesis?.cancel();
        session = null;
        redirect(me.back);
      }
    };
  };

  const next = () => {
    if (session !== me) return;
    if (pos >= queue.length) return finish();
    const st = queue[pos];
    if (DEBUG) window.__kozeStep = st;
    ({ situation, intro, choose_ht: choice, choose_en: choice, listen: choice, order, type, speak })[st.type](st);
  };
  const advance = () => { pos += 1; next(); };

  // Rezilta yon egzèsis: fèy anba a ak maskòt la.
  const result = (st, ok, { close = false, given = '' } = {}) => {
    if (!st.retry) {
      firstTries += 1;
      if (ok) { firstOk += 1; xp += 10; }
    }
    if (!ok) {
      missed.add(st.item.id);
      queue.push({ ...st, retry: true }); // fraz ou rate a ap tounen pita
    }
    vibrate(ok ? 25 : [40, 60, 40]);
    if (ok) say(st.item.en);
    const foot = $('.run-foot');
    foot.innerHTML = `
      <div class="fb ${ok ? 'ok' : 'bad'}">
        <div class="fb-head">
          ${maskot(ok ? 'kontan' : 'ankouraje', 'fb-maskot')}
          <div>
            <p class="fb-title">${ok ? ic('check') : ic('x')}${ok ? (close ? 'Prèske pafè!' : pick(PRAISE)) : pick(COMFORT)}</p>
            ${ok && !close ? '' : `<p class="fb-label">${ok ? 'Gade yon ti fòt:' : 'Bon repons lan:'}</p>`}
          </div>
        </div>
        ${given && !ok ? `<p class="fb-given">Ou te mete: <s>${esc(given)}</s></p>` : ''}
        <p class="fb-en">${esc(st.item.en)} <button class="mini-say" data-say aria-label="Koute">${ic('volume-2')}</button></p>
        <p class="fb-ht">${esc(st.item.ht)} · <i>${esc(st.item.son)}</i></p>
        ${!ok ? '<p class="fb-again">Fraz sa a ap tounen nan fen leson an.</p>' : ''}
        <button class="btn ${ok ? 'primary' : 'danger'} big" data-continue>Kontinye</button>
      </div>`;
    $$('.run-body button, .run-body textarea').forEach((el) => (el.disabled = true));
    foot.querySelector('[data-say]').onclick = () => say(st.item.en);
    const btn = foot.querySelector('[data-continue]');
    btn.onclick = advance;
    btn.focus();
  };

  const checkBtn = (disabled = true) => `<button class="btn primary big" data-check ${disabled ? 'disabled' : ''}>Tcheke</button>`;

  // --- Sitiyasyon
  function situation({ lesson: l }) {
    const p = PATH.get(l.path);
    frame(`
      <div class="situation">
        ${ptile(p, 'xl')}
        <p class="eyebrow">${esc(p.non)} · ${l.items.length} fraz</p>
        <h2 class="sit-title">${esc(l.tit)}</h2>
        <p class="scene">${esc(l.sitiyasyon)}</p>
        <p class="goal-line">${ic('target')}<span>Apre leson sa a, ou ap ka ${esc(l.objektif)}</span></p>
        <p class="note">${ic('volume-2')}<span>${canSpeak
          ? 'Mete volim telefòn ou pou w tande pwononsyasyon an.'
          : 'Telefòn ou pa ka li anglè byen fò. Swiv « Di l konsa » pou w konnen kijan pou w pwononse.'}</span></p>
      </div>`, `<button class="btn primary big" data-go>Annou kòmanse</button>`);
    $('[data-go]').onclick = advance;
  }

  // --- Nouvo fraz
  function intro({ item }) {
    frame(`
      <p class="eyebrow">${ic('sparkles')} Nouvo fraz</p>
      <div class="card phrase">
        <span class="lang">EN</span>
        <p class="en">${esc(item.en)}</p>
        <span class="say-as"><span class="lbl">Di l konsa</span><b>${esc(item.son)}</b></span>
        <p class="kr"><span class="lang kr">KR</span>${esc(item.ht)}</p>
        ${canSpeak ? `<div class="say-row">
          <button class="btn secondary" data-say>${ic('volume-2')} Koute</button>
          <button class="btn ghost" data-slow>${ic('snail')} Dousman</button></div>` : ''}
      </div>
      <p class="muted small">Repete l byen fò 2 fwa anvan ou kontinye.</p>`,
    `<button class="btn primary big" data-go>Mwen konprann</button>`);
    $('[data-say]')?.addEventListener('click', () => say(item.en));
    $('[data-slow]')?.addEventListener('click', () => say(item.en, true));
    $('[data-go]').onclick = advance;
    say(item.en);
  }

  // --- Chwazi (3 kalite)
  function choice(st) {
    const { item, type: kind } = st;
    const field = kind === 'choose_ht' ? 'ht' : 'en';
    const lessonItems = ALL_ITEMS.filter((it) => it.id !== item.id && it.id.split('.')[0] === item.id.split('.')[0]);
    const others = shuffle(ALL_ITEMS.filter((it) => it.id !== item.id));
    const pool = [...shuffle(lessonItems), ...others].map((it) => it[field]);
    const opts = [item[field]];
    for (const o of pool) { if (opts.length >= 4) break; if (!opts.includes(o)) opts.push(o); }
    const options = shuffle(opts);

    const prompt = {
      choose_ht: `<p class="eyebrow">Kisa sa vle di?</p>
        <p class="prompt"><span class="lang">EN</span>${esc(item.en)} ${canSpeak ? `<button class="mini-say" data-say aria-label="Koute">${ic('volume-2')}</button>` : ''}</p>`,
      choose_en: `<p class="eyebrow">Kijan yo di sa an anglè?</p><p class="prompt"><span class="lang kr">KR</span>${esc(item.ht)}</p>`,
      listen: `<p class="eyebrow">Koute epi chwazi sa ou tande</p>
        <div class="listen-row">
          <button class="big-say" data-say aria-label="Koute">${ic('volume-2')}</button>
          <button class="big-say slow" data-slow aria-label="Koute dousman">${ic('snail')}</button>
        </div>`,
    }[kind];

    frame(`${prompt}
      <div class="opts" role="group" aria-label="Chwazi yon repons">${options.map((o, i) => `<button class="opt" data-i="${i}" aria-pressed="false"><span class="n">${i + 1}</span><span>${esc(o)}</span></button>`).join('')}</div>`,
    checkBtn());
    let chosen = null;
    $$('.opt').forEach((b) => (b.onclick = () => {
      $$('.opt').forEach((x) => { x.classList.remove('sel'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('sel');
      b.setAttribute('aria-pressed', 'true');
      chosen = options[+b.dataset.i];
      $('[data-check]').disabled = false;
    }));
    $('[data-say]')?.addEventListener('click', () => say(item.en));
    $('[data-slow]')?.addEventListener('click', () => say(item.en, true));
    $('[data-check]').onclick = () => {
      const ok = chosen === item[field];
      $$('.opt').forEach((b) => {
        const v = options[+b.dataset.i];
        if (v === item[field]) b.classList.add('right');
        else if (v === chosen) b.classList.add('wrong');
      });
      result(st, ok);
    };
    if (kind !== 'choose_en') say(item.en);
  }

  // --- Mete mo yo nan lòd
  function order(st) {
    const { item } = st;
    const target = words(item.en);
    const lower = new Set(target.map((w) => w.toLowerCase()));
    const extra = shuffle([...new Set(ALL_ITEMS.flatMap((it) => words(it.en)))].filter((w) => !lower.has(w.toLowerCase())))
      .slice(0, target.length > 4 ? 3 : 2);
    const tiles = shuffle([...target, ...extra]).map((w, i) => ({ w, i }));
    const answer = [];

    frame(`
      <p class="eyebrow">Mete mo yo nan lòd</p>
      <p class="prompt"><span class="lang kr">KR</span>${esc(item.ht)}</p>
      <div class="answer-line" aria-label="Repons ou"></div>
      <div class="bank" aria-label="Mo yo"></div>`, checkBtn());

    const draw = () => {
      $('.answer-line').innerHTML = answer.map((t) => `<button class="tile-w" data-a="${t.i}">${esc(t.w)}</button>`).join('');
      $('.bank').innerHTML = tiles.map((t) => `<button class="tile-w ${answer.includes(t) ? 'used' : ''}" data-b="${t.i}" ${answer.includes(t) ? 'disabled aria-hidden="true"' : ''}>${esc(t.w)}</button>`).join('');
      $$('[data-b]').forEach((b) => (b.onclick = () => { answer.push(tiles.find((t) => t.i === +b.dataset.b)); draw(); }));
      $$('[data-a]').forEach((b) => (b.onclick = () => { answer.splice(answer.findIndex((t) => t.i === +b.dataset.a), 1); draw(); }));
      $('[data-check]').disabled = answer.length === 0;
    };
    draw();
    $('[data-check]').onclick = () => {
      const given = answer.map((t) => t.w).join(' ');
      result(st, norm(given) === norm(item.en), { given });
    };
  }

  // --- Ekri
  function type(st) {
    const { item } = st;
    frame(`
      <p class="eyebrow">Ekri sa an anglè</p>
      <p class="prompt"><span class="lang kr">KR</span>${esc(item.ht)}</p>
      <label class="sr" for="type-in">Repons ou an anglè</label>
      <textarea id="type-in" class="type-in" rows="2" autocapitalize="sentences" autocomplete="off" autocorrect="off" spellcheck="false"
        placeholder="Tape an anglè…"></textarea>
      <button class="hint-btn" data-hint>${ic('lightbulb')} Ede m ak premye mo a</button>
      <p class="hint muted" aria-live="polite"></p>`, checkBtn());
    const inp = $('.type-in');
    inp.focus();
    inp.oninput = () => { $('[data-check]').disabled = !inp.value.trim(); };
    inp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); if (inp.value.trim()) $('[data-check]').click(); } };
    $('[data-hint]').onclick = () => { $('.hint').textContent = `Li kòmanse ak: "${words(item.en)[0]} …"`; };
    $('[data-check]').onclick = () => {
      const m = typedMatch(inp.value, item.en);
      result(st, m !== 'wrong', { close: m === 'close', given: inp.value.trim() });
    };
  }

  // --- Pale
  function speak(st) {
    const { item } = st;
    let tries = 0;
    frame(`
      <p class="eyebrow">${ic('mic')} Di fraz sa a byen fò</p>
      <div class="card phrase">
        <p class="en">${esc(item.en)}</p>
        <span class="say-as"><span class="lbl">Di l konsa</span><b>${esc(item.son)}</b></span>
        ${canSpeak ? `<div class="say-row"><button class="btn ghost" data-say>${ic('volume-2')} Koute anvan</button></div>` : ''}
      </div>
      <button class="mic" data-mic aria-label="Peze pou w pale">${ic('mic')}</button>
      <p class="heard muted center" aria-live="polite">Peze mikwofòn nan epi pale.</p>`,
    `<button class="btn ghost big" data-skip>Mwen pa ka pale kounye a</button>`);
    $('[data-say]')?.addEventListener('click', () => say(item.en));
    $('[data-skip]').onclick = advance; // pa pini moun nan si li pa ka pale
    $('[data-mic]').onclick = async () => {
      const mic = $('[data-mic]');
      mic.classList.add('on');
      $('.heard').textContent = 'M ap koute…';
      let alts = [];
      try { alts = await listen(); } catch (e) {
        mic.classList.remove('on');
        $('.heard').textContent = e === 'not-allowed'
          ? 'Koze pa gen dwa sèvi ak mikwofòn nan. Louvri paramèt navigatè a pou w pèmèt li, oswa sote egzèsis la.'
          : 'Mikwofòn nan pa mache kounye a. Eseye ankò oswa sote egzèsis la.';
        return;
      }
      mic.classList.remove('on');
      tries += 1;
      const score = spokenScore(alts, item.en);
      if (score >= 0.75) {
        xp += 10;
        vibrate(25);
        $('.run-foot').innerHTML = `<div class="fb ok">
          <div class="fb-head">${maskot('kontan', 'fb-maskot')}<div><p class="fb-title">${ic('mic')}${pick(PRAISE)}</p>
          <p class="fb-label">Nou tande: "${esc(alts[0] || '')}"</p></div></div>
          <button class="btn primary big" data-continue>Kontinye</button></div>`;
        $('[data-continue]').onclick = advance;
        $('[data-continue]').focus();
      } else {
        $('.heard').innerHTML = alts[0]
          ? `Nou tande: "<i>${esc(alts[0])}</i>". ${tries < 3 ? 'Eseye ankò, pale klè epi pa twò vit.' : 'Pa gen pwoblèm, w ap pratike l ankò pita.'}`
          : 'Nou pa tande anyen. Eseye ankò, pi pre telefòn nan.';
      }
    };
  }

  // --- Fen: fèt
  function finish() {
    for (const it of items) S.items[it.id] = grade(S.items[it.id], !missed.has(it.id));
    if (kind === 'lesson') S.done[lesson.id] = true;
    xp += kind === 'lesson' ? 20 : 10;
    const { goalReached, streakUp } = addXp(xp);
    me.done = true;
    const acc = firstTries ? Math.round((firstOk / firstTries) * 100) : 100;
    const extra = [
      goalReached ? `<li>${ic('target')} Ou rive nan objektif ou jodi a!</li>` : '',
      streakUp ? `<li class="fire-li">${ic('flame')} Seri ou: ${S.streak} jou youn dèyè lòt!</li>` : '',
      missed.size ? `<li>${ic('brain')} ${missed.size} fraz ap tounen nan revizyon demen.</li>` : '',
    ].join('');
    view(`
    <main class="screen done">
      <div class="celebrate">${STRIPES}${maskot('kontan', 'done-maskot')}</div>
      <h1>${kind === 'lesson' ? 'Leson fini!' : 'Revizyon fini!'}</h1>
      <p class="scene">${kind === 'lesson' ? `Kounye a ou ka ${esc(lesson.objektif)}` : 'Memwa w ap vin pi fò chak jou.'}</p>
      <div class="stat-row">
        <div class="stat"><b data-count="${xp}">+${xp}</b><span>XP</span></div>
        <div class="stat"><b>${acc}%</b><span>Presizyon</span></div>
        <div class="stat"><b>${S.streak}</b><span>Jou youn dèyè lòt</span></div>
      </div>
      ${extra ? `<ul class="wins">${extra}</ul>` : ''}
      <div class="grow"></div>
      <div class="sticky-foot"><button class="btn primary big" data-home>Kontinye</button></div>
    </main>`);
    vibrate([30, 50, 30, 50, 60]);
    countUp($('[data-count]'), xp);
    const btn = $('[data-home]');
    btn.focus();
    btn.onclick = () => { session = null; redirect(me.back); };
  }

  next();
}

// XP a monte (si moun nan pa mande mwens mouvman).
function countUp(el, to) {
  if (!el || reduceMotion()) return;
  const t0 = performance.now();
  const dur = 700;
  const tick = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    el.textContent = `+${Math.round(to * (1 - (1 - k) ** 3))}`;
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ================================================================ klavye

// 1-4 pou chwazi, Enter pou tcheke / kontinye.
document.addEventListener('keydown', (e) => {
  if (e.target.matches('textarea, input') || document.querySelector('.modal')) return;
  const opt = $(`.opt[data-i="${+e.key - 1}"]`);
  if (opt && !opt.disabled) return opt.click();
  if (e.key === 'Enter' && !e.target.matches('a, button, summary')) {
    const b = $('[data-continue]') || $('[data-check]:not([disabled])') || $('[data-go]');
    if (b) { e.preventDefault(); b.click(); }
  }
});

// ================================================================ demaraj

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

render();
booting = false;
