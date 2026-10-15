// prisma/seed.js
//
// Idempotent seed (VPD-04, D9, D10):
//   1. Creates demo users directly in Postgres with bcrypt hashed passwords:
//      huesped@alquilibres.com/guest123, usuario@alquilibres.com/user123,
//      admin@alquilibres.com/admin123.
//   2. Upserts rows in Postgres (users, properties, plans, platform_settings,
//      reviews, messages, 2 demo reservations + notification rows), all keyed
//      by stable ids — re-running leaves counts unchanged.
//
// Requires env: DATABASE_URL.
// Run with: npm run seed  (prisma db seed -> node prisma/seed.js)
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { pathToFileURL } from 'url'
import {
  mockProperties,
  mockPendingProperties,
  mockAnnualProperty,
  mockReviews,
  mockMessages,
  mockGuestUser,
  mockOwnerUser,
  mockAdminUser,
} from '../src/data/mockData.js'
import { buildSeedPayload } from './seed-data.js'

const prisma = new PrismaClient()

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Copia .env.example a .env y completala con los valores reales.`
    )
  }
  return value
}

// Single owner of the demo user rows. Creates/updates the full row — bcrypt
// password, profile, AND subscription — so nothing else needs to touch User.
// (A separate user upsert once overwrote these bcrypt hashes with plaintext
// passwords, which silently broke login.)
async function ensureDemoUsers() {
  const demoAccounts = [
    { role: 'guest', email: mockGuestUser.email, password: 'guest123', displayName: mockGuestUser.displayName, emailVerified: mockGuestUser.emailVerified !== false, subscription: mockGuestUser.subscription ?? null },
    { role: 'owner', email: mockOwnerUser.email, password: 'user123', displayName: mockOwnerUser.displayName, emailVerified: mockOwnerUser.emailVerified !== false, subscription: mockOwnerUser.subscription ?? null },
    { role: 'admin', email: mockAdminUser.email, password: 'admin123', displayName: mockAdminUser.displayName, emailVerified: mockAdminUser.emailVerified !== false, subscription: mockAdminUser.subscription ?? null },
  ]

  // Stable UUIDs for demo users (deterministic across runs)
  const STABLE_IDS = {
    guest: 'a0000000-0000-0000-0000-000000000001',
    owner: 'a0000000-0000-0000-0000-000000000002',
    admin: 'a0000000-0000-0000-0000-000000000003',
  }

  const userIds = {}
  for (const account of demoAccounts) {
    const id = STABLE_IDS[account.role]
    const hashed = await bcrypt.hash(account.password, 10)
    const row = {
      email: account.email,
      password: hashed,
      displayName: account.displayName,
      role: account.role,
      isActive: true,
      emailVerified: account.emailVerified,
      subscription: account.subscription,
    }
    const existing = await prisma.user.findUnique({ where: { email: account.email } })

    if (existing) {
      userIds[account.role] = existing.id
      await prisma.user.update({ where: { id: existing.id }, data: row })
      console.log(`  Usuario actualizado: ${account.email}`)
      continue
    }

    await prisma.user.create({ data: { id, ...row } })
    userIds[account.role] = id
    console.log(`  Usuario creado: ${account.email} (${account.role})`)
  }
  return userIds
}

async function upsertByStableId(model, rows) {
  for (const row of rows) {
    const { id, ...update } = row
    await model.upsert({ where: { id }, update, create: row })
  }
}

export async function main() {
  requireEnv('DATABASE_URL')
  console.log('Seed AlquiLibres — native auth (no Supabase)')

  console.log('1/2 Demo users (bcrypt)...')
  const userIds = await ensureDemoUsers()

  console.log('2/2 Postgres upserts...')
  const payload = buildSeedPayload(
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

  // Users are seeded solely by ensureDemoUsers() above (bcrypt password +
  // profile + subscription). No user upsert here: a second writer once
  // overwrote the bcrypt hashes with plaintext passwords and broke login.
  await upsertByStableId(prisma.property, payload.properties)
  await upsertByStableId(prisma.subscriptionPlan, payload.plans)
  await prisma.platformSettings.upsert({
    where: { id: payload.platformSettings.id },
    update: { ...payload.platformSettings, id: undefined },
    create: payload.platformSettings,
  })
  await upsertByStableId(prisma.review, payload.reviews)
  await upsertByStableId(prisma.message, payload.messages)
  await upsertByStableId(prisma.reservation, payload.reservations)
  await upsertByStableId(prisma.notification, payload.notifications)

  console.log('Seed completado:')
  console.log(`  users: ${payload.users.length} (bcrypt hashed)`)
  console.log(`  properties: ${payload.properties.length}`)
  console.log(`  plans: ${payload.plans.length}, platform_settings: 1`)
  console.log(`  reviews: ${payload.reviews.length}, messages: ${payload.messages.length}`)
  console.log(`  reservations: ${payload.reservations.length}, notifications: ${payload.notifications.length}`)
  console.log('')
  console.log('Credenciales demo:')
  console.log('  huesped@alquilibres.com / guest123')
  console.log('  usuario@alquilibres.com / user123')
  console.log('  admin@alquilibres.com / admin123')
}

// Auto-run only when executed directly (`node prisma/seed.js` / `npm run
// seed`). When imported (e.g. by the temporary serverless seed endpoint),
// main() must be awaited explicitly by the caller.
const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectRun) {
  main()
    .catch((err) => {
      console.error('Seed falló:', err.message ?? err)
      process.exitCode = 1
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
