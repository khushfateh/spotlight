#!/usr/bin/env node
/**
 * spot-artists.mjs
 *
 * Programmatically spot artists on behalf of a user.
 * Uses the admin (service-role) client so RLS is bypassed.
 * Calls spot_or_rediscover() RPC — the same path the app uses —
 * so spotter numbers, user_artist_spots, and the realtime `spots`
 * table all update exactly as if the user clicked "Spot" in the UI.
 *
 * Usage:
 *   node scripts/spot-artists.mjs --tickers TEMS,SHUBH,APDHILLON --user-id <uuid>
 *   node scripts/spot-artists.mjs --tickers TEMS,SHUBH,APDHILLON --user-email khushfateh01@gmail.com
 *
 * Env (read from .env.local automatically):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SECRET_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

// ─── Load .env.local ───────────────────────────────────────────────────────

const root = resolve(fileURLToPath(import.meta.url), '../../')
const envPath = resolve(root, '.env.local')

if (existsSync(envPath)) {
  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
}

// ─── Parse args ────────────────────────────────────────────────────────────

function arg(flag) {
  const idx = process.argv.indexOf(flag)
  return idx !== -1 ? process.argv[idx + 1] : null
}

const tickersRaw = arg('--tickers')
const userIdArg  = arg('--user-id')
const userEmail  = arg('--user-email')

if (!tickersRaw) {
  console.error('Error: --tickers is required  (e.g. --tickers TEMS,SHUBH,APDHILLON)')
  process.exit(1)
}
if (!userIdArg && !userEmail) {
  console.error('Error: provide --user-id <uuid>  OR  --user-email <email>')
  process.exit(1)
}

const tickers = tickersRaw.split(',').map(t => t.trim().toUpperCase()).filter(Boolean)

// ─── Supabase admin client ─────────────────────────────────────────────────

const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
const secret = process.env.SUPABASE_SECRET_KEY

if (!url || !secret) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env.local')
  process.exit(1)
}

const admin = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ─── Resolve user ID ───────────────────────────────────────────────────────

async function resolveUserId() {
  if (userIdArg) return userIdArg

  // Look up by email in auth.users (requires service-role)
  const { data, error } = await admin.auth.admin.listUsers()
  if (error) throw new Error(`Could not list auth users: ${error.message}`)

  const match = data.users.find(u => u.email === userEmail)
  if (!match) throw new Error(`No auth user found with email: ${userEmail}`)
  return match.id
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🎯 SPOTLIGHT — Spot Artist Script')
  console.log('─'.repeat(40))

  const userId = await resolveUserId()
  console.log(`\n  User ID : ${userId}`)
  console.log(`  Tickers : ${tickers.join(', ')}\n`)

  // Fetch all creator IDs in one query
  const { data: creators, error: creatorErr } = await admin
    .from('creators')
    .select('id, ticker, name')
    .in('ticker', tickers)

  if (creatorErr) throw new Error(`Could not fetch creators: ${creatorErr.message}`)

  // Warn about any tickers not found
  const found = new Set(creators.map(c => c.ticker.toUpperCase()))
  const missing = tickers.filter(t => !found.has(t))
  if (missing.length) {
    console.warn(`  ⚠  Tickers not found in creators table: ${missing.join(', ')}\n`)
  }

  // Spot each creator via the canonical RPC
  const results = []
  for (const creator of creators) {
    process.stdout.write(`  Spotting ${creator.name.padEnd(28)} `)

    const { data, error } = await admin.rpc('spot_or_rediscover', {
      p_user_id:    userId,
      p_creator_id: creator.id,
    })

    if (error) {
      console.log(`✗  ${error.message}`)
      results.push({ ticker: creator.ticker, name: creator.name, ok: false, error: error.message })
    } else {
      const { spotter_number, card_status } = data ?? {}
      const badge = card_status === 'already_spotted' ? '(already spotted)' : `#${spotter_number} spotter`
      console.log(`✓  ${badge}  [${card_status}]`)
      results.push({ ticker: creator.ticker, name: creator.name, ok: true, spotter_number, card_status })
    }
  }

  // Summary
  const ok  = results.filter(r => r.ok).length
  const bad = results.filter(r => !r.ok).length
  console.log('\n─'.repeat(40))
  console.log(`  Done: ${ok} spotted, ${bad} failed, ${missing.length} ticker(s) not found`)
  console.log('  Realtime listeners in the app will update automatically.\n')

  if (bad > 0) process.exit(1)
}

main().catch(err => {
  console.error('\n  Fatal:', err.message)
  process.exit(1)
})
