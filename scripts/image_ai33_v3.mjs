// Generate images with ai33.pro Imagen 3 (the v1i endpoint is retired): node image_ai33_v3.mjs <prompts.json> <out_dir>
// prompts.json: [{ "name": "logo-a", "prompt": "...", "n": 2, "aspect_ratio": "1:1", "resolution": "1K", "assets": ["img/maskot.webp"] }]
// The API key is injected by the proxy in the cloud; on your PC: export AI33_API_KEY=...
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const API = "https://api.ai33.pro";
const KEY = process.env.AI33_API_KEY || "proxy-injected";
const call = (args) => {
  const out = execFileSync("curl", ["-sS", "-m", "120", "-H", `xi-api-key: ${KEY}`, ...args]).toString();
  const j = JSON.parse(out);
  if (j.success === false) throw new Error(`ai33: ${j.message || out}`);
  return j;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const [file, outDir] = process.argv.slice(2);
const items = JSON.parse(fs.readFileSync(file, "utf8"));
fs.mkdirSync(outDir, { recursive: true });

for (const it of items) {
  const form = { prompt: it.prompt, model_id: it.model || "image-v3", aspect_ratio: it.aspect_ratio || "1:1", resolution: it.resolution || "1K", generations_count: String(it.n || 1) };
  // "assets": reference images (paths), e.g. the mascot, so the result looks like it
  const assets = (it.assets || []).flatMap((f) => ["-F", `assets=@${f};type=image/${path.extname(f).slice(1).replace("jpg", "jpeg")}`]);
  const r = call(["-X", "POST", ...Object.entries(form).flatMap(([k, v]) => ["--form-string", `${k}=${v}`]), ...assets, `${API}/v3/image/generate`]);
  it.task = r.task_id;
  console.log(`${it.name}: submitted (${r.credits_used} credits)`);
}
const t0 = Date.now();
while (items.some((it) => !it.done)) {
  if (Date.now() - t0 > 20 * 60e3) throw new Error("tasks still not done after 20 minutes");
  await sleep(10000);
  for (const it of items.filter((x) => !x.done)) {
    let d;
    try { d = call([`${API}/v3/task/${it.task}`]).data; } catch { continue; } // busy: ask again next round
    if (/fail|error/i.test(d.status)) { it.done = true; console.log(`${it.name}: FAILED ${d.error_message || ""}`); continue; }
    if (d.status !== "done") continue;
    it.done = true;
    const imgs = d.metadata?.result_images || d.metadata?.images || d.result_images || [];
    if (!imgs.length) console.log(`${it.name}: done, no image list:`, JSON.stringify(d).slice(0, 600));
    imgs.forEach((img, i) => {
      const url = img.imageUrl || img.url || img;
      const f = path.join(outDir, `${it.name}_${i + 1}${path.extname(new URL(url).pathname) || ".webp"}`);
      execFileSync("curl", ["-sS", "--fail", "-m", "120", "-o", f, url]);
      console.log(`${it.name}: ${f}`);
    });
  }
}
console.log("Done.");
