# SPOTLIGHT — Artist Vault · PRD

## Original Problem Statement
Make a website where users can spot artists; the website gives them a vault card with the time they started spotting the artist and a spotter rank. 3D, motion-driven, vertical progression. Reference: a dark/gold luxury "SPOTLIGHT" landing with floating glassmorphic artist cards + momentum sparklines.

## User Choices
- Spotting = follow/bookmark a rising music artist early
- Artists: curated preloaded catalog (live Spotify deferred)
- Auth: JWT email/password (Google login deferred)
- Vault card: artist name + image, spot timestamp, spotter rank, downloadable card
- Visual: premium minimal, glassy, dark + gold accents

## Architecture
- Backend: FastAPI + MongoDB (motor). JWT (PyJWT) + bcrypt. Routes under /api.
- Frontend: React 19 + Tailwind + framer-motion. Auth token in localStorage (`av_token`), Bearer header.
- Collections: users, artists (seeded 12), spots.

## Spotter Rank System (vertical progression)
- Per-artist position: you're the Nth person to spot that artist (position<=10 = EARLY SPOT).
- User tier by total spots: Initiate(0) → Scout(1) → Tracker(3) → Curator(6) → Tastemaker(10) → Oracle(16).

## Implemented (2026-06-28)
- JWT register/login/me/logout; seeded admin (admin@artistvault.com / vault123).
- 12 curated artists with genre, momentum, 24-pt trend sparkline.
- /discover: artist grid, search, 3D tilt cards, spot/unspot with toast + position.
- /vault: glass vault cards (timestamp, position, EARLY badge), vertical tier ladder + progress, canvas-generated downloadable PNG card.
- /pulse: leaderboard (spots, early count, tier).
- Landing: parallax hero with floating cards, trending strip, vertical "how it works", vault teaser.
- Verified: backend 13/13, frontend E2E 17/17 (testing agent iteration_1).

## Backlog
- P1: Emergent Google social login (user requested).
- P1: Live Spotify integration (real artists/search) — needs Spotify Client ID/Secret.
- P2: Shareable public vault link; social share of card image.
- P2: Real momentum data / periodic updates; artist detail page.
- P2: Lifespan handlers (replace deprecated on_event); remove dead set_cookie.

## Next Tasks
1. Add Google login (integration_expert → Emergent Auth).
2. Wire live Spotify catalog + search (collect keys from user).
