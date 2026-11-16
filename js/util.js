export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const pick = (a) => a[Math.floor(Math.random() * a.length)];

const CONTRACTIONS = {
  "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are', "it's": 'it is',
  "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "can't": 'cannot', "i'll": 'i will',
  "let's": 'let us', "what's": 'what is', "where's": 'where is', "that's": 'that is', "i've": 'i have',
  "isn't": 'is not', "aren't": 'are not', "we'll": 'we will', "you'll": 'you will', "how's": 'how is',
};

// Mete yon fraz anglè sou yon fòm senp pou n ka konpare l.
export function norm(s) {
  let t = String(s).toLowerCase().replace(/[’‘`]/g, "'");
  t = t.replace(/[a-z]+'[a-z]+/g, (w) => CONTRACTIONS[w] ?? w);
  t = t.replace(/\bcan not\b/g, 'cannot');
  return t.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function lev(a, b) {
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

// 'exact' | 'close' (ti fòt frap) | 'wrong'
export function typedMatch(input, target) {
  const a = norm(input), b = norm(target);
  if (!a) return 'wrong';
  if (a === b) return 'exact';
  return lev(a, b) <= Math.max(1, Math.floor(b.length * 0.08)) ? 'close' : 'wrong';
}

// Pi bon pousantaj mo nou rekonèt nan sa moun nan di (0..1).
export function spokenScore(alternatives, target) {
  const t = norm(target).split(' ');
  let best = 0;
  for (const alt of alternatives) {
    const said = new Set(norm(alt).split(' '));
    best = Math.max(best, t.filter((w) => said.has(w)).length / t.length);
  }
  return best;
}

export const words = (s) => s.replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean);
