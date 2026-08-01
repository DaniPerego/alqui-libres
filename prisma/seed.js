// prisma/seed.js
//
// Idempotent seed (VPD-04, D9, D10):
//   1. Creates demo users in Supabase Auth (service role) if they don't
//      exist: huesped@alquilibres.com/guest123, usuario@alquilibres.com/user123,
//      admin@alquilibres.com/admin123 (email_confirm: true).
//   2. Upserts rows in Postgres (users, properties, plans, platform_settings,
//      reviews, messages, 2 demo reservations + notification rows), all keyed
//      by stable ids — re-running leaves counts unchanged.
//
// Requires env: DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// Run with: npm run seed  (prisma db seed -> node prisma/seed.js)
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
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
      `Falta la variable de entorno ${name}. Copia .env.example a .env y completala con los valores reales (Vercel Postgres / Supabase).`
    )
  }
  return value
}

// Upsert the 3 demo accounts in Supabase Auth. Skips emails that already
// exist so re-runs never duplicate accounts (VPD-04 idempotency).
async function ensureSupabaseUsers() {
  const url = requireEnv('SUPABASE_URL')
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const demoAccounts = [
    { role: 'guest', email: mockGuestUser.email, password: 'guest123', displayName: mockGuestUser.displayName },
    { role: 'owner', email: mockOwnerUser.email, password: 'user123', displayName: mockOwnerUser.displayName },
    { role: 'admin', email: mockAdminUser.email, password: 'admin123', displayName: mockAdminUser.displayName },
  ]

  const { data: existing, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) {
    throw new Error(`No se pudieron listar usuarios de Supabase: ${listError.message}`)
  }
  const byEmail = new Map(existing.users.map((u) => [u.email, u]))

  const userIds = {}
  for (const account of demoAccounts) {
    const found = byEmail.get(account.email)
    if (found) {
      userIds[account.role] = found.id
      continue
    }
    const { data, error } = await admin.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: { displayName: account.displayName, role: account.role },
    })
    if (error) {
      throw new Error(`No se pudo crear el usuario demo ${account.email}: ${error.message}`)
    }
    userIds[account.role] = data.user.id
    console.log(`  Supabase user creado: ${account.email} (${account.role})`)
  }
  return userIds
}

async function upsertByStableId(model, rows) {
  for (const row of rows) {
    const { id, ...update } = row
    await model.upsert({ where: { id }, update, create: row })
  }
}

async function main() {
  requireEnv('DATABASE_URL')
  console.log('Seed AlquiLibres — backend-vercel-migration (WU1)')

  console.log('1/2 Supabase demo users...')
  const userIds = await ensureSupabaseUsers()

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

  await upsertByStableId(prisma.user, payload.users)
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
  console.log(`  users: ${payload.users.length} (ids = Supabase UIDs)`)
  console.log(`  properties: ${payload.properties.length}`)
  console.log(`  plans: ${payload.plans.length}, platform_settings: 1`)
  console.log(`  reviews: ${payload.reviews.length}, messages: ${payload.messages.length}`)
  console.log(`  reservations: ${payload.reservations.length}, notifications: ${payload.notifications.length}`)
}

main()
  .catch((err) => {
    console.error('Seed falló:', err.message ?? err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
