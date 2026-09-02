# CRM Monthly Report — Google Slides yang datanya dari Google Sheet

Membuat ulang deck **CRM Monthly Report** (template Alfamart) sebagai **Google
Slides**, dengan seluruh angka & grafik bersumber dari **Google Sheet**. Ubah
data di sheet → klik menu → slide ikut ter-update.

Grafik di slide disisipkan sebagai **linked Sheets chart**, jadi benar-benar
tersambung ke sheet (bukan gambar mati).

```
Google Sheet (data)  ──►  Apps Script  ──►  Google Slides (deck)
   sumber angka          tekan menu            hasil presentasi
```

## Isi folder

| File / folder | Fungsi |
|---|---|
| `apps-script/00_Data.gs` | Seluruh angka template (seed) + judul/narasi tiap slide |
| `apps-script/10_Sheet.gs` | Membangun tab data + grafik di Google Sheet |
| `apps-script/20_Slides.gs` | Membangun 16 slide + menyisipkan grafik linked |
| `apps-script/30_Menu.gs` | Menu "CRM Report" + fungsi `setup` / `rebuildSlides` |
| `apps-script/Code.combined.gs` | Gabungan 4 file di atas jadi 1 file (kalau mau tempel sekali) |
| `apps-script/appsscript.json` | Manifest (scope & timezone) |
| `data/build_workbook.py` | (Opsional) generator `crm_report_data.xlsx` |
| `data/crm_report_data.xlsx` | (Opsional) workbook siap di-import jadi Google Sheet |

## Cara pakai (cara termudah — ± 5 menit)

1. Buka <https://sheets.new> untuk membuat **Google Sheet baru** (kosong).
   Beri nama, mis. `CRM Monthly Report - DATA`.
2. Di sheet itu: menu **Extensions → Apps Script**.
3. Hapus isi `Code.gs` bawaan, lalu **tempel isi `apps-script/Code.combined.gs`**
   (satu file berisi semua). Simpan (ikon 💾).
   - *Alternatif rapi:* buat 4 file terpisah (`00_Data.gs`, `10_Sheet.gs`,
     `20_Slides.gs`, `30_Menu.gs`) dan tempel masing-masing.
4. **Refresh** tab Google Sheet. Akan muncul menu baru: **CRM Report**.
5. Klik **CRM Report → 1. Setup awal (isi data + buat Slides)**.
   - Pertama kali akan diminta **Authorize** — izinkan (script hanya
     mengakses Spreadsheet & Slides milik Anda).
6. Selesai. Script akan:
   - mengisi semua tab data + grafik di sheet, dan
   - membuat **Google Slides** baru (link muncul di notifikasi & di tab
     `Config`, baris `slides_deck_url`).

## Cara update data tiap bulan

1. Edit angka di tab data yang sesuai (mis. `S04_TrendMember`,
   `S15_Redemption`, dll). Judul/narasi bisa diubah di tab **`Text`**;
   kop/periode/footer di tab **`Config`**.
2. Klik **CRM Report → 2. Update / Rebuild Slides dari data**.
3. Deck yang sama akan dibangun ulang mengikuti angka terbaru
   (grafik linked ikut menyegarkan datanya).

> Ingin ganti periode sekaligus (mis. dari Juli → Agustus)? Cara cepat:
> ubah angka langsung di sheet. Kalau ingin mengganti dari kode, edit
> `00_Data.gs` lalu jalankan **CRM Report → Reset data sheet dari script**,
> kemudian **Update / Rebuild Slides**.

## Struktur tab di Google Sheet

| Tab | Slide | Isi |
|---|---|---|
| `Config` | semua | judul, periode, warna, footer, info perusahaan, `slides_deck_url` |
| `Text` | semua | judul & narasi tiap slide (bisa diedit) |
| `S02_TotalActive` | 2 | Total vs Active Member + % aktif |
| `S03_Profiling` | 3 | Profil usia (P/L) + komposisi gender |
| `S04_TrendMember` | 4 | Tren total, active, % active |
| `S05_SalesContrib` | 5 | Sales member, sales/member, % kontribusi (YTD vs LY) |
| `S06_VisitBasket` | 6 | Struk/member & basket size (YTD vs LY) |
| `S07_TrendContrib` | 7 | Tren kontribusi 2026 vs 2025 |
| `S08_TrendMemberSales` | 8 | Combo sales member (bar) + jumlah member (line) |
| `S09_TrendSalesPerMember` | 9 | Tren sales/member |
| `S10_TrendTrxPerMember` | 10 | Tren transaksi/member |
| `S11_TrendBasket` | 11 | Tren basket size |
| `S15_Redemption` | 15 | Tabel point redemption + tren redemption rate |

Slide 1 (cover), 12 & 13 (gambar/peta by branch & by dept), 14 (section),
16 (thank you) dibuat otomatis; slide 12 & 13 menyediakan kotak "tempel
gambar di sini" karena sumbernya berupa peta/screenshot.

## Opsi B — mulai dari workbook siap pakai

Kalau ingin tab data langsung terisi tanpa menunggu `setup()`:

1. `cd data && python3 build_workbook.py` → menghasilkan `crm_report_data.xlsx`.
2. Buka Google Drive → **New → File upload** → pilih `crm_report_data.xlsx`.
3. Klik kanan file itu → **Open with → Google Sheets** (otomatis jadi Google
   Sheet multi-tab).
4. Lanjut ke **Extensions → Apps Script**, tempel `Code.combined.gs`, lalu
   jalankan **CRM Report → 2. Update / Rebuild Slides dari data** (tidak perlu
   `setup` karena data sudah ada).

## Catatan

- Semua angka pada `00_Data.gs` diambil dari file template
  `monthly_report_CRM_template_ppt.pptx` yang dilampirkan.
- Warna korporat memakai navy `#1F3A5F` + merah `#E4002B` (bisa diubah di
  tab `Config` / `00_Data.gs`).
- Script hanya butuh izin Spreadsheet & Slides milik Anda sendiri; tidak
  mengirim data ke pihak lain.
