#!/usr/bin/env python3
"""
Heikin Ashi RSI Oscillator (HARSI) — porting dari Pine Script v4 ke Python.

Indikator asli: "Heikin Ashi RSI Oscillator" oleh JayRogers (TradingView).
Porting ini menghitung nilai yang sama seperti versi Pine:
  - Candle HARSI (Open/High/Low/Close berbasis RSI zero-median)
  - Garis/Histogram RSI (mode standar atau smoothed)
  - Stochastic RSI (K & D)

Dipakai pada DataFrame OHLC (kolom: open, high, low, close), mis. hasil dari
tarik_ohlc_idx.py. Butuh: pandas, numpy. (matplotlib opsional untuk plot.)

Catatan porting penting (agar cocok dengan TradingView):
  - Pine `rsi()` memakai RMA (Wilder), bukan SMA/EMA biasa.
  - Semua RSI di sini "zero-median" (dikurangi 50) persis seperti f_zrsi.
  - `_open` HARSI bersifat rekursif (bergantung nilai bar sebelumnya), jadi
    dihitung secara iteratif — sama seperti perilaku series Pine.
"""

from __future__ import annotations

import argparse

import numpy as np
import pandas as pd


# ----------------------------------------------------------------------------
# Helper dasar (padanan fungsi Pine)
# ----------------------------------------------------------------------------

def rma(series: pd.Series, length: int) -> pd.Series:
    """Wilder's RMA (ta.rma di Pine).

    Seed nilai pertama = SMA dari `length` nilai awal, lalu rekursif:
        rma[i] = (rma[i-1] * (length-1) + x[i]) / length
    """
    x = series.to_numpy(dtype=float)
    n = len(x)
    out = np.full(n, np.nan)
    alpha = 1.0 / length

    # indeks pertama yang punya cukup data non-NaN untuk seed SMA
    valid = ~np.isnan(x)
    if valid.sum() < length:
        return pd.Series(out, index=series.index)

    # cari posisi awal (setelah leading NaN)
    first = np.argmax(valid)  # posisi non-NaN pertama
    seed_end = first + length
    if seed_end > n:
        return pd.Series(out, index=series.index)

    prev = np.nanmean(x[first:seed_end])
    out[seed_end - 1] = prev
    for i in range(seed_end, n):
        xi = x[i]
        if np.isnan(xi):
            xi = prev  # perlakukan seperti Pine yang meneruskan nilai
        prev = (prev * (length - 1) + xi) * alpha
        out[i] = prev
    return pd.Series(out, index=series.index)


def rsi(source: pd.Series, length: int) -> pd.Series:
    """Padanan ta.rsi() Pine (berbasis RMA)."""
    change = source.diff()
    up = rma(change.clip(lower=0.0), length)
    down = rma((-change).clip(lower=0.0), length)

    rs = up / down
    out = 100.0 - 100.0 / (1.0 + rs)
    # kasus batas persis seperti Pine: down==0 -> 100, up==0 -> 0
    out = out.mask(down == 0.0, 100.0)
    out = out.mask(up == 0.0, 0.0)
    return out


def zrsi(source: pd.Series, length: int) -> pd.Series:
    """f_zrsi: RSI zero-median (dikurangi 50)."""
    return rsi(source, length) - 50.0


def sma(series: pd.Series, length: int) -> pd.Series:
    return series.rolling(length, min_periods=length).mean()


def zstoch(source: pd.Series, length: int, smooth: int, scale: float) -> pd.Series:
    """f_zstoch: stochastic zero-median + smoothing + scaling %.

    Di Pine, stoch(src, src, src, len) memakai source untuk high/low/close.
    """
    lowest = source.rolling(length, min_periods=length).min()
    highest = source.rolling(length, min_periods=length).max()
    rng = (highest - lowest).replace(0.0, np.nan)
    raw = 100.0 * (source - lowest) / rng
    zst = raw - 50.0
    smoothed = sma(zst, smooth)
    scaled = (smoothed / 100.0) * scale
    return scaled


# ----------------------------------------------------------------------------
# RSI plot (standar / smoothed) — f_rsi
# ----------------------------------------------------------------------------

def f_rsi(source: pd.Series, length: int, mode: bool) -> pd.Series:
    """RSI zero-median, opsional smoothed (mirip HA open pakai RSI realtime).

        _smoothed := na(_smoothed[1]) ? _zrsi : (_smoothed[1] + _zrsi) / 2
        return mode ? _smoothed : _zrsi
    """
    z = zrsi(source, length).to_numpy(dtype=float)
    n = len(z)
    if not mode:
        return pd.Series(z, index=source.index)

    smoothed = np.full(n, np.nan)
    prev = np.nan
    for i in range(n):
        zi = z[i]
        if np.isnan(prev):
            smoothed[i] = zi
        else:
            smoothed[i] = (prev + zi) / 2.0 if not np.isnan(zi) else prev
        if not np.isnan(smoothed[i]):
            prev = smoothed[i]
    return pd.Series(smoothed, index=source.index)


