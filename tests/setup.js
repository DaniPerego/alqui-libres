import { vi } from 'vitest'

// Deterministic JWT secret: setup runs before api-handlers/lib/auth.js is
// imported, so handlers and the integration auth helpers (tests/integration/
// helpers/auth.js) verify/sign with the same value.
process.env.JWT_SECRET = 'alqui-libres-test-secret'

// Ensure a controllable `fetch` global exists in every test environment.
// Node 18+ provides a real fetch; we stub it so store/service tests can
// assert on calls without hitting the network. Tests that need a specific
// response override the stub per test (see tests/unit/auth.test.js pattern).
vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })))
