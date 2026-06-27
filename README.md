# 🚀 ShipReel

**Say what you want — a cartoon host delivers it as a multi-format social reel, and ships it for you.**

🔗 **Live demo:** https://shipreel-one.vercel.app · **Repo:** https://github.com/frederikeff/shipreel

> Built at the Vercel Ship hackathon. **Technologies:** Vercel (hosting + AI Gateway + the `eve` agent framework), Claude (Anthropic, via AI Gateway), Remotion, Supabase (Postgres + Storage), Auth0, Resend, OpenAI (TTS + image), Next.js, Tailwind.
>
> _Note: the live deploy showcases the agent, AI scripts, the character cast, and Supabase persistence. Voiceover and mp4 rendering run on the **local** dev server (they need a writable filesystem / headless Chromium) — see the demo video._

You give ShipReel a topic (and optionally a few images and which of 20 cartoon
hosts should present). It **writes the script**, **records a voiceover**,
**renders the video** in 3 aspect ratios, lets **you approve it** (human in the
loop), then **publishes to LinkedIn / Instagram** and **emails you when it's
done**.

Built for the Vercel Ship hackathon. Every sponsor is load-bearing:

| Sponsor | Role in ShipReel |
| --- | --- |
| **Vercel / eve** | The [`eve`](https://www.npmjs.com/package/eve) agent is the producer brain. It orchestrates the pipeline through typed tools and runs same-origin with Next via `withEve`. |
| **Vercel AI Gateway** | Writes the scene-by-scene script (`ai` SDK → `anthropic/claude-sonnet-4.6`). |
| **Remotion** | Renders the talking-character reel — live in-browser via `<Player>`, and to real `.mp4` via the renderer. |
| **Supabase** | Postgres for reels + Storage for media (falls back to a local JSON store with zero setup). |
| **Auth0** | Identity: human approver login + machine identity for the agent. |
| **Resend** | Emails the owner when a reel is ready / published. |
| **LinkedIn** | Real publishing via the UGC Posts API. |

> **Runs with zero API keys.** With nothing configured it still works end to end:
> a templated script, a silent captioned video, real Remotion renders, local
> storage, and simulated publishing. Add each key to turn that piece real.

---

## Quickstart

```bash
pnpm install
cp .env.example .env.local   # optional — fill in only the keys you have
pnpm dev                     # boots Next.js AND the eve agent together (withEve)
```

Open **http://localhost:3000**.

Two ways to make a reel:

1. **Studio form** (works with no keys) — type a topic, pick a host, optionally
   upload images, hit *Generate preview*. The reel plays live on the right. Hit
   *Render mp4* for real files, then *Approve & Publish*.
2. **Producer chat** (needs a model key — see below) — just tell the agent
   *"Make a hype reel about joining a hackathon, hosted by Nova"* and watch it
   run the tools. When it wants to publish, an **approval card** appears — that's
   the human-in-the-loop gate.

## Turning each piece real

Everything is optional and degrades gracefully. Add to `.env.local`:

- **Agent chat / better scripts** — `AI_GATEWAY_API_KEY` (create at
  vercel.com/dashboard/ai/api-keys) **or** run `vercel link` then `eve link` to
  use `VERCEL_OIDC_TOKEN`. Direct `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` also work.
- **Voiceover** — `OPENAI_API_KEY` (OpenAI TTS) or `ELEVENLABS_API_KEY`.
- **Persistence + media hosting** — `NEXT_PUBLIC_SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY` (+ run [`supabase/schema.sql`](supabase/schema.sql)).
- **Login** — `AUTH0_SECRET` (`openssl rand -hex 32`), `AUTH0_DOMAIN`,
  `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `APP_BASE_URL`.
- **Done emails** — `RESEND_API_KEY` (+ `RESEND_FROM`).
- **Real LinkedIn posts** — `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_AUTHOR_URN`
  (`urn:li:person:...`).

## Architecture

```
agent/                     eve agent (the producer)
  instructions.md          pipeline orchestration prompt
  tools/                   create_reel → write_script → synthesize_voice →
                           render_reel → publish_reel (HITL) → send_notification
  channels/eve.ts          HTTP channel (localDev + OIDC auth)
lib/                       shared pipeline + integrations (all degrade gracefully)
  pipeline.ts              single source of truth; tools AND API routes call it
  ai.ts tts.ts render.ts   AI Gateway · TTS · Remotion render
  supabase.ts store.ts     Postgres/Storage or local JSON
  resend.ts linkedin.ts    notifications · publishing
  characters.ts (x20)      the cast · formats.ts (9:16 / 1:1 / 16:9)
remotion/                  ReelComposition.tsx — the animated talking host
app/                       Studio UI + REST API (/api/reels, /publish, /render, /upload)
components/                Studio · ProducerChat (useEveAgent) · ReelPreview (<Player>) · CharacterPicker
```

The **eve agent** and the **REST API** both call the same `lib/pipeline.ts`, so
the chat-driven flow and the form-driven flow stay perfectly consistent.

### The human-in-the-loop gate

`agent/tools/publish_reel.ts` uses eve's `approval: always()`. When the agent
tries to publish, eve **durably pauses** the session and emits an
`input.requested` event. The browser (`useEveAgent`) renders an approve/deny card;
nothing is posted until a human clicks approve.

## Deploy (Vercel)

`withEve` deploys the Next app and the eve runtime as one Vercel project.

```bash
vercel link        # creates the project + lets eve pull AI Gateway creds
vercel deploy
```

Set the same env vars in the Vercel dashboard. Note: serverless mp4 rendering is
heavy — for production, render via Remotion Lambda or keep the in-browser
`<Player>` preview and ship the caption + link (current LinkedIn behavior).

## Scripts

- `pnpm dev` — Next.js + eve together
- `pnpm studio` — open Remotion Studio on the reel composition
- `pnpm typecheck` — `tsc --noEmit`
