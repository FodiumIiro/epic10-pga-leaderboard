"use client";

import { useState } from "react";

const EMBED_URL = "https://epic10-pga-leaderboard.vercel.app/embed";

const SNIPPETS: Array<{ label: string; desc: string; code: string }> = [
  {
    label: "Suora linkki",
    desc: "Jaa osoite tai linkitä siihen suoraan.",
    code: EMBED_URL,
  },
  {
    label: "Yksinkertainen iframe",
    desc: "Liitä nettisivun HTML-lähdekoodiin.",
    code: `<iframe src="${EMBED_URL}" style="width:100%;max-width:640px;height:90vh;border:0" loading="lazy"></iframe>`,
  },
  {
    label: "Responsiivinen iframe",
    desc: "Skaalautuu sivuston leveyteen, vähimmäiskorkeus 600px.",
    code: `<div style="max-width:640px;margin:0 auto">
  <iframe src="${EMBED_URL}" style="width:100%;height:90vh;min-height:600px;border:0" loading="lazy"></iframe>
</div>`,
  },
];

export function EmbedInstructions() {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copy = async (idx: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      window.setTimeout(
        () => setCopiedIdx((cur) => (cur === idx ? null : cur)),
        1500
      );
    } catch {
      // Clipboard unavailable (e.g. older browser); user can still select+copy.
    }
  };

  return (
    <details className="mx-auto w-full max-w-[640px] border-b border-white/10 bg-[#0A0F1E] group">
      <summary className="flex items-center justify-between cursor-pointer select-none px-4 py-3 text-sm font-semibold text-zinc-200 hover:bg-white/5">
        <span>Upota tämä taulukko sivustollesi</span>
        <span className="text-[10px] text-zinc-500 group-open:hidden">
          3 tapaa ▾
        </span>
        <span className="hidden text-[10px] text-zinc-500 group-open:inline">
          sulje ▴
        </span>
      </summary>
      <div className="px-4 pb-4 space-y-4">
        {SNIPPETS.map((s, i) => (
          <div key={i}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs font-semibold text-zinc-200">
                {s.label}
              </span>
              <button
                type="button"
                onClick={() => copy(i, s.code)}
                className="text-[10px] font-medium text-lime-300 hover:text-lime-200 px-2 py-0.5 rounded bg-lime-300/5 border border-lime-300/20"
                aria-label={`Kopioi ${s.label}`}
              >
                {copiedIdx === i ? "Kopioitu ✓" : "Kopioi"}
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 mb-1.5">{s.desc}</p>
            <pre className="text-[10px] bg-black/40 border border-white/5 rounded px-2.5 py-2 overflow-x-auto text-zinc-300 font-mono whitespace-pre-wrap break-all">
              {s.code}
            </pre>
          </div>
        ))}
        <p className="text-[10px] text-zinc-500 leading-relaxed pt-1 border-t border-white/5">
          Taulukko päivittyy automaattisesti 60 sekunnin välein. Mobiililaitteille
          optimoitu; toimii myös WordPressissä ja Webflowissa Custom HTML
          -lohkona.
        </p>
      </div>
    </details>
  );
}
