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
  const rank = player.isMissing
    ? "DNP"
    : formatGroupRank(player.groupRankMin, player.groupRankMax);

  return (
    <tr className="border-t border-white/5 text-sm">
      <td className="px-2 py-2 font-mono text-xs text-zinc-500 tabular-nums">
        {pickPosition}.
      </td>
      <td className="px-2 py-2 text-zinc-100">
        <span className="block max-w-[9rem] truncate" title={pick.csvName}>
          {shortLastName(pick.csvName)}
          {player.isMissing && (
            <span className="ml-1 text-[10px] text-zinc-500">(ei kentällä)</span>
          )}
          {wasFrozen && (
            <span className="ml-1 text-[10px] text-zinc-500">*</span>
          )}
        </span>
      </td>
      <td
        className="px-2 py-2 text-right font-mono text-xs text-zinc-300 tabular-nums"
        title={player.isMissing ? "Ei mukana kentällä" : "Pelaajan sijoitus Epic10-ryhmässä"}
      >
        {rank}
      </td>
      <td className="px-2 py-2 text-right font-mono text-xs text-zinc-300 tabular-nums">
        {formatScore(player)}
      </td>
      <td
        className={`px-2 py-2 text-right font-mono text-xs font-semibold tabular-nums ${gapColor(gap, isCorrect)}`}
        title="Erotus veikatun sijan ja pelaajan nykyisen Epic10-sijan välillä"
      >
        {formatGap(gap, isCorrect)}
      </td>
    </tr>
  );
}
