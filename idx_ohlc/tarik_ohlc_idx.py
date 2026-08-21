#!/usr/bin/env python3
"""
Tarik data OHLC saham IDX dari Yahoo Finance MELALUI Google Apps Script.

Alur:
    Python (file ini)  --panggil-->  Apps Script Web App  --ambil-->  Yahoo Finance
    Python              <--JSON----   Apps Script          <--data--   (query1 chart API)

Jadi yang benar-benar menarik datanya adalah Apps Script (lihat
appscript/Code.gs). Python hanya memanggil URL web app-nya, menerima JSON,
lalu menyimpannya ke CSV.

Saham IDX di Yahoo Finance memakai akhiran ".JK", contoh: BBCA.JK, TLKM.JK.

Contoh pakai:
    export APPSCRIPT_URL="https://script.google.com/macros/s/XXXX/exec"

    python tarik_ohlc_idx.py BBCA.JK TLKM.JK --range 3mo --interval 1d
    python tarik_ohlc_idx.py BBCA.JK --start 2024-01-01 --end 2024-06-30
    python tarik_ohlc_idx.py BBRI.JK --out data_bbri.csv
"""

import argparse
import csv
import os
import sys
import time
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

# Kolom OHLC yang disimpan ke CSV, sesuai key yang dikirim Apps Script.
FIELDS = ["ticker", "date", "open", "high", "low", "close", "adj_close", "volume"]


def panggil_appscript(url, tickers, range_, interval, start, end, timeout=60, retries=3):
    """Panggil Apps Script Web App dan kembalikan dict JSON hasilnya."""
    params = {"tickers": ",".join(tickers), "range": range_, "interval": interval}
    if start:
        params["period1"] = start
    if end:
        params["period2"] = end

    full_url = url + ("&" if "?" in url else "?") + urlencode(params)

    last_err = None
    for attempt in range(1, retries + 1):
        try:
            req = Request(full_url, headers={"User-Agent": "idx-ohlc-python/1.0"})
            with urlopen(req, timeout=timeout) as resp:
                raw = resp.read().decode("utf-8")
            import json
            return json.loads(raw)
        except (HTTPError, URLError, TimeoutError) as e:
            last_err = e
            if attempt < retries:
                wait = 2 ** attempt
                print(f"  ! gagal ({e}); coba lagi dalam {wait}s "
                      f"({attempt}/{retries})", file=sys.stderr)
                time.sleep(wait)
    raise SystemExit(f"Gagal memanggil Apps Script setelah {retries}x: {last_err}")


def ratakan(payload):
    """Ubah JSON dari Apps Script menjadi daftar baris datar (list of dict)."""
    if not payload.get("ok"):
        raise SystemExit(f"Apps Script error: {payload.get('error')}")

    rows = []
    for ticker, info in payload.get("data", {}).items():
        if info.get("error"):
            print(f"  ! {ticker}: {info['error']}", file=sys.stderr)
            continue
        for bar in info.get("rows", []):
            rows.append({
                "ticker": ticker,
                "date": bar.get("date"),
                "open": bar.get("open"),
                "high": bar.get("high"),
                "low": bar.get("low"),
                "close": bar.get("close"),
                "adj_close": bar.get("adj_close"),
                "volume": bar.get("volume"),
            })
    rows.sort(key=lambda r: (r["ticker"], str(r["date"])))
    return rows


def simpan_csv(rows, out_path):
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)


def parse_args(argv=None):
    p = argparse.ArgumentParser(
        description="Tarik OHLC saham IDX dari Yahoo Finance via Google Apps Script.")
    p.add_argument("tickers", nargs="+",
                   help="Kode saham (akhiran .JK), mis. BBCA.JK TLKM.JK")
    p.add_argument("--url", default=os.environ.get("APPSCRIPT_URL"),
                   help="URL web app Apps Script (atau set env APPSCRIPT_URL).")
    p.add_argument("--range", dest="range_", default="1mo",
                   help="Rentang: 1d,5d,1mo,3mo,6mo,1y,2y,5y,10y,ytd,max (default 1mo).")
    p.add_argument("--interval", default="1d",
                   help="Interval: 1m,5m,15m,30m,60m,1d,1wk,1mo (default 1d).")
    p.add_argument("--start", help="Tanggal mulai YYYY-MM-DD (menimpa --range).")
    p.add_argument("--end", help="Tanggal akhir YYYY-MM-DD (menimpa --range).")
    p.add_argument("--out", default="ohlc_idx.csv", help="File CSV keluaran.")
    return p.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)

    if not args.url:
        raise SystemExit(
            "URL Apps Script belum diset. Deploy dulu appscript/Code.gs sebagai "
            "Web App, lalu:\n"
            "  export APPSCRIPT_URL='https://script.google.com/macros/s/XXXX/exec'\n"
            "atau tambahkan opsi --url ...")

    # Normalkan: pastikan setiap ticker punya akhiran pasar (default .JK untuk IDX).
    tickers = [t if "." in t else f"{t}.JK" for t in (t.upper() for t in args.tickers)]

    print(f"Memanggil Apps Script untuk {len(tickers)} ticker: {', '.join(tickers)}")
    payload = panggil_appscript(
        args.url, tickers, args.range_, args.interval, args.start, args.end)

    rows = ratakan(payload)
    if not rows:
        raise SystemExit("Tidak ada data yang diterima.")

    simpan_csv(rows, args.out)
    print(f"OK: {len(rows)} baris tersimpan ke {args.out}")

    # Ringkasan singkat per ticker.
    per = {}
    for r in rows:
        per[r["ticker"]] = per.get(r["ticker"], 0) + 1
    for t, n in per.items():
        print(f"  - {t}: {n} bar")


if __name__ == "__main__":
    main()
