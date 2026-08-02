import { createClient } from '@supabase/supabase-js';

// Proyecto Supabase propio de Duprat Lira Abogados (cuenta del despacho).
// La "anon key" esta pensada para ser publica: el acceso real a los datos
// se controla con Row Level Security (RLS) del lado de Supabase, no
// ocultando esta llave.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://scnlpwlklvtjoqhxwgoq.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbmxwd2xrbHZ0am9xaHh3Z29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MzcwNjksImV4cCI6MjEwMDMxMzA2OX0.hv9ZhF1N0262_7f7ucJC1RCAhEApJIlfzASPSoaUDK4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
