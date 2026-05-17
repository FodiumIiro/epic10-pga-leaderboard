"use client";

import { ScoredTeam } from "@/lib/types";
import { PickRow } from "./PickRow";

function formatPar(n: number): string {
  if (n === 0) return "E";
  return n > 0 ? `+${n}` : `${n}`;
}

interface Props {
  team: ScoredTeam;
  isOpen: boolean;
  onToggle: () => void;
  expandable: boolean;
  hasFrozenPick: boolean;
}

export function TeamRow({ team, isOpen, onToggle, expandable, hasFrozenPick }: Props) {
  return (
    <div className="border-b border-white/5">
      <button
        type="button"
        onClick={expandable ? onToggle : undefined}
        disabled={!expandable}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
          expandable ? "hover:bg-white/5 active:bg-white/10" : ""
        } ${isOpen ? "bg-white/5" : ""}`}
      >
        <span className="w-7 text-right font-mono text-sm text-zinc-400 tabular-nums">
          {team.rank}.
        </span>
        <span className="flex-1 min-w-0 truncate font-medium text-zinc-100">
          {team.name}
        </span>
        <span className="font-mono text-base font-bold text-lime-300 tabular-nums">
          {team.points}
        </span>
        {expandable && (
          <span
            className={`text-zinc-500 transition-transform ${
              isOpen ? "rotate-90" : ""
            }`}
            aria-hidden
          >
            ▸
          </span>
        )}
      </button>
      {isOpen && team.pickResults.length > 0 && (
        <div className="px-2 pb-3 pt-1 bg-black/30">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] table-fixed text-sm">
              <colgroup>
                <col className="w-[4.25rem]" />
                <col />
                <col className="w-[3.75rem]" />
                <col className="w-[3.75rem]" />
                <col className="w-[4rem]" />
              </colgroup>
              <thead className="text-[10px] uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-2 py-1.5 text-left font-medium" title="Joukkueen veikkaama sijoitus">
                    Veikkaus
                  </th>
                  <th className="px-2 py-1.5 text-left font-medium">Pelaaja</th>
                  <th className="px-2 py-1.5 text-right font-medium" title="Pelaajan nykyinen sijoitus Epic10-ryhmässä">
                    Sija
                  </th>
                  <th className="px-2 py-1.5 text-right font-medium" title="Pelaajan tulos suhteessa pariin">
                    Tulos
                  </th>
                  <th className="px-2 py-1.5 text-right font-medium" title="Erotus veikkauksen ja nykyisen sijan välillä">
                    Erotus
                  </th>
                </tr>
              </thead>
              <tbody>
                {team.pickResults.map((pick) => (
                  <PickRow key={pick.pickPosition} pick={pick} />
                ))}
              </tbody>
            </table>
          </div>
          {hasFrozenPick && (
            <p className="mt-2 px-2 text-[10px] text-zinc-500 italic">
              * cut-pelaajan sijoitus on jäädytetty kierroksen 2 lopputuloksen
              perusteella
            </p>
          )}
          <div className="mx-2 mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-xs">
            <span className="text-zinc-400">Veikkaus voittajan tuloksesta</span>
            <span className="font-mono font-semibold text-zinc-200 tabular-nums">
              {formatPar(team.predictedWinnerScore)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
