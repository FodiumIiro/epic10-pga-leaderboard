import { ApiMeta } from "@/lib/types";

interface Props {
  meta: ApiMeta;
  showStale: boolean;
}

function formatRoundLabel(round: number | null, started: boolean): string {
  if (!started || round == null) return "Ennen kierrosta";
  return `Kierros ${round}`;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("fi-FI", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Helsinki",
    });
  } catch {
    return "--:--";
  }
}

export function Header({ meta, showStale }: Props) {
  return (
    <header className="px-4 py-3 border-b border-white/10 sticky top-0 z-10 bg-[#0A0F1E]/95 backdrop-blur">
      <div className="flex items-baseline justify-between gap-2">
        <h1 className="text-base font-bold text-white tracking-tight">
          PGA Championship 2026
        </h1>
        <span className="text-[10px] uppercase tracking-wider text-lime-300 font-semibold px-2 py-0.5 rounded bg-lime-300/10 border border-lime-300/20">
          Epic10
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-zinc-400">
        <span>{formatRoundLabel(meta.currentRound, meta.started)}</span>
        <span className="flex items-center gap-1.5">
          {showStale && (
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"
              title="Yhteyttä ei ole päivitetty 5 minuuttiin"
            />
          )}
          Päivitetty {formatTime(meta.lastUpdate)}
        </span>
      </div>
    </header>
  );
}
