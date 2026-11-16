import { PATHS, GOALS, GOAL_TO_PATH, LEVELS, MINUTES, LESSONS } from './data.js';
import * as store from './store.js';
import { grade, dueIds, MASTERED_BOX } from './srs.js';
import { say, canSpeak, canListen, listen, stopListening, setAudioIndex, preload, stopSpeaking } from './speech.js';
import { buildLesson, buildReview } from './lesson.js';
import { esc, shuffle, pick, typedMatch, spokenMatch, norm, words } from './util.js';
import { SPRITE } from './icons.js';
import { sfx, sfxOn, setSfx } from './sfx.js';
import * as cloud from './cloud.js';
import { PAGES } from './pages.js';
const oauthHash = cloud.grabOAuthHash(); // avan routeur la wè #access_token

document.body.insertAdjacentHTML('afterbegin', SPRITE);

// ================================================================ ti zouti

const ic = (name, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const LOGO = `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><clipPath id="kz-b"><path d="M14 8h36a10 10 0 0 1 10 10v22a10 10 0 0 1-10 10H30l-12 10v-10h-4A10 10 0 0 1 4 40V18A10 10 0 0 1 14 8z"/></clipPath></defs><g clip-path="url(#kz-b)"><rect width="64" height="29" fill="#0b2bb8"/><rect y="29" width="64" height="35" fill="#d21034"/></g><path d="M25 18v22M25 31l11-11M28.5 28l8.5 12" stroke="#fff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
const wordmark = (big = false) => `<span class="wordmark ${big ? 'big' : ''}" translate="no">${LOGO}<span>koze</span></span>`;
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
// Odyo Kokoro yo: audio/<leson>-<n>.mp3, lis yo nan audio/index.json (scripts/voice_koze.mjs).
// Nou itilize sèlman fichye ki egziste; sinon se vwa telefòn nan.
fetch('audio/index.json')
  .then((r) => (r.ok ? r.json() : {}))
  .then((idx) => {
    const files = new Set(Object.keys(idx));
    setAudioIndex(new Map(ALL_ITEMS
      .map((it) => [it.en, `${it.id.replace('.', '-')}.mp3`])
      .filter(([, f]) => files.has(f))
      .map(([en, f]) => [en, `audio/${f}`])));
  })
  .catch(() => {});
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
function ask(msg, yes, danger = false, stay = '') {
  return new Promise((resolve) => {
    const before = document.activeElement;
    const m = document.createElement('div');
    m.className = 'modal';
    m.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="ask-t"><p id="ask-t">${esc(msg)}</p>
      <div class="row">${stay
        ? `<button class="btn ghost" data-yes>${esc(yes)}</button><button class="btn primary" data-no>${esc(stay)}</button>`
        : `<button class="btn ghost" data-no>Non</button><button class="btn ${danger ? 'danger' : 'primary'}" data-yes>${esc(yes)}</button>`}</div></div>`;
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
  if (/access_token=|error_code=/.test(location.hash)) { const h = cloud.grabOAuthHash(); if (h) { authReturn(h); return; } }
  // Bouton retounen pandan yon leson: mande anvan.
  if (session && !session.done && location.hash !== session.hash) {
    const target = location.hash;
    history.pushState(null, '', session.hash);
    if (await ask('Ou vle kite? Pwogrè sa a ap pèdi.', 'Wi, kite', false, 'Kontinye')) {
      stopSpeaking(); stopListening(); store.clearRun();
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

  if (PAGES[name] && !arg) return infoScreen(name);
  if (cloud.cloudReady) {
    if (h === '#kont') return signupScreen();
    if (h === '#konekte') return loginScreen();
    if (h === '#bliye-modpas') return forgotScreen();
    if (h === '#modpas') return passwordScreen();
    if (h === '#efase-kont') return deleteAccountScreen();
  }
  if (!S.profile) {
    if (name === 'kesyon' && +arg >= 1 && +arg <= 4) return setup(+arg);
    if (h !== '#byenvini') return redirect('#byenvini');
    return welcome();
  }
  if (name === 'kesyon' && +arg >= 1 && +arg <= 4) return setup(+arg);
  if (name === 'leson') {
    const lesson = LESSON.get(arg);
    if (!lesson || !unlockedSet().has(lesson.id)) return redirect('#aprann');
    if (session?.hash === h) return;
    const saved = savedRun(h);
    if (saved) return startLesson(lesson, saved); // rafrechi oswa retounen: kontinye kote l te ye
    if (booting) return redirect('#aprann');
    return startLesson(lesson);
  }
  if (name === 'revizyon') {
    if (session?.hash === h) return;
    const saved = savedRun(h);
    if (saved) return startReview(saved);
    if (booting || !dueNow().length) return redirect('#revize');
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
    <p class="lead">Leson <span class="num">5</span> a <span class="num">10</span> minit ki swiv lavi ou: biznis, lekòl, vwayaj, chantye, lopital.</p>
    <div class="sample" aria-label="Egzanp yon fraz">
      <div class="sample-row"><span class="lang">EN</span><span class="en" translate="no" lang="en">Thank you very much.</span>
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
    <div class="sticky-foot"><button class="btn primary big" data-go>Kòmanse, se gratis</button>
      ${cloud.cloudReady ? '<a class="quiet-link center-link" href="#konekte">Mwen gen yon kont deja</a>' : ''}
      <p class="legal-foot"><a href="#faq">Kesyon</a> · <a href="#konfidansyalite">Konfidansyalite</a> · <a href="#kondisyon">Kondisyon</a></p></div>
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
      <span class="step-count" aria-hidden="true">${step}/${total}</span>
    </div>
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
        <h2>${esc(next.tit)}</h2>
        <p class="meta">Pwochen leson · ${esc(PATH.get(next.path).non)} · ${next.items.length} fraz</p>
        <p class="muted">${esc(next.sitiyasyon)}</p>
        <p class="goal-line">${ic('target')}<span>Apre leson sa a, ou ap ka ${esc(next.objektif)}</span></p>
        ${(() => {
          const r = savedRun(`#leson-${next.id}`);
          return r
            ? `<a class="btn primary big" href="#leson-${next.id}">${ic('play')} Kontinye leson an · ${Math.round((r.pos / r.queue.length) * 100)}%</a>`
            : `<a class="btn primary big" href="#leson-${next.id}">${ic('play')} Kòmanse leson an</a>`;
        })()}
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
    <section class="memory" aria-label="Fòs memwa ou: ${nTop} metrize, ${nMid} ap aprann, ${nNew} nouvo">
      <h2 class="section-title">Fòs memwa ou</h2>
      <div class="mem-bar" aria-hidden="true">
        ${nTop ? `<i class="top" style="flex:${nTop}"></i>` : ''}${nMid ? `<i class="mid" style="flex:${nMid}"></i>` : ''}${nNew ? `<i class="new" style="flex:${nNew}"></i>` : ''}
      </div>
      <p class="mem-legend"><span class="top"><b>${nTop}</b> metrize</span><span class="mid"><b>${nMid}</b> ap aprann</span><span class="new"><b>${nNew}</b> nouvo</span></p>
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
                <span class="pl-en" translate="no" lang="en">${esc(it.en)}</span>
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
    <section class="panel">
      <h2>Pwogrè ou</h2>
      <div class="bar" role="progressbar" aria-label="Leson fini" aria-valuemin="0" aria-valuemax="${LESSONS.length}" aria-valuenow="${doneCount}"><i style="width:${Math.round((doneCount / LESSONS.length) * 100)}%"></i></div>
      <p><span class="num">${doneCount}</span> leson fini sou <span class="num">${LESSONS.length}</span> · <b class="num">${mastered}</b> fraz metrize · <span class="num">${learning}</span> fraz w ap aprann</p>
    </section>
    <section class="panel">
      <h2>Chemen ou</h2>
      <ul class="my-paths">${p.paths.map((id) => `<li>${ptile(PATH.get(id), 'sm')}${esc(PATH.get(id).non)}</li>`).join('')}</ul>
      <p class="muted"><b>Nivo:</b> ${esc(LEVELS.find((l) => l.id === p.level)?.label || '')} · <b><span class="num">${p.minutes}</span> minit</b> pa jou</p>
      <div class="row">
        <a class="btn secondary" href="#kesyon-2" data-edit>Chanje chemen</a>
        <a class="btn ghost" href="#kesyon-1" data-edit>Chanje tout preferans yo</a>
      </div>
    </section>
    <section class="panel device">
      <h2>Telefòn ou</h2>
      <p class="note ${canSpeak ? 'ok' : ''}">${ic('volume-2')}<span>${canSpeak ? 'Vwa anglè a mache.' : 'Telefòn ou pa ka li fraz anglè yo byen fò. Eseye ak Chrome (Android) oswa Safari (iPhone).'}</span></p>
      <button class="switch" data-sfx role="switch" aria-checked="${sfxOn()}">${ic('volume-2')}<span>Son efè (bon/move repons)</span><b>${sfxOn() ? 'Wi' : 'Non'}</b></button>
      <p class="note ${canListen ? 'ok' : ''}">${ic('mic')}<span>${canListen ? 'Egzèsis pale yo mache.' : 'Egzèsis pale yo mache sèlman nan Chrome (Android) ak Safari (iPhone). Ou ka sote yo.'}</span></p>
    </section>
    ${cloud.cloudReady ? accountPanel() : ''}
    <section class="panel">
      <h2>Èd ak enfòmasyon</h2>
      <ul class="link-list">
        <li><a href="#faq">${ic('circle-help')}<span>Kesyon moun poze</span>${ic('chevron-right')}</a></li>
        <li><a href="#konfidansyalite">${ic('shield-check')}<span>Règ konfidansyalite</span>${ic('chevron-right')}</a></li>
        <li><a href="#kondisyon">${ic('file-text')}<span>Kondisyon itilizasyon</span>${ic('chevron-right')}</a></li>
      </ul>
    </section>
    <button class="quiet-link" data-reset>Efase tout pwogrè mwen</button>
    <p class="foot-note muted small">Koze v0.6 · ${cloud.currentUser() ? 'Pwogrè ou sove nan kont ou.' : 'Tout pwogrè ou rete sou telefòn ou.'}</p>`, { title: 'Pwofil' });
  $$('[data-edit]').forEach((a) => (a.onclick = () => { draft = null; }));
  $('[data-sfx]').onclick = (e) => {
    const on = !sfxOn();
    setSfx(on);
    const b = e.currentTarget;
    b.setAttribute('aria-checked', String(on));
    b.querySelector('b').textContent = on ? 'Wi' : 'Non';
    if (on) sfx('ok');
  };
  $('[data-reset]').onclick = async () => {
    const msg = cloud.currentUser() ? 'Ou sèten? Tout pwogrè ou ap efase, sou telefòn sa a ak nan kont ou.' : 'Ou sèten? Tout pwogrè ou ap efase.';
    if (await ask(msg, 'Efase', true)) { store.clearRun(); if (cloud.currentUser()) await cloud.removeRemote(); S = store.reset(); redirect('#byenvini'); }
  };
  $('[data-signout]')?.addEventListener('click', async () => {
    if (await ask('Dekonekte? Pwogrè ou rete sou telefòn sa a ak nan kont ou.', 'Dekonekte')) { await cloud.signOut(); toast('Ou dekonekte.'); render(); }
  });
  $('[data-sync]')?.addEventListener('click', async (e) => {
    e.currentTarget.disabled = true;
    const ok = await sync({ force: true });
    toast(ok ? 'Pwogrè ou sove.' : 'Pa ka sove kounye a. Eseye ankò pita.');
    if (location.hash === '#pwofil') render();
  });
}

// Retounen apre lyen imèl la oswa Google (paj nèf, oswa Koze ki te deja louvri).
async function authReturn(hash) {
  if (!hash) return false;
  const back = await cloud.takeOAuthRedirect(hash);
  if (back === 'error') { toast('Lyen sa a ekspire oswa li deja sèvi. Mande yon nouvo lyen.'); redirect('#kont'); return true; }
  if (back === 'recovery') { recovering = true; redirect('#modpas'); return true; }
  if (back) { await sync({ force: true }); toast(back === 'signup' ? 'Imèl ou konfime. Pwogrè ou sove.' : 'Ou konekte. Pwogrè ou sove.'); redirect(S.profile ? '#pwofil' : '#byenvini'); return true; }
  return false;
}

// ================================================================ kont (Supabase)

// Mete pwogrè telefòn nan ak pa kont lan ansanm, epi sove rezilta a nan kont lan.
let syncing = null;
function sync({ force = false } = {}) {
  if (!cloud.cloudReady || !cloud.currentUser() || (!force && navigator.onLine === false)) return Promise.resolve(false);
  syncing ??= (async () => {
    try {
      const remote = await cloud.pull();
      const merged = store.merge(S, remote);
      const changed = JSON.stringify(merged) !== JSON.stringify(S);
      S = merged;
      save();
      await cloud.push(S);
      try { localStorage.setItem('koze.synced', String(Date.now())); } catch { /* */ }
      if (changed && !session && /^#(aprann|revize|pwofil)?$/.test(location.hash)) render();
      return true;
    } catch { return false; } finally { syncing = null; }
  })();
  return syncing;
}

function syncedLabel() {
  const t = +(localStorage.getItem('koze.synced') || 0);
  if (!t) return 'poko sove';
  const min = Math.round((Date.now() - t) / 60000);
  return min < 1 ? 'kounye a' : min < 60 ? `sa gen ${min} minit` : `sa gen ${Math.round(min / 60)} è`;
}

function accountPanel() {
  const u = cloud.currentUser();
  return u ? `
    <section class="panel">
      <h2>Kont ou</h2>
      <p class="acct">${ic('user-round')}<span translate="no">${esc(u.email)}</span></p>
      <p class="muted">Dènye fwa pwogrè ou sove: ${syncedLabel()}.</p>
      <div class="row">
        <button class="btn secondary" data-sync>${ic('refresh-cw')} Sove kounye a</button>
        <button class="btn ghost" data-signout>Dekonekte</button>
      </div>
      <ul class="link-list">
        <li><a href="#modpas">${ic('key-round')}<span>Chanje modpas</span>${ic('chevron-right')}</a></li>
        <li><a href="#efase-kont" class="danger-link">${ic('trash-2')}<span>Efase kont mwen</span>${ic('chevron-right')}</a></li>
      </ul>
    </section>` : `
    <section class="panel">
      <h2>Kont ou</h2>
      <p class="muted">Kreye yon kont gratis pou w pa pèdi pwogrè ou si w chanje telefòn, epi pou w aprann sou plizyè aparèy.</p>
      <div class="row"><a class="btn secondary" href="#kont">Kreye kont</a><a class="btn ghost" href="#konekte">Konekte</a></div>
    </section>`;
}

// ---------------------------------------------------------------- ekran kont yo
// #kont (kreye kont) · #konekte · #bliye-modpas · #modpas (chanje) · #efase-kont
let lastEmail = ''; // imèl moun nan te tape a, pou l pa tape l de fwa
let recovering = false; // moun nan sot peze lyen « Reset Password » la: li pa bezwen ansyen modpas la
const homeHash = () => (S.profile ? '#pwofil' : '#byenvini');
const goBack = () => (history.length > 1 ? history.back() : redirect(homeHash()));

const pwField = (id, label, auto, rules = false) => `
  <label for="${id}">${label}</label>
  <div class="pw">
    <input id="${id}" name="${id}" type="password" autocomplete="${auto}" autocapitalize="off" spellcheck="false" required
      minlength="${cloud.PW_MIN}" maxlength="${cloud.PW_MAX}" ${rules ? `aria-describedby="${id}-rules"` : ''}>
    <button type="button" class="pw-eye" data-eye="${id}" aria-label="Montre modpas la" aria-pressed="false">${ic('eye')}</button>
  </div>
  ${rules ? `<ul class="pw-rules" id="${id}-rules">
    <li data-r="len">${ic('check')}<span>Omwen ${cloud.PW_MIN} karaktè</span></li>
    <li data-r="mix">${ic('check')}<span>Lèt ak chif</span></li>
    <li data-r="safe">${ic('check')}<span>Pa fasil pou devine (pa « 12345678 », pa non imèl ou)</span></li>
  </ul>` : ''}`;
const emailField = (email = '') => `
  <label for="acct-email">Imèl ou</label>
  <input id="acct-email" name="email" type="email" inputmode="email" autocomplete="username" autocapitalize="off" spellcheck="false" required placeholder="egzanp@gmail.com" value="${esc(email)}">`;
const legalLine = (what) => `<p class="muted small legal">${what} <a href="#kondisyon">Kondisyon yo</a> ak <a href="#konfidansyalite">Règ konfidansyalite a</a>.</p>`;
const authTabs = (on) => `
  <nav class="seg" aria-label="Kont">
    <a href="#kont" ${on === 'kont' ? 'aria-current="page"' : ''}>Kreye kont</a>
    <a href="#konekte" ${on === 'konekte' ? 'aria-current="page"' : ''}>Konekte</a>
  </nav>`;
const authPage = (body) => view(`
  <main class="screen setup account">
    <div class="run-top"><button class="icon-btn" data-back aria-label="Retounen">${ic('arrow-left', 'lg')}</button></div>
    ${body}
  </main>`);
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

// Zouti fòm: mesaj erè, bouton okipe, je modpas, règ modpas yo an dirèk.
function wireForm(onSubmit) {
  $('[data-back]').onclick = goBack;
  const form = $('[data-form]');
  const errEl = $('.form-err');
  const btn = form.querySelector('[type=submit]');
  const label = btn.textContent;
  const err = (t) => { errEl.textContent = t; };
  $$('[data-eye]').forEach((b) => (b.onclick = () => {
    const inp = $('#' + b.dataset.eye);
    const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    b.setAttribute('aria-pressed', String(show));
    b.setAttribute('aria-label', show ? 'Kache modpas la' : 'Montre modpas la');
    b.innerHTML = ic(show ? 'eye-off' : 'eye');
  }));
  const rules = $('.pw-rules');
  const live = () => {
    err('');
    if (!rules) return;
    const r = cloud.passwordRules($('#' + rules.id.replace('-rules', '')).value, $('#acct-email')?.value || cloud.currentUser()?.email || '');
    for (const li of rules.children) li.classList.toggle('ok', r[li.dataset.r]);
  };
  form.addEventListener('input', live);
  form.onsubmit = async (e) => {
    e.preventDefault();
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = 'Tann yon ti moman…';
    try { await onSubmit({ err, form }); } catch (x) { err(cloud.errorText(x)); }
    if (btn.isConnected) { btn.disabled = false; btn.textContent = label; }
  };
  return { err };
}

async function signedIn(msg) {
  recovering = false;
  await sync({ force: true });
  sfx('ok');
  toast(msg);
  redirect(homeHash());
}

function signupScreen() {
  if (cloud.currentUser()) return redirect(homeHash());
  authPage(`
    ${authTabs('kont')}
    <h1>Kreye kont Koze ou</h1>
    <p class="muted">Gratis. Pwogrè ou ap sove: ou p ap pèdi l si w chanje telefòn.</p>
    <form class="acct-form" data-form novalidate>
      ${emailField()}
      ${pwField('acct-pw', 'Chwazi yon modpas', 'new-password', true)}
      <label class="agree"><input type="checkbox" id="acct-agree" required>
        <span>Mwen gen omwen 13 an, epi mwen dakò ak <a href="#kondisyon">Kondisyon yo</a> ak <a href="#konfidansyalite">Règ konfidansyalite a</a>.</span></label>
      <p class="form-err" role="alert" aria-live="polite"></p>
      <button class="btn primary big" type="submit">Kreye kont mwen</button>
    </form>
    ${cloud.googleReady ? `<p class="or">oswa</p><a class="btn ghost big" href="${esc(cloud.googleUrl())}">Kontinye ak Google</a>` : ''}
    <a class="quiet-link center-link" href="#konekte">Mwen gen yon kont deja</a>`);
  $('#acct-email').focus();
  wireForm(async ({ err }) => {
    const email = $('#acct-email').value.trim().toLowerCase();
    const pw = $('#acct-pw').value;
    if (!validEmail(email)) { err('Adrès imèl sa a pa bon. Tcheke l epi eseye ankò.'); return $('#acct-email').focus(); }
    const r = cloud.passwordRules(pw, email);
    if (!r.ok) { err(!r.len ? `Modpas la dwe gen omwen ${cloud.PW_MIN} karaktè.` : !r.mix ? 'Mete lèt ak chif nan modpas la.' : 'Modpas sa a twò fasil pou devine. Chwazi yon lòt.'); return $('#acct-pw').focus(); }
    if (!$('#acct-agree').checked) { err('Tcheke kare a pou w dakò ak kondisyon yo.'); return $('#acct-agree').focus(); }
    const res = await cloud.signUp(email, pw);
    if (res === 'session') return signedIn('Kont ou kreye. Pwogrè ou sove.');
    checkEmailScreen('confirm', email);
  });
}

function loginScreen(email = lastEmail) {
  if (cloud.currentUser()) return redirect(homeHash());
  authPage(`
    ${authTabs('konekte')}
    <h1>Konekte</h1>
    <form class="acct-form" data-form novalidate>
      ${emailField(email)}
      ${pwField('acct-pw', 'Modpas', 'current-password')}
      <a class="quiet-link forgot" href="#bliye-modpas">Ou bliye modpas ou?</a>
      <p class="form-err" role="alert" aria-live="polite"></p>
      <button class="btn primary big" type="submit">Konekte</button>
    </form>
    ${cloud.googleReady ? `<p class="or">oswa</p><a class="btn ghost big" href="${esc(cloud.googleUrl())}">Kontinye ak Google</a>` : ''}
    <a class="quiet-link center-link" href="#kont">Mwen poko gen kont</a>`);
  (email ? $('#acct-pw') : $('#acct-email')).focus();
  $('.forgot').onclick = () => { lastEmail = $('#acct-email').value.trim(); };
  wireForm(async ({ err }) => {
    const em = $('#acct-email').value.trim().toLowerCase();
    if (!validEmail(em)) { err('Adrès imèl sa a pa bon. Tcheke l epi eseye ankò.'); return $('#acct-email').focus(); }
    if (!$('#acct-pw').value) { err('Ekri modpas ou.'); return $('#acct-pw').focus(); }
    try {
      await cloud.signIn(em, $('#acct-pw').value);
    } catch (x) {
      if (/email_not_confirmed|not confirmed/i.test(`${x.code} ${x.message}`)) return checkEmailScreen('confirm', em, true);
      $('#acct-pw').select();
      throw x;
    }
    await signedIn('Ou konekte. Pwogrè ou sove.');
  });
}

function forgotScreen() {
  authPage(`
    <h1>Ou bliye modpas ou?</h1>
    <p class="muted">Ekri imèl kont ou. N ap voye yon lyen pou w chwazi yon nouvo modpas.</p>
    <form class="acct-form" data-form novalidate>
      ${emailField(lastEmail)}
      <p class="form-err" role="alert" aria-live="polite"></p>
      <button class="btn primary big" type="submit">Voye lyen an</button>
    </form>`);
  $('#acct-email').focus();
  wireForm(async ({ err }) => {
    const email = $('#acct-email').value.trim().toLowerCase();
    if (!validEmail(email)) { err('Adrès imèl sa a pa bon. Tcheke l epi eseye ankò.'); return $('#acct-email').focus(); }
    await cloud.sendReset(email);
    lastEmail = email;
    checkEmailScreen('reset', email);
  });
}

// « Gade imèl ou »: apre kreye kont (konfime) oswa bliye modpas (reset).
function checkEmailScreen(kind, email, notConfirmed = false) {
  const link = kind === 'reset' ? 'Reset Password' : 'Confirm your mail';
  authPage(`
    <h1>Gade imèl ou</h1>
    ${notConfirmed ? '<p class="note">Ou poko konfime imèl ou. Peze lyen nou te voye a, oswa mande yon lòt anba a.</p>' : ''}
    <ol class="steps">
      <li>Louvri imèl nou voye bay <b translate="no">${esc(email)}</b> <b>sou telefòn sa a</b>.</li>
      <li>Peze lyen <b translate="no" lang="en">« ${link} »</b> ki ladan l.</li>
      <li>${kind === 'reset' ? 'Koze ap louvri pou w chwazi yon nouvo modpas.' : 'Koze ap louvri epi w ap konekte.'}</li>
    </ol>
    <p class="muted small">Ou pa wè imèl la? Gade nan « Spam » oswa « Promosyon ». Li ka pran 1 minit. Lyen an mache yon sèl fwa.</p>
    <p class="form-err" role="alert" aria-live="polite"></p>
    <div class="row center-row"><button class="quiet-link" data-resend>Voye imèl la ankò</button><a class="quiet-link" href="#konekte">Retounen nan Konekte</a></div>`);
  $('[data-back]').onclick = goBack;
  $('[data-resend]').onclick = async (e) => {
    const b = e.currentTarget;
    b.disabled = true;
    try { await (kind === 'reset' ? cloud.sendReset(email) : cloud.resendConfirm(email)); toast('Nou voye imèl la ankò.'); }
    catch (x) { $('.form-err').textContent = cloud.errorText(x); }
    setTimeout(() => { if (b.isConnected) b.disabled = false; }, 30_000); // pa voye 10 imèl youn dèyè lòt
  };
}

function passwordScreen() {
  if (!cloud.currentUser()) return redirect('#konekte');
  const needOld = !recovering;
  authPage(`
    <h1>${needOld ? 'Chanje modpas ou' : 'Chwazi yon nouvo modpas'}</h1>
    <form class="acct-form" data-form novalidate>
      <input type="email" autocomplete="username" value="${esc(cloud.currentUser().email)}" hidden>
      ${needOld ? pwField('acct-old', 'Modpas ou genyen kounye a', 'current-password') : ''}
      ${pwField('acct-pw', 'Nouvo modpas', 'new-password', true)}
      <p class="form-err" role="alert" aria-live="polite"></p>
      <button class="btn primary big" type="submit">Sove nouvo modpas la</button>
    </form>`);
  $(needOld ? '#acct-old' : '#acct-pw').focus();
  wireForm(async ({ err }) => {
    const pw = $('#acct-pw').value;
    const r = cloud.passwordRules(pw, cloud.currentUser().email);
    if (!r.ok) { err(!r.len ? `Modpas la dwe gen omwen ${cloud.PW_MIN} karaktè.` : !r.mix ? 'Mete lèt ak chif nan modpas la.' : 'Modpas sa a twò fasil pou devine. Chwazi yon lòt.'); return $('#acct-pw').focus(); }
    if (needOld) {
      if (!$('#acct-old').value) { err('Ekri modpas ou genyen kounye a.'); return $('#acct-old').focus(); }
      try { await cloud.checkPassword($('#acct-old').value); } catch (x) {
        $('#acct-old').select();
        if (x.status === 400) { err('Modpas ou genyen kounye a pa bon.'); return; }
        throw x;
      }
    }
    await cloud.setPassword(pw);
    recovering = false;
    sfx('ok');
    toast('Nouvo modpas ou sove.');
    redirect(homeHash());
  });
}

function deleteAccountScreen() {
  if (!cloud.currentUser()) return redirect('#konekte');
  authPage(`
    <h1>Efase kont ou</h1>
    <p>Kont <b translate="no">${esc(cloud.currentUser().email)}</b> ak tout pwogrè ki sove ladan l ap efase <b>nèt</b>. Ou p ap ka jwenn yo ankò.</p>
    <p class="muted">Pwogrè ki sou telefòn sa a ap rete, men l p ap sove okenn kote ankò.</p>
    <form class="acct-form" data-form novalidate>
      <input type="email" autocomplete="username" value="${esc(cloud.currentUser().email)}" hidden>
      ${pwField('acct-pw', 'Ekri modpas ou pou konfime', 'current-password')}
      <p class="form-err" role="alert" aria-live="polite"></p>
      <button class="btn danger big" type="submit">${ic('trash-2')} Efase kont mwen nèt</button>
    </form>`);
  $('#acct-pw').focus();
  wireForm(async ({ err }) => {
    if (!$('#acct-pw').value) { err('Ekri modpas ou.'); return $('#acct-pw').focus(); }
    try { await cloud.checkPassword($('#acct-pw').value); } catch (x) {
      $('#acct-pw').select();
      if (x.status === 400) { err('Modpas la pa bon.'); return; }
      throw x;
    }
    await cloud.deleteAccount();
    try { localStorage.removeItem('koze.synced'); localStorage.removeItem('koze.offered'); } catch { /* */ }
    toast('Kont ou efase.');
    redirect(homeHash());
  });
}

// FAQ, Konfidansyalite, Kondisyon.
function infoScreen(id) {
  const p = PAGES[id];
  view(`
  <main class="screen info">
    <div class="run-top"><button class="icon-btn" data-back aria-label="Retounen">${ic('arrow-left', 'lg')}</button></div>
    <h1>${p.title}</h1>
    <article class="prose">${p.body()}</article>
    <nav class="info-links" aria-label="Lòt paj">
      ${Object.entries(PAGES).filter(([k]) => k !== id).map(([k, x]) => `<a href="#${k}">${x.title}${ic('chevron-right')}</a>`).join('')}
    </nav>
  </main>`);
  $('[data-back]').onclick = goBack;
}

// ================================================================ leson / revizyon

// Leson ki te an kou (si l koresponn ak adrès la epi tout fraz li yo egziste toujou).
const deser = (x) => ({ type: x.t, item: x.i ? ITEM.get(x.i) : undefined, lesson: x.l ? LESSON.get(x.l) : undefined, retry: !!x.r });
function savedRun(hash) {
  const r = store.loadRun();
  if (!r || r.hash !== hash) return null;
  const ok = r.queue.every((x) => (!x.i || ITEM.has(x.i)) && (!x.l || LESSON.has(x.l))) && r.itemIds.every((id) => ITEM.has(id));
  return ok && r.pos < r.queue.length ? r : null;
}

function startLesson(lesson, resume = null) {
  session = { hash: `#leson-${lesson.id}`, back: '#aprann', done: false };
  preload(lesson.items.map((it) => it.en));
  run({ kind: 'lesson', lesson, steps: resume ? resume.queue.map(deser) : buildLesson(lesson, S.profile), items: lesson.items, resume });
}

function startReview(resume = null) {
  session = { hash: '#revizyon', back: '#revize', done: false };
  const items = resume ? resume.itemIds.map((id) => ITEM.get(id)) : dueNow().slice(0, REVIEW_SIZE).map((id) => ITEM.get(id));
  preload(items.map((it) => it.en));
  run({ kind: 'review', steps: resume ? resume.queue.map(deser) : buildReview(items, S.items), items, resume });
}

function run({ kind, lesson, steps, items, resume = null }) {
  const me = session;
  const queue = steps.slice();
  let pos = resume?.pos ?? 0;
  let xp = resume?.xp ?? 0;
  let firstTries = resume?.firstTries ?? 0;
  let firstOk = resume?.firstOk ?? 0;
  const missed = new Set(resume?.missed ?? []);
  // Sonje kote moun nan ye, pou si l rafrechi paj la.
  const persist = () => store.saveRun({
    hash: me.hash, kind, itemIds: items.map((it) => it.id), pos, xp, firstTries, firstOk, missed: [...missed],
    queue: queue.map((x) => ({ t: x.type, i: x.item?.id, l: x.lesson?.id, r: x.retry ? 1 : 0 })),
  });

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
      if (await ask('Ou vle kite? Pwogrè sa a ap pèdi.', 'Wi, kite', false, 'Kontinye')) {
        stopSpeaking();
        store.clearRun();
        session = null;
        redirect(me.back);
      }
    };
  };

  const next = () => {
    if (session !== me) return;
    if (pos >= queue.length) return finish();
    persist();
    const st = queue[pos];
    if (DEBUG) window.__kozeStep = st;
    ({ situation, intro, choose_ht: choice, choose_en: choice, listen: choice, order, type, speak })[st.type](st);
  };
  const advance = () => { stopListening(); pos += 1; next(); };

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
    sfx(ok ? 'ok' : 'bad');
    if (ok) setTimeout(() => say(st.item.en), 450); // kite son an fini anvan vwa a
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
        <p class="fb-en"><span translate="no" lang="en">${esc(st.item.en)}</span> <button class="mini-say" data-say aria-label="Koute">${ic('volume-2')}</button></p>
        <p class="fb-ht">${esc(st.item.ht)} · <i>${esc(st.item.son)}</i></p>
        ${!ok ? '<p class="fb-again">Fraz sa a ap tounen nan fen leson an.</p>' : ''}
        <button class="btn ${ok ? 'primary' : 'ink'} big" data-continue>Kontinye</button>
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
        <h2 class="sit-title">${esc(l.tit)}</h2>
        <p class="meta">${esc(p.non)} · ${l.items.length} fraz</p>
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
      <p class="instr">${ic('sparkles')} Nouvo fraz</p>
      <div class="card phrase">
        <span class="lang">EN</span>
        <p class="en" translate="no" lang="en">${esc(item.en)}</p>
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
      choose_ht: `<p class="instr">Kisa sa vle di?</p>
        <p class="prompt"><span class="lang">EN</span><span translate="no" lang="en">${esc(item.en)}</span> ${canSpeak ? `<button class="mini-say" data-say aria-label="Koute">${ic('volume-2')}</button>` : ''}</p>`,
      choose_en: `<p class="instr">Kijan yo di sa an anglè?</p><p class="prompt"><span class="lang kr">KR</span>${esc(item.ht)}</p>`,
      listen: `<p class="instr">Koute epi chwazi sa ou tande.</p>
        <div class="listen-row">
          <button class="big-say" data-say aria-label="Koute">${ic('volume-2')}</button>
          <button class="big-say slow" data-slow aria-label="Koute dousman">${ic('snail')}</button>
        </div>`,
    }[kind];

    frame(`${prompt}
      <div class="opts" role="group" aria-label="Chwazi yon repons">${options.map((o, i) => `<button class="opt" data-i="${i}" aria-pressed="false"><span class="n">${i + 1}</span><span ${field === 'en' ? 'translate="no" lang="en"' : ''}>${esc(o)}</span></button>`).join('')}</div>`,
    checkBtn());
    let chosen = null;
    $$('.opt').forEach((b) => (b.onclick = () => {
      $$('.opt').forEach((x) => { x.classList.remove('sel'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('sel');
      b.setAttribute('aria-pressed', 'true');
      sfx('tap');
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
      <p class="instr">Mete mo yo nan bon lòd.</p>
      <p class="prompt"><span class="lang kr">KR</span>${esc(item.ht)}</p>
      <div class="answer-line" aria-label="Repons ou"></div>
      <div class="bank" aria-label="Mo yo"></div>`, checkBtn());

    const draw = () => {
      $('.answer-line').innerHTML = answer.map((t) => `<button class="tile-w" translate="no" lang="en" data-a="${t.i}">${esc(t.w)}</button>`).join('');
      $('.bank').innerHTML = tiles.map((t) => `<button class="tile-w ${answer.includes(t) ? 'used' : ''}" translate="no" lang="en" data-b="${t.i}" ${answer.includes(t) ? 'disabled aria-hidden="true"' : ''}>${esc(t.w)}</button>`).join('');
      $$('[data-b]').forEach((b) => (b.onclick = () => { sfx('tap'); answer.push(tiles.find((t) => t.i === +b.dataset.b)); draw(); }));
      $$('[data-a]').forEach((b) => (b.onclick = () => { sfx('tap'); answer.splice(answer.findIndex((t) => t.i === +b.dataset.a), 1); draw(); }));
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
      <p class="instr">Ekri fraz sa a an anglè.</p>
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
    $('[data-hint]').onclick = () => { $('.hint').textContent = `Li kòmanse ak: « ${words(item.en)[0]} … »`; };
    $('[data-check]').onclick = () => {
      const m = typedMatch(inp.value, item.en);
      result(st, m !== 'wrong', { close: m === 'close', given: inp.value.trim() });
    };
  }

  // --- Pale
  // Nou aksepte 60 % mo yo, ak mo ki prèske menm (aksan). Apre 2 esè, moun nan ka toujou kontinye.
  const MIC_ERR = {
    'not-allowed': 'Koze pa gen dwa sèvi ak mikwofòn nan. Peze kadna a bò adrès sit la (oswa Paramèt → Sit → Mikwofòn) epi pèmèt li.',
    'service-not-allowed': 'Navigatè sa a pa kite Koze sèvi ak mikwofòn nan. Eseye ak Chrome (Android) oswa Safari (iPhone).',
    network: 'Pou tande w, telefòn nan bezwen entènèt. Konekte w epi eseye ankò, oswa kontinye san pale.',
    start: 'Mikwofòn nan pa t ka louvri. Peze l ankò.',
    'no-speech': 'Nou pa tande anyen. Pale pi fò, pi pre telefòn nan.',
    'audio-capture': 'Nou pa jwenn mikwofòn nan. Tcheke si yon lòt app ap sèvi ak li.',
  };
  function speak(st) {
    const { item } = st;
    let tries = 0;
    let rec = null;
    frame(`
      <p class="instr">${ic('mic')} Di fraz sa a byen fò.</p>
      <div class="card phrase">
        <p class="en" translate="no" lang="en">${esc(item.en)}</p>
        <span class="say-as"><span class="lbl">Di l konsa</span><b>${esc(item.son)}</b></span>
        ${canSpeak ? `<div class="say-row"><button class="btn ghost" data-say>${ic('volume-2')} Koute anvan</button></div>` : ''}
      </div>
      <button class="mic" data-mic aria-label="Peze pou w pale">${ic('mic')}</button>
      <div class="heard center" aria-live="polite"><p class="muted">Peze mikwofòn nan, epi di fraz la.</p></div>`,
    `<button class="btn ghost big" data-skip>Mwen pa ka pale kounye a</button>`);
    const heard = (html) => { $('.heard').innerHTML = html; };
    $('[data-say]')?.addEventListener('click', () => say(item.en));
    $('[data-skip]').onclick = () => { rec?.stop(); advance(); }; // pa pini moun nan si li pa ka pale
    const mic = $('[data-mic]');
    mic.onclick = async () => {
      if (rec) { rec.stop(); return; } // dezyèm klik: kanpe
      if (navigator.onLine === false) return heard(`<p class="mic-err">${MIC_ERR.network}</p>`);
      mic.classList.add('on');
      mic.setAttribute('aria-label', 'Peze pou w kanpe');
      heard('<p class="listening">M ap koute… pale kounye a.</p>');
      rec = listen({ onInterim: (t) => heard(`<p class="listening">« ${esc(t)} »</p>`) });
      let alts = [];
      try { alts = await rec.done; } catch (e) {
        heard(`<p class="mic-err">${MIC_ERR[e] || 'Mikwofòn nan pa mache kounye a. Eseye ankò, oswa kontinye san pale.'}</p>`);
        return reset();
      }
      reset();
      if (!alts.length) return heard(`<p class="mic-err">${MIC_ERR['no-speech']}</p>`);
      tries += 1;
      const m = spokenMatch(alts, item.en);
      const colored = m.hits.length === m.words.length
        ? m.words.map((w, i) => `<span class="${m.hits[i] ? 'hit' : 'miss'}">${esc(w)}</span>`).join(' ')
        : esc(m.heard);
      if (m.score >= 0.6) {
        xp += 10;
        vibrate(25);
        sfx('ok');
        heard(`<p class="said" translate="no" lang="en">${colored}</p>`);
        $('.run-foot').innerHTML = `<div class="fb ok">
          <div class="fb-head">${maskot('kontan', 'fb-maskot')}<div><p class="fb-title">${ic('mic')}${m.score === 1 ? pick(PRAISE) : 'Byen di!'}</p>
          <p class="fb-label">Telefòn nan konprann ${Math.round(m.score * 100)}% fraz la.</p></div></div>
          <button class="btn primary big" data-continue>Kontinye</button></div>`;
        $('[data-continue]').onclick = advance;
        $('[data-continue]').focus();
      } else {
        sfx('bad');
        heard(`<p class="said" translate="no" lang="en">${colored}</p>
          <p class="muted small">Nou tande: « ${esc(m.heard)} ». Mo ki an gri yo pa t klè. ${tries < 2 ? 'Koute ankò, epi eseye ankò dousman.' : 'Pa gen pwoblèm: w ap pratike fraz sa a ankò pita.'}</p>`);
        if (tries >= 2) {
          const b = $('[data-skip]');
          b.textContent = 'Kontinye';
          b.className = 'btn primary big';
        }
      }
    };
    function reset() {
      rec = null;
      mic.classList.remove('on');
      mic.setAttribute('aria-label', 'Peze pou w pale');
    }
  }

  // --- Fen: fèt
  function finish() {
    store.clearRun();
    for (const it of items) S.items[it.id] = grade(S.items[it.id], !missed.has(it.id));
    if (kind === 'lesson') S.done[lesson.id] = true;
    xp += kind === 'lesson' ? 20 : 10;
    const { goalReached, streakUp } = addXp(xp);
    me.done = true;
    const acc = firstTries ? Math.round((firstOk / firstTries) * 100) : 100;
    const offerAccount = cloud.cloudReady && !cloud.currentUser() && kind === 'lesson' && !localStorage.getItem('koze.offered');
    sync();
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
      ${offerAccount ? `<section class="save-offer">
        <p><b>Pa pèdi pwogrè ou.</b> Kreye yon kont gratis ak imèl ou, epi kontinye sou nenpòt telefòn.</p>
        <div class="row"><a class="btn secondary" href="#kont" data-offer>Kreye yon kont</a><button class="btn ghost" data-later>Pita</button></div>
      </section>` : ''}
      ${extra ? `<ul class="wins">${extra}</ul>` : ''}
      <div class="grow"></div>
      <div class="sticky-foot"><button class="btn primary big" data-home>Kontinye</button></div>
    </main>`);
    vibrate([30, 50, 30, 50, 60]);
    sfx('done');
    countUp($('[data-count]'), xp);
    const btn = $('[data-home]');
    btn.focus();
    btn.onclick = () => { session = null; redirect(me.back); };
    $('[data-later]')?.addEventListener('click', (e) => { try { localStorage.setItem('koze.offered', '1'); } catch { /* */ } e.currentTarget.closest('.save-offer').remove(); });
    $('[data-offer]')?.addEventListener('click', () => { try { localStorage.setItem('koze.offered', '1'); } catch { /* */ } session = null; });
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
  // Lè yon nouvo vèsyon pran kontwòl, rechaje yon sèl fwa pou moun nan jwenn li touswit
  // (yon leson an kou rekòmanse kote l te ye, gras a sessionStorage).
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    location.reload();
  });
  navigator.serviceWorker.register('sw.js').then((r) => r.update()).catch(() => {});
}

render();
booting = false;

// Kont: retounen apre Google, epi senkronize an aryè plan.
(async () => {
  if (await authReturn(oauthHash)) return;
  sync();
})();
window.addEventListener('online', () => sync());
