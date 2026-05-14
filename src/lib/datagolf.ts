import { GroupPlayer } from "./types";
import { CANONICAL_PLAYERS, CanonicalPlayer, dgNameToCanonical } from "./names";

const BASE_URL = process.env.DATAGOLF_BASE_URL || "https://feeds.datagolf.com";
const CACHE_TTL = 60;

const CONFIG = {
  TIMEOUT_MS: 10_000,
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 1_000,
  MAX_DELAY_MS: 10_000,
};

interface InPlayPlayer {
  dg_id: number;
  player_name: string;
  current_pos: string;
  thru: number | null;
  current_score: number | null;
  today: number | null;
  round: number | null;
  R1: number | null;
  R2: number | null;
  R3: number | null;
  R4: number | null;
}

interface InPlayResponse {
  info?: {
    event_name?: string;
    current_round?: number;
    last_update?: string;
  };
  data?: InPlayPlayer[];
}

const OUT_POSITIONS = new Set(["CUT", "WD", "DQ", "MDF"]);

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function backoff(attempt: number): number {
  const exp = CONFIG.BASE_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exp;
  return Math.min(exp + jitter, CONFIG.MAX_DELAY_MS);
}

async function fetchInPlayRaw(): Promise<InPlayResponse> {
  const key = process.env.DATAGOLF_API_KEY;
  if (!key) throw new Error("DATAGOLF_API_KEY is not configured");

  const url = new URL("/preds/in-play", BASE_URL);
  url.searchParams.set("tour", "pga");
  url.searchParams.set("file_format", "json");
  url.searchParams.set("key", key);

  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    if (attempt > 0) await sleep(backoff(attempt - 1));
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), CONFIG.TIMEOUT_MS);
      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        signal: ctrl.signal,
        next: { revalidate: CACHE_TTL },
      });
      clearTimeout(timer);

      if (!res.ok) {
        if (res.status === 400) {
          // No tournament data available — return empty payload
          return { info: {}, data: [] };
        }
        if (res.status >= 500 || res.status === 429) {
          lastErr = new Error(`DataGolf ${res.status}`);
          continue;
        }
        throw new Error(`DataGolf ${res.status} ${res.statusText}`);
      }
      return (await res.json()) as InPlayResponse;
    } catch (e) {
      lastErr = e;
      if (
        e instanceof Error &&
        (e.name === "AbortError" || /fetch|network/i.test(e.message))
      ) {
        continue;
      }
      throw e;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("DataGolf: max retries exceeded");
}

export interface FetchResult {
  tournamentName: string;
  currentRound: number | null;
  lastUpdate: string;
  leaderTotalScore: number | null;
  groupPlayers: GroupPlayer[];
  started: boolean;
}

export async function fetchInPlay(): Promise<FetchResult> {
  const raw = await fetchInPlayRaw();
  const data = raw.data ?? [];

  const dgByCanonical = new Map<CanonicalPlayer, InPlayPlayer>();
  for (const entry of data) {
    const canonical = dgNameToCanonical(entry.player_name);
    if (canonical) dgByCanonical.set(canonical, entry);
  }

  const groupPlayers: GroupPlayer[] = CANONICAL_PLAYERS.map((name) => {
    const e = dgByCanonical.get(name);
    if (!e) {
      return {
        csvName: name,
        dgPosition: "DNP",
        currentScore: null,
        R1: null,
        R2: null,
        R3: null,
        R4: null,
        thru: null,
        today: null,
        isOut: true,
        isMissing: true,
        effectiveScore: 999,
      };
    }
    const isOut = OUT_POSITIONS.has(e.current_pos);
    return {
      csvName: name,
      dgPosition: e.current_pos,
      currentScore: e.current_score,
      R1: e.R1,
      R2: e.R2,
      R3: e.R3,
      R4: e.R4,
      thru: e.thru,
      today: e.today,
      isOut,
      isMissing: false,
      // Provisional; cutSnapshot.applySnapshot finalizes this
      effectiveScore: e.current_score ?? 0,
    };
  });

  let leaderTotalScore: number | null = null;
  for (const e of data) {
    if (e.current_score == null) continue;
    if (OUT_POSITIONS.has(e.current_pos)) continue;
    if (leaderTotalScore === null || e.current_score < leaderTotalScore) {
      leaderTotalScore = e.current_score;
    }
  }

  const started = data.some(
    (e) =>
      (e.thru !== null && e.thru !== undefined && e.thru > 0) ||
      (e.current_score !== null &&
        e.current_score !== undefined &&
        e.current_score !== 0)
  );

  return {
    tournamentName: raw.info?.event_name || "PGA Championship 2026",
    currentRound: raw.info?.current_round ?? null,
    lastUpdate: raw.info?.last_update || new Date().toISOString(),
    leaderTotalScore,
    groupPlayers,
    started,
  };
}
