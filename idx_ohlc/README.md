# Tarik OHLC Saham IDX — yfinance via Google Apps Script

Menarik data OHLC saham IDX dari **Yahoo Finance** (sumber data di balik
`yfinance`) **melalui Google Apps Script**, dijalankan dari **Python lokal**.

```
Python (tarik_ohlc_idx.py)  ──panggil──►  Apps Script Web App  ──ambil──►  Yahoo Finance
Python                      ◄──JSON────   Apps Script          ◄──data───   (chart API)
```

Yang benar-benar menarik data adalah **Apps Script**. Python hanya
memanggilnya dan menyimpan hasil ke CSV. (Catatan: `yfinance` adalah library
Python dan tidak bisa berjalan di dalam Apps Script, jadi Apps Script memanggil
endpoint Yahoo Finance yang sama — `query1.finance.yahoo.com/v8/finance/chart` —
yang dipakai `yfinance` di balik layar.)

## 1. Deploy Apps Script (sekali saja)

1. Buka <https://script.google.com> → **New project**.
2. Tempel isi `appscript/Code.gs` ke editor.
3. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (atau *Anyone with the link*)
4. Salin **Web app URL** (bentuknya `https://script.google.com/macros/s/XXXX/exec`).

## 2. Jalankan Python di lokal

Tidak perlu `pip install` apa pun — hanya butuh **Python 3.8+** (pakai
standard library).

```bash
export APPSCRIPT_URL="https://script.google.com/macros/s/XXXX/exec"

# 1 bulan harian, dua saham
python tarik_ohlc_idx.py BBCA.JK TLKM.JK --range 1mo --interval 1d

# rentang tanggal spesifik
python tarik_ohlc_idx.py BBRI.JK --start 2024-01-01 --end 2024-06-30

# intraday 15 menit, output custom
python tarik_ohlc_idx.py ANTM.JK --range 5d --interval 15m --out antm.csv
```

Kode tanpa titik otomatis diberi akhiran `.JK` (mis. `BBCA` → `BBCA.JK`).

## Opsi

| Opsi | Arti | Default |
|------|------|---------|
| `--url` | URL web app (bila tak set env `APPSCRIPT_URL`) | — |
| `--range` | `1d,5d,1mo,3mo,6mo,1y,2y,5y,10y,ytd,max` | `1mo` |
| `--interval` | `1m,5m,15m,30m,60m,1d,1wk,1mo` | `1d` |
| `--start` / `--end` | Tanggal `YYYY-MM-DD` (menimpa `--range`) | — |
| `--out` | File CSV keluaran | `ohlc_idx.csv` |

## Hasil (CSV)

Kolom: `ticker,date,open,high,low,close,adj_close,volume`

## Indikator HARSI (Heikin Ashi RSI Oscillator)

`harsi.py` adalah porting dari Pine Script v4 "Heikin Ashi RSI Oscillator"
(JayRogers) ke Python. Dipakai langsung pada CSV OHLC di atas.

Butuh `pandas` + `numpy` (dan `matplotlib` bila mau plot):

```bash
pip install pandas numpy matplotlib

# hitung indikator dari CSV OHLC
python harsi.py ohlc_idx.csv --ticker BBCA.JK --out harsi_bbca.csv

# sekaligus buat grafik PNG
python harsi.py ohlc_idx.csv --ticker BBCA.JK --plot harsi_bbca.png
```

Keluaran: candle HARSI (`harsi_open/high/low/close`), garis `rsi`, dan
`stoch_k`/`stoch_d`. Semua parameter default = default indikator TradingView
(`--len-harsi 14 --smoothing 1 --source ohlc4 --len-rsi 7 --stoch-len 14`, dst).

## Uji cepat Apps Script (tanpa Python)

Buka URL ini di browser setelah deploy:

```
{WEB_APP_URL}?tickers=BBCA.JK&range=5d&interval=1d
```
