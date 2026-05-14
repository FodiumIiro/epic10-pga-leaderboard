import fs from "node:fs";
import path from "node:path";
import { Team } from "./types";
import { CANONICAL_PLAYERS, csvNameToCanonical } from "./names";

const CSV_PATH = path.join(process.cwd(), "data", "pga-championship.csv");

function stripExcelQuote(s: string): string {
  return s.startsWith("'") ? s.slice(1) : s;
}

function parseScoreToPar(raw: string): number {
  const cleaned = stripExcelQuote(raw).replace(/\s+/g, "");
  // Accept "E" or "0" for even, otherwise +N / -N / N
  if (/^e$/i.test(cleaned)) return 0;
  const n = parseInt(cleaned, 10);
  return n;
}

function parseSubmitDate(raw: string): Date {
  const iso = raw.replace(" ", "T") + "Z";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${raw}`);
  return d;
}

export function loadTeams(): Team[] {
  const raw = fs.readFileSync(CSV_PATH, "utf-8").replace(/^﻿/, "");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== "");
  const [header, ...rows] = lines;
  if (!header.startsWith("#")) {
    throw new Error(`Unexpected CSV header: ${header.slice(0, 40)}`);
  }

  const canonicalSet = new Set<string>(CANONICAL_PLAYERS);
  const teams: Team[] = [];

  for (const row of rows) {
    const cols = row.split(";");
    if (cols.length < 9) continue;

    const id = cols[0];
    const name = cols[1].trim();
    const picksRaw = cols[2];
    const winnerScoreRaw = cols[3];
    const submitDateRaw = cols[8];

    if (!name || !picksRaw) continue;

    const picksInput = picksRaw.split(",").map((p) => p.trim());
    if (picksInput.length !== 10) {
      throw new Error(`Team ${name}: ${picksInput.length} picks, expected 10`);
    }

    const picks = picksInput.map((p) => {
      if (canonicalSet.has(p)) return p;
      const canonical = csvNameToCanonical(p);
      if (!canonical) {
        throw new Error(`Team ${name}: unknown pick "${p}"`);
      }
      return canonical;
    });

    const predictedWinnerScore = parseScoreToPar(winnerScoreRaw);
    if (Number.isNaN(predictedWinnerScore)) {
      throw new Error(`Team ${name}: invalid winner score "${cols[3]}"`);
    }

    const submitDate = parseSubmitDate(submitDateRaw);

    teams.push({ id, name, picks, predictedWinnerScore, submitDate });
  }

  // Dedup by team name: keep earliest submit
  const byName = new Map<string, Team>();
  for (const t of teams) {
    const existing = byName.get(t.name);
    if (!existing || t.submitDate < existing.submitDate) {
      byName.set(t.name, t);
    }
  }

  return Array.from(byName.values()).sort(
    (a, b) => a.submitDate.getTime() - b.submitDate.getTime()
  );
}

let cached: Team[] | null = null;
export function getTeams(): Team[] {
  if (!cached) cached = loadTeams();
  return cached;
}
