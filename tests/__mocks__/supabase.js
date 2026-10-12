// tests/__mocks__/supabase.js
//
// Global mock for @supabase/supabase-js used by vitest.config.js alias.
// Provides a minimal createClient stub so frontend modules that import
// supabase.js don't fail with "Failed to resolve import".

export function createClient() {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({ data: {}, error: null }),
      signUp: async () => ({ data: {}, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          maybeSingle: async () => ({ data: null, error: null }),
        }),
        maybeSingle: async () => ({ data: null, error: null }),
        order: () => ({
          limit: () => ({
            eq: () => ({ data: [], error: null }),
          }),
        }),
        limit: () => ({ data: [], error: null }),
      }),
      insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
      update: () => ({
        eq: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
      }),
      delete: () => ({
        eq: () => ({ data: null, error: null }),
      }),
    }),
  }
}

export default { createClient }
