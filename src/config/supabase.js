import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || ''
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

function isPlaceholder(value) {
  if (!value) return true
  return value.startsWith('your_') || value.includes('test-project-url') || value.includes('placeholder')
}

export const supabase = (!isPlaceholder(url) && !isPlaceholder(key))
  ? createClient(url, key)
  : null

export function isSupabaseConfigured() {
  return supabase !== null
}

export default supabase
