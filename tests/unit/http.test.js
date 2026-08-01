// tests/unit/http.test.js
//
// RED unit tests for api/lib/http.js — error contract codes and
// parsePagination defaults/cap/non-numeric (API-01 / D4).
import { describe, it, expect, vi } from 'vitest'
import { HttpError, ERROR_CODES, sendError, parsePagination, buildMeta } from '../../api/lib/http.js'

describe('parsePagination (D4 offset pagination)', () => {
  it('sin query -> page 1, limit 20', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 20 })
  })
  it('valores validos se respetan', () => {
    expect(parsePagination({ page: '3', limit: '10' })).toEqual({ page: 3, limit: 10 })
  })
  it('limit > 100 se limita a 100', () => {
    expect(parsePagination({ page: '1', limit: '500' })).toEqual({ page: 1, limit: 100 })
  })
  it('no-numericos caen a defaults', () => {
    expect(parsePagination({ page: 'abc', limit: 'xyz' })).toEqual({ page: 1, limit: 20 })
  })
  it('cero y negativos caen a defaults', () => {
    expect(parsePagination({ page: '0', limit: '0' })).toEqual({ page: 1, limit: 20 })
    expect(parsePagination({ page: '-2', limit: '-5' })).toEqual({ page: 1, limit: 20 })
  })
})

describe('HttpError + sendError (error contract)', () => {
  it('mapea codes a status correcto', () => {
    expect(new HttpError('NOT_FOUND', 'x').status).toBe(404)
    expect(new HttpError('CONFLICT', 'x').status).toBe(409)
    expect(new HttpError('VALIDATION', 'x').status).toBe(400)
    expect(new HttpError('UNAUTHORIZED', 'x').status).toBe(401)
    expect(new HttpError('FORBIDDEN', 'x').status).toBe(403)
    expect(new HttpError('METHOD', 'x').status).toBe(405)
  })

  it('serializa { error: { code, message } }', () => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
    sendError(res, new HttpError('NOT_FOUND', 'No existe'))
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'NOT_FOUND', message: 'No existe' } })
  })

  it('errores desconocidos -> 500 INTERNAL sin filtrar internals', () => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    sendError(res, new Error('stack trace secreto'))
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'INTERNAL', message: 'Internal server error' } })
    consoleSpy.mockRestore()
  })

  it('HttpError 5xx tampoco filtra internals', () => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    sendError(res, new HttpError('INTERNAL', 'detalle interno'))
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'INTERNAL', message: 'Internal server error' } })
    consoleSpy.mockRestore()
  })

  it('expone los codes del contrato', () => {
    expect(ERROR_CODES).toEqual({
      VALIDATION: 'VALIDATION',
      UNAUTHORIZED: 'UNAUTHORIZED',
      FORBIDDEN: 'FORBIDDEN',
      NOT_FOUND: 'NOT_FOUND',
      METHOD: 'METHOD',
      CONFLICT: 'CONFLICT',
      INTERNAL: 'INTERNAL',
    })
  })
})

describe('buildMeta (D4 response meta)', () => {
  it('calcula totalPages con redondeo hacia arriba', () => {
    expect(buildMeta({ page: 2, limit: 10, total: 25 })).toEqual({ page: 2, limit: 10, total: 25, totalPages: 3 })
  })
  it('total 0 -> totalPages 0', () => {
    expect(buildMeta({ page: 1, limit: 20, total: 0 })).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 })
  })
})
