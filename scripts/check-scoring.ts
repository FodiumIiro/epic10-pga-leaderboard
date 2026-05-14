/**
 * Sanity-check the scoring engine with synthetic fixtures.
 * Run: npx tsx scripts/check-scoring.ts
 */
import { computeGroupRanks, scoreTeam, sortTeams } from "../src/lib/scoring";
import { CANONICAL_PLAYERS } from "../src/lib/names";
import { GroupPlayer, ScoredTeam, Team } from "../src/lib/types";

function mkPlayer(csvName: string, effectiveScore: number): GroupPlayer {
  return {
    csvName,
    dgPosition: "T1",
    currentScore: effectiveScore,
    R1: null,
    R2: null,
    R3: null,
    R4: null,
    thru: 18,
    today: 0,
    isOut: false,
    isMissing: false,
    effectiveScore,
  };
}

function mkTeam(id: string, name: string, picks: string[]): Team {
  return {
    id,
    name,
    picks,
    predictedWinnerScore: -15,
    submitDate: new Date("2026-05-14T10:00:00Z"),
  };
}

function assertEq(label: string, got: unknown, expected: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  console.log(`${ok ? "PASS" : "FAIL"} ${label} :: got=${JSON.stringify(got)} expected=${JSON.stringify(expected)}`);
  if (!ok) process.exitCode = 1;
}

// Build a no-tie ranking: each player has a unique effectiveScore
const noTieGroup: GroupPlayer[] = CANONICAL_PLAYERS.map((name, i) =>
  mkPlayer(name, i)
);
const noTieRanked = computeGroupRanks(noTieGroup);
console.log("\nGroup ranks (no ties):");
for (const p of noTieRanked) {
  console.log(`  ${p.csvName} -> [${p.groupRankMin},${p.groupRankMax}]`);
}

// Team 1: exact match -> 10 points
const exactTeam = mkTeam("t1", "Exact", [...CANONICAL_PLAYERS]);
const r1 = scoreTeam(exactTeam, noTieRanked);
assertEq("exact match -> 10 pts", r1.points, 10);

// Team 2: reversed -> 0 points
const reversedTeam = mkTeam("t2", "Reversed", [...CANONICAL_PLAYERS].reverse());
const r2 = scoreTeam(reversedTeam, noTieRanked);
assertEq("reversed -> 0 pts", r2.points, 0);

// Team 3: swap positions 1 and 2 -> 8 points
const swapTeam = mkTeam("t3", "Swap12", [
  CANONICAL_PLAYERS[1],
  CANONICAL_PLAYERS[0],
  ...CANONICAL_PLAYERS.slice(2),
]);
const r3 = scoreTeam(swapTeam, noTieRanked);
assertEq("swap #1 and #2 -> 8 pts", r3.points, 8);

// Tie test: make players 3 and 4 tied
const tiedGroup: GroupPlayer[] = CANONICAL_PLAYERS.map((name, i) => {
  let eff = i;
  if (i === 2 || i === 3) eff = 2.5; // share rank
  return mkPlayer(name, eff);
});
const tiedRanked = computeGroupRanks(tiedGroup);
console.log("\nGroup ranks (players 3 & 4 tied):");
for (const p of tiedRanked) {
  console.log(`  ${p.csvName} -> [${p.groupRankMin},${p.groupRankMax}]`);
}
// Player at idx 2 (Ludvig Åberg) and idx 3 (Matt Fitzpatrick) should both be [3,4]
const aberg = tiedRanked.find((p) => p.csvName === CANONICAL_PLAYERS[2])!;
const fitz = tiedRanked.find((p) => p.csvName === CANONICAL_PLAYERS[3])!;
assertEq("Åberg tied range", [aberg.groupRankMin, aberg.groupRankMax], [3, 4]);
assertEq("Fitzpatrick tied range", [fitz.groupRankMin, fitz.groupRankMax], [3, 4]);

// Pick Åberg at #3 AND Fitzpatrick at #4 -> both correct (10 pts)
const tieExact = mkTeam("t4", "TieExact", [...CANONICAL_PLAYERS]);
const r4 = scoreTeam(tieExact, tiedRanked);
assertEq("ties: exact order -> 10 pts", r4.points, 10);

// Pick Fitzpatrick at #3 AND Åberg at #4 -> both still correct because of tie range (10 pts)
const tieSwap = mkTeam("t5", "TieSwap", [
  CANONICAL_PLAYERS[0],
  CANONICAL_PLAYERS[1],
  CANONICAL_PLAYERS[3], // Fitz at #3
  CANONICAL_PLAYERS[2], // Åberg at #4
  ...CANONICAL_PLAYERS.slice(4),
]);
const r5 = scoreTeam(tieSwap, tiedRanked);
assertEq("ties: swapped order still 10 pts", r5.points, 10);

// Tiebreaker test
const leaderScore = -10;
const scored: ScoredTeam[] = [
  {
    id: "a", name: "A", predictedWinnerScore: -8,
    submitDate: "2026-05-14T10:00:00Z", points: 5, pickResults: [], rank: 0,
  },
  {
    id: "b", name: "B", predictedWinnerScore: -10,
    submitDate: "2026-05-14T11:00:00Z", points: 5, pickResults: [], rank: 0,
  },
  {
    id: "c", name: "C", predictedWinnerScore: -12,
    submitDate: "2026-05-14T09:00:00Z", points: 7, pickResults: [], rank: 0,
  },
];
const sortedTeams = sortTeams(scored, leaderScore);
console.log("\nTiebreaker order (leader=-10):");
for (const t of sortedTeams) console.log(`  ${t.rank}. ${t.name} pts=${t.points} pred=${t.predictedWinnerScore}`);
assertEq("highest points wins", sortedTeams[0].name, "C");
assertEq("closer predicted score wins tie", sortedTeams[1].name, "B");
assertEq("further predicted score loses tie", sortedTeams[2].name, "A");

console.log("\nDone.");
