"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiResponse } from "@/lib/types";
import { Header } from "./Header";
import { TeamRow } from "./TeamRow";
import { EmptyState } from "./EmptyState";

interface Props {
  initial: ApiResponse;
}

const POLL_INTERVAL_MS = 60_000;
const POLL_JITTER_MS = 5_000;
const STALE_THRESHOLD_MS = 5 * 60_000;

function foldName(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function Leaderboard({ initial }: Props) {
  const [data, setData] = useState<ApiResponse>(initial);
  const [now, setNow] = useState<number>(() => Date.now());
  const [openTeamId, setOpenTeamId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filteredTeams = useMemo(() => {
    const q = foldName(query.trim());
    if (!q) return data.teams;
    return data.teams.filter((t) => foldName(t.name).includes(q));
  }, [data.teams, query]);

  const inFlight = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetch("/api/scores", { cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as ApiResponse;
        setData(json);
      }
    } catch {
      // silent — the stale dot will surface this in the header
    } finally {
      inFlight.current = false;
      setNow(Date.now());
    }
  }, []);

  // Polling loop with ±jitter
  useEffect(() => {
    const schedule = () => {
      const jitter = Math.random() * POLL_JITTER_MS;
      timerRef.current = setTimeout(async () => {
        await refresh();
        schedule();
      }, POLL_INTERVAL_MS + jitter);
    };
    schedule();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [refresh]);

  // Tick for stale indicator
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const lastUpdateMs = (() => {
    const t = new Date(data.meta.lastUpdate).getTime();
    return Number.isFinite(t) ? t : 0;
  })();
  const showStale = lastUpdateMs > 0 && now - lastUpdateMs > STALE_THRESHOLD_MS;

  const expandable = data.meta.started && data.teams.length > 0;

  return (
    <div className="mx-auto w-full max-w-[640px] min-h-screen bg-[#0A0F1E] text-zinc-100">
      <Header meta={data.meta} showStale={showStale} />

      <div className="sticky top-[60px] z-10 bg-[#0A0F1E]/95 backdrop-blur px-4 py-2 border-b border-white/5">
        <input
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hae joukkuetta…"
          aria-label="Hae joukkuetta"
          className="w-full h-8 px-2.5 bg-white/5 border border-white/10 rounded text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-lime-300/40 focus:bg-white/10"
        />
      </div>

      {data.meta.error && (
        <div className="px-4 py-2 text-[11px] text-amber-400 border-b border-amber-400/20 bg-amber-400/5">
          Tietolähde ei ole tavoitettavissa. Näytetään viimeisin tila.
        </div>
      )}

      {!data.meta.started && (
        <EmptyState
          message={
            data.meta.error
              ? "Kierroksen tietoja ei voitu hakea."
              : "Kierros 1 ei ole alkanut. Joukkueet näkyvät ilmoittautumisjärjestyksessä."
          }
        />
      )}

      <div className="divide-white/5">
        {filteredTeams.map((team) => (
          <TeamRow
            key={team.id}
            team={team}
            isOpen={openTeamId === team.id}
            onToggle={() =>
              setOpenTeamId((cur) => (cur === team.id ? null : team.id))
            }
            expandable={expandable}
            hasFrozenPick={team.pickResults.some(
              (p) => p.player?.isOut && !p.player?.isMissing
            )}
          />
        ))}
        {query.trim() !== "" && filteredTeams.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-zinc-500">
            Ei osumia.
          </p>
        )}
      </div>

      <footer className="px-4 py-6 text-center text-[10px] text-zinc-600">
        Pisteytys: 1 piste / oikealla sijalla oleva pelaaja, max 10 p.
        <br />
        Tasapeli ratkaistaan ekstrakysymyksellä (voittajan tulos).
      </footer>
    </div>
  );
}
