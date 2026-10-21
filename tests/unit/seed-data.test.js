// tests/unit/seed-data.test.js
//
// Unit tests for prisma/seed-data.js — pure payload builder (no DB, no network).
// Covers D8 normalization (propertyType -> enum), ownerId remap (user123/user456/
// owner001 -> seed user IDs), review/message participant remap, and payload
// idempotency (stable ids, no duplicates — VPD-04).
import { describe, it, expect } from 'vitest'
import { buildSeedPayload, normalizePropertyType } from '../../prisma/seed-data.js'
import {
  mockProperties,
  mockPendingProperties,
  mockAnnualProperty,
  mockReviews,
  mockMessages,
  mockGuestUser,
  mockOwnerUser,
  mockAdminUser,
} from '../../src/data/mockData.js'

const userIds = { guest: 'supa-guest-001', owner: 'supa-owner-001', admin: 'supa-admin-001' }

function build() {
  return buildSeedPayload(
    {
      mockProperties,
      mockPendingProperties,
      mockAnnualProperty,
      mockReviews,
      mockMessages,
      mockGuestUser,
      mockOwnerUser,
      mockAdminUser,
    },
    { userIds }
  )
}

describe('normalizePropertyType (D8)', () => {
  it('mapea apartamento -> departamento (enum del spec)', () => {
    expect(normalizePropertyType('apartamento')).toBe('departamento')
  })
  it('mantiene cabana (Prisma enum sin tilde)', () => {
    expect(normalizePropertyType('cabana')).toBe('cabana')
  })
  it('mapea loft (fuera del enum) a otro', () => {
    expect(normalizePropertyType('loft')).toBe('otro')
  })
  it('mantiene los valores validos del enum', () => {
    expect(normalizePropertyType('casa')).toBe('casa')
    expect(normalizePropertyType('departamento')).toBe('departamento')
    expect(normalizePropertyType('habitacion')).toBe('habitacion')
  })
  it('valor desconocido cae a otro', () => {
    expect(normalizePropertyType('mansion')).toBe('otro')
  })
})

