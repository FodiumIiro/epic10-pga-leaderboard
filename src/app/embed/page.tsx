import { headers } from "next/headers";
import { Leaderboard } from "@/components/Leaderboard";
import { ApiResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getInitial(): Promise<ApiResponse> {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  const base = host ? `${proto}://${host}` : "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/scores`, { cache: "no-store" });
    if (res.ok) return (await res.json()) as ApiResponse;
  } catch {
    // fall through
  }
  return {
    meta: {
      tournamentName: "PGA Championship 2026",
      currentRound: null,
      lastUpdate: new Date().toISOString(),
      snapshotApplied: false,
      snapshotAvailable: false,
      leaderTotalScore: null,
      started: false,
      error: "Initial load failed",
    },
    groupPlayers: [],
    teams: [],
  };
}

export default async function EmbedPage() {
  const initial = await getInitial();
  return <Leaderboard initial={initial} />;
}
