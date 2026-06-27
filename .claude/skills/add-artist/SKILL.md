---
name: add-artist
description: Add one or more new artists to the SPOTLIGHT platform — creates all required DB records (creators + artist_spot_counters), fetches Spotify data automatically, and updates artist-map.ts. Call with a comma-separated list of artist names or a JSON spec.
argument-hint: "\"Artist Name 1, Artist Name 2\"  OR  path/to/artists.json"
---

# Add Artist(s) to SPOTLIGHT

This skill adds brand-new artists that don't exist yet in the platform — from DB insertion to Spotify data to the artist-map — in a single command.

## What it does

For each artist:
1. Derives ticker (e.g. `BILLIEEILISH`) and slug from the name
2. Searches Spotify for image, follower count, popularity, and latest release date
3. Inserts into `creators` table
4. Inserts into `artist_spot_counters` (required so the spotter ranking system works immediately)
5. Appends ticker → Spotify ID to `lib/spotify/artist-map.ts`

## Script

```
scripts/add-artists.mjs
```

## How to run

### Simple — just names (Spotify auto-lookup)

```bash
node scripts/add-artists.mjs --names "Billie Eilish, Olivia Rodrigo, Gracie Abrams"
```

### With a JSON spec file (for custom tickers, bios, categories)

Create a file like `scripts/new-artists.json`:
```json
[
  {
    "name": "Billie Eilish",
    "ticker": "BILLIE",
    "category": "Music",
    "spotify_id": "6qqNVTkY8uBg9cP3Jd7DAH",
    "bio": "Custom bio text — if omitted, left blank for you to fill in"
  },
  {
    "name": "A Gaming Creator",
    "ticker": "GCREATOR",
    "category": "Gaming"
  }
]
```

Then run:
```bash
node scripts/add-artists.mjs --file scripts/new-artists.json
```

## Fields reference

| Field | Required | Default | Notes |
|-------|----------|---------|-------|
| `name` | YES | — | Display name |
| `ticker` | no | derived from name | UPPERCASE, max 12 chars, no spaces |
| `category` | no | Music | Music / Gaming / Sports / Content / Lifestyle / Podcast |
| `spotify_id` | no | auto-searched | If provided, skips Spotify search (use for precision) |
| `bio` | no | null | Left empty if not set — fill in Supabase later |
| `image_url` | no | from Spotify | Falls back to Spotify artist image |

## When Claude runs this skill

1. Parse the artist names / spec from the user's message
2. If the user provided Spotify IDs, use them; otherwise let the script auto-search
3. Run: `node scripts/add-artists.mjs --names "..."` (or `--file` if a JSON spec was given)
4. Read and relay the script output — show which artists were added, their ticker symbols, follower counts, and any failures
5. If artist-map.ts was updated, confirm that

## Env requirements

The script reads `.env.local` automatically:
- `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SECRET_KEY` — **required**
- `SPOTIFY_CLIENT_ID` + `SPOTIFY_CLIENT_SECRET` — optional but recommended (enables auto image/follower sync)

## Notes

- Duplicate tickers are skipped safely (idempotent)
- The spotter counter starts at 1 immediately, so the first user to spot the new artist gets #1
- Spotify image/follower data also syncs every 3 h via the existing cron job
- After adding, the artist appears in Explore immediately; it will surface in momentum ranking once it accumulates spots/views