# ----------------------------------------------------------------------------
# HARSI candles — f_rsiHeikinAshi
# ----------------------------------------------------------------------------

def heikin_ashi_rsi(df: pd.DataFrame, length: int, smoothing: int) -> pd.DataFrame:
    """Hasilkan candle HARSI (open, high, low, close) berbasis RSI.

    df wajib punya kolom: high, low, close.
    """
    close_rsi = zrsi(df["close"], length).to_numpy(dtype=float)
    high_raw = zrsi(df["high"], length).to_numpy(dtype=float)
    low_raw = zrsi(df["low"], length).to_numpy(dtype=float)

    n = len(close_rsi)
    open_rsi = np.empty(n)
    open_rsi[0] = close_rsi[0]
    open_rsi[1:] = close_rsi[:-1]                    # _openRSI = nz(_closeRSI[1], _closeRSI)
    open_rsi = np.where(np.isnan(open_rsi), close_rsi, open_rsi)

    high_rsi = np.maximum(high_raw, low_raw)         # max(highRaw, lowRaw)
    low_rsi = np.minimum(high_raw, low_raw)          # min(highRaw, lowRaw)

    ha_close = (open_rsi + high_rsi + low_rsi + close_rsi) / 4.0

    # _open rekursif dengan smoothing.
    # Pine: _open := na(_open[i_smoothing]) ? (openRSI+closeRSI)/2
    #                                       : ((_open[1]*sm) + _close[1]) / (sm+1)
    # Kondisi seed berbasis NaN dari nilai `smoothing` bar lalu (bukan indeks).
    ha_open = np.full(n, np.nan)
    for i in range(n):
        ref = ha_open[i - smoothing] if i - smoothing >= 0 else np.nan
        if np.isnan(ref):
            ha_open[i] = (open_rsi[i] + close_rsi[i]) / 2.0
        else:
            ha_open[i] = ((ha_open[i - 1] * smoothing) + ha_close[i - 1]) / (smoothing + 1)

    ha_high = np.maximum(high_rsi, np.maximum(ha_open, ha_close))
    ha_low = np.minimum(low_rsi, np.minimum(ha_open, ha_close))

    return pd.DataFrame(
        {"open": ha_open, "high": ha_high, "low": ha_low, "close": ha_close},
        index=df.index,
    )


# ----------------------------------------------------------------------------
# Sumber harga (padanan `input.source`: close, ohlc4, dll)
# ----------------------------------------------------------------------------

def resolve_source(df: pd.DataFrame, name: str) -> pd.Series:
    name = name.lower()
    o, h, l, c = df["open"], df["high"], df["low"], df["close"]
    table = {
        "open": o, "high": h, "low": l, "close": c,
        "hl2": (h + l) / 2,
        "hlc3": (h + l + c) / 3,
        "ohlc4": (o + h + l + c) / 4,
        "hlcc4": (h + l + c + c) / 4,
    }
    if name not in table:
        raise ValueError(f"Sumber tidak dikenal: {name}. Pilihan: {', '.join(table)}")
    return table[name]


# ----------------------------------------------------------------------------
# Perhitungan lengkap (semua default = default Pine)
# ----------------------------------------------------------------------------

def compute_harsi(
    df: pd.DataFrame,
    len_harsi: int = 14,       # i_lenHARSI
    smoothing: int = 1,        # i_smoothing
    source: str = "ohlc4",     # i_source
    len_rsi: int = 7,          # i_lenRSI
    smoothed_mode: bool = True,  # i_mode
    smooth_k: int = 3,         # i_smoothK
    smooth_d: int = 3,         # i_smoothD
    stoch_len: int = 14,       # i_stochLen
    stoch_fit: int = 80,       # i_stochFit
) -> pd.DataFrame:
    """Kembalikan DataFrame berisi seluruh output indikator.

    Kolom keluaran:
        harsi_open, harsi_high, harsi_low, harsi_close  -> candle HARSI
        rsi                                             -> garis/histogram RSI
        stoch_k, stoch_d                                -> Stochastic RSI
    """
    df = df.copy()
    for col in ("open", "high", "low", "close"):
        if col not in df.columns:
            raise ValueError(f"DataFrame harus punya kolom '{col}'")
        df[col] = pd.to_numeric(df[col], errors="coerce")

    ha = heikin_ashi_rsi(df, len_harsi, smoothing)

    src = resolve_source(df, source)
    rsi_line = f_rsi(src, len_rsi, smoothed_mode)

    stoch_k = zstoch(rsi_line, stoch_len, smooth_k, stoch_fit)
    stoch_d = sma(stoch_k, smooth_d)

    out = pd.DataFrame(index=df.index)
    out["harsi_open"] = ha["open"]
    out["harsi_high"] = ha["high"]
    out["harsi_low"] = ha["low"]
    out["harsi_close"] = ha["close"]
    out["rsi"] = rsi_line
    out["stoch_k"] = stoch_k
    out["stoch_d"] = stoch_d
    return out