describe('buildSeedPayload', () => {
  it('normaliza propertyType en todas las propiedades mock', () => {
    const { properties } = build()
    const byId = new Map(properties.map((p) => [p.id, p]))
    expect(byId.get('2').propertyType).toBe('departamento') // apartamento
    expect(byId.get('3').propertyType).toBe('cabana') // cabana
    expect(byId.get('4').propertyType).toBe('otro') // loft
    expect(byId.get('p6').propertyType).toBe('departamento') // apartamento
    expect(byId.get('p7').propertyType).toBe('departamento') // ya valido
    expect(byId.get('a1').propertyType).toBe('departamento') // apartamento
  })

  it('mantiene rentalType dentro del enum PropertyRentalType', () => {
    const { properties } = build()
    const byId = new Map(properties.map((p) => [p.id, p]))
    expect(byId.get('1').rentalType).toBe('temporario')
    expect(byId.get('p7').rentalType).toBe('anual')
    expect(byId.get('a1').rentalType).toBe('anual')
  })

  it('remapea ownerId user123/user456/owner001 al UID del owner seed', () => {
    const { properties } = build()
    const byId = new Map(properties.map((p) => [p.id, p]))
    expect(byId.get('1').ownerId).toBe(userIds.owner) // user123
    expect(byId.get('2').ownerId).toBe(userIds.owner) // user123
    expect(byId.get('3').ownerId).toBe(userIds.owner) // user456
    expect(byId.get('p5').ownerId).toBe(userIds.owner) // user456
    expect(byId.get('a1').ownerId).toBe(userIds.owner) // owner001
  })

  it('remapea reviews (listingId -> property, guest -> UID seed)', () => {
    const { reviews } = build()
    expect(reviews).toHaveLength(5)
    expect(reviews[0]).toMatchObject({ id: 'r1', propertyId: '1', guestId: userIds.guest })
    expect(reviews[3]).toMatchObject({ id: 'r4', propertyId: '3', ownerId: userIds.owner })
    const r1 = reviews.find((r) => r.id === 'r1')
    expect(r1.ownerResponse).toContain('Muchas gracias María')
    expect(r1.ownerRespondedAt).toBeInstanceOf(Date)
  })

  it('remapea mensajes a participantes seed (guest/owner UIDs)', () => {
    const { messages } = build()
    expect(messages).toHaveLength(5)
    for (const m of messages) {
      expect(m.guestId).toBe(userIds.guest)
      expect(m.ownerId).toBe(userIds.owner)
    }
    expect(messages[0].propertyId).toBe('1')
    const m4 = messages.find((m) => m.id === 'm4')
    expect(m4.status).toBe('replied')
    expect(m4.read).toBe(true)
    expect(m4.repliedAt).toBeInstanceOf(Date)
  })

  it('no construye users (los demo users los posee ensureDemoUsers en seed.js)', () => {
    const payload = build()
    expect(payload.users).toBeUndefined()
  })

  it('incluye planes basic/pro/enterprise y settings general (D3)', () => {
    const { plans, platformSettings } = build()
    expect(plans.map((p) => p.id)).toEqual(['basic', 'pro', 'enterprise'])
    expect(platformSettings.id).toBe('general')
  })

  it('incluye una subscription pro activa para el owner demo', () => {
    const { subscriptions } = build()
    expect(subscriptions).toHaveLength(1)
    expect(subscriptions[0]).toMatchObject({
      id: 'sub-owner-demo',
      userId: userIds.owner,
      planId: 'pro',
      status: 'active',
      autoRenew: true,
    })
    expect(subscriptions[0].startedAt).toBeInstanceOf(Date)
    expect(subscriptions[0].expiresAt).toBeInstanceOf(Date)
  })

  it('incluye 3 pagos aprobados del owner (2 vinculados a la subscription)', () => {
    const { payments } = build()
    expect(payments).toHaveLength(3)
    expect(payments.every((p) => p.status === 'approved' && p.userId === userIds.owner)).toBe(true)
    const linked = payments.filter((p) => p.subscriptionId === 'sub-owner-demo')
    expect(linked).toHaveLength(2)
    expect(payments.reduce((s, p) => s + p.amount, 0)).toBe(24999 * 3)
  })

  it('expone variedad de estados en propiedades demo', () => {
    const { properties } = build()
    const byId = new Map(properties.map((p) => [p.id, p]))
    expect(byId.get('1').featured).toBe(true)
    expect(byId.get('1').viewCount).toBe(1247)
    expect(byId.get('4').isActive).toBe(false)
    expect(byId.get('4').status).toBe('active')
    expect(byId.get('4').viewCount).toBe(0)
    expect([0, 45, 89, 312, 1247].sort((a, b) => a - b)).toEqual(
      ['1', '2', '3', '4', 'a1'].map((id) => byId.get(id).viewCount).sort((a, b) => a - b)
    )
  })

  it('incluye reservas demo en todos los estados y sus notificaciones (D10, API-04)', () => {
    const { reservations, notifications } = build()
    expect(reservations.map((r) => r.status).sort()).toEqual([
      'cancelled',
      'confirmed',
      'confirmed',
      'confirmed',
      'pending',
      'rejected',
    ])
    expect(notifications).toHaveLength(7)
    // create notifica al owner; confirm notifica al guest
    expect(notifications.find((n) => n.id === 'notif-res-1').userId).toBe(userIds.owner)
    expect(notifications.find((n) => n.id === 'notif-res-2').userId).toBe(userIds.guest)
    // owner inbox cubre todos los NotificationType
    const ownerNotifications = notifications.filter((n) => n.userId === userIds.owner)
    expect(ownerNotifications.map((n) => n.type).sort()).toEqual([
      'message',
      'payment',
      'property',
      'reservation',
      'reservation',
      'system',
    ])
  })

  it('no duplica ids dentro de cada lista (idempotencia del payload, VPD-04)', () => {
    const { properties, subscriptions, payments, reviews, messages, reservations, notifications } = build()
    for (const list of [properties, subscriptions, payments, reviews, messages, reservations, notifications]) {
      const ids = list.map((x) => x.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('requiere userIds completos', () => {
    expect(() => buildSeedPayload({ mockProperties, mockPendingProperties, mockAnnualProperty, mockReviews, mockMessages, mockGuestUser, mockOwnerUser, mockAdminUser }, { userIds: { guest: 'x' } })).toThrow()
  })
})
