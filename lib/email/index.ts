// Thin Resend wrapper. Silently skips if RESEND_API_KEY is not set (dev/CI).
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM   = process.env.EMAIL_FROM ?? 'SPOTLIGHT <noreply@spotlight.app>'
const TEAM   = process.env.TEAM_EMAIL ?? ''

async function send(to: string | string[], subject: string, html: string) {
  if (!resend) {
    console.log(`[email skip — no RESEND_API_KEY] to=${JSON.stringify(to)} subject="${subject}"`)
    return
  }
  const { error } = await resend.emails.send({ from: FROM, to, subject, html })
  if (error) console.error('[resend]', error)
}

// ── Templates ──────────────────────────────────────────────────────────────────

function base(body: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#050508;font-family:'JetBrains Mono',monospace;color:#e5e5e5;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:48px 24px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0a0a0f;border:1px solid rgba(201,168,76,0.18);border-radius:4px;overflow:hidden;">
<tr><td style="padding:0 0 0 0;">
  <div style="background:linear-gradient(135deg,#0d0b05,#050508);padding:28px 36px 24px;border-bottom:1px solid rgba(201,168,76,0.12);">
    <span style="color:#C9A84C;font-size:16px;letter-spacing:0.08em;">◈</span>
    <span style="color:rgba(255,255,255,0.75);font-size:11px;letter-spacing:0.32em;text-transform:uppercase;margin-left:10px;">SPOTLIGHT</span>
  </div>
</td></tr>
<tr><td style="padding:36px 36px 40px;">
  ${body}
</td></tr>
<tr><td style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.05);">
  <p style="margin:0;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.18);">
    You received this because you have an account on SPOTLIGHT.
  </p>
</td></tr>
</table>
</td></tr></table>
</body></html>`
}

function h1(text: string) {
  return `<h1 style="margin:0 0 20px;font-size:26px;font-weight:300;line-height:1.15;color:rgba(255,255,255,0.90);letter-spacing:0.01em;font-family:Georgia,serif;">${text}</h1>`
}
function p(text: string) {
  return `<p style="margin:0 0 14px;font-size:13px;line-height:1.75;color:rgba(255,255,255,0.55);">${text}</p>`
}
function mono(text: string) {
  return `<span style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.14em;color:rgba(201,168,76,0.75);">${text}</span>`
}
function badge(text: string) {
  return `<div style="display:inline-block;margin:16px 0;padding:10px 20px;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.30);border-radius:2px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#C9A84C;">${text}</div>`
}

// ── Email senders ──────────────────────────────────────────────────────────────

export async function sendRequestAcknowledgement(to: string, artistName: string, currentCount: number) {
  const need       = Math.max(0, 5 - currentCount)
  const countLabel = mono(`${currentCount} spotter${currentCount !== 1 ? 's' : ''}`)
  const thresholdNote = need > 0
    ? ` — ${mono(`${need} more`)} needed to trigger a review`
    : ' — the queue threshold is met, our team is on it'
  await send(to, `◈ We got your request — ${artistName}`, base(`
    ${h1(`Your request for <em style="color:#C9A84C;">${artistName}</em> is in.`)}
    ${p(`We review artists once they have been requested by 5 or more spotters. Right now, ${countLabel} have requested ${artistName}${thresholdNote}.`)}
    ${p(`We will email you the moment ${artistName} goes live on SPOTLIGHT.`)}
    ${badge('◈ Request Received')}
    ${p(`In the meantime, explore who is already on the platform. The next icon might already be there.`)}
  `))
}

export async function sendTeamArtistAlert(artistName: string, requestCount: number, requests: { requester_email: string; genre?: string | null; spotify_url?: string | null; reason?: string | null }[]) {
  if (!TEAM) return
  const rows = requests.map(r =>
    `<tr><td style="padding:6px 10px;font-size:11px;color:rgba(255,255,255,0.65);border-bottom:1px solid rgba(255,255,255,0.05);">${r.requester_email}</td><td style="padding:6px 10px;font-size:11px;color:rgba(201,168,76,0.75);">${r.reason ?? '—'}</td></tr>`
  ).join('')
  await send(TEAM, `🔔 Artist request threshold hit — ${artistName} (${requestCount} requests)`, base(`
    ${h1(`<em style="color:#C9A84C;">${artistName}</em> has been requested by ${requestCount} spotters.`)}
    ${p(`This artist has crossed the 5-request threshold and is ready for your team's review.`)}
    ${badge(`${requestCount} Requests · Action Required`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid rgba(201,168,76,0.15);border-radius:2px;">
      <tr style="background:rgba(201,168,76,0.07);">
        <td style="padding:8px 10px;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(201,168,76,0.50);">Requester</td>
        <td style="padding:8px 10px;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(201,168,76,0.50);">Why</td>
      </tr>
      ${rows}
    </table>
    ${requests[0]?.spotify_url ? p(`Spotify: <a href="${requests[0].spotify_url}" style="color:#C9A84C;">${requests[0].spotify_url}</a>`) : ''}
  `))
}

export async function sendArtistApprovedEmail(toList: string[], artistName: string, ticker: string) {
  for (const to of toList) {
    await send(to, `◈ ${artistName} is now on SPOTLIGHT — you helped make this happen`, base(`
      ${h1(`<em style="color:#C9A84C;">${artistName}</em> is live on SPOTLIGHT.`)}
      ${p(`You requested ${artistName} — and we listened. They're now on the platform, ready to be spotted.`)}
      ${badge('◈ Founding Requester')}
      ${p(`As the person who requested them, you'll receive a permanent <strong style="color:rgba(255,255,255,0.80);">◈ Founding Requester</strong> badge on your vault card when you spot ${artistName}. That badge tells every viewer: <em>this person is the reason this artist is here.</em>`)}
      ${p(`<a href="https://spotlight.app/creator/${ticker.toLowerCase()}" style="color:#C9A84C;text-decoration:none;">Go be the first to spot them →</a>`)}
    `))
  }
}
