"use client";

import { ScoredTeam } from "@/lib/types";
import { PickRow } from "./PickRow";

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
        <div className="px-4 pb-3 pt-1 bg-black/30">
          {team.pickResults.map((pick) => (
            <PickRow key={pick.pickPosition} pick={pick} />
          ))}
          {hasFrozenPick && (
            <p className="mt-2 text-[10px] text-zinc-500 italic">
              * cut-pelaajan sijoitus on jäädytetty kierroksen 2 lopputuloksen
              perusteella
            </p>
          )}
        </div>
      )}
    </div>
  );
}
