#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "data", "final-scores.json");

const args = new Set(process.argv.slice(2));
const force = args.has("--force");
const sourceUrl =
  process.env.SCORES_URL ||
  "https://epic10-pga-leaderboard.vercel.app/api/scores";

if (!force) {
  try {
    readFileSync(OUT, "utf8");
    console.error(`${OUT} already exists. Re-run with --force to replace it.`);
    process.exit(1);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

const res = await fetch(sourceUrl, { cache: "no-store" });
if (!res.ok) {
  throw new Error(`Could not fetch scores from ${sourceUrl}: ${res.status} ${res.statusText}`);
}

const data = await res.json();
if (!data?.meta || !Array.isArray(data?.teams) || data.teams.length === 0) {
  throw new Error("Scores response did not look like a populated Epic10 ApiResponse");
}

const now = new Date().toISOString();
data.meta = {
  ...data.meta,
  finalized: true,
  frozenAt: data.meta.frozenAt || now,
  freezeReason:
    data.meta.freezeReason ||
    `Manual final leaderboard freeze from ${sourceUrl}`,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`);

console.log(`Wrote ${OUT}`);
console.log(`Teams: ${data.teams.length}`);
console.log(`Top: #${data.teams[0].rank} ${data.teams[0].name} — ${data.teams[0].points} pts`);
console.log(`Frozen at: ${data.meta.frozenAt}`);
