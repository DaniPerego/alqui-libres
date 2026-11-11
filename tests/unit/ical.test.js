// tests/unit/ical.test.js
//
// Unit tests for api-handlers/lib/ical.js:
//   - parseIcal: unfolding, all-day vs timed, exclusive DTEND, escaping
//   - serializeIcal: round-trip, escaping, 75-octet line folding
//   - expandDateRange / expandIcalEventsToDays: half-open day semantics
//   - assertSafeIcalUrl: scheme/host/IP guards (no network in tests)
import { describe, it, expect } from 'vitest'
import {
  parseIcal,
  serializeIcal,
  expandDateRange,
  expandIcalEventsToDays,
  assertSafeIcalUrl,
} from '../../api-handlers/lib/ical.js'

const ICAL = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'BEGIN:VEVENT',
  'UID:ev-1@test',
  'DTSTART;VALUE=DATE:20261201',
  'DTEND;VALUE=DATE:20261205',
  'SUMMARY:Closed\\, renovation',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:ev-2@test',
  'DTSTART:20261210T143000Z',
  'DTEND:20261210T160000Z',
  'SUMMARY:Timed block',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:ev-3@test',
  'DTSTART;VALUE=DATE:20261220',
  'SUMMARY:Sin DTEND ni\rc\n líneas plegadas siempre\, con coma',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:ev-4@test',
  'SUMMARY:Sin DTSTART se ignora',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n')

describe('parseIcal', () => {
  it('parsea all-day, timed y eventos sin DTEND; ignora VEVENT sin DTSTART', () => {
    const events = parseIcal(ICAL)
    expect(events).toHaveLength(3)

    const [first, timed, noEnd] = events
    expect(first).toEqual({ start: '2026-12-01', end: '2026-12-05', summary: 'Closed, renovation', uid: 'ev-1@test' })
    // Same-day timed event: still a full committed day, so the half-open
    // range must span [day, day+1) — a zero span would block nothing.
    expect(timed).toEqual({ start: '2026-12-10', end: '2026-12-11', summary: 'Timed block', uid: 'ev-2@test' })
    // Missing DTEND -> exclusive end is start + 1 day.
    expect(noEnd.start).toBe('2026-12-20')
    expect(noEnd.end).toBe('2026-12-21')
  })

  it('desdobla líneas de continuación (CRLF + espacio)', () => {
    const folded = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'DTSTART;VALUE=DATE:20260101',
      'DTEND;VALUE=DATE:20260102',
      'SUMMARY:Una línea que se ',
      ' plega en dos',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const [event] = parseIcal(folded)
    expect(event.summary).toBe('Una línea que se plega en dos')
  })

  it('devuelve [] con entradas que no son string o sin VEVENTs', () => {
    expect(parseIcal(null)).toEqual([])
    expect(parseIcal(undefined)).toEqual([])
    expect(parseIcal(42)).toEqual([])
    expect(parseIcal('BEGIN:VCALENDAR\r\nEND:VCALENDAR')).toEqual([])
  })

  it('si DTEND es anterior a DTSTART, garantiza al menos un día bloqueado', () => {
    const ical = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'DTSTART;VALUE=DATE:20260310',
      'DTEND;VALUE=DATE:20260301',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const [event] = parseIcal(ical)
    expect(event.start).toBe('2026-03-10')
    expect(event.end).toBe('2026-03-11')
  })
})

