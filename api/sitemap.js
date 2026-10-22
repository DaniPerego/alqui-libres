// api/sitemap.js
//
// Public sitemap endpoint. Returns an XML sitemap with static routes and one
// entry per active property. Keep SITE_URL in sync with the production domain.
import { prisma } from '../api-handlers/lib/prisma.js'
import { HttpError, asyncRoute } from '../api-handlers/lib/http.js'

// Must match the production deployment domain.
export const SITE_URL = 'https://alqui-libres.vercel.app'

export const config = { runtime: 'nodejs' }

const STATIC_PATHS = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/buscar', priority: '0.9', changefreq: 'weekly' },
  { path: '/login', priority: '0.7', changefreq: 'monthly' },
  { path: '/registro', priority: '0.8', changefreq: 'monthly' },
  { path: '/terminos', priority: '0.5', changefreq: 'monthly' },
  { path: '/privacidad', priority: '0.5', changefreq: 'monthly' },
  { path: '/contrato', priority: '0.5', changefreq: 'monthly' },
  { path: '/faq', priority: '0.6', changefreq: 'weekly' },
  { path: '/nosotros', priority: '0.6', changefreq: 'monthly' },
  { path: '/como-funciona', priority: '0.7', changefreq: 'monthly' },
  { path: '/contacto', priority: '0.6', changefreq: 'monthly' },
  { path: '/cookies', priority: '0.5', changefreq: 'monthly' },
]

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatDate(date) {
  return new Date(date).toISOString().split('T')[0]
}

export default asyncRoute(async (req, res) => {
  if (req.method !== 'GET') {
    throw new HttpError('METHOD', 'Method not allowed', 405)
  }

  const today = formatDate(new Date())

  const properties = await prisma.property.findMany({
    where: { status: 'active', isActive: true },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  })

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

  for (const { path, priority, changefreq } of STATIC_PATHS) {
    xml += '  <url>\n'
    xml += `    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>\n`
    xml += `    <lastmod>${today}</lastmod>\n`
    xml += `    <changefreq>${changefreq}</changefreq>\n`
    xml += `    <priority>${priority}</priority>\n`
    xml += '  </url>\n'
  }

  for (const property of properties) {
    xml += '  <url>\n'
    xml += `    <loc>${escapeXml(`${SITE_URL}/propiedad/${property.id}`)}</loc>\n`
    xml += `    <lastmod>${formatDate(property.updatedAt)}</lastmod>\n`
    xml += '    <changefreq>weekly</changefreq>\n'
    xml += '    <priority>0.8</priority>\n'
    xml += '  </url>\n'
  }

  xml += '</urlset>\n'

  res.setHeader('Content-Type', 'application/xml')
  return res.status(200).send(xml)
})
