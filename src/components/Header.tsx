import { ApiMeta } from "@/lib/types";

interface Props {
  meta: ApiMeta;
  showStale: boolean;
}

function formatRoundLabel(round: number | null, started: boolean): string {
  if (!started || round == null) return "Ennen kierrosta";
  return `Kierros ${round}`;
}

function formatTime(raw: string): string {
  // DataGolf's `last_update` is a US Pacific naive string, e.g. "2026-05-14 12:25 PM".
  // JS Date() reads naive strings as UTC, dropping 7h (PDT = UTC-7). Hand-parse and treat as PT.
  const m = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(
    raw.trim()
  );
  let date: Date;
  if (m) {
    const [, Y, Mo, D, hh, mm, ap] = m;
    let h = parseInt(hh, 10);
    if (ap?.toUpperCase() === "PM" && h !== 12) h += 12;
    if (ap?.toUpperCase() === "AM" && h === 12) h = 0;
    // PDT (mid-March–early November) is UTC-7. Tournament runs May 14–17, 2026 → always PDT.
    date = new Date(Date.UTC(+Y, +Mo - 1, +D, h + 7, +mm));
  } else {
    date = new Date(raw);
  }
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("fi-FI", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Helsinki",
  });
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
