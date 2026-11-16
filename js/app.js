import { PATHS, GOALS, GOAL_TO_PATH, LEVELS, MINUTES, LESSONS } from './data.js';
import * as store from './store.js';
import { grade, dueIds, MASTERED_BOX } from './srs.js';
import { say, canSpeak, canListen, listen } from './speech.js';
import { buildLesson, buildReview } from './lesson.js';
import { esc, shuffle, pick, typedMatch, spokenScore, norm, words } from './util.js';
import { SPRITE } from './icons.js';

document.body.insertAdjacentHTML('afterbegin', SPRITE);
const ic = (name, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const LOGO = `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><clipPath id="kz-b"><path d="M14 8h36a10 10 0 0 1 10 10v22a10 10 0 0 1-10 10H30l-12 10v-10h-4A10 10 0 0 1 4 40V18A10 10 0 0 1 14 8z"/></clipPath></defs><g clip-path="url(#kz-b)"><rect width="64" height="29" fill="#0b2bb8"/><rect y="29" width="64" height="35" fill="#d21034"/></g><path d="M25 18v22M25 31l11-11M28.5 28l8.5 12" stroke="#fff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
const wordmark = (big = false) => `<span class="wordmark ${big ? 'big' : ''}">${LOGO}<span>koze</span></span>`;
const STRIPES = '<div class="stripes" aria-hidden="true"><i></i><i></i><i></i><i></i></div>';
const ptile = (p, cls = '') => `<span class="ptile t-${p.ton} ${cls}">${ic(p.ikon, 'lg')}</span>`;

// Fenèt konfimasyon andedan app la (pi bèl pase confirm() navigatè a).
function ask(msg, yes, danger = false) {
  return new Promise((resolve) => {
    const m = document.createElement('div');
    m.className = 'modal';
    m.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><p>${esc(msg)}</p>
      <div class="row"><button class="btn ghost" data-no>Non</button><button class="btn ${danger ? 'danger' : 'primary'}" data-yes>${esc(yes)}</button></div></div>`;
    const close = (v) => { m.remove(); resolve(v); };
    m.querySelector('[data-no]').onclick = () => close(false);
    m.querySelector('[data-yes]').onclick = () => close(true);
    m.onclick = (e) => { if (e.target === m) close(false); };
    document.body.appendChild(m);
    m.querySelector('[data-no]').focus();
  });
}

const app = document.getElementById('app');
const DEBUG = new URLSearchParams(location.search).has('debug');
let S = store.load();
const save = () => store.save(S);

const ALL_ITEMS = LESSONS.flatMap((l) => l.items);
const ITEM = new Map(ALL_ITEMS.map((it) => [it.id, it]));
const PATH = new Map(PATHS.map((p) => [p.id, p]));
const PRAISE = ['Bravo!', 'Trè byen!', 'Ou fò!', 'Pafè!', 'Kontinye konsa!', 'Se sa!'];
const REVIEW_SIZE = 12;

const $ = (sel, root = app) => root.querySelector(sel);
const $$ = (sel, root = app) => [...root.querySelectorAll(sel)];
function view(html) {
  app.innerHTML = html;
  window.scrollTo(0, 0);
}

// ---------------------------------------------------------------- pwogrè

function sequence() {
  const baz = LESSONS.filter((l) => l.path === 'baz');
  const lists = S.profile.paths.map((p) => LESSONS.filter((l) => l.path === p));
  const mixed = [];
  const max = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < max; i++) lists.forEach((l) => l[i] && mixed.push(l[i]));
  return [...baz, ...mixed];
}

function unlockedSet(seq) {
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
  if (S.today.day !== today) S.today = { day: today, xp: 0 };
  S.today.xp += xp;
  S.xp += xp;
  if (S.lastDay !== today) {
    S.streak = S.lastDay === store.yesterdayKey() ? S.streak + 1 : 1;
    S.lastDay = today;
  }
  save();
}

// ---------------------------------------------------------------- premye fwa

function welcome() {
  view(`
  <section class="welcome">
    ${wordmark(true)}
    ${STRIPES}
    <h1 class="hero">Pale anglè.<br>Aprann li <em>an kreyòl.</em></h1>
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
    <button class="btn primary big" data-go>Kòmanse, se gratis</button>
  </section>`);
  $('[data-say]')?.addEventListener('click', () => say('Thank you very much.'));
  $('[data-go]').onclick = () => setup(1);
}

