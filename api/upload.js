import { put } from '@vercel/blob'

export const config = {
  runtime: 'nodejs18.x'
}

function getExtension(fileName, mimeType) {
  const byMime = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }
  const rawExt = fileName.split('.').pop()?.toLowerCase()
  if (rawExt) return rawExt
  return byMime[mimeType] || 'jpg'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const formData = new FormData()
    const buffers = []

    await new Promise((resolve, reject) => {
      req.on('data', (chunk) => buffers.push(chunk))
      req.on('end', resolve)
      req.on('error', reject)
    })

    const raw = Buffer.concat(buffers)
    const boundary = req.headers['content-type']?.split('boundary=')[1]
    if (!boundary) {
      return res.status(400).json({ error: 'No boundary in content-type' })
    }

    const parts = parseMultipart(raw, boundary)
    const fileField = parts.find(p => p.name === 'file')
    if (!fileField || !fileField.data) {
      return res.status(400).json({ error: 'No file provided' })
    }

    const ext = getExtension(fileField.filename || 'image.jpg', fileField.contentType || 'image/jpeg')
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`
    const folder = req.headers['x-upload-type'] === 'profile' ? 'users' : 'properties'
    const filepath = `${folder}/${filename}`

    let blob
    try {
      blob = await put(filepath, fileField.data, {
        access: 'public',
        addRandomSuffix: false,
        contentType: fileField.contentType
      })
    } catch (publicError) {
      if (publicError.message?.includes('Cannot use public access on a private store')) {
        blob = await put(filepath, fileField.data, {
          access: 'private',
          addRandomSuffix: false,
          contentType: fileField.contentType
        })
        return res.status(200).json({
          url: `/api/upload/serve?path=${encodeURIComponent(blob.pathname)}`,
          filePath: blob.pathname
        })
      }
      throw publicError
    }

    return res.status(200).json({ url: blob.url, filePath: blob.pathname })
  } catch (error) {
    console.error('Upload error:', error)
    return res.status(500).json({ error: error.message || 'Error uploading file' })
  }
}

function parseMultipart(buffer, boundary) {
  const parts = []
  const delimiter = Buffer.from(`--${boundary}`)
  const endDelimiter = Buffer.from(`--${boundary}--`)
  let start = 0

  while (start < buffer.length) {
    const delimiterStart = buffer.indexOf(delimiter, start)
    if (delimiterStart === -1) break

    const contentStart = buffer.indexOf(Buffer.from('\r\n\r\n'), delimiterStart)
    if (contentStart === -1) break

    const headerSection = buffer.slice(delimiterStart + delimiter.length, contentStart).toString()
    const nameMatch = headerSection.match(/name="([^"]+)"/)
    const filenameMatch = headerSection.match(/filename="([^"]+)"/)
    const contentTypeMatch = headerSection.match(/Content-Type:\s*(\S+)/i)

    const dataStart = contentStart + 4

    let dataEnd
    const nextDelimiter = buffer.indexOf(delimiter, dataStart)
    const endDelimiterPos = buffer.indexOf(endDelimiter, dataStart)

    if (endDelimiterPos !== -1 && (nextDelimiter === -1 || endDelimiterPos < nextDelimiter)) {
      dataEnd = endDelimiterPos
    } else if (nextDelimiter !== -1) {
      dataEnd = nextDelimiter
    } else {
      dataEnd = buffer.length
    }

    while ((buffer[dataEnd - 1] === 0x0a || buffer[dataEnd - 1] === 0x0d) && dataEnd > dataStart) {
      dataEnd--
    }

    const data = buffer.slice(dataStart, dataEnd)

    if (nameMatch) {
      parts.push({
        name: nameMatch[1],
        filename: filenameMatch ? filenameMatch[1] : undefined,
        contentType: contentTypeMatch ? contentTypeMatch[1] : undefined,
        data
      })
    }

    if (endDelimiterPos !== -1 && endDelimiterPos < buffer.indexOf(delimiter, dataStart + 1)) {
      break
    }

    start = (nextDelimiter !== -1) ? nextDelimiter : buffer.length
  }

  return parts
}
