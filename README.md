# Epic10 — PGA Championship 2026 Leaderboard

Embeddable live leaderboard for a Finnish prediction game on the 2026 PGA Championship.

## Stack

- Next.js 16 (App Router, Node runtime)
- TypeScript, Tailwind CSS 4
- Vercel KV (cut-snapshot persistence)
- DataGolf `/preds/in-play` for live tournament data

## Scoring

Each of 134 teams ranks the same 10 elite golfers 1–10. We award **1 point per pick whose position matches that player's rank inside the 10-player group**. Ties inside the group share their position range — picking either tied player at either tied rank scores. Players who miss the cut keep their R1+R2 score (snapshotted in KV after round 2 starts).

Team-level tiebreaker: `|leader's current score − team's predicted winner score|` ascending, then earliest submission.

## Environment variables

Copy `.env.local.example` to `.env.local`:

```
DATAGOLF_API_KEY=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

KV vars are auto-populated when you link a Vercel KV store via the Vercel dashboard.

## Dev

```bash
npm install
npm run dev
# open http://localhost:3000/embed
```

## Sanity-check the scoring engine

```bash
npx tsx scripts/check-scoring.ts
```

## Deploy

1. `gh repo create IiroFodium/epic10-pga-leaderboard --public --source=. --push`
2. Import on Vercel under the IiroFodium account
3. Set env vars in Vercel: `DATAGOLF_API_KEY` + provision a KV store
4. The embed URL is `https://<deployment>.vercel.app/embed`

## Embed snippet

```html
<iframe
  src="https://epic10-pga-leaderboard.vercel.app/embed"
  style="width:100%;max-width:640px;height:90vh;border:0"
  loading="lazy"
></iframe>
```