describe('serializeIcal', () => {
  it('emite un calendario RFC-5545 con DTEND exclusivo', () => {
    const out = serializeIcal({
      uid: 'p-1@alquilibres.com',
      title: 'Depto centro',
      events: [{ start: '2026-12-01', end: '2026-12-05', summary: 'Reserved' }],
    })

    expect(out).toContain('BEGIN:VCALENDAR')
    expect(out).toContain('VERSION:2.0')
    expect(out).toContain('UID:p-1@alquilibres.com-event-0')
    expect(out).toContain('DTSTART;VALUE=DATE:20261201')
    expect(out).toContain('DTEND;VALUE=DATE:20261205')
    expect(out).toContain('SUMMARY:Reserved')
    expect(out.endsWith('\r\n')).toBe(true)
  })

  it('escapa comas, punto y coma y saltos de línea', () => {
    const out = serializeIcal({
      events: [{ start: '2026-01-01', end: '2026-01-02', summary: 'Feriado, pausa; vuelta\nlinea 2' }],
    })
    expect(out).toContain('SUMMARY:Feriado\\, pausa\\; vuelta\\nlinea 2')
  })

  it('pliega líneas a 75 octetos como manda RFC-5545', () => {
    const out = serializeIcal({
      events: [{ start: '2026-01-01', end: '2026-01-02', summary: 'x'.repeat(200) }],
    })
    const lines = out.split('\r\n')
    for (const line of lines) {
      expect(Buffer.byteLength(line, 'utf8')).toBeLessThanOrEqual(75)
    }
    // Continuation lines start with a single space.
    expect(lines.some((l) => l.startsWith(' '))).toBe(true)
  })

  it('round-trip: serializar y volver a parsear conserva el rango', () => {
    const events = [{ start: '2026-05-01', end: '2026-05-04', summary: 'Bloqueo' }]
    const parsed = parseIcal(serializeIcal({ events }))
    expect(parsed).toHaveLength(1)
    expect(parsed[0].start).toBe('2026-05-01')
    expect(parsed[0].end).toBe('2026-05-04')
    expect(parsed[0].summary).toBe('Bloqueo')
  })
})

describe('expandDateRange / expandIcalEventsToDays', () => {
  it('rango semiabierto [start, end) no incluye el día final', () => {
    expect(expandDateRange('2026-01-01', '2026-01-04')).toEqual([
      '2026-01-01', '2026-01-02', '2026-01-03',
    ])
    expect(expandDateRange('2026-01-01', '2026-01-01')).toEqual([])
  })

  it('cruza fin de año', () => {
    expect(expandDateRange('2026-12-30', '2027-01-02')).toEqual([
      '2026-12-30', '2026-12-31', '2027-01-01',
    ])
  })

  it('expande eventos iCal a días bloqueados, sin duplicados garantizados', () => {
    const days = expandIcalEventsToDays([
      { start: '2026-06-01', end: '2026-06-03' },
      { start: '2026-06-10', end: '2026-06-11' },
    ])
    expect(days).toEqual(['2026-06-01', '2026-06-02', '2026-06-10'])
    expect(expandIcalEventsToDays(null)).toEqual([])
  })
})

describe('assertSafeIcalUrl (SSRF)', () => {
  const expectReject = async (url, match) => {
    await expect(assertSafeIcalUrl(url)).rejects.toThrow(match)
  }

  it('rechaza esquemas distintos de https', async () => {
    await expectReject('http://example.com/cal.ics', 'HTTPS')
    await expectReject('ftp://example.com/cal.ics', 'HTTPS')
    await expectReject('file:///etc/passwd', 'HTTPS')
  })

  it('rechaza URLs malformadas', async () => {
    await expectReject('not a url', 'Invalid URL')
  })

  it('rechaza localhost y hostnames .local', async () => {
    await expectReject('https://localhost/cal.ics', 'hostname is not allowed')
    await expectReject('https://mi-casa.local/cal.ics', 'hostname is not allowed')
  })

  it('rechaza IPs privadas, loopback y link-local (v4 y v6)', async () => {
    const bad = [
      'https://127.0.0.1/cal.ics',
      'https://10.0.0.5/cal.ics',
      'https://192.168.1.10/cal.ics',
      'https://172.16.4.4/cal.ics',
      'https://169.254.169.254/latest/meta-data',
      'https://[::1]/cal.ics',
      'https://[fd00::1]/cal.ics',
      'https://[fe80::1]/cal.ics',
    ]
    for (const url of bad) {
      await expectReject(url, /IP address is not allowed|Invalid URL/)
    }
  })

  it('acepta una IP pública literal (sin resolver DNS)', async () => {
    await expect(assertSafeIcalUrl('https://8.8.8.8/cal.ics')).resolves.toBeUndefined()
  })
})