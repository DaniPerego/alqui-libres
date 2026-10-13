// api/[...slug].js
//
// Single Vercel serverless entry point. The Vercel Hobby plan allows a
// maximum of 12 serverless functions per deployment; the API previously
// shipped 22 separate functions (one per api/*.js file). All handlers now
// live OUTSIDE api/ (in api-handlers/) so Vercel does not deploy them as
// functions, and this catch-all route is the ONLY function the project
// deploys. Every request to /api/** is routed here and dispatched to the
// matching handler.
//
// Routing rules (order matters):
//   1. Static exact matches first (e.g. /properties/mine, /users/me) so a
//      static segment is never shadowed by a dynamic :id route.
//   2. Dynamic routes after (e.g. /messages/:id, /reservations/:id/status).
//   3. No match -> 404 using the API error contract.
//
// Dynamic params are re-injected into req.query exactly as Vercel would for
// a [id].js function (handlers read `const { id } = req.query`). The rest of
// the query string is preserved untouched.
import { sendError } from '../api-handlers/lib/http.js'

import authHandler from '../api-handlers/auth.js'
import messagesHandler from '../api-handlers/messages.js'
import messagesIdHandler from '../api-handlers/messages/[id].js'
import mercadopagoPreferenceHandler from '../api-handlers/mercadopago/preference.js'
import mercadopagoWebhookHandler from '../api-handlers/mercadopago/webhook.js'
import notificationsHandler from '../api-handlers/notifications.js'
import notificationsIdHandler from '../api-handlers/notifications/[id].js'
import paymentsHandler from '../api-handlers/payments.js'
import paymentsStatusHandler from '../api-handlers/payments/status.js'
import plansHandler from '../api-handlers/plans.js'
import plansIdHandler from '../api-handlers/plans/[id].js'
import platformSettingsHandler from '../api-handlers/platform-settings.js'
import propertiesHandler from '../api-handlers/properties.js'
import propertiesMineHandler from '../api-handlers/properties/mine.js'
import propertiesIdHandler from '../api-handlers/properties/[id].js'
import propertiesIdAvailabilityHandler from '../api-handlers/properties/[id]/availability.js'
import reservationsHandler from '../api-handlers/reservations.js'
import reservationsIdHandler from '../api-handlers/reservations/[id].js'
import reservationsIdStatusHandler from '../api-handlers/reservations/[id]/status.js'
import reviewsHandler from '../api-handlers/reviews.js'
import subscriptionsHandler from '../api-handlers/subscriptions.js'
import subscriptionsIdHandler from '../api-handlers/subscriptions/[id].js'
import subscriptionsMineHandler from '../api-handlers/subscriptions/mine.js'
import uploadHandler from '../api-handlers/upload.js'
import uploadDeleteHandler from '../api-handlers/upload/delete.js'
import usersHandler from '../api-handlers/users.js'
import usersMeHandler from '../api-handlers/users/me.js'
import usersIdHandler from '../api-handlers/users/[id].js'

export const config = { runtime: 'nodejs' }

// Static exact routes, single-segment collections first, then two-segment
// sub-routes. Every static pattern is evaluated before any dynamic one so a
// fixed segment (mine/me/delete) can never be captured by a :id route.
const STATIC_ROUTES = [
  // 1 segment — collection endpoints.
  { segments: ['messages'], handler: messagesHandler },
  { segments: ['notifications'], handler: notificationsHandler },
  { segments: ['payments'], handler: paymentsHandler },
  { segments: ['plans'], handler: plansHandler },
  { segments: ['platform-settings'], handler: platformSettingsHandler },
  { segments: ['properties'], handler: propertiesHandler },
  { segments: ['reservations'], handler: reservationsHandler },
  { segments: ['reviews'], handler: reviewsHandler },
  { segments: ['subscriptions'], handler: subscriptionsHandler },
  { segments: ['upload'], handler: uploadHandler },
  { segments: ['users'], handler: usersHandler },
  // 2 segments — static sub-routes (must stay before /:id matches).
  { segments: ['mercadopago', 'preference'], handler: mercadopagoPreferenceHandler },
  { segments: ['mercadopago', 'webhook'], handler: mercadopagoWebhookHandler },
  { segments: ['payments', 'status'], handler: paymentsStatusHandler },
  { segments: ['properties', 'mine'], handler: propertiesMineHandler },
  { segments: ['subscriptions', 'mine'], handler: subscriptionsMineHandler },
  { segments: ['upload', 'delete'], handler: uploadDeleteHandler },
  { segments: ['users', 'me'], handler: usersMeHandler },
]

// Dynamic routes. ':id' captures a single segment; the value is injected
// into req.query.id before delegating (see dispatch). Patterns with more
// segments are listed first for readability; matching requires an exact
// length, so they cannot collide.
const DYNAMIC_ROUTES = [
  { segments: ['auth', ':action'], handler: authHandler },
  { segments: ['properties', ':id', 'availability'], handler: propertiesIdAvailabilityHandler },
  { segments: ['reservations', ':id', 'status'], handler: reservationsIdStatusHandler },
  { segments: ['messages', ':id'], handler: messagesIdHandler },
  { segments: ['notifications', ':id'], handler: notificationsIdHandler },
  { segments: ['plans', ':id'], handler: plansIdHandler },
  { segments: ['properties', ':id'], handler: propertiesIdHandler },
  { segments: ['reservations', ':id'], handler: reservationsIdHandler },
  { segments: ['subscriptions', ':id'], handler: subscriptionsIdHandler },
  { segments: ['users', ':id'], handler: usersIdHandler },
]

// Exact segment match (static routes).
function exactMatch(pattern, segments) {
  if (pattern.length !== segments.length) return false
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] !== segments[i]) return false
  }
  return true
}

// Matches a dynamic pattern (['messages', ':id']) against request segments.
// Returns the captured params ({ id }) or null.
function matchDynamic(pattern, segments) {
  if (pattern.length !== segments.length) return null
  const params = {}
  for (let i = 0; i < pattern.length; i++) {
    const part = pattern[i]
    if (part.startsWith(':')) {
      params[part.slice(1)] = segments[i]
    } else if (part !== segments[i]) {
      return null
    }
  }
  return params
}

// Resolves a route for the request path segments. Static first, then dynamic.
function getRoute(segments) {
  for (const route of STATIC_ROUTES) {
    if (exactMatch(route.segments, segments)) return { handler: route.handler, params: {} }
  }
  for (const route of DYNAMIC_ROUTES) {
    const params = matchDynamic(route.segments, segments)
    if (params) return { handler: route.handler, params }
  }
  return null
}

// Extracts decoded path segments without the /api prefix. Prefers req.url;
// falls back to the catch-all slug array Vercel injects into req.query
// (which already excludes the /api prefix).
function getSegments(req) {
  if (req.url) {
    const pathname = req.url.split('?')[0]
    let segments = pathname
      .split('/')
      .filter(Boolean)
      .map((s) => {
        try {
          return decodeURIComponent(s)
        } catch {
          return s
        }
      })
    // Strip the leading `api` segment: routes are defined relative to /api.
    if (segments[0] === 'api') segments.shift()
    // The vercel.json rewrite forwards /api/* to this catch-all with a
    // `?path=` query. If the runtime handed us the literal catch-all path
    // (e.g. /api/[...slug]) instead of the original URL, recover the real
    // segments from that query (or the legacy `...slug` param).
    if (segments.length === 1 && segments[0].startsWith('[...')) {
      const recovered = req.query?.path ?? req.query?.['...slug']
      if (typeof recovered === 'string' && recovered) {
        segments = recovered
          .split('/')
          .filter(Boolean)
          .map((s) => {
            try {
              return decodeURIComponent(s)
            } catch {
              return s
            }
          })
      } else if (Array.isArray(req.query?.slug)) {
        segments = req.query.slug
      }
    }
    return segments
  }
  if (Array.isArray(req.query?.slug)) return req.query.slug
  return []
}

export default async function handler(req, res) {
  try {
    const segments = getSegments(req)
    const route = getRoute(segments)

    if (!route) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } })
    }

    // Preserve the original query string (Vercel already parsed it into
    // req.query) and add the dynamic params — the same shape Vercel's
    // [id].js would produce, so handlers keep reading req.query.id. The
    // `slug` key is Vercel's routing artifact, not a real query param.
    const query = { ...req.query }
    delete query.slug
    for (const [key, value] of Object.entries(route.params)) {
      query[key] = value
    }
    req.query = query

    return route.handler(req, res)
  } catch (err) {
    return sendError(res, err)
  }
}