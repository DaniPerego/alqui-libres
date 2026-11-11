// api-handlers/lib/ical.js
//
// Minimal RFC-5545 iCal utilities for AlquiLibres.
//   - parseIcal / serializeIcal: pure parser/serializer pair.
//   - assertSafeIcalUrl / fetchIcal: SSRF-hardened HTTP fetch.
//   - expandDateRange / expandIcalEventsToDays: day-range helpers that mirror
//     the half-open convention used by the availability endpoint.

import dns from 'node:dns'
import net from 'node:net'
import { HttpError } from './http.js'

export const config = { runtime: 'nodejs' }

const DAY_MS = 86_400_000
const MAX_REDIRECTS = 2
const MAX_SIZE_BYTES = 1024 * 1024
const FETCH_TIMEOUT_MS = 8_000

// ---------- pure date helpers ----------

function pad(n) {
  return String(n).padStart(2, '0')
}

function formatDate(date) {
  const d = new Date(date)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/**
 * iCal all-day values arrive as a compact YYYYMMDD string (never a Date).
 * Normalize them to ISO so day expansion and comparisons stay consistent —
 * without this, feeds that export all-day events (Airbnb, Booking, Google)
 * produced raw "20261201" keys and blocked ZERO days downstream.
 */
function compactToIso(value) {
  const m = String(value).match(/^(\d{4})(\d{2})(\d{2})$/)
  if (!m) return String(value)
  return `${m[1]}-${m[2]}-${m[3]}`
}

function addOneDay(dateString) {
  const d = new Date(`${dateString}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return formatDate(d)
}

/**
 * Expand a half-open day range [start, end) into ISO day strings.
 * Mirrors api-handlers/properties/[id]/availability.js.
 */
export function expandDateRange(start, end) {
  const dates = []
  const current = new Date(`${start}T00:00:00.000Z`)
  const last = new Date(`${end}T00:00:00.000Z`)
  while (current < last) {
    dates.push(formatDate(current))
    current.setUTCDate(current.getUTCDate() + 1)
  }
  return dates
}

/**
 * Expand normalized iCal events into individual blocked day strings.
 */
export function expandIcalEventsToDays(events) {
  const days = []
  for (const e of events || []) {
    days.push(...expandDateRange(e.start, e.end))
  }
  return days
}

// ---------- parser ----------

function unescapeIcal(value) {
  return String(value)
    .replace(/\\n/gi, '\n')
    .replace(/\\;/g, ';')
    .replace(/\\,/g, ',')
    .replace(/\\\\/g, '\\')
}

function parseDateTime(prop) {
  if (!prop) return null
  const { value, params } = prop

  // All-day: VALUE=DATE or bare YYYYMMDD.
  if (params.VALUE === 'DATE' || /^\d{8}$/.test(value)) {
    return { date: value, isAllDay: true }
  }

  // Timed: YYYYMMDDTHHMMSS(Z?) or TZID=... prefixed.
  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/)
  if (!m) return null

  const [, y, mo, d, h, mi, s, z] = m
  // TZ decision: we cannot reliably interpret arbitrary TZID values without a
  // timezone database, and external feeds often ship TZID without a matching
  // VTIMEZONE. Conservative choice: treat every timed value as UTC. This is
  // documented here so callers understand the trade-off.
  const date = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s))
  return { date, isAllDay: false }
}

function normalizeEvent(props) {
  const startProp = props.DTSTART
  if (!startProp) return null

  const startParsed = parseDateTime(startProp)
  if (!startParsed) return null

  const endProp = props.DTEND || startProp
  const endParsed = parseDateTime(endProp)

  let startDay
  let endDay

  if (startParsed.isAllDay) {
    startDay = compactToIso(startParsed.date)
    if (endParsed && endParsed.isAllDay) {
      // RFC 5545 all-day ranges already use an exclusive DTEND.
      endDay = compactToIso(endParsed.date)
    } else {
      endDay = addOneDay(startDay)
    }
  } else {
    startDay = formatDate(startParsed.date)
    if (endParsed) {
      // Mixed feeds ship DTEND as VALUE=DATE even when DTSTART is timed.
      endDay = endParsed.isAllDay ? compactToIso(endParsed.date) : formatDate(endParsed.date)
    } else {
      endDay = addOneDay(startDay)
    }
  }

  // Half-open ranges drive day expansion: a zero/negative span would block
  // nothing. All-day without DTEND and same-day timed events are both single
  // day commitments (RFC 5545 default duration), so guarantee at least one
  // blocked day. Without this, all-day feeds and same-day timed blocks
  // silently produced an empty availability window.
  if (endDay <= startDay) endDay = addOneDay(startDay)

  const summary = props.SUMMARY ? unescapeIcal(props.SUMMARY.value) : undefined
  const uid = props.UID ? props.UID.value : undefined

  return { start: startDay, end: endDay, summary, uid }
}

/**
 * Minimal RFC-5545 reader. Returns normalized events:
 *   { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD', summary?: string, uid?: string }
 * `end` is EXCLUSIVE (half-open day range).
 */
export function parseIcal(text) {
  if (typeof text !== 'string') return []

  // Unfold continuation lines. RFC 5545 uses CRLF followed by a single space
  // or tab; we also accept bare LF continuations for robustness.
  const unfolded = text
    .replace(/\r?\n[ \t]/g, '')
    .replace(/\r[ \t]/g, '')

  const lines = unfolded.split(/\r\n|\n/)
  const events = []
  let current = null

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (line === 'BEGIN:VEVENT') {
      current = { props: {} }
      continue
    }
    if (line === 'END:VEVENT') {
      if (current) {
        const normalized = normalizeEvent(current.props)
        if (normalized) events.push(normalized)
        current = null
      }
      continue
    }
    if (!current) continue

    const idx = line.indexOf(':')
    if (idx === -1) continue

    const namePart = line.slice(0, idx)
    const value = line.slice(idx + 1)
    const [name, ...paramParts] = namePart.split(';')
    const params = Object.fromEntries(
      paramParts.map((p) => {
        const [k, ...rest] = p.split('=')
        return [k.toUpperCase(), rest.join('=')]
      })
    )

    current.props[name.toUpperCase()] = { value, params }
  }

  return events
}

// ---------- serializer ----------

function escapeIcal(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n')
}

function formatUtcDateTime(date) {
  const d = new Date(date)
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}

function foldLine(line) {
  const maxBytes = 75
  if (Buffer.byteLength(line, 'utf8') <= maxBytes) return line

  const parts = []
  let remaining = line
  while (Buffer.byteLength(remaining, 'utf8') > maxBytes) {
    let cut = maxBytes
    while (cut > 0 && Buffer.byteLength(remaining.slice(0, cut), 'utf8') > maxBytes) {
      cut--
    }
    parts.push(remaining.slice(0, cut))
    remaining = ' ' + remaining.slice(cut)
  }
  parts.push(remaining)
  return parts.join('\r\n')
}

/**
 * Serialize normalized events into a text/calendar payload.
 * Input events use half-open day ranges; output uses DTSTART/DTEND;VALUE=DATE
 * with the same exclusive end semantics.
 */
export function serializeIcal({ uid, title, events }) {
  const calendarUid = uid || 'alquilibres@alquilibres.com'
  const dtstamp = formatUtcDateTime(new Date())
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//AlquiLibres//${escapeIcal(title || 'Calendar')}//EN`,
  ]

  for (let i = 0; i < (events || []).length; i++) {
    const e = events[i]
    const eventUid = e.uid || `${calendarUid}-event-${i}`
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${eventUid}`)
    lines.push(`DTSTAMP:${dtstamp}`)
    lines.push(`DTSTART;VALUE=DATE:${e.start.replace(/-/g, '')}`)
    lines.push(`DTEND;VALUE=DATE:${e.end.replace(/-/g, '')}`)
    if (e.summary) lines.push(`SUMMARY:${escapeIcal(e.summary)}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join('\r\n') + '\r\n'
}

// ---------- SSRF-hardened URL guard ----------

const IPv4_PRIVATE_RANGES = [
  { mask: 8, prefixInt: 10 << 24 },
  { mask: 12, prefixInt: (172 << 24) | (16 << 16) },
  { mask: 16, prefixInt: (192 << 24) | (168 << 16) },
  { mask: 8, prefixInt: 127 << 24 },
  { mask: 16, prefixInt: (169 << 24) | (254 << 16) },
]

function isPrivateIPv4(ip) {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    return true
  }
  if (parts.every((p) => p === 0)) return true

  const ipInt = parts.reduce((acc, p) => (acc << 8) | p, 0) >>> 0
  for (const { mask, prefixInt } of IPv4_PRIVATE_RANGES) {
    const shift = 32 - mask
    if ((ipInt >>> shift) === (prefixInt >>> shift)) return true
  }
  return false
}

function expandIPv6(ip) {
  const clean = ip.split('%')[0].toLowerCase()
  if (!net.isIPv6(clean)) return null
  if (!clean.includes('::')) return clean

  const [left, right] = clean.split('::')
  const leftParts = left ? left.split(':').filter(Boolean) : []
  const rightParts = right ? right.split(':').filter(Boolean) : []
  const missing = 8 - leftParts.length - rightParts.length
  if (missing < 0) return null
  const middle = Array(missing).fill('0')
  return [...leftParts, ...middle, ...rightParts].join(':')
}

function isPrivateIPv6(ip) {
  const expanded = expandIPv6(ip)
  if (!expanded) return true
  const parts = expanded.split(':').map((g) => parseInt(g, 16))
  if (parts.length !== 8) return true

  // ::1
  if (parts.every((p, i) => p === 0 || (i === 7 && p === 1))) return true
  // fc00::/7 (unique local)
  if ((parts[0] & 0xfe00) === 0xfc00) return true
  // fe80::/10 (link-local)
  if ((parts[0] & 0xffc0) === 0xfe80) return true
  return false
}

function isPrivateIP(ip) {
  const version = net.isIP(ip)
  if (version === 4) return isPrivateIPv4(ip)
  if (version === 6) return isPrivateIPv6(ip)
  return true
}

/**
 * Validate that an iCal URL is safe to fetch:
 *   - https scheme only
 *   - no localhost / *.local hostnames
 *   - no private/loopback/link-local IP literals
 *   - DNS resolves and every address is public
 * Throws HttpError('VALIDATION', ...) on failure.
 */
export async function assertSafeIcalUrl(url) {
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    throw new HttpError('VALIDATION', 'Invalid URL', 400)
  }

  if (parsed.protocol !== 'https:') {
    throw new HttpError('VALIDATION', 'URL must use HTTPS', 400)
  }

  const hostname = parsed.hostname
  if (hostname === 'localhost' || hostname.endsWith('.local')) {
    throw new HttpError('VALIDATION', 'URL hostname is not allowed', 400)
  }

  // URL.hostname keeps IPv6 literals bracketed ([::1]); strip them so net.isIP
  // classifies the address instead of falling through to a DNS lookup.
  const bareHost = hostname.replace(/^\[|\]$/g, '')
  if (net.isIP(bareHost)) {
    if (isPrivateIP(bareHost)) {
      throw new HttpError('VALIDATION', 'URL IP address is not allowed', 400)
    }
    return
  }

  let addresses
  try {
    addresses = await dns.promises.lookup(hostname, { all: true })
  } catch {
    throw new HttpError('VALIDATION', 'URL hostname could not be resolved', 400)
  }

  if (!addresses || addresses.length === 0) {
    throw new HttpError('VALIDATION', 'URL hostname could not be resolved', 400)
  }

  for (const { address } of addresses) {
    if (isPrivateIP(address)) {
      throw new HttpError('VALIDATION', 'URL resolves to a forbidden address', 400)
    }
  }
}

