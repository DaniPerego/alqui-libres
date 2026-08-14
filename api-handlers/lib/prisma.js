// api/lib/prisma.js
//
// Serverless-safe Prisma singleton: Vercel functions can be re-invoked on
// warm instances, so we reuse one PrismaClient per process via globalThis
// instead of opening a new connection pool per request.
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