function setup(step, draft) {
  draft ??= S.profile
    ? { ...S.profile, paths: [...S.profile.paths] }
    : { goal: null, paths: [], level: null, minutes: null };
  const total = 4;
  const go = (n) => setup(n, draft);
  const finish = () => {
    const first = !S.profile;
    S.profile = draft;
    save();
    if (first) toast('Chemen ou pare!');
    home();
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
  <section class="screen setup">
    <div class="run-top">
      <button class="icon-btn" data-back aria-label="Retounen">${ic('arrow-left', 'lg')}</button>
      <div class="bar"><i style="width:${(step / total) * 100}%"></i></div>
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
    <div class="foot-space"></div>
    <div class="sticky-foot">
      <button class="btn primary big" data-next ${valid ? '' : 'disabled'}>${step === total ? 'Fini' : 'Kontinye'}</button>
    </div>
  </section>`);
  $$('.choice').forEach((b) => {
    b.onclick = () => {
      const id = isNaN(+b.dataset.id) ? b.dataset.id : +b.dataset.id;
      q.set(id);
      go(step);
    };
  });
  $('[data-back]').onclick = () => (step > 1 ? go(step - 1) : S.profile ? profileScreen() : welcome());
  $('[data-next]').onclick = () => (step < total ? go(step + 1) : finish());
}

// ---------------------------------------------------------------- akèy

function home() {
  const seq = sequence();
  const open = unlockedSet(seq);
  const next = seq.find((l) => open.has(l.id) && !S.done[l.id]);
  const due = dueNow();
  const goal = dailyGoal();
  const tx = todayXp();
  const pct = Math.min(100, Math.round((tx / goal) * 100));
  const groups = ['baz', ...S.profile.paths].map((pid) => ({ p: PATH.get(pid), lessons: seq.filter((l) => l.path === pid) }));

  const streak = streakNow();
  view(`
  <header class="top">
    ${wordmark()}
    <div class="chips">
      <span class="chip fire ${streak ? 'on' : ''}" title="Jou youn dèyè lòt">${ic('flame')} ${streak}</span>
      <span class="chip xp" title="Pwen XP">${ic('star')} ${S.xp}</span>
      <button class="icon-btn" data-profile aria-label="Pwofil">${ic('user-round', 'lg')}</button>
    </div>
  </header>
  <div class="home">
    <section class="goal ${pct >= 100 ? 'done' : ''}" aria-label="Objektif jodi a">
      <div class="goal-row"><b>Objektif jodi a</b><span>${tx} / ${goal} XP</span></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      ${pct >= 100 ? `<p class="goal-ok">${ic('check')} Ou rive nan objektif ou jodi a.</p>` : ''}
    </section>

    ${due.length ? `
    <section class="review">
      ${ic('brain', 'lg')}
      <div><b>${due.length} fraz pou revize</b><p>Revize yo kounye a pou w pa bliye yo.</p></div>
      <button class="btn" data-review>Revize</button>
    </section>` : ''}

    ${next ? `
    <section class="next-card">
      ${STRIPES}
      <div class="next-body">
        <p class="eyebrow">${esc(PATH.get(next.path).non)} · Pwochen leson</p>
        <h2>${esc(next.tit)}</h2>
        <p class="muted">${esc(next.sitiyasyon)}</p>
        <p class="goal-line">${ic('target')}<span>Apre leson sa a, ou ap ka ${esc(next.objektif)}</span></p>
        <button class="btn primary big" data-start="${next.id}">${ic('play')} Kòmanse leson an</button>
      </div>
    </section>` : `
    <section class="next-card">
      ${STRIPES}
      <div class="next-body">
        <h2>Ou fini tout leson ki disponib yo</h2>
        <p class="muted">Nouvo leson ap vini byento. Pandan tan sa a, fè revizyon chak jou pou w kenbe sa w aprann.</p>
      </div>
    </section>`}

    <h3 class="section-title">Chemen ou</h3>
    ${groups.map(({ p, lessons }) => `
      <section class="path">
        <div class="path-head">${ptile(p)}<div><b>${esc(p.non)}</b><small>${esc(p.dekri)}</small></div></div>
        <ol class="track">
          ${lessons.map((l) => {
            const done = !!S.done[l.id];
            const isOpen = open.has(l.id);
            const state = done ? 'done' : isOpen ? 'open' : 'locked';
            const icon = done ? ic('check') : isOpen ? ic('play') : ic('lock');
            return `<li><button class="lesson ${state}" ${isOpen ? `data-start="${l.id}"` : 'disabled'}>
              <span class="dot">${icon}</span><span class="lt">${esc(l.tit)}</span>
              <span class="n">${l.items.length} fraz</span></button></li>`;
          }).join('')}
        </ol>
      </section>`).join('')}
    <p class="foot-note muted small">Koze · Aprann anglè an kreyòl</p>
  </div>`);

  $$('[data-start]').forEach((b) => (b.onclick = () => startLesson(b.dataset.start)));
  $('[data-review]')?.addEventListener('click', startReview);
  $('[data-profile]').onclick = profileScreen;
}

function startLesson(id) {
  const lesson = LESSONS.find((l) => l.id === id);
  run({ kind: 'lesson', lesson, steps: buildLesson(lesson, S.profile), items: lesson.items });
}

function startReview() {
  const items = dueNow().slice(0, REVIEW_SIZE).map((id) => ITEM.get(id));
  run({ kind: 'review', steps: buildReview(items, S.items), items });
}

// ---------------------------------------------------------------- leson / revizyon

function run({ kind, lesson, steps, items }) {
  const queue = steps.slice();
  let pos = 0;
  let xp = 0;
  let firstTries = 0;
  let firstOk = 0;
  const missed = new Set();

  const frame = (body, foot) => {
    const pct = Math.round((pos / queue.length) * 100);
    view(`
    <section class="run">
      <div class="run-top">
        <button class="icon-btn" data-quit aria-label="Kite">${ic('x', 'lg')}</button>
        <div class="bar"><i style="width:${pct}%"></i></div>
      </div>
      <div class="run-body">${body}</div>
      <div class="run-foot">${foot}</div>
    </section>`);
    $('[data-quit]').onclick = async () => {
      if (await ask('Ou vle kite leson an? Pwogrè leson sa a ap pèdi.', 'Wi, kite')) { window.speechSynthesis?.cancel(); home(); }
    };
  };

  const next = () => {
    if (pos >= queue.length) return finish();
    const st = queue[pos];
    if (DEBUG) window.__kozeStep = st;
    ({ situation, intro, choose_ht: choice, choose_en: choice, listen: choice, order, type, speak })[st.type](st);
  };
  const advance = () => { pos += 1; next(); };

  // Rezilta yon egzèsis.
  const result = (st, ok, { close = false, given = '' } = {}) => {
    if (!st.retry) {
      firstTries += 1;
      if (ok) { firstOk += 1; xp += 10; }
    }
    if (!ok) {
      missed.add(st.item.id);
      queue.push({ ...st, retry: true }); // fraz ou rate a ap tounen pita
    }
    if (ok) say(st.item.en);
    const foot = $('.run-foot');
    foot.innerHTML = `
      <div class="fb ${ok ? 'ok' : 'bad'}" role="status">
        <div class="fb-title">${ok ? ic('check') : ic('x')}${ok ? (close ? 'Prèske pafè!' : pick(PRAISE)) : 'Pa tout afè!'}</div>
        ${ok && !close ? '' : `<div class="fb-label">${ok ? 'Gade yon ti fòt:' : 'Bon repons lan:'}</div>`}
        ${given && !ok ? `<div class="fb-given">Ou te mete: <s>${esc(given)}</s></div>` : ''}
        <div class="fb-en">${esc(st.item.en)} <button class="mini-say" data-say aria-label="Koute">${ic('volume-2')}</button></div>
        <div class="fb-ht">${esc(st.item.ht)} · <i>${esc(st.item.son)}</i></div>
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
        ${ptile(p)}
        <p class="eyebrow">${esc(p.non)} · ${l.items.length} fraz</p>
        <h1>${esc(l.tit)}</h1>
        <p class="scene">${esc(l.sitiyasyon)}</p>
        <p class="goal-line">${ic('target')}<span>Apre leson sa a, ou ap ka ${esc(l.objektif)}</span></p>
        ${canSpeak ? `<p class="note">${ic('volume-2')}<span>Mete volim telefòn ou pou w tande pwononsyasyon an.</span></p>` : ''}
      </div>`, `<button class="btn primary big" data-go>Annou kòmanse</button>`);
    $('[data-go]').onclick = advance;
  }

  // --- Nouvo fraz
  function intro({ item }) {
    frame(`
      <p class="eyebrow">${ic('sparkles')} Nouvo fraz</p>
      <div class="card phrase">
        <span class="lang">EN</span>
        <div class="en">${esc(item.en)}</div>
        <span class="say-as"><span class="lbl">Di l konsa</span><b>${esc(item.son)}</b></span>
        <div class="kr"><span class="lang kr">KR</span>${esc(item.ht)}</div>
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
    const { item, type } = st;
    const toHt = type === 'choose_ht';
    const field = toHt ? 'ht' : 'en';
    const lessonItems = ALL_ITEMS.filter((it) => it.id !== item.id && it.id.split('.')[0] === item.id.split('.')[0]);
    const others = shuffle(ALL_ITEMS.filter((it) => it.id !== item.id));
    const pool = [...shuffle(lessonItems), ...others].map((it) => it[field]);
    const opts = [item[field]];
    for (const o of pool) { if (opts.length >= 4) break; if (!opts.includes(o)) opts.push(o); }
    const options = shuffle(opts);

    const prompt = {
      choose_ht: `<p class="eyebrow">Kisa sa vle di?</p>
        <div class="prompt"><span class="lang">EN</span>${esc(item.en)} ${canSpeak ? `<button class="mini-say" data-say aria-label="Koute">${ic('volume-2')}</button>` : ''}</div>`,
      choose_en: `<p class="eyebrow">Kijan yo di sa an anglè?</p><div class="prompt"><span class="lang kr">KR</span>${esc(item.ht)}</div>`,
      listen: `<p class="eyebrow">Koute epi chwazi sa ou tande</p>
        <div class="listen-row">
          <button class="big-say" data-say aria-label="Koute">${ic('volume-2')}</button>
          <button class="big-say slow" data-slow aria-label="Koute dousman">${ic('snail')}</button>
        </div>`,
    }[type];

    frame(`${prompt}
      <div class="opts">${options.map((o, i) => `<button class="opt" data-i="${i}"><span class="n">${i + 1}</span>${esc(o)}</button>`).join('')}</div>`,
    checkBtn());
    let chosen = null;
    $$('.opt').forEach((b) => (b.onclick = () => {
      $$('.opt').forEach((x) => x.classList.remove('sel'));
      b.classList.add('sel');
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
    if (type !== 'choose_en') say(item.en);
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
      <div class="prompt"><span class="lang kr">KR</span>${esc(item.ht)}</div>
      <div class="answer-line" aria-label="Repons ou"></div>
      <div class="bank"></div>`, checkBtn());

    const draw = () => {
      $('.answer-line').innerHTML = answer.map((t) => `<button class="tile-w" data-a="${t.i}">${esc(t.w)}</button>`).join('');
      $('.bank').innerHTML = tiles.map((t) => `<button class="tile-w ${answer.includes(t) ? 'used' : ''}" data-b="${t.i}" ${answer.includes(t) ? 'disabled' : ''}>${esc(t.w)}</button>`).join('');
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
      <div class="prompt"><span class="lang kr">KR</span>${esc(item.ht)}</div>
      <textarea id="type-in" class="type-in" rows="2" autocapitalize="sentences" autocomplete="off" autocorrect="off" spellcheck="false"
        placeholder="Tape an anglè…" aria-label="Repons ou an anglè"></textarea>
      <button class="hint-btn" data-hint>${ic('lightbulb')} Ede m ak premye mo a</button>
      <p class="hint muted"></p>`, checkBtn());
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
        <div class="en">${esc(item.en)}</div>
        <span class="say-as"><span class="lbl">Di l konsa</span><b>${esc(item.son)}</b></span>
        ${canSpeak ? `<div class="say-row"><button class="btn ghost" data-say>${ic('volume-2')} Koute anvan</button></div>` : ''}
      </div>
      <button class="mic" data-mic aria-label="Peze pou w pale">${ic('mic')}</button>
      <p class="heard muted center">Peze mikwofòn nan epi pale.</p>`,
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
          ? 'Ou dwe bay Koze aksè a mikwofòn nan.'
          : 'Mikwofòn nan pa mache. Eseye ankò oswa sote egzèsis la.';
        return;
      }
      mic.classList.remove('on');
      tries += 1;
      const score = spokenScore(alts, item.en);
      if (score >= 0.75) {
        xp += 10;
        $('.run-foot').innerHTML = `<div class="fb ok"><div class="fb-title">${ic('mic')}${pick(PRAISE)}</div>
          <div class="fb-label">Nou tande: "${esc(alts[0] || '')}"</div>
          <button class="btn primary big" data-continue>Kontinye</button></div>`;
        $('[data-continue]').onclick = advance;
      } else {
        $('.heard').innerHTML = alts[0]
          ? `Nou tande: "<i>${esc(alts[0])}</i>". ${tries < 3 ? 'Eseye ankò, pale klè epi pa twò vit.' : 'Pa gen pwoblèm, w ap pratike l ankò pita.'}`
          : 'Nou pa tande anyen. Eseye ankò.';
      }
    };
  }

  function finish() {
    for (const it of items) S.items[it.id] = grade(S.items[it.id], !missed.has(it.id));
    if (kind === 'lesson') S.done[lesson.id] = true;
    xp += kind === 'lesson' ? 20 : 10;
    addXp(xp);
    const acc = firstTries ? Math.round((firstOk / firstTries) * 100) : 100;
    view(`
    <section class="screen done">
      <div class="medal">${ic(acc >= 80 ? 'trophy' : 'party-popper')}</div>
      <h1>${kind === 'lesson' ? 'Leson fini!' : 'Revizyon fini!'}</h1>
      ${kind === 'lesson' ? `<p class="scene">Kounye a ou ka ${esc(lesson.objektif)}</p>` : '<p class="scene">Memwa w ap vin pi fò chak jou.</p>'}
      <div class="stat-row">
        <div class="stat"><b>+${xp}</b><span>XP</span></div>
        <div class="stat"><b>${acc}%</b><span>Presizyon</span></div>
        <div class="stat"><b>${S.streak}</b><span>Jou youn dèyè lòt</span></div>
      </div>
      ${missed.size ? `<p class="muted">${missed.size} fraz ap tounen nan revizyon demen.</p>` : ''}
      <button class="btn primary big" data-home>Kontinye</button>
    </section>`);
    $('[data-home]').onclick = home;
  }

  next();
}

// ---------------------------------------------------------------- pwofil

function profileScreen() {
  const mastered = Object.values(S.items).filter((r) => r.box >= MASTERED_BOX).length;
  const learning = Object.keys(S.items).length - mastered;
  const doneCount = Object.keys(S.done).length;
  const p = S.profile;
  view(`
  <header class="top">
    <button class="icon-btn" data-back aria-label="Retounen">${ic('arrow-left', 'lg')}</button>
    <h2>Pwofil ou</h2><span style="width:44px"></span>
  </header>
  <div class="profile">
    <section class="grid-stats">
      <div class="stat"><b>${ic('flame')} ${streakNow()}</b><span>Jou youn dèyè lòt</span></div>
      <div class="stat"><b>${ic('star')} ${S.xp}</b><span>XP total</span></div>
      <div class="stat"><b>${ic('check')} ${mastered}</b><span>Fraz ou metrize</span></div>
      <div class="stat"><b>${ic('brain')} ${learning}</b><span>Fraz w ap aprann</span></div>
    </section>
    <section class="panel">
      <p class="eyebrow">Leson fini: ${doneCount} sou ${LESSONS.length}</p>
      <p><b>Chemen ou:</b> ${p.paths.map((id) => esc(PATH.get(id).non)).join(', ')}</p>
      <p><b>Nivo:</b> ${esc(LEVELS.find((l) => l.id === p.level)?.label || '')} · ${p.minutes} minit pa jou</p>
      <div class="row">
        <button class="btn secondary" data-paths>Chanje chemen</button>
        <button class="btn ghost" data-prefs>Chanje tout preferans yo</button>
      </div>
    </section>
    ${!canSpeak ? `<p class="note">${ic('volume-2')}<span>Telefòn ou pa ka li fraz anglè yo byen fò. Eseye ak Chrome oswa Safari.</span></p>` : ''}
    ${!canListen ? `<p class="note">${ic('mic')}<span>Egzèsis pale yo mache sèlman nan Chrome (Android) ak Safari (iPhone).</span></p>` : ''}
    <button class="btn ghost" data-reset>Efase tout pwogrè mwen</button>
    <p class="foot-note muted small">Koze v0.2 · Tout pwogrè ou rete sou telefòn ou.</p>
  </div>`);
  $('[data-back]').onclick = home;
  $('[data-paths]').onclick = () => setup(2);
  $('[data-prefs]').onclick = () => setup(1);
  $('[data-reset]').onclick = async () => {
    if (await ask('Ou sèten? Tout pwogrè ou ap efase.', 'Efase', true)) { S = store.reset(); welcome(); }
  };
}

// ---------------------------------------------------------------- ti mesaj

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

// Klavye: 1-4 pou chwazi, Enter pou tcheke / kontinye.
document.addEventListener('keydown', (e) => {
  if (e.target.matches('textarea, input')) return;
  const opt = $(`.opt[data-i="${+e.key - 1}"]`);
  if (opt && !opt.disabled) return opt.click();
  if (e.key === 'Enter') {
    const b = $('[data-continue]') || $('[data-check]:not([disabled])') || $('[data-go]');
    if (b) { e.preventDefault(); b.click(); }
  }
});

// Mache san entènèt.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

S.profile ? home() : welcome();