# ----------------------------------------------------------------------------
# Plot opsional (meniru tampilan indikator)
# ----------------------------------------------------------------------------

def plot_harsi(result: pd.DataFrame, upper=20, upperx=30, lower=-20, lowerx=-30,
               show_stoch=False, title="Heikin Ashi RSI Oscillator", out=None):
    import matplotlib.pyplot as plt
    from matplotlib.patches import Rectangle

    r = result.reset_index(drop=True)
    x = np.arange(len(r))
    fig, ax = plt.subplots(figsize=(14, 6))

    # channel OB/OS
    ax.axhspan(upper, upperx, color="red", alpha=0.08)
    ax.axhspan(lower, upper, color="blue", alpha=0.05)
    ax.axhspan(lowerx, lower, color="green", alpha=0.08)
    for lvl in (upperx, upper, 0, lower, lowerx):
        ax.axhline(lvl, color="gray", lw=0.6, ls="--" if lvl != 0 else ":")

    # candle HARSI
    for i in x:
        o, h, l, c = (r.loc[i, "harsi_open"], r.loc[i, "harsi_high"],
                      r.loc[i, "harsi_low"], r.loc[i, "harsi_close"])
        if any(map(lambda v: v != v, (o, h, l, c))):  # skip NaN
            continue
        col = "teal" if c >= o else "red"
        ax.plot([i, i], [l, h], color="gray", lw=0.7, zorder=1)
        lo, hi = min(o, c), max(o, c)
        ax.add_patch(Rectangle((i - 0.3, lo), 0.6, max(hi - lo, 1e-9),
                               color=col, zorder=2))

    ax.plot(x, r["rsi"], color="#FAC832", lw=1.2, label="RSI", zorder=3)

    if show_stoch:
        ax.plot(x, r["stoch_k"], color="#0094FF", lw=1.0, label="Stoch K")
        ax.plot(x, r["stoch_d"], color="#FF6A00", lw=1.0, label="Stoch D")

    ax.set_title(title)
    ax.legend(loc="upper left", fontsize=8)
    ax.margins(x=0.01)
    fig.tight_layout()
    if out:
        fig.savefig(out, dpi=120)
        print(f"Plot disimpan ke {out}")
    else:
        plt.show()


# ----------------------------------------------------------------------------
# CLI
# ----------------------------------------------------------------------------

def _read_ohlc(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    df.columns = [c.lower() for c in df.columns]
    need = {"open", "high", "low", "close"}
    if not need.issubset(df.columns):
        raise SystemExit(f"CSV harus punya kolom {need}. Ada: {list(df.columns)}")
    if "date" in df.columns:
        df = df.set_index("date")
    return df


def main(argv=None):
    p = argparse.ArgumentParser(description="Hitung Heikin Ashi RSI Oscillator (HARSI).")
    p.add_argument("csv", help="File CSV OHLC (kolom: date,open,high,low,close,...).")
    p.add_argument("--ticker", help="Filter kolom 'ticker' bila CSV berisi banyak saham.")
    p.add_argument("--len-harsi", type=int, default=14)
    p.add_argument("--smoothing", type=int, default=1)
    p.add_argument("--source", default="ohlc4")
    p.add_argument("--len-rsi", type=int, default=7)
    p.add_argument("--no-smoothed", action="store_true", help="Matikan smoothed mode RSI.")
    p.add_argument("--stoch-len", type=int, default=14)
    p.add_argument("--smooth-k", type=int, default=3)
    p.add_argument("--smooth-d", type=int, default=3)
    p.add_argument("--stoch-fit", type=int, default=80)
    p.add_argument("--out", default="harsi_out.csv", help="CSV hasil perhitungan.")
    p.add_argument("--plot", metavar="PNG", nargs="?", const="__show__",
                   help="Tampilkan/simpan plot. Beri nama file .png untuk menyimpan.")
    args = p.parse_args(argv)

    df = _read_ohlc(args.csv)
    if args.ticker and "ticker" in df.columns:
        df = df[df["ticker"].str.upper() == args.ticker.upper()]
        if df.empty:
            raise SystemExit(f"Ticker {args.ticker} tidak ada di CSV.")

    result = compute_harsi(
        df,
        len_harsi=args.len_harsi,
        smoothing=args.smoothing,
        source=args.source,
        len_rsi=args.len_rsi,
        smoothed_mode=not args.no_smoothed,
        smooth_k=args.smooth_k,
        smooth_d=args.smooth_d,
        stoch_len=args.stoch_len,
        stoch_fit=args.stoch_fit,
    )

    result.to_csv(args.out)
    print(f"OK: {len(result)} baris -> {args.out}")
    with pd.option_context("display.max_columns", None, "display.width", 120):
        print(result.tail(5).round(3))

    if args.plot:
        out = None if args.plot == "__show__" else args.plot
        plot_harsi(result, show_stoch=True, out=out)


if __name__ == "__main__":
    main()
