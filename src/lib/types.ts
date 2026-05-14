export interface Team {
  id: string;
  name: string;
  picks: string[];
  predictedWinnerScore: number;
  submitDate: Date;
}

export interface GroupPlayer {
  csvName: string;
  dgPosition: string;
  currentScore: number | null;
  R1: number | null;
  R2: number | null;
  R3: number | null;
  R4: number | null;
  thru: number | null;
  today: number | null;
  isOut: boolean;
  isMissing: boolean;
  effectiveScore: number;
}

export interface RankedGroupPlayer extends GroupPlayer {
  groupRankMin: number;
  groupRankMax: number;
}

export interface PickResult {
  csvName: string;
  pickPosition: number;
  player: RankedGroupPlayer;
  isCorrect: boolean;
  gap: number;
}

export interface ScoredTeam {
  id: string;
  name: string;
  predictedWinnerScore: number;
  submitDate: string;
  points: number;
  pickResults: PickResult[];
  rank: number;
}

export interface ApiMeta {
  tournamentName: string;
  currentRound: number | null;
  lastUpdate: string;
  snapshotApplied: boolean;
  snapshotAvailable: boolean;
  leaderTotalScore: number | null;
  started: boolean;
  error?: string;
}

export interface ApiResponse {
  meta: ApiMeta;
  groupPlayers: RankedGroupPlayer[];
  teams: ScoredTeam[];
}
