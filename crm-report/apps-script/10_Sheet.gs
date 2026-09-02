/*
 * 10_Sheet.gs
 * ---------------------------------------------------------------------------
 * Membangun isi Google Sheet (tab data + grafik) dari 00_Data.gs.
 * Grafik dibuat di sheet ini lalu DISISIPKAN (linked) ke Google Slides,
 * sehingga saat data diubah, grafik di slide ikut ter-update.
 * ---------------------------------------------------------------------------
 */

var FMT_INT = '#,##0';
var FMT_PCT = '0.0%';
var FMT_PCT2 = '0.00%';
var FMT_DEC2 = '0.00';

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function sheetReset_(name) {
  var ss = ss_();
  var sh = ss.getSheetByName(name);
  if (sh) {
    // buang grafik lama biar tidak menumpuk
    sh.getCharts().forEach(function (c) { sh.removeChart(c); });
    sh.clear();
  } else {
    sh = ss.insertSheet(name);
  }
  return sh;
}

function writeBlock_(sh, r, c, values2D) {
  if (!values2D.length) return;
  sh.getRange(r, c, values2D.length, values2D[0].length).setValues(values2D);
}

function styleHeader_(sh, r, c, ncol, bg, fg) {
  sh.getRange(r, c, 1, ncol)
    .setBackground(bg || CONFIG.brand_primary)
    .setFontColor(fg || '#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
}

/** Bangun / bangun-ulang seluruh tab data. */
function buildDataSheets_() {
  var ss = ss_();

  // ---- Config -------------------------------------------------------------
  var cfg = sheetReset_('Config');
  var cRows = [['key', 'value']];
  Object.keys(CONFIG).forEach(function (k) { cRows.push([k, CONFIG[k]]); });
  if (!cfg.getRange('A:A').createTextFinder('slides_deck_id').findNext()) {
    cRows.push(['slides_deck_id', '']);
  }
  writeBlock_(cfg, 1, 1, cRows);
  styleHeader_(cfg, 1, 1, 2);
  cfg.getRange(2, 1, cRows.length - 1, 1).setFontWeight('bold');
  cfg.setColumnWidth(1, 170); cfg.setColumnWidth(2, 360);

  // ---- Text (judul + narasi) ---------------------------------------------
  var tx = sheetReset_('Text');
  var tRows = [['slide_key', 'title', 'narrative']];
  Object.keys(TEXTS).forEach(function (k) { tRows.push([k, TEXTS[k].title, TEXTS[k].narr]); });
  writeBlock_(tx, 1, 1, tRows);
  styleHeader_(tx, 1, 1, 3);
  tx.getRange(2, 3, tRows.length - 1, 1).setWrap(true);
  tx.setColumnWidth(1, 90); tx.setColumnWidth(2, 300); tx.setColumnWidth(3, 460);

  // ---- S02 Total vs Active ------------------------------------------------
  var d = DATA.s02_total_active;
  var s02 = sheetReset_('S02_TotalActive');
  writeBlock_(s02, 1, 1, [d.header].concat(d.rows));
  styleHeader_(s02, 1, 1, 2);
  s02.getRange(2, 2, 2, 1).setNumberFormat(FMT_INT);
  s02.getRange('A5').setValue('% Active Member').setFontWeight('bold');
  s02.getRange('B5').setFormula('=B3/B2').setNumberFormat(FMT_PCT);
  s02.insertChart(s02.newChart().asColumnChart()
    .addRange(s02.getRange('A1:B3')).setNumHeaders(1)
    .setOption('title', 'Total Member vs Active Member')
    .setOption('colors', [CONFIG.brand_primary])
    .setOption('legend', { position: 'none' })
    .setOption('width', 520).setOption('height', 320)
    .setPosition(7, 1, 0, 0).build());

  // ---- S03 Profiling ------------------------------------------------------
  d = DATA.s03_profiling;
  var s03 = sheetReset_('S03_Profiling');
  writeBlock_(s03, 1, 1, [d.header].concat(d.rows));
  styleHeader_(s03, 1, 1, 3);
  s03.getRange(2, 2, d.rows.length, 2).setNumberFormat(FMT_PCT);
  writeBlock_(s03, 9, 1, [['Gender', '%'], ['Perempuan', d.gender.perempuan], ['Laki-laki', d.gender.lakilaki]]);
  styleHeader_(s03, 9, 1, 2);
  s03.getRange(10, 2, 2, 1).setNumberFormat(FMT_PCT);
  s03.insertChart(s03.newChart().asColumnChart()
    .addRange(s03.getRange('A1:C6')).setNumHeaders(1)
    .setOption('title', 'Profiling Member by Usia')
    .setOption('colors', [CONFIG.brand_accent, CONFIG.brand_primary])
    .setOption('legend', { position: 'bottom' })
    .setOption('width', 560).setOption('height', 300)
    .setPosition(13, 1, 0, 0).build());
  s03.insertChart(s03.newChart().asPieChart()
    .addRange(s03.getRange('A9:B11')).setNumHeaders(1)
    .setOption('title', 'Komposisi Gender')
    .setOption('colors', [CONFIG.brand_accent, CONFIG.brand_primary])
    .setOption('pieHole', 0.45)
    .setOption('width', 320).setOption('height', 300)
    .setPosition(13, 6, 0, 0).build());

  // ---- S04 Tren Total vs Active ------------------------------------------
  d = DATA.s04_trend_member;
  var s04 = sheetReset_('S04_TrendMember');
  var rows04 = [d.header.concat(['% Active'])];
  for (var i = 0; i < MONTHS_SERIES.length; i++) {
    var rr = i + 2;
    rows04.push([MONTHS_SERIES[i], d.total[i], d.active[i],
      '=IF(OR(B' + rr + '="",C' + rr + '="",B' + rr + '=0),"",C' + rr + '/B' + rr + ')']);
  }
  writeBlock_(s04, 1, 1, rows04);
  styleHeader_(s04, 1, 1, 4);
  s04.getRange(2, 2, MONTHS_SERIES.length, 2).setNumberFormat(FMT_INT);
  s04.getRange(2, 4, MONTHS_SERIES.length, 1).setNumberFormat(FMT_PCT);
  s04.insertChart(s04.newChart().asLineChart()
    .addRange(s04.getRange('A1:C25')).setNumHeaders(1)
    .setOption('title', 'Tren Total Member vs Active Member')
    .setOption('colors', [CONFIG.brand_primary, CONFIG.brand_accent])
    .setOption('legend', { position: 'bottom' })
    .setOption('width', 560).setOption('height', 300)
    .setPosition(28, 1, 0, 0).build());
  s04.insertChart(s04.newChart().asLineChart()
    .addRange(s04.getRange('A1:A25'))
    .addRange(s04.getRange('D1:D25')).setNumHeaders(1)
    .setOption('title', '% Active Member')
    .setOption('colors', ['#2E7D32'])
    .setOption('legend', { position: 'none' })
    .setOption('width', 320).setOption('height', 300)
    .setPosition(28, 6, 0, 0).build());

  // ---- S05 Kontribusi Sales Member (KPI, tanpa chart) --------------------
  d = DATA.s05_sales_contrib;
  var s05 = sheetReset_('S05_SalesContrib');
  writeBlock_(s05, 1, 1, [d.header].concat(d.rows));
  styleHeader_(s05, 1, 1, 4);
  s05.getRange(2, 2, 2, 2).setNumberFormat(FMT_INT);     // sales, sales/member
  s05.getRange(4, 2, 1, 2).setNumberFormat(FMT_PCT);     // % contr
  s05.setColumnWidth(1, 190);

  // ---- S06 Visit & Basket (KPI) ------------------------------------------
  d = DATA.s06_visit_basket;
  var s06 = sheetReset_('S06_VisitBasket');
  writeBlock_(s06, 1, 1, [d.header].concat(d.rows));
  styleHeader_(s06, 1, 1, 4);
  s06.getRange(2, 2, 1, 2).setNumberFormat(FMT_DEC2);    // struk
  s06.getRange(3, 2, 1, 2).setNumberFormat(FMT_INT);     // basket
  s06.setColumnWidth(1, 170);

  // ---- S07/S09/S10/S11 tren kalender 2026 vs 2025 ------------------------
  buildCalendarTrend_('S07_TrendContrib', DATA.s07_trend_contrib, FMT_PCT,
    'Tren Kontribusi Sales Member', ['#2E7D32', '#9E9E9E']);
  buildCalendarTrend_('S09_TrendSalesPerMember', DATA.s09_trend_sales_per_member, FMT_INT,
    'Tren Sales per Member', [CONFIG.brand_primary, '#9E9E9E']);
  buildCalendarTrend_('S10_TrendTrxPerMember', DATA.s10_trend_trx_per_member, FMT_DEC2,
    'Tren Transaksi per Member', [CONFIG.brand_accent, '#9E9E9E']);
  buildCalendarTrend_('S11_TrendBasket', DATA.s11_trend_basket, FMT_INT,
    'Tren Basket Size Member', [CONFIG.brand_primary, '#9E9E9E']);

  // ---- S08 Tren Jumlah Member & Sales Member (combo) ---------------------
  d = DATA.s08_trend_member_sales;
  var s08 = sheetReset_('S08_TrendMemberSales');
  var rows08 = [d.header];
  for (var j = 0; j < MONTHS_SERIES.length; j++) rows08.push([MONTHS_SERIES[j], d.sales[j], d.jumlah[j]]);
  writeBlock_(s08, 1, 1, rows08);
  styleHeader_(s08, 1, 1, 3);
  s08.getRange(2, 2, MONTHS_SERIES.length, 2).setNumberFormat(FMT_INT);
  s08.insertChart(s08.newChart()
    .setChartType(Charts.ChartType.COMBO)
    .addRange(s08.getRange('A1:C25')).setNumHeaders(1)
    .setOption('title', 'Tren Jumlah Member dan Sales Member')
    .setOption('colors', [CONFIG.brand_primary, CONFIG.brand_accent])
    .setOption('legend', { position: 'bottom' })
    .setOption('seriesType', 'bars')
    .setOption('series', { 1: { type: 'line', targetAxisIndex: 1 } })
    .setOption('width', 640).setOption('height', 320)
    .setPosition(28, 1, 0, 0).build());

  // ---- S15 Point Redemption ----------------------------------------------
  d = DATA.s15_redemption;
  var s15 = sheetReset_('S15_Redemption');
  writeBlock_(s15, 1, 1, [d.table_header].concat(d.table_rows));
  styleHeader_(s15, 1, 1, 4);
  s15.getRange(2, 2, 2, 2).setNumberFormat(FMT_INT);
  s15.getRange(4, 2, 1, 2).setNumberFormat(FMT_PCT2);
  var trendStart = 6;
  var rows15 = [d.trend_header];
  for (var k = 0; k < MONTHS_CAL.length; k++) rows15.push([MONTHS_CAL[k], d.y2026[k], d.y2025[k]]);
  writeBlock_(s15, trendStart, 1, rows15);
  styleHeader_(s15, trendStart, 1, 3);
  s15.getRange(trendStart + 1, 2, MONTHS_CAL.length, 2).setNumberFormat(FMT_PCT);
  var last15 = trendStart + MONTHS_CAL.length;
  s15.insertChart(s15.newChart().asLineChart()
    .addRange(s15.getRange(trendStart, 1, MONTHS_CAL.length + 1, 3)).setNumHeaders(1)
    .setOption('title', 'Trend Redemption Rate (%)')
    .setOption('colors', [CONFIG.brand_accent, '#9E9E9E'])
    .setOption('legend', { position: 'bottom' })
    .setOption('width', 620).setOption('height', 300)
    .setPosition(last15 + 2, 1, 0, 0).build());

  SpreadsheetApp.flush();
}

/** Helper: tab tren kalender (12 bulan 2026 vs 2025 + baris YTD di bawah). */
function buildCalendarTrend_(name, d, fmt, title, colors) {
  var sh = sheetReset_(name);
  var rows = [d.header];
  for (var i = 0; i < MONTHS_CAL.length; i++) rows.push([MONTHS_CAL[i], d.y2026[i], d.y2025[i]]);
  writeBlock_(sh, 1, 1, rows);
  styleHeader_(sh, 1, 1, 3);
  sh.getRange(2, 2, MONTHS_CAL.length, 2).setNumberFormat(fmt);
  // baris YTD (referensi, tidak masuk chart)
  var ytdRow = MONTHS_CAL.length + 3;
  writeBlock_(sh, ytdRow, 1, [['YTD Jul', d.ytd[0], d.ytd[1]]]);
  sh.getRange(ytdRow, 1).setFontWeight('bold');
  sh.getRange(ytdRow, 2, 1, 2).setNumberFormat(fmt);
  sh.insertChart(sh.newChart().asLineChart()
    .addRange(sh.getRange(1, 1, MONTHS_CAL.length + 1, 3)).setNumHeaders(1)
    .setOption('title', title)
    .setOption('colors', colors)
    .setOption('legend', { position: 'bottom' })
    .setOption('width', 600).setOption('height', 300)
    .setPosition(ytdRow + 2, 1, 0, 0).build());
  return sh;
}

/** Ambil nilai konfigurasi dari sheet Config. */
function cfgGet_(key) {
  var f = ss_().getSheetByName('Config').getRange('A:A').createTextFinder(key).matchEntireCell(true).findNext();
  return f ? f.offset(0, 1).getValue() : '';
}
function cfgSet_(key, val) {
  var cfg = ss_().getSheetByName('Config');
  var f = cfg.getRange('A:A').createTextFinder(key).matchEntireCell(true).findNext();
  if (f) f.offset(0, 1).setValue(val);
  else cfg.appendRow([key, val]);
}
/** Ambil judul/narasi dari sheet Text (fallback ke konstanta). */
function textGet_(key) {
  var sh = ss_().getSheetByName('Text');
  var f = sh.getRange('A:A').createTextFinder(key).matchEntireCell(true).findNext();
  if (f) return { title: f.offset(0, 1).getValue(), narr: f.offset(0, 2).getValue() };
  return TEXTS[key] || { title: '', narr: '' };
}
