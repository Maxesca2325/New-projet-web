// Odyo anglè pou chak fraz Koze, ak yon vwa ai33.pro (ElevenLabs "Sarah" pa defo; Kokoro mache tou).
//   node scripts/voice_koze.mjs [voice_id] [speed]     default: elevenlabs_EXAVITQu4vr4xnSDxMaL (Sarah) 0.85 (pa twò vit pou moun k ap aprann)
// Ekri audio/<leson>-<n>.mp3 (mono, 48 kbps, san silans nan kòmansman ak nan fen).
// Li sote fraz ki deja fèt ak menm tèks + menm vwa (audio/index.json), kidonk
// relanse l apre w ajoute fraz sèlman peye pou nouvo yo.
// Kle API: sou anviwònman cloud la, proxy a mete l. Sou pwòp òdinatè ou:
//   export AI33_API_KEY=...   (pa janm ekri kle a nan yon fichye)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { LESSONS } from "../js/data.js";

const API = "https://api.ai33.pro";
const KEY = process.env.AI33_API_KEY || "proxy-injected";
const voice = process.argv[2] || "elevenlabs_EXAVITQu4vr4xnSDxMaL";
const speed = Number(process.argv[3] || 0.85);
const OUT = "audio";
const TMP = path.join(OUT, ".raw");
fs.mkdirSync(TMP, { recursive: true });
const indexFile = path.join(OUT, "index.json");
const index = fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile, "utf8")) : {};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const curl = (args) => {
  for (let i = 0; i < 8; i++) {
    try {
      const j = JSON.parse(execFileSync("curl", ["-sS", "--fail-with-body", "-m", "120", "-H", `xi-api-key: ${KEY}`, ...args]).toString());
      if (j.success === false) throw new Error(j.message);
      return j;
    } catch (e) {
      if (i === 7) throw e;
      execFileSync("sleep", [String(2 + i * 2)]); // server busy: wait and retry
    }
  }
};

const items = LESSONS.flatMap((l) => l.items);
const fileOf = (it) => `${it.id.replace(".", "-")}.mp3`;
const key = (it) => `${voice}|${speed}|${it.en}`;
const todo = items.filter((it) => index[fileOf(it)] !== key(it) || !fs.existsSync(path.join(OUT, fileOf(it))));
console.log(`${items.length} fraz, ${todo.length} pou fè (vwa ${voice}, vitès ${speed})`);

for (const it of todo) {
  it.task = curl(["-X", "POST", `${API}/v3/text-to-speech`, "--form-string", `text=${it.en}`, "--form-string", `voice_id=${voice}`,
    "--form-string", `speed=${speed}`, "--form-string", "with_transcript=false"]).task_id;
  await sleep(400); // pa twò vit pou sèvè a
}
let credits = 0;
const t0 = Date.now();
while (todo.some((it) => !it.done)) {
  if (Date.now() - t0 > 20 * 60e3) throw new Error("ai33: pa fini apre 20 minit");
  await sleep(4000);
  for (const it of todo.filter((x) => !x.done)) {
    let d;
    try { d = curl([`${API}/v3/task/${it.task}`]).data; } catch { continue; }
    if (/fail|error|cancel/i.test(d.status)) throw new Error(`${it.id}: ${JSON.stringify(d.error_message || d.status)}`);
    if (d.status !== "done") continue;
    const raw = path.join(TMP, fileOf(it));
    execFileSync("curl", ["-sS", "--fail", "-L", "-m", "120", "-o", raw, d.metadata.audio_url]);
    // koupe silans yo, egalize volim nan, mono 48 kbps
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", raw,
      "-af", "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse,loudnorm=I=-16:TP=-1.5:LRA=11",
      "-ac", "1", "-ar", "24000", "-b:a", "48k", path.join(OUT, fileOf(it))]);
    index[fileOf(it)] = key(it);
    credits += d.credit_cost || 0;
    it.done = true;
  }
  console.log(`${todo.filter((x) => x.done).length}/${todo.length}`);
}
fs.writeFileSync(indexFile, JSON.stringify(index, null, 1));
fs.rmSync(TMP, { recursive: true, force: true });
console.log(`Fini. ${credits} kredi ai33.`);
