/**
 * Apps Script Web App — Penarik OHLC saham IDX dari Yahoo Finance.
 *
 * Script ini yang MENARIK datanya (bukan Python). Python hanya memanggil URL
 * web app ini, lalu Apps Script memanggil endpoint chart Yahoo Finance
 * (endpoint yang sama dipakai oleh library `yfinance`) dan mengembalikan
 * OHLC dalam bentuk JSON.
 *
 * Cara deploy:
 *   1. Buka https://script.google.com  ->  New project.
 *   2. Tempel isi file ini ke Code.gs.
 *   3. Deploy  ->  New deployment  ->  pilih "Web app".
 *        - Execute as:      Me
 *        - Who has access:  Anyone   (atau "Anyone with the link")
 *   4. Salin "Web app URL" yang muncul, taruh di Python (env APPSCRIPT_URL).
 *
 * Cara pakai (dipanggil Python lewat GET):
 *   {WEB_APP_URL}?tickers=BBCA.JK,TLKM.JK&range=1mo&interval=1d
 *
 * Parameter:
 *   tickers   : daftar kode saham dipisah koma. Saham IDX pakai akhiran ".JK".
 *   range     : 1d,5d,1mo,3mo,6mo,1y,2y,5y,10y,ytd,max   (default: 1mo)
 *   interval  : 1m,2m,5m,15m,30m,60m,1d,1wk,1mo          (default: 1d)
 *   period1   : (opsional) epoch detik / "YYYY-MM-DD" tanggal mulai
 *   period2   : (opsional) epoch detik / "YYYY-MM-DD" tanggal akhir
 *               Jika period1/period2 diisi, dia dipakai menggantikan "range".
 */

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};

    var tickersRaw = p.tickers || p.ticker || '';
    var tickers = tickersRaw
      .split(',')
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 0; });

    if (tickers.length === 0) {
      return _json({ ok: false, error: 'Parameter "tickers" wajib diisi, mis. BBCA.JK,TLKM.JK' });
    }

    var range = p.range || '1mo';
    var interval = p.interval || '1d';
    var period1 = p.period1 ? _toEpoch(p.period1) : null;
    var period2 = p.period2 ? _toEpoch(p.period2) : null;

    var result = {};
    tickers.forEach(function (t) {
      result[t] = _fetchOhlc(t, range, interval, period1, period2);
    });

    return _json({
      ok: true,
      source: 'yahoo-finance/v8/chart',
      generated_at: new Date().toISOString(),
      data: result
    });
  } catch (err) {
    return _json({ ok: false, error: String(err) });
  }
}

/** Ambil OHLC satu ticker dari endpoint chart Yahoo Finance. */
function _fetchOhlc(ticker, range, interval, period1, period2) {
  var base = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(ticker);

  var qs = ['interval=' + encodeURIComponent(interval)];
  if (period1 && period2) {
    qs.push('period1=' + period1);
    qs.push('period2=' + period2);
  } else {
    qs.push('range=' + encodeURIComponent(range));
  }
  var url = base + '?' + qs.join('&');

  var resp = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AppsScript OHLC fetcher)' }
  });

  if (resp.getResponseCode() !== 200) {
    return { error: 'HTTP ' + resp.getResponseCode(), rows: [] };
  }

  var body = JSON.parse(resp.getContentText());
  var chart = body && body.chart;
  if (!chart || chart.error) {
    return { error: (chart && chart.error && chart.error.description) || 'unknown', rows: [] };
  }

  var res = chart.result && chart.result[0];
  if (!res || !res.timestamp) {
    return { error: 'data kosong', rows: [] };
  }

  var ts = res.timestamp;
  var q = res.indicators && res.indicators.quote && res.indicators.quote[0];
  var adj = res.indicators && res.indicators.adjclose && res.indicators.adjclose[0];
  var tz = (res.meta && res.meta.timezone) || 'Asia/Jakarta';

  var rows = [];
  for (var i = 0; i < ts.length; i++) {
    // Lewati bar yang datanya tidak lengkap (kadang null saat hari libur/suspend).
    if (q.open[i] == null || q.close[i] == null) continue;

    rows.push({
      date: _fmtDate(ts[i], interval, tz),
      open: q.open[i],
      high: q.high[i],
      low: q.low[i],
      close: q.close[i],
      adj_close: adj && adj.adjclose ? adj.adjclose[i] : q.close[i],
      volume: q.volume[i]
    });
  }

  return { currency: res.meta && res.meta.currency, timezone: tz, rows: rows };
}

/** Format timestamp epoch -> string. Harian pakai tanggal, intraday pakai jam. */
function _fmtDate(epochSec, interval, tz) {
  var d = new Date(epochSec * 1000);
  var intraday = /m$|^\d+m|h$/.test(interval) && interval.indexOf('mo') === -1;
  var fmt = intraday ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd';
  return Utilities.formatDate(d, tz || 'Asia/Jakarta', fmt);
}

/** Ubah "YYYY-MM-DD" atau epoch string -> epoch detik. */
function _toEpoch(v) {
  if (/^\d+$/.test(String(v))) return parseInt(v, 10);
  var d = new Date(v + 'T00:00:00Z');
  return Math.floor(d.getTime() / 1000);
}

function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