// ---------- fetch ----------

/**
 * SSRF-hardened iCal fetch. Validates each redirect hop, enforces an 8s
 * timeout, aborts responses >1MB, and requires the body to contain
 * BEGIN:VCALENDAR. Throws HttpError('SERVICE_UNAVAILABLE', ...) on upstream
 * failures; HttpError('VALIDATION', ...) is re-thrown from assertSafeIcalUrl.
 */
export async function fetchIcal(url) {
  let currentUrl = url
  let redirects = 0

  while (true) {
    await assertSafeIcalUrl(currentUrl)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(new Error('Timeout')), FETCH_TIMEOUT_MS)

    let response
    try {
      response = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: 'manual',
        headers: { Accept: 'text/calendar' },
      })
      clearTimeout(timeout)
    } catch (err) {
      clearTimeout(timeout)
      if (err instanceof HttpError) throw err
      throw new HttpError('SERVICE_UNAVAILABLE', 'Failed to fetch iCal', 503)
    }

    if (response.status >= 300 && response.status < 400 && response.headers.has('location')) {
      if (redirects >= MAX_REDIRECTS) {
        throw new HttpError('SERVICE_UNAVAILABLE', 'Too many redirects', 503)
      }
      redirects++
      currentUrl = new URL(response.headers.get('location'), currentUrl).href
      continue
    }

    if (!response.ok) {
      throw new HttpError('SERVICE_UNAVAILABLE', `Upstream returned ${response.status}`, 503)
    }

    if (!response.body) {
      throw new HttpError('SERVICE_UNAVAILABLE', 'Empty iCal response', 503)
    }

    const chunks = []
    let size = 0
    let sizeExceeded = false
    try {
      for await (const chunk of response.body) {
        size += chunk.length
        if (size > MAX_SIZE_BYTES) {
          sizeExceeded = true
          controller.abort()
          break
        }
        chunks.push(chunk)
      }
    } catch (err) {
      if (sizeExceeded) {
        throw new HttpError('SERVICE_UNAVAILABLE', 'iCal response too large', 503)
      }
      throw new HttpError('SERVICE_UNAVAILABLE', 'Failed to read iCal response', 503)
    }

    if (sizeExceeded) {
      throw new HttpError('SERVICE_UNAVAILABLE', 'iCal response too large', 503)
    }

    const text = Buffer.concat(chunks).toString('utf8')
    if (!text.includes('BEGIN:VCALENDAR')) {
      throw new HttpError('SERVICE_UNAVAILABLE', 'Invalid iCal response', 503)
    }
    return text
  }
}
