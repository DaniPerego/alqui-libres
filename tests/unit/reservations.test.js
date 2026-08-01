// tests/unit/reservations.test.js
//
// RED unit tests for the reservation transition map (API-04 / D6):
//   invalid transition -> INVALID (409 in handler)
//   valid transition with wrong role -> FORBIDDEN (403 in handler)
//   owner confirm/reject from pending, owner+guest cancel.
//
// The handler module pulls in prisma/auth; the bare specifiers are mocked so
// the import chain loads without a DB/client. resolveTransition is pure.
import { describe, it, expect, vi } from 'vitest'

vi.mock('@prisma/client', async () => {
  const actual = await vi.importActual('@prisma/client')
  return { ...actual, PrismaClient: class {} }
})

import { resolveTransition, RESERVATION_TRANSITIONS } from '../../api/reservations/[id]/status.js'

describe('reservation transition map (API-04)', () => {
  it('transicion invalida -> INVALID (handler responde 409)', () => {
    expect(resolveTransition('confirmed', 'confirmed', 'owner')).toEqual({ ok: false, code: 'INVALID' })
    expect(resolveTransition('confirmed', 'rejected', 'owner')).toEqual({ ok: false, code: 'INVALID' })
    expect(resolveTransition('rejected', 'cancelled', 'guest')).toEqual({ ok: false, code: 'INVALID' })
    expect(resolveTransition('cancelled', 'confirmed', 'owner')).toEqual({ ok: false, code: 'INVALID' })
    expect(resolveTransition('pending', 'pending', 'owner')).toEqual({ ok: false, code: 'INVALID' })
  })

  it('transicion valida con rol equivocado -> FORBIDDEN (403)', () => {
    expect(resolveTransition('pending', 'confirmed', 'guest')).toEqual({ ok: false, code: 'FORBIDDEN' })
    expect(resolveTransition('pending', 'rejected', 'guest')).toEqual({ ok: false, code: 'FORBIDDEN' })
  })

  it('owner confirma y rechaza desde pending', () => {
    expect(resolveTransition('pending', 'confirmed', 'owner')).toEqual({ ok: true })
    expect(resolveTransition('pending', 'rejected', 'owner')).toEqual({ ok: true })
  })

  it('owner y guest cancelan desde pending y confirmed (cancel silencioso)', () => {
    expect(resolveTransition('pending', 'cancelled', 'owner')).toEqual({ ok: true })
    expect(resolveTransition('pending', 'cancelled', 'guest')).toEqual({ ok: true })
    expect(resolveTransition('confirmed', 'cancelled', 'owner')).toEqual({ ok: true })
    expect(resolveTransition('confirmed', 'cancelled', 'guest')).toEqual({ ok: true })
  })

  it('mapa cubre solo pending y confirmed como estado origen', () => {
    expect(Object.keys(RESERVATION_TRANSITIONS).sort()).toEqual(['confirmed', 'pending'])
  })
})
