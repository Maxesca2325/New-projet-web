// Generate images with ai33.pro: node image_ai33.mjs <prompts.json> <out_dir>
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const API = "https://api.ai33.pro";
const KEY = process.env.AI33_API_KEY || "proxy-injected";
const curl = (args) => {
  const out = execFileSync("curl", ["-sS", "--fail-with-body", "-m", "120", "-H", `xi-api-key: ${KEY}`, ...args]).toString();
  const j = JSON.parse(out);
  if (j.success === false) throw new Error(`ai33: ${j.message || out}`);
  return j;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const [file, outDir] = process.argv.slice(2);
const items = JSON.parse(fs.readFileSync(file, "utf8"));
fs.mkdirSync(outDir, { recursive: true });

for (const it of items) {
  const model_parameters = {};
  for (const k of ["aspect_ratio", "resolution", "quality"]) if (it[k]) model_parameters[k] = it[k];
  const body = { prompt: it.prompt, model_id: it.model, generations_count: it.n || 1, model_parameters };
  const r = curl(["-X", "POST", "-H", "Content-Type: application/json", "-d", JSON.stringify(body), `${API}/v1i/task/generate-image`]);
  it.task = r.task_id;
  console.log(`${it.name}: submitted (${r.estimated_credits} credits est.)`);
}
let credits = 0;
const t0 = Date.now();
while (items.some((it) => !it.done)) {
  if (Date.now() - t0 > 10 * 60e3) throw new Error("tasks still not done after 10 minutes");
  await sleep(6000);
  for (const it of items.filter((x) => !x.done)) {
    const d = curl([`${API}/v1/task/${it.task}`]);
    if (/fail|error/i.test(d.status)) { it.done = true; console.log(`${it.name}: FAILED ${d.error_message || ""}`); continue; }
    if (d.status !== "done") continue;
    it.done = true;
    credits += d.credit_cost || 0;
    (d.metadata?.result_images || []).forEach((img, i) => {
      const f = path.join(outDir, `${it.name}_${i + 1}.png`);
      execFileSync("curl", ["-sS", "--fail", "-m", "120", "-o", f, img.imageUrl]);
      console.log(`${it.name}: ${f} (${img.width}x${img.height})`);
    });
  }
}
console.log(`Done. ${credits} credits.`);
