import { del } from '@vercel/blob'

export const config = {
  runtime: 'nodejs18.x'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const buffers = []
    await new Promise((resolve, reject) => {
      req.on('data', (chunk) => buffers.push(chunk))
      req.on('end', resolve)
      req.on('error', reject)
    })

    const body = JSON.parse(Buffer.concat(buffers).toString())
    const { url } = body

    if (!url) {
      return res.status(400).json({ error: 'URL is required' })
    }

    try {
      await del(url)
    } catch (delError) {
      if (!delError.message?.includes('not found')) {
        throw delError
      }
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return res.status(500).json({ error: error.message || 'Error deleting file' })
  }
}
