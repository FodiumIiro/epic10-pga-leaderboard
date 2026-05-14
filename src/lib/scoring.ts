import {
  GroupPlayer,
  PickResult,
  RankedGroupPlayer,
  ScoredTeam,
  Team,
} from "./types";

export function computeGroupRanks(players: GroupPlayer[]): RankedGroupPlayer[] {
  const sorted = [...players].sort(
    (a, b) => a.effectiveScore - b.effectiveScore
  );
  const result: RankedGroupPlayer[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (
      j + 1 < sorted.length &&
      sorted[j + 1].effectiveScore === sorted[i].effectiveScore
    ) {
      j++;
    }
    for (let k = i; k <= j; k++) {
      result.push({
        ...sorted[k],
        groupRankMin: i + 1,
        groupRankMax: j + 1,
      });
    }
    i = j + 1;
  }
  return result;
}

export function scoreTeam(
  team: Team,
  ranked: RankedGroupPlayer[]
): { points: number; pickResults: PickResult[] } {
  const byName = new Map(ranked.map((p) => [p.csvName, p]));
  let points = 0;
  const pickResults: PickResult[] = team.picks.map((csvName, idx) => {
    const pickPosition = idx + 1;
    const player = byName.get(csvName);
    if (!player) {
      throw new Error(`Pick "${csvName}" not in ranked group`);
    }
    const isCorrect =
      player.groupRankMin <= pickPosition &&
      pickPosition <= player.groupRankMax;
    if (isCorrect) points++;
    const rep = Math.max(
      player.groupRankMin,
      Math.min(player.groupRankMax, pickPosition)
    );
    const gap = rep - pickPosition;
    return { csvName, pickPosition, player, isCorrect, gap };
  });
  return { points, pickResults };
}

export function sortTeams(
  scored: ScoredTeam[],
  leaderTotalScore: number | null
): ScoredTeam[] {
  const out = [...scored].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (leaderTotalScore !== null) {
      const da = Math.abs(leaderTotalScore - a.predictedWinnerScore);
      const db = Math.abs(leaderTotalScore - b.predictedWinnerScore);
      if (da !== db) return da - db;
    }
    return new Date(a.submitDate).getTime() - new Date(b.submitDate).getTime();
  });
  return out.map((t, idx) => ({ ...t, rank: idx + 1 }));
}
