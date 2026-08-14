import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Detects placeholder values that should trigger demo mode.
 * Any value missing or starting with "your_" / "test-" is treated as a placeholder.
 */
function isPlaceholder(value) {
  if (!value) return true
  const normalized = String(value).trim().toLowerCase()
  return normalized.startsWith('your_') || normalized.startsWith('test-')
}

/**
 * Returns true when the Supabase client is configured with real credentials.
 */
export function isSupabaseConfigured() {
  return !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey)
}

let supabase = null

if (isSupabaseConfigured()) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error.message)
  }
}

export { supabase }
export default supabase
