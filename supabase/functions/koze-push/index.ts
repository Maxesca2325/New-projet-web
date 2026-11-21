// Koze: fonksyon Supabase pou rapèl chak jou (Web Push).
//   GET  /functions/v1/koze-push?key=1   → { publicKey } (kle piblik VAPID; li kreye kle yo la premye fwa)
//   POST /functions/v1/koze-push?send=1  → voye rapèl yo (se pg_cron ki rele l chak èdtan, ak header x-cron-secret)
// Li konekte dirèkteman ak baz done a (SUPABASE_DB_URL, Supabase bay li otomatikman): pa gen kle pou kopye.
// Deplwaye l ak « Verify JWT » ETENN (app la voye kle publishable la, pa yon JWT).
import postgres from 'npm:postgres@3.4.5';
import webpush from 'npm:web-push@3.6.7';
import { isDue, message } from './logic.js';

const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { prepare: false, max: 1 });
const SITE = 'https://maxesca2325.github.io/New-projet-web/';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'apikey, authorization, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

type Settings = { vapid_public: string; vapid_private: string; cron_secret: string };

async function keys(): Promise<Settings> {
  let [s] = await sql<Settings[]>`select vapid_public, vapid_private, cron_secret from koze_private.settings where id = 1`;
  if (!s.vapid_public) {
    const k = webpush.generateVAPIDKeys();
    await sql`update koze_private.settings set vapid_public = ${k.publicKey}, vapid_private = ${k.privateKey} where id = 1 and vapid_public is null`;
    [s] = await sql<Settings[]>`select vapid_public, vapid_private, cron_secret from koze_private.settings where id = 1`;
  }
  return s;
}

async function send(s: { vapid_public: string; vapid_private: string }) {
  webpush.setVapidDetails(SITE, s.vapid_public, s.vapid_private);
  const now = new Date();
  const subs = await sql`select * from koze_private.push_subs`;
  let sent = 0, removed = 0, failed = 0;
  for (const sub of subs.filter((x: Record<string, unknown>) => isDue(x, now))) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(message(sub, now)),
        { TTL: 3 * 3600, urgency: 'normal' },
      );
      await sql`update koze_private.push_subs set last_sent = (now() at time zone ${sub.tz})::date, fails = 0 where endpoint = ${sub.endpoint}`;
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) { // abònman an pa egziste ankò (moun nan retire l)
        await sql`delete from koze_private.push_subs where endpoint = ${sub.endpoint}`;
        removed++;
      } else {
        await sql`update koze_private.push_subs set fails = fails + 1 where endpoint = ${sub.endpoint}`;
        await sql`delete from koze_private.push_subs where endpoint = ${sub.endpoint} and fails >= 10`;
        failed++;
      }
    }
  }
  return { checked: subs.length, sent, removed, failed };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const url = new URL(req.url);
  try {
    const s = await keys();
    if (req.method === 'GET' && url.searchParams.has('key')) return json({ publicKey: s.vapid_public });
    if (req.method === 'POST' && url.searchParams.has('send')) {
      if (req.headers.get('x-cron-secret') !== s.cron_secret) return json({ error: 'forbidden' }, 403);
      return json(await send(s));
    }
    return json({ error: 'not found' }, 404);
  } catch (e) {
    console.error(e);
    return json({ error: 'server' }, 500);
  }
});
