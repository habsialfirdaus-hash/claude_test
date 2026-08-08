# xyzflyfit — Koneksi Supabase

Setup koneksi ke project Supabase **xyzflyfit** (`ap-southeast-1` / Singapore).

## Cara pakai

```bash
cp .env.example .env   # nilai sudah terisi, tinggal cek
npm install
npm run check          # tes koneksi ke Supabase
```

Di dalam kode:

```js
import { supabase } from './lib/supabaseClient.js';

const { data, error } = await supabase.from('app_state').select('*');
```

## Info project

- **URL:** `https://waxayizxjqeqinzdmxqs.supabase.co`
- **Publishable (anon) key:** aman dipakai di frontend **selama RLS aktif**.
- **service_role key:** JANGAN pernah ditaruh di frontend. Hanya untuk backend.

> Publishable/anon key memang didesain untuk publik — keamanan datamu bergantung
> pada **Row Level Security (RLS)**, bukan kerahasiaan key ini. Pastikan setiap
> tabel punya policy RLS. Tabel `app_state` sudah `rls_enabled = true`.

## Apakah Free Plan aman untuk penyimpanan jangka panjang?

Ringkasnya: **aman untuk data yang tidak besar, TAPI ada satu risiko besar untuk
"jangka panjang" — auto-pause.**

### Batasan Free Plan (per organisasi/2 project aktif)

| Item | Limit Free |
|------|-----------|
| Database (Postgres) | 500 MB |
| File Storage | 1 GB |
| Egress (bandwidth) / bulan | 5 GB |
| Monthly Active Users (Auth) | 50.000 |
| Backup otomatis | ❌ tidak ada di Free |
| **Auto-pause** | **project di-pause setelah ~7 hari tanpa aktivitas** |

### Risiko utama untuk "jangka panjang"

1. **Auto-pause karena tidak aktif.** Kalau project tidak dipakai ~1 minggu, project
   otomatis **di-pause**. Data tidak langsung hilang dan bisa di-*restore* manual dari
   dashboard, tapi selama pause **API/DB tidak bisa diakses**. Untuk "penyimpanan
   jangka panjang" yang jarang disentuh, ini masalah nyata.
2. **Tidak ada backup otomatis.** Kalau ada kesalahan (delete tak sengaja, dsb),
   tidak ada backup harian bawaan untuk restore. Kamu harus backup sendiri.
3. **Batas 500 MB DB.** Cukup untuk data teks/relasional biasa, tapi kalau menyimpan
   banyak data akan cepat penuh.

### Rekomendasi

- **Data terus dipakai (app aktif):** Free plan aman. Aktivitas rutin mencegah auto-pause.
- **Data disimpan tapi jarang diakses:** jangan mengandalkan Free saja. Lakukan salah satu:
  - Backup rutin (mis. `pg_dump` terjadwal) ke penyimpanan lain, atau
  - Upgrade ke **Pro (~$25/bln)** → tidak ada auto-pause + backup harian 7 hari.
- **File besar (gambar/video):** 1 GB cepat habis. Pertimbangkan storage terpisah.
- **Wajib:** pastikan RLS aktif di semua tabel sebelum key dipakai publik.

**Kesimpulan:** Free plan **bukan** pilihan andal untuk arsip data jangka panjang yang
jarang diakses (karena auto-pause + tanpa backup). Untuk app yang aktif dipakai
sehari-hari, Free plan aman untuk memulai; siapkan backup mandiri dan rencana upgrade
begitu data/traffic bertambah.
