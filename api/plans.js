// api/plans.js
//
// API-01 — subscription plans. Public: active plans only; an authenticated
// admin sees all plans (including inactive). No pagination: the catalog is
// tiny (basic/pro/enterprise) and the store consumes a plain array.
import { prisma } from './lib/prisma.js'
import { HttpError, asyncRoute } from './lib/http.js'
import { getAuthUser } from './lib/auth.js'

export const config = { runtime: 'nodejs' }

export default asyncRoute(async (req, res) => {
  if (req.method !== 'GET') {
    throw new HttpError('METHOD', 'Method not allowed', 405)
  }
  let isAdmin = false
  try {
    const { userId } = await getAuthUser(req)
    const dbUser = await prisma.user.findUnique({ where: { id: userId } })
    isAdmin = Boolean(dbUser?.isActive && dbUser.role === 'admin')
  } catch {
    // anonymous or invalid token -> public view (active plans only)
  }
  const where = {}
  if (!isAdmin) where.isActive = true
  const plans = await prisma.subscriptionPlan.findMany({ where, orderBy: { order: 'asc' } })
  return res.status(200).json({ data: plans })
})
