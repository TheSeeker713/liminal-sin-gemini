# CURRENT_STATE.md — Liminal Sin Gemini
> **AI WORKING MEMORY** — This file is overwritten at the start of every new AI session.
> Last updated: March 5, 2026

---

## Active Project Identity

| Field | Value |
|---|---|
| **Project** | Liminal Sin — FMV psychological horror experience |
| **Contest** | Gemini Live Agent Challenge (Google / Devpost) |
| **Deadline** | March 16, 2026 @ 5:00 PM PT |
| **Days Remaining** | ~11 |
| **Repo** | `d:\DEV\liminal-sin-gemini` |
| **Marketing Shell** | `myceliainteractive.com/ls` (separate repo: `myceliainteractive`) |
| **Judge Backdoor URL** | `myceliainteractive.com/ls/judges` (see `myceliainteractive` repo) |

---

## March 5, 2026 — Session Summary

### Marketing Shell (myceliainteractive repo) — FULLY COMPLETE
- Landing page `myceliainteractive.com/ls` live with all sections: navbar, hero, lore, Trust System cards, What Awaits You, signup forms, footer
- Judge backdoor `myceliainteractive.com/ls/judges` live
- D1 database `liminal-sin-signups` provisioned with `signups` table (name, email, type, created_at, email1_sent, email2_sent) + `settings` table (game_live flag)
- Cloudflare Worker (`workers/signup-api.ts`) handling `POST /api/signup`, `POST /api/set-game-live` (Bearer token protected), and cron every minute for Email 2
- **Email system**: Brevo transactional API (free tier, 300/day). Email 1 fires instantly on signup. Email 2 fires when admin calls `/api/set-game-live`
- `BREVO_API_KEY` and `ADMIN_TOKEN` stored as encrypted Cloudflare secrets
- `npm run deploy` script chains `next build && wrangler deploy` — prevents stale asset deploys
- `.gitignore` updated with `*.tsbuildinfo`
- `AGENTS.md` + `copilot-instructions.md` updated: always `npm run build` before deploy rule added

### Known Pending (marketing shell)
- [ ] Test and confirm Email 1 delivers to `jrobards713@gmail.com` via Brevo (pending as of session end)

---

## Current Build Phase

**Phase 1 — Foundation (Days 1–7)** — DOCUMENTS COMPLETE, IMPLEMENTATION NOT YET STARTED

The project is fully designed at the document level. No game code has been implemented yet.

### What Exists (Completed)
- [x] `AGENTS.md` — project rules and execution protocol
- [x] `README.md` — full technical architecture spec, cloud setup playbook, agent prompts
- [x] `docs/WORLD_BIBLE.md` — canonical lore, world layers, character canon
- [x] `docs/Characters.md` — agent persona and system prompt specs
- [x] `docs/Gamemaster.md` — Director agent operational logic
- [x] `docs/Ballys.md` — real-world location context
- [x] `docs/Tunnel-and-park.md` — environment and lighting specs
- [x] `docs/CONTEST.md` — contest constants, scoring matrix, submission checklist
- [x] `CURRENT_STATE.md` — this file
- [x] `package.json` — dependencies installed (Next.js 16, Firebase, Gemini SDK, zustand, etc.)
- [x] `components/CrackedGlassesHud.tsx` — HUD component (built, not yet integrated)
- [x] `app/page.tsx` — Next.js default route (placeholder only)
- [x] `app/globals.css` — Tailwind v4 base styles

### What Does NOT Exist Yet
- [ ] Google Cloud project provisioned (`myceliainteractive` project ID)
- [ ] Firestore database created and structured
- [ ] Cloud Run service (`liminal-gateway`) deployed
- [ ] Gemini Live API integration (voice input → character agents)
- [ ] Director Agent logic (Game Master webcam perception, Anomalous Intensity)
- [ ] Character Agent prompts wired to ADK / Gemini sessions
- [ ] FMV playback pipeline (Cloud Storage clips + scene_key switching)
- [ ] Slotsky engine (trust/fear thresholds → anomaly events)
- [ ] Player webcam/mic capture (`react-webcam` integration)
- [ ] Trust/Fear Firestore state persistence
- [ ] Any actual gameplay loop

---

## Environment Variables Required
All stored in `.env.local` (never committed):

```
GEMINI_API_KEY=
GOOGLE_CLOUD_PROJECT=myceliainteractive
GOOGLE_CLOUD_REGION=us-west1
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## Next Priority Action

**Priority 1 — Cloud Foundation (BLOCKING everything)**
> Nothing can be tested without a live Firestore + Gemini Live API connection.

1. Create / select GCP project ID `myceliainteractive`
2. Enable APIs: Vertex AI, Cloud Run, Firestore, Cloud Build, Secret Manager, Cloud Storage
3. Create Firestore database in Native mode (`us-west1`)
4. Add `GEMINI_API_KEY` to `.env.local` (get from Google AI Studio / Google Cloud Console)
5. Add Firebase config values to `.env.local` (Firebase Console → Project Settings → Web App)
6. Run `npm run dev` and confirm local dev server starts with no errors

**Priority 2 — GameMaster Gateway (Cloud Run service)**
> See `README.md` Section ☁️ Cloud System Setup → Step D

**Priority 3 — Jason Character Agent (first playable moment)**
> Wire one character (Jason) to Gemini Live API with voice input + trust/fear state write to Firestore

---

## Character Agents — Quick Reference

| Character | Model | Starting State | Trust Default |
|---|---|---|---|
| Jason | `gemini-2.5-flash-preview-tts` | Separated, POV via cracked smart glasses | Neutral (0.1) |
| Audrey | `gemini-2.5-flash-preview-09-2025` | Separated, voice-only echo | Neutral (0.3) |
| Josh | `gemini-2.5-flash-preview-09-2025` | Separated, voice-only echo | Neutral (0.2) |
| Slotsky | N/A (probability engine) | Environmental only — never speaks | N/A |
| Game Master | `gemini-3.1-pro-preview-09-2025` | Bimodal: webcam 1FPS + audio | N/A |

---

## Firestore Session State Shape

```json
{
  "player_emotion": "calm",
  "player_tone": "steady",
  "player_whisper": false,
  "fourth_wall_count": 0,
  "reality_fractured": false,
  "scene_key": "jason_entry_loop",
  "slotsky_trigger": null,
  "characters": {
    "jason": { "trust_level": 0.1, "fear_index": 0.3, "proximity_state": "FOUND" },
    "audrey": { "trust_level": 0.3, "fear_index": 0.4, "proximity_state": "ECHO" },
    "josh": { "trust_level": 0.2, "fear_index": 0.5, "proximity_state": "ECHO" }
  }
}
```

---

## Competition Status (as of March 4, 2026)
- 6,462 participants in contest
- Project gallery NOT YET PUBLISHED by organizers — no competitor submissions visible
- No FMV horror + Gemini Live voice-narrative projects found anywhere (Reddit, Devpost search, YouTube)
- **Liminal Sin has a clear, uncontested lane in the contest**

---

## Known IP Notes
- "Bally's" references in docs refer to Bally's Las Vegas (rebranded to Horseshoe Las Vegas, Dec 2022)
- Fictional framing is covered by disclaimer in `README.md` — see Attribution & Legal section
- "The Boring Company" is similarly covered by same disclaimer
- No action required on either name — fiction/parody framing + explicit disclaimer = adequate protection
