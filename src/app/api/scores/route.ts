import { NextResponse } from "next/server";
import { getTeams } from "@/lib/csv";
import { fetchInPlay } from "@/lib/datagolf";
import {
  applySnapshot,
  maybeWriteSnapshot,
  readSnapshot,
} from "@/lib/cutSnapshot";
import { readFinalSnapshot } from "@/lib/finalSnapshot";
import { computeGroupRanks, scoreTeam, sortTeams } from "@/lib/scoring";
import { ApiResponse, ScoredTeam } from "@/lib/types";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  const finalSnapshot = readFinalSnapshot();
  if (finalSnapshot) {
    return NextResponse.json(finalSnapshot, {
      status: 200,
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" },
    });
  }

  const teams = getTeams();

  let fetched;
  try {
    fetched = await fetchInPlay();
  } catch (e) {
    const fallback: ApiResponse = {
      meta: {
        tournamentName: "PGA Championship 2026",
        currentRound: null,
        lastUpdate: new Date().toISOString(),
        snapshotApplied: false,
        snapshotAvailable: false,
        leaderTotalScore: null,
        started: false,
        error: e instanceof Error ? e.message : "Unknown error",
      },
      groupPlayers: [],
      teams: teams.map((t, idx) => ({
        id: t.id,
        name: t.name,
        predictedWinnerScore: t.predictedWinnerScore,
        submitDate: t.submitDate.toISOString(),
        points: 0,
        pickResults: [],
        rank: idx + 1,
      })),
    };
    return NextResponse.json(fallback, {
      status: 200,
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=30" },
    });
  }

  if (!fetched.started) {
    const preStart: ApiResponse = {
      meta: {
        tournamentName: fetched.tournamentName,
        currentRound: fetched.currentRound,
        lastUpdate: fetched.lastUpdate,
        snapshotApplied: false,
        snapshotAvailable: false,
        leaderTotalScore: null,
        started: false,
      },
      groupPlayers: [],
      teams: teams.map((t, idx) => ({
        id: t.id,
        name: t.name,
        predictedWinnerScore: t.predictedWinnerScore,
        submitDate: t.submitDate.toISOString(),
        points: 0,
        pickResults: [],
        rank: idx + 1,
      })),
    };
    return NextResponse.json(preStart, {
      status: 200,
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=30",
      },
    });
  }

  const { wrote } = await maybeWriteSnapshot(
    fetched.currentRound,
    fetched.groupPlayers
  );
  const snapshot = await readSnapshot();
  const adjusted = applySnapshot(fetched.groupPlayers, snapshot);
  const ranked = computeGroupRanks(adjusted);

  const scored: ScoredTeam[] = teams.map((team) => {
    const { points, pickResults } = scoreTeam(team, ranked);
    return {
      id: team.id,
      name: team.name,
      predictedWinnerScore: team.predictedWinnerScore,
      submitDate: team.submitDate.toISOString(),
      points,
      pickResults,
      rank: 0,
    };
  });
  const sorted = sortTeams(scored, fetched.leaderTotalScore);

  const response: ApiResponse = {
    meta: {
      tournamentName: fetched.tournamentName,
      currentRound: fetched.currentRound,
      lastUpdate: fetched.lastUpdate,
      snapshotApplied: !!snapshot,
      snapshotAvailable: !!snapshot || wrote,
      leaderTotalScore: fetched.leaderTotalScore,
      started: true,
    },
    groupPlayers: ranked,
    teams: sorted,
  };

  return NextResponse.json(response, {
    status: 200,
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
  });
}
