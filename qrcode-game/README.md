# 🎁 Kotak Kejutan — QR Mini-Game + Jump Scare

QR code yang bila di-scan membuka mini-game "hadiah" beberapa langkah, dan
di akhir langkah muncul **kejutan menyeramkan** (wajah seram + suara jeritan + getar).

## Isi folder

| File | Fungsi |
|------|--------|
| `index.html` | Halaman game (self-contained, tanpa dependency). Ini yang dibuka lewat QR. |
| `qrcode.png` | QR code (1024px, error-correction H) → mengarah ke game. |
| `qrcode.svg` | Versi vektor QR, tajam untuk cetak ukuran besar. |
| `poster.html` | Poster siap cetak dengan QR ter-embed + ajakan "Scan & Menangkan!". |
| `gen-qr.mjs` | Script untuk membuat ulang QR (mis. jika URL berubah). |

## Alur permainan

1. **Welcome** — "Tebak & Menangkan Hadiah!" → tombol Mulai.
2. **Langkah 1** — pilih salah satu dari 3 kotak (selalu "hampir").
3. **Langkah 2** — ketuk balon 5× sampai penuh.
4. **Langkah 3** — loading palsu "menyiapkan hadiah…".
5. **Kejutan** — layar jadi hitam, wajah seram muncul + jeritan + getar 👻.

Ada tombol **🔁 Main lagi** setelah kejutan.

## URL game (via Artifact)

```
https://claude.ai/code/artifact/0852ffaa-e47d-4183-add8-db6ec1300d67
```

## Membuat ulang QR

Jika URL berubah, edit `url` di `gen-qr.mjs` lalu:

```bash
npm install qrcode        # sekali saja
node qrcode-game/gen-qr.mjs
```

## Catatan

- Suara pakai Web Audio (dibuat on-the-fly), jadi tidak perlu file audio dan
  hanya berbunyi setelah pemain berinteraksi (sesuai kebijakan autoplay browser).
- Getar (`navigator.vibrate`) hanya jalan di sebagian browser HP.
- Menghormati `prefers-reduced-motion`: guncangan layar dikurangi.
- Gambar seram digambar dengan SVG/CSS — kartun-seram, tanpa gambar orang asli.
