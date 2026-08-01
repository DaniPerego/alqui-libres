// tests/unit/search.test.js
//
// RED unit tests for api/lib/search.js — escapeLike (API-03 / D5) and the
// generated $queryRaw SQL/params (wildcards escaped, literal "100%" match).
import { describe, it, expect } from 'vitest'
import { escapeLike, searchProperties } from '../../api/lib/search.js'

describe('escapeLike (API-03 wildcards)', () => {
  it('escapa % -> \\%', () => {
    expect(escapeLike('100%')).toBe('100\\%')
  })
  it('escapa _ -> \\_', () => {
    expect(escapeLike('a_b')).toBe('a\\_b')
  })
  it('escapa \\ -> \\\\ (primero)', () => {
    expect(escapeLike('a\\b')).toBe('a\\\\b')
  })
  it('escapa combinaciones en orden', () => {
    expect(escapeLike('100%_x\\y')).toBe('100\\%\\_x\\\\y')
  })
  it('mantiene texto plano sin wildcards', () => {
    expect(escapeLike('mardel')).toBe('mardel')
  })
  it('null/undefined -> cadena vacia', () => {
    expect(escapeLike(null)).toBe('')
    expect(escapeLike(undefined)).toBe('')
  })
  it('escapa numeros convirtiendolos a string', () => {
    expect(escapeLike(100)).toBe('100')
  })
})

describe('searchProperties (API-03 raw query)', () => {
  it('pasa el patron escapado como parametro ($1), wildcard literal', async () => {
    const calls = []
    const fakePrisma = {
      $queryRaw: async (sql) => {
        calls.push(sql)
        return []
      },
    }
    await searchProperties(fakePrisma, { q: '100%', limit: 10, offset: 0 })

    expect(calls).toHaveLength(1)
    const query = calls[0]
    // Prisma.sql exposes { text, values }; each parameter occurrence gets its
    // own placeholder ($1..$5), so the pattern appears twice.
    expect(query.text).toContain("ILIKE '%' || $1 || '%' ESCAPE '\\'")
    expect(query.text).toContain("ILIKE '%' || $2 || '%' ESCAPE '\\'")
    expect(query.text).toContain('FROM "Property"')
    expect(query.text).toContain('"locationCity"')
    expect(query.text).toContain('"isActive" = $3')
    // pattern = '%' + escaped('100%') + '%' = '%100\%%' (backslash literal)
    expect(query.values[0]).toBe('%100\\%%')
    expect(query.values[1]).toBe('%100\\%%')
    expect(query.values[2]).toBe(true)
  })

  it('aplica LIMIT/OFFSET desde la paginacion', async () => {
    const calls = []
    const fakePrisma = {
      $queryRaw: async (sql) => {
        calls.push(sql)
        return []
      },
    }
    await searchProperties(fakePrisma, { q: 'mar', limit: 5, offset: 10 })
    expect(calls[0].text).toContain('LIMIT $4 OFFSET $5')
    expect(calls[0].values.slice(3)).toEqual([5, 10])
  })
})
