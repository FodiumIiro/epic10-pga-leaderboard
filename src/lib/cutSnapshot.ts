import { kv } from "@vercel/kv";
import { GroupPlayer } from "./types";

const KEY = "cut-snapshot-pga-championship-2026-v2";

interface Snapshot {
  savedAt: string;
  byCsvName: Record<string, number>;
}

function kvConfigured(): boolean {
  return Boolean(
    process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  );
}

export async function readSnapshot(): Promise<Snapshot | null> {
  if (!kvConfigured()) return null;
  try {
    const v = await kv.get<Snapshot>(KEY);
    return v ?? null;
  } catch {
    return null;
  }
}

export async function maybeWriteSnapshot(
  currentRound: number | null,
  groupPlayers: GroupPlayer[]
): Promise<{ wrote: boolean; available: boolean }> {
  if (!kvConfigured()) return { wrote: false, available: false };
  if (currentRound === null || currentRound < 3) {
    return { wrote: false, available: false };
  }
  try {
    const existing = await kv.get<Snapshot>(KEY);
    if (existing) return { wrote: false, available: true };

    const byCsvName: Record<string, number> = {};
    for (const p of groupPlayers) {
      if (p.currentScore != null) {
        byCsvName[p.csvName] = p.currentScore;
      }
    }
    const snap: Snapshot = {
      savedAt: new Date().toISOString(),
      byCsvName,
    };
    await kv.set(KEY, snap);
    return { wrote: true, available: true };
  } catch {
    return { wrote: false, available: false };
  }
}

export function applySnapshot(
  groupPlayers: GroupPlayer[],
  snapshot: Snapshot | null
): GroupPlayer[] {
  return groupPlayers.map((p) => {
    if (p.isMissing) {
      return { ...p, effectiveScore: 999 };
    }
    if (p.isOut) {
      const frozen = snapshot?.byCsvName?.[p.csvName];
      const eff =
        frozen != null
          ? frozen
          : p.currentScore != null
            ? p.currentScore
            : 999;
      return { ...p, effectiveScore: eff };
    }
    return {
      ...p,
      effectiveScore: p.currentScore != null ? p.currentScore : 0,
    };
  });
}
