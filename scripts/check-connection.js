// Cek cepat: apakah koneksi ke Supabase jalan?
// Jalankan: npm install && npm run check
import 'dotenv/config';
import { supabase } from '../lib/supabaseClient.js';

const { data, error } = await supabase.from('app_state').select('*').limit(1);

if (error) {
  console.error('❌ Gagal konek / query:', error.message);
  process.exit(1);
}

console.log('✅ Terhubung ke Supabase. Contoh baris dari app_state:');
console.log(data);
