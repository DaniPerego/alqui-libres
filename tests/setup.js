import { vi } from 'vitest'

// Ensure a controllable `fetch` global exists in every test environment.
// Node 18+ provides a real fetch; we stub it so store/service tests can
// assert on calls without hitting the network. Tests that need a specific
// response override the stub per test (see tests/unit/auth.test.js pattern).
vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })))
