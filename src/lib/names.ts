export const CANONICAL_PLAYERS = [
  "Scottie Scheffler",
  "Rory McIlroy",
  "Ludvig Åberg",
  "Matt Fitzpatrick",
  "Brooks Koepka",
  "Justin Rose",
  "Viktor Hovland",
  "Tyrrell Hatton",
  "Jordan Spieth",
  "Sami Välimäki",
] as const;

export type CanonicalPlayer = (typeof CANONICAL_PLAYERS)[number];

export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z]/g, "");
}

const NORMALIZED_TO_CANONICAL = new Map<string, CanonicalPlayer>(
  CANONICAL_PLAYERS.map((name) => [normalizeName(name), name])
);

export function dgNameToCanonical(dgName: string): CanonicalPlayer | null {
  const parts = dgName.split(",").map((p) => p.trim());
  const display = parts.length === 2 ? `${parts[1]} ${parts[0]}` : dgName;
  return NORMALIZED_TO_CANONICAL.get(normalizeName(display)) ?? null;
}

export function csvNameToCanonical(csvName: string): CanonicalPlayer | null {
  return NORMALIZED_TO_CANONICAL.get(normalizeName(csvName)) ?? null;
}

export function shortLastName(csvName: string): string {
  const parts = csvName.trim().split(/\s+/);
  return parts[parts.length - 1];
}
