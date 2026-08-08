import { createClient } from '@supabase/supabase-js';

// Ambil dari environment variable (lihat .env.example).
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY belum di-set. Salin .env.example ke .env dan isi nilainya.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
