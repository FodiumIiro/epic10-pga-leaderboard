import { PickResult } from "@/lib/types";
import { shortLastName } from "@/lib/names";

interface Props {
  pick: PickResult;
}

function formatGroupRank(min: number, max: number): string {
  return min === max ? `${min}.` : `T${min}.`;
}

function formatGap(gap: number, isCorrect: boolean): string {
  if (isCorrect) return "✓";
  return gap > 0 ? `+${gap}` : `${gap}`;
}

function gapColor(gap: number, isCorrect: boolean): string {
  if (isCorrect) return "text-lime-300";
  if (gap > 0) return "text-amber-400";
  return "text-sky-400";
}

function formatScore(player: PickResult["player"]): string {
  if (player.isMissing) return "–";
  // pre-tee-off (haven't started yet): suppress score
  if (!player.isOut && player.thru === 0) return "–";
  // Cut players use the frozen effective_score (R1+R2); active players use live currentScore.
  const s = player.isOut ? player.effectiveScore : player.currentScore;
  if (s == null || s === 999) return "–";
  if (s === 0) return "E";
  return s > 0 ? `+${s}` : `${s}`;
}

export function PickRow({ pick }: Props) {
  const { pickPosition, player, isCorrect, gap } = pick;
  const wasFrozen = player.isOut && !player.isMissing;
  return (
    <div className="grid grid-cols-[2rem_minmax(0,1fr)_2.75rem_3rem_2.75rem_2.25rem] items-center gap-2 py-2 text-sm">
      <span className="text-zinc-500 font-mono">{pickPosition}.</span>
      <span className="truncate text-zinc-100">
        {shortLastName(pick.csvName)}
        {player.isMissing && (
          <span className="ml-1 text-[10px] text-zinc-500">(ei kentällä)</span>
        )}
        {wasFrozen && (
          <span className="ml-1 text-[10px] text-zinc-500">*</span>
        )}
      </span>
      <span className="font-mono text-zinc-300 text-xs">
        {player.isMissing
          ? "–"
          : formatGroupRank(player.groupRankMin, player.groupRankMax)}
      </span>
      <span className="font-mono text-zinc-400 text-xs">
        {player.isMissing
          ? "DNP"
          : player.isOut
            ? player.dgPosition
            : player.dgPosition || "–"}
      </span>
      <span className="font-mono text-zinc-300 text-xs">
        {formatScore(player)}
      </span>
      <span
        className={`font-mono text-right text-xs font-semibold ${gapColor(gap, isCorrect)}`}
      >
        {formatGap(gap, isCorrect)}
      </span>
    </div>
  );
}
