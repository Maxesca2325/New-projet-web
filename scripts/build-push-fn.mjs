// Fè yon sèl fichye pou fonksyon Supabase « koze-push » (pou kole nan Dashboard → Edge Functions → Via Editor).
// node scripts/build-push-fn.mjs  →  supabase/functions/koze-push/one-file.ts
import fs from 'node:fs';
const dir = 'supabase/functions/koze-push/';
const logic = fs.readFileSync(dir + 'logic.js', 'utf8').replace(/^export /gm, '')
  // tip TypeScript pou fonksyon yo (logic.js se JavaScript)
  .replace('function localNow(tz, now', 'function localNow(tz: string, now')
  .replace(/function (isDue|streakAlive|message)\(sub, now/g, 'function $1(sub: any, now')
  .replace('const iso = (d) =>', 'const iso = (d: unknown) =>')
  .replace('const g = (t) =>', 'const g = (t: string) =>');
const index = fs.readFileSync(dir + 'index.ts', 'utf8').replace("import { isDue, message } from './logic.js';\n", '');
fs.writeFileSync(dir + 'one-file.ts', `// FICHYE FÈT OTOMATIKMAN pa scripts/build-push-fn.mjs (index.ts + logic.js). Pa modifye l: modifye sous yo.\n${index}\n// ---------------------------------------------------------------- logic.js\n${logic}`);
console.log('ok', dir + 'one-file.ts');
