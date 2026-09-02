/*
 * Code.gs  —  CRM Monthly Report (gabungan semua modul dalam 1 file).
 * Tempel seluruh isi file ini ke Apps Script (Extensions > Apps Script)
 * bila Anda lebih suka 1 file saja. Isi = 00_Data + 10_Sheet + 20_Slides + 30_Menu.
 */

// ===================== 00_Data.gs =====================
/*
 * 00_Data.gs
 * ---------------------------------------------------------------------------
 * SUMBER DATA (seed) untuk CRM Monthly Report.
 *
 * Semua angka yang muncul di Google Slides berasal dari sini pada saat
 * pertama kali `setup()` dijalankan -> ditulis ke Google Sheet.
 * Setelah itu, SHEET adalah sumber kebenaran: ubah angka di sheet lalu
 * jalankan menu "CRM Report > Update / Rebuild Slides".
 *
 * Untuk mengganti bulan/periode berikutnya cukup:
 *   1) edit angka di Google Sheet, ATAU
 *   2) edit nilai di file ini lalu jalankan "Reset data sheet dari script".
 * ---------------------------------------------------------------------------
 */

// Label 24 bulan berderet (Jan-25 .. Des-26). 19 pertama ada isinya.
var MONTHS_SERIES = [
  'Jan-25','Feb-25','Mar-25','Apr-25','Mei-25','Jun-25','Jul-25',
  'Agu-25','Sep-25','Okt-25','Nov-25','Des-25',
  'Jan-26','Feb-26','Mar-26','Apr-26','Mei-26','Jun-26','Jul-26',
  'Agu-26','Sep-26','Okt-26','Nov-26','Des-26'
];
var MONTHS_CAL = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

var CONFIG = {
  report_title:      'CRM MONTHLY REPORT',
  report_period:     'Juli 2026',
  report_month_short:'Jul 26',
  brand_primary:     '#1F3A5F',   // navy
  brand_accent:      '#E4002B',   // merah
  brand_soft:        '#EAF0F7',
  footer_text:       'CRM Monthly Report  •  All Rights Reserved. @Alfamart 2026',
  company_name:      'PT. SUMBER ALFARIA TRIJAYA Tbk',
  company_addr1:     'Alfa Tower, Jalan Jalur Sutera Barat Kav. 7-9',
  company_addr2:     'Alam Sutera, Kota Tangerang, Banten 15143',
  company_web:       'www.alfamartku.com',
  slides_deck_name:  'CRM Monthly Report - Juli 2026'
};

// Narasi & judul tiap slide (boleh diubah user di sheet "Text").
var TEXTS = {
  s02: { title: 'Total Member vs Active Member',
    narr: 'Di bulan Jul 26, total member = 26,8 juta member dengan active member = 17,6 juta member (65,6%).' },
  s03: { title: 'Profiling Member',
    narr: 'Dari total member Alfamart, mayoritas berjenis kelamin perempuan dengan rentang usia terbanyak di 21-40 tahun.' },
  s04: { title: 'Tren Total Member vs Active Member', narr: '' },
  s05: { title: 'Kontribusi Sales Member',
    narr: 'Kontribusi sales member di YTD Jul 26 = 60,91%, naik 4,3 pts vs LY. Secara value sales member naik 15,5% vs tahun lalu, sedangkan sales per member turun 3,5%.' },
  s06: { title: 'Visit per Member & Basket Size Member',
    narr: 'Struk per Member di YTD Jul 26 = 4,71, turun 3,5% vs LY. Basket Size member YTD Jul 26 = 68.312, hampir sama dibanding LY.' },
  s07: { title: 'Tren Kontribusi Sales Member', narr: '' },
  s08: { title: 'Tren Jumlah Member dan Sales Member', narr: '' },
  s09: { title: 'Tren Sales Per Member', narr: '' },
  s10: { title: 'Tren Transaksi Per Member', narr: '' },
  s11: { title: 'Tren Basket Size Member', narr: '' },
  s12: { title: 'Kontribusi Sales Member by Branch',
    narr: 'Tempel peta / grafik distribusi kontribusi per branch pada slide ini (gambar).' },
  s13: { title: 'Sales Member by Departement - Top 20 Departement',
    narr: 'Kontribusi dari 20 departement = 95,3% terhadap sales member YTD Jul 2026.' },
  s14: { title: 'REDEEMPTION POIN MEMBER', narr: '' },
  s15: { title: 'Point Redemption', narr: '' }
};

var N = null;

// --- Data mentah tiap slide -------------------------------------------------
var DATA = {

  // Slide 2 -----------------------------------------------------------------
  s02_total_active: {
    header: ['Kategori', 'Jumlah Member'],
    rows: [
      ['Total Member', 26839543],
      ['Active Member', 17619760]
    ]
  },

  // Slide 3 -----------------------------------------------------------------
  s03_profiling: {
    header: ['Rentang Usia', 'Perempuan', 'Laki-laki'],
    rows: [
      ['<21 tahun',   0.0661059187623879, 0.07110034368884409],
      ['21-30 tahun', 0.3765410954178481, 0.387049181263036],
      ['31-40 tahun', 0.28509676019885777, 0.29259543732175847],
      ['41-50 tahun', 0.17514310772972164, 0.16876014070169773],
      ['>=51 tahun',  0.09711311789118458, 0.08049489702466368]
    ],
    gender: { perempuan: 0.66, lakilaki: 0.34 }
  },

  // Slide 4 -----------------------------------------------------------------
  s04_trend_member: {
    header: ['Bulan', 'Total Member', 'Active Member'],
    total:  [20817045,20993855,21262211,21353334,21695168,22012418,22364090,22713524,22856131,23181980,23527146,23759146,24204410,24582490,25119971,25474731,25964774,26424609,26839543,N,N,N,N,N],
    active: [13541668,13481661,14369613,14080367,14244378,14613080,14785553,14871892,14833096,15300482,15449824,15683706,15992030,16045521,17506055,16632546,17394397,17498467,17619760,N,N,N,N,N]
  },

  // Slide 5 -----------------------------------------------------------------
  s05_sales_contrib: {
    header: ['Metrik', 'YTD Jul 26', 'YTD Jul 25', 'Delta'],
    rows: [
      ['Sales Member (Rp)',       38184702752510.7, 33063195342471.29, '+15,5%'],
      ['Sales per Member (Rp)',   321721.26973214815, 333579.7307897558, '-3,5%'],
      ['% Contr. Sales Member',   0.6091149422299342, 0.5656518125042255, '+4,3 pts']
    ]
  },

  // Slide 6 -----------------------------------------------------------------
  s06_visit_basket: {
    header: ['Metrik', 'YTD Jul 26', 'YTD Jul 25', 'Delta'],
    rows: [
      ['Struk per Member', 4.70959740227494, 4.882385070390023, '-3,5%'],
      ['Basket Size (Rp)', 68311.84117282357, 68323.10970570543, '-0,02%']
    ]
  },

  // Slide 7 -----------------------------------------------------------------
  s07_trend_contrib: {
    header: ['Bulan', 'Kontribusi 2026', 'Kontribusi 2025'],
    y2026: [0.6030403581550094,0.6289157040053209,0.5829251733078351,0.5976574054619987,0.6325658124344529,0.604535611592103,0.6204637045352445,N,N,N,N,N],
    y2025: [0.5687517969822217,0.5798051019772953,0.5867060815200548,0.5192647596451941,0.5674067826125074,0.5625686908617799,0.5724753810321792,0.5791266425928627,0.5839471616726127,0.5917252432402588,0.5932773933989567,0.5942283218931982],
    ytd:   [0.6091149422299342, 0.5656518125042255]
  },

  // Slide 8 -----------------------------------------------------------------
  s08_trend_member_sales: {
    header: ['Bulan', 'Sales Member (Rp)', 'Jumlah Member'],
    sales: [4417374461508.74,4378719583454.53,5907331590489.71,4345446380692.29,4597590272122.74,4668147962567.35,4748585091635.93,4693297753440.22,4526402700806.52,4891586124223.42,4850254376267.61,5112595722371.64,5015328536755.68,5243364195297.39,6481133638453.85,5015823687116.12,5746446679993.04,5244235895972.81,5438370118921.82,N,N,N,N,N],
    jumlah:[13541668,13481661,14369613,14080367,14244378,14613080,14785553,14871892,14833096,15300482,15449824,15683706,15992030,16045521,17506055,16632546,17394397,17498464,17619760,N,N,N,N,N]
  },

  // Slide 9 -----------------------------------------------------------------
  s09_trend_sales_per_member: {
    header: ['Bulan', 'Sales/Member 2026', 'Sales/Member 2025'],
    y2026: [313614.2526468297,326780.551114382,370222.39667668415,301566.8008443277,330361.936662308,299696.92745447886,308651.7704510062,N,N,N,N,N],
    y2025: [326206.0819618927,324790.8090445628,411098.8647007898,308617.4089561934,322765.25321939227,319449.9696550864,321163.84768536757,315581.7533801496,305155.62636461866,319701.4397470236,313935.8983162274,325981.354303099],
    ytd:   [321721.26973214815, 333579.7307897558]
  },

  // Slide 10 ----------------------------------------------------------------
  s10_trend_trx_per_member: {
    header: ['Bulan', 'Struk/Member 2026', 'Struk/Member 2025'],
    y2026: [4.528464929092804,4.373104494394417,4.838451038797719,4.648130959625784,5.016471625891946,4.7146497544013,4.802459284348935,N,N,N,N,N],
    y2025: [4.8787962457800615,4.620819126070593,5.128524686085839,4.870513034212816,5.131615925946363,4.733506283411847,4.803295216621252,4.754517986010119,4.610926471452757,4.7717105905552515,4.575506814834913,4.629892641445842],
    ytd:   [4.70959740227494, 4.882385070390023]
  },

  // Slide 11 ----------------------------------------------------------------
  s11_trend_basket: {
    header: ['Bulan', 'Basket Size 2026', 'Basket Size 2025'],
    y2026: [69253.98729093318,74725.07266479902,76516.71861676598,64879.153247568254,65855.43810457982,63567.166823940766,64269.52362863182,N,N,N,N,N],
    y2025: [66862.0015119603,70288.57875264969,80159.28358815136,63364.45602102221,62897.3909733645,67486.96431957225,66863.23309340158,66375.13083528756,66180.97865014833,66999.33570569336,68612.26767237466,70407.97261365874],
    ytd:   [68311.84117282357, 68323.10970570543]
  },

  // Slide 15 ----------------------------------------------------------------
  s15_redemption: {
    table_header: ['Metrik', '2026', '2025', '2026 vs 2025'],
    table_rows: [
      ['Issued Point',        131499745941, 125274796303, '+5,0%'],
      ['Redemp Point',        80322882241,  76763900922,  '+4,6%'],
      ['% Redemption Rate',   0.6108,       0.6128,       '-0,19%']
    ],
    trend_header: ['Bulan', 'Redemption Rate 2026', 'Redemption Rate 2025'],
    y2026: [0.7884482355854628,0.5737591899302854,0.48223661628516273,0.687555013841083,0.5949930164253318,0.6515147001010176,0.5954836796777726,N,N,N,N,N],
    y2025: [0.578193945270244,0.5922819947606582,0.5139597657325711,0.6396232409257835,0.7205360278647829,0.6582972178446708,0.6235676306184152,0.516088448876211,0.6034009218040162,0.6399858745501065,0.5873013507577727,0.6641523988861396]
  }
};

// ===================== 10_Sheet.gs =====================
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

// ===================== 20_Slides.gs =====================
/*
 * 20_Slides.gs
 * ---------------------------------------------------------------------------
 * Membangun Google Slides dari data & grafik di Google Sheet.
 * Grafik disisipkan sebagai "linked Sheets chart" -> bisa di-refresh saat
 * data di sheet berubah.
 * ---------------------------------------------------------------------------
 */

// ---- util angka (format Indonesia) ----------------------------------------
function fmtInt_(n) {
  if (n === '' || n === null || isNaN(n)) return '-';
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
function fmtDec_(n, d) {
  if (n === '' || n === null || isNaN(n)) return '-';
  var s = Number(n).toFixed(d == null ? 2 : d).replace('.', ',');
  return s.replace(/\B(?=(\d{3})+(?!\d),)/g, '.');
}
function fmtPct_(x, d) { return (x * 100).toFixed(d == null ? 1 : d).replace('.', ',') + '%'; }
function fmtMoneyShort_(n) {
  if (n >= 1e12) return 'Rp ' + fmtDec_(n / 1e12, 2) + ' T';
  if (n >= 1e9) return 'Rp ' + fmtDec_(n / 1e9, 2) + ' M';
  return 'Rp ' + fmtInt_(n);
}
function deltaColor_(txt) {
  var t = String(txt).trim();
  if (t.charAt(0) === '-') return '#C62828';           // turun -> merah
  if (t.charAt(0) === '+') return '#2E7D32';           // naik  -> hijau
  return '#555555';
}

// ---- pembuat elemen dasar --------------------------------------------------
var MX = 28;   // margin kiri/kanan (pt)

function chartOf_(sheetName, idx) {
  var charts = ss_().getSheetByName(sheetName).getCharts();
  return charts[idx];
}

function addTitle_(slide, title, W) {
  var tb = slide.insertTextBox(title, MX, 16, W - 2 * MX, 40);
  var ts = tb.getText().getTextStyle();
  ts.setFontFamily('Arial').setBold(true).setFontSize(22).setForegroundColor(CONFIG.brand_primary);
  return tb;
}

function addFooter_(slide, W, H) {
  var fb = slide.insertTextBox(CONFIG.footer_text, MX, H - 22, W - 2 * MX, 16);
  fb.getText().getTextStyle().setFontFamily('Arial').setFontSize(8).setForegroundColor('#8A97A6');
  fb.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.END);
}

function addNarr_(slide, text, x, y, w, h) {
  if (!text) return null;
  var nb = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, x, y, w, h);
  nb.getFill().setSolidFill(CONFIG.brand_soft);
  nb.getBorder().setTransparent();
  var t = nb.getText().setText(text);
  t.getTextStyle().setFontFamily('Arial').setFontSize(11).setForegroundColor('#33475B');
  nb.setContentAlignment(SlidesApp.ContentAlignment.MIDDLE);
  nb.getText().getParagraphStyle().setIndentStart(8).setIndentEnd(8);
  return nb;
}

/** KPI card: angka besar + label + delta. */
function kpiCard_(slide, x, y, w, h, bigValue, label, delta) {
  var card = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, x, y, w, h);
  card.getFill().setSolidFill('#FFFFFF');
  card.getBorder().getLineFill().setSolidFill('#DfE6EE');
  card.getBorder().setWeight(1);

  var val = slide.insertTextBox(bigValue, x + 6, y + 10, w - 12, 40);
  val.getText().getTextStyle().setFontFamily('Arial').setBold(true).setFontSize(24).setForegroundColor(CONFIG.brand_primary);
  val.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  var lab = slide.insertTextBox(label, x + 6, y + 50, w - 12, 26);
  lab.getText().getTextStyle().setFontFamily('Arial').setFontSize(10).setForegroundColor('#5B6B7B');
  lab.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  if (delta) {
    var dl = slide.insertTextBox(delta + '  vs LY', x + 6, y + h - 26, w - 12, 20);
    dl.getText().getTextStyle().setFontFamily('Arial').setBold(true).setFontSize(11).setForegroundColor(deltaColor_(delta));
    dl.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
  }
}

function blankSlide_(pres) { return pres.appendSlide(SlidesApp.PredefinedLayout.BLANK); }

function removeAllSlides_(pres) {
  var slides = pres.getSlides();
  for (var i = slides.length - 1; i >= 0; i--) slides[i].remove();
}

function darkSlide_(slide) { slide.getBackground().setSolidFill(CONFIG.brand_primary); }

// ---- DECK ------------------------------------------------------------------
function buildDeck_() {
  var deckId = cfgGet_('slides_deck_id');
  var pres = null;
  if (deckId) {
    try { pres = SlidesApp.openById(deckId); } catch (e) { pres = null; }
  }
  if (!pres) {
    pres = SlidesApp.create(cfgGet_('slides_deck_name') || CONFIG.slides_deck_name);
  }
  // kosongkan seluruh slide (sisakan minimal 1 saat menghapus, lalu buang)
  removeAllSlides_(pres);
  var W = pres.getPageWidth(), H = pres.getPageHeight();

  slideCover_(pres, W, H);
  slideS02_(pres, W, H);
  slideS03_(pres, W, H);
  slideChart1_(pres, W, H, 's04', 'S04_TrendMember', [0, 1]);   // 2 chart
  slideS05_(pres, W, H);
  slideS06_(pres, W, H);
  slideChart1_(pres, W, H, 's07', 'S07_TrendContrib', [0]);
  slideChart1_(pres, W, H, 's08', 'S08_TrendMemberSales', [0]);
  slideChart1_(pres, W, H, 's09', 'S09_TrendSalesPerMember', [0]);
  slideChart1_(pres, W, H, 's10', 'S10_TrendTrxPerMember', [0]);
  slideChart1_(pres, W, H, 's11', 'S11_TrendBasket', [0]);
  slideImagePlaceholder_(pres, W, H, 's12');
  slideImagePlaceholder_(pres, W, H, 's13');
  slideSection_(pres, W, H, 's14');
  slideS15_(pres, W, H);
  slideThankYou_(pres, W, H);

  cfgSet_('slides_deck_id', pres.getId());
  cfgSet_('slides_deck_url', 'https://docs.google.com/presentation/d/' + pres.getId() + '/edit');
  pres.saveAndClose();
  return pres.getId();
}

// ---- masing-masing slide ---------------------------------------------------
function slideCover_(pres, W, H) {
  var s = blankSlide_(pres); darkSlide_(s);
  var t = s.insertTextBox(CONFIG.report_title, MX, H / 2 - 70, W - 2 * MX, 70);
  t.getText().getTextStyle().setFontFamily('Arial').setBold(true).setFontSize(44).setForegroundColor('#FFFFFF');
  t.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
  var p = s.insertTextBox('Periode ' + CONFIG.report_period, MX, H / 2 + 6, W - 2 * MX, 34);
  p.getText().getTextStyle().setFontFamily('Arial').setFontSize(18).setForegroundColor('#CADCFC');
  p.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
  var c = s.insertTextBox(CONFIG.company_name, MX, H - 40, W - 2 * MX, 20);
  c.getText().getTextStyle().setFontFamily('Arial').setFontSize(10).setForegroundColor('#9FB3D1');
  c.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
}

function slideS02_(pres, W, H) {
  var tx = textGet_('s02'); var s = blankSlide_(pres);
  addTitle_(s, tx.title, W);
  var d = DATA.s02_total_active;
  s.insertSheetsChart(chartOf_('S02_TotalActive', 0), MX, 70, W * 0.56, H - 130);
  var kx = MX + W * 0.56 + 16, kw = W - kx - MX;
  kpiCard_(s, kx, 74, kw, 84, fmtInt_(d.rows[0][1]), 'Total Member', '');
  kpiCard_(s, kx, 168, kw, 84, fmtInt_(d.rows[1][1]), 'Active Member', '');
  kpiCard_(s, kx, 262, kw, 60, fmtPct_(d.rows[1][1] / d.rows[0][1], 1), '% Active Member', '');
  addNarr_(s, tx.narr, MX, H - 58, W - 2 * MX, 34);
  addFooter_(s, W, H);
}

function slideS03_(pres, W, H) {
  var tx = textGet_('s03'); var s = blankSlide_(pres);
  addTitle_(s, tx.title, W);
  s.insertSheetsChart(chartOf_('S03_Profiling', 0), MX, 70, W * 0.60, H - 140);
  s.insertSheetsChart(chartOf_('S03_Profiling', 1), MX + W * 0.60 + 14, 70, W * 0.34, (H - 140) * 0.9);
  addNarr_(s, tx.narr, MX, H - 62, W - 2 * MX, 38);
  addFooter_(s, W, H);
}

/** Slide dengan 1-2 chart penuh + narasi opsional. */
function slideChart1_(pres, W, H, key, sheetName, idxs) {
  var tx = textGet_(key); var s = blankSlide_(pres);
  addTitle_(s, tx.title, W);
  var hasNarr = !!tx.narr;
  var bottom = hasNarr ? H - 66 : H - 34;
  var top = 70, areaH = bottom - top;
  if (idxs.length === 1) {
    s.insertSheetsChart(chartOf_(sheetName, idxs[0]), MX, top, W - 2 * MX, areaH);
  } else {
    var cw = (W - 2 * MX - 14) / 2;
    s.insertSheetsChart(chartOf_(sheetName, idxs[0]), MX, top, cw, areaH);
    s.insertSheetsChart(chartOf_(sheetName, idxs[1]), MX + cw + 14, top, cw, areaH);
  }
  if (hasNarr) addNarr_(s, tx.narr, MX, H - 60, W - 2 * MX, 36);
  addFooter_(s, W, H);
}

function slideS05_(pres, W, H) {
  var tx = textGet_('s05'); var s = blankSlide_(pres);
  addTitle_(s, tx.title, W);
  var d = DATA.s05_sales_contrib.rows;
  var cw = (W - 2 * MX - 2 * 16) / 3, y = 84, ch = 150;
  kpiCard_(s, MX, y, cw, ch, fmtMoneyShort_(d[0][1]), 'Sales Member (YTD Jul 26)', d[0][3]);
  kpiCard_(s, MX + cw + 16, y, cw, ch, 'Rp ' + fmtInt_(d[1][1]), 'Sales per Member (YTD Jul 26)', d[1][3]);
  kpiCard_(s, MX + 2 * (cw + 16), y, cw, ch, fmtPct_(d[2][1], 2), '% Kontribusi Sales Member', d[2][3]);
  addNarr_(s, tx.narr, MX, H - 74, W - 2 * MX, 48);
  addFooter_(s, W, H);
}

function slideS06_(pres, W, H) {
  var tx = textGet_('s06'); var s = blankSlide_(pres);
  addTitle_(s, tx.title, W);
  var d = DATA.s06_visit_basket.rows;
  var cw = (W - 2 * MX - 16) / 2, y = 88, ch = 150;
  kpiCard_(s, MX, y, cw, ch, fmtDec_(d[0][1], 2), 'Struk per Member (YTD Jul 26)', d[0][3]);
  kpiCard_(s, MX + cw + 16, y, cw, ch, 'Rp ' + fmtInt_(d[1][1]), 'Basket Size (YTD Jul 26)', d[1][3]);
  addNarr_(s, tx.narr, MX, H - 74, W - 2 * MX, 48);
  addFooter_(s, W, H);
}

function slideImagePlaceholder_(pres, W, H, key) {
  var tx = textGet_(key); var s = blankSlide_(pres);
  addTitle_(s, tx.title, W);
  var ph = s.insertShape(SlidesApp.ShapeType.RECTANGLE, MX, 74, W - 2 * MX, H - 150);
  ph.getFill().setSolidFill('#F4F7FB');
  ph.getBorder().getLineFill().setSolidFill('#C7D2DE');
  ph.getText().setText('[ Tempel gambar / peta di sini ]');
  ph.getText().getTextStyle().setFontFamily('Arial').setFontSize(12).setForegroundColor('#9AA7B5');
  ph.setContentAlignment(SlidesApp.ContentAlignment.MIDDLE);
  ph.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
  addNarr_(s, tx.narr, MX, H - 62, W - 2 * MX, 38);
  addFooter_(s, W, H);
}

function slideSection_(pres, W, H, key) {
  var tx = textGet_(key); var s = blankSlide_(pres); darkSlide_(s);
  var t = s.insertTextBox(tx.title, MX, H / 2 - 30, W - 2 * MX, 60);
  t.getText().getTextStyle().setFontFamily('Arial').setBold(true).setFontSize(34).setForegroundColor('#FFFFFF');
  t.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
}

function slideS15_(pres, W, H) {
  var tx = textGet_('s15'); var s = blankSlide_(pres);
  addTitle_(s, tx.title, W);
  // tabel di kiri
  var d = DATA.s15_redemption;
  var tblW = W * 0.42;
  var table = s.insertTable(d.table_rows.length + 1, 4, MX, 80, tblW, 150);
  var head = [d.table_header].concat(d.table_rows.map(function (r, i) {
    return [r[0],
      (i === 2 ? fmtPct_(r[1], 2) : fmtInt_(r[1])),
      (i === 2 ? fmtPct_(r[2], 2) : fmtInt_(r[2])),
      r[3]];
  }));
  for (var ri = 0; ri < head.length; ri++) {
    for (var ci = 0; ci < 4; ci++) {
      var cell = table.getCell(ri, ci);
      cell.getText().setText(String(head[ri][ci]));
      var st = cell.getText().getTextStyle();
      st.setFontFamily('Arial').setFontSize(9);
      if (ri === 0) { st.setBold(true).setForegroundColor('#FFFFFF'); cell.getFill().setSolidFill(CONFIG.brand_primary); }
      else if (ci === 3) { st.setBold(true).setForegroundColor(deltaColor_(head[ri][ci])); }
    }
  }
  // chart tren di kanan
  s.insertSheetsChart(chartOf_('S15_Redemption', 0), MX + tblW + 16, 74, W - MX - (MX + tblW + 16), H - 130);
  addFooter_(s, W, H);
}

function slideThankYou_(pres, W, H) {
  var s = blankSlide_(pres); darkSlide_(s);
  var t = s.insertTextBox('Thank You!', MX, H / 2 - 90, W - 2 * MX, 70);
  t.getText().getTextStyle().setFontFamily('Arial').setBold(true).setFontSize(40).setForegroundColor('#FFFFFF');
  t.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
  var info = CONFIG.company_name + '\n' + CONFIG.company_addr1 + '\n' + CONFIG.company_addr2 + '\n' + CONFIG.company_web;
  var b = s.insertTextBox(info, MX, H / 2 - 4, W - 2 * MX, 100);
  b.getText().getTextStyle().setFontFamily('Arial').setFontSize(12).setForegroundColor('#CADCFC');
  b.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
}

// ===================== 30_Menu.gs =====================
/*
 * 30_Menu.gs
 * ---------------------------------------------------------------------------
 * Menu & orkestrasi. Titik masuk yang dipakai user:
 *   - setup()            : sekali di awal -> isi sheet + grafik + buat deck
 *   - rebuildSlides()    : bangun ulang deck dari data terbaru di sheet
 *   - reseedFromScript() : timpa data sheet dengan angka di 00_Data.gs
 * ---------------------------------------------------------------------------
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('CRM Report')
    .addItem('1. Setup awal (isi data + buat Slides)', 'setup')
    .addItem('2. Update / Rebuild Slides dari data', 'rebuildSlides')
    .addSeparator()
    .addItem('Buka Google Slides', 'openDeck')
    .addItem('Reset data sheet dari script (00_Data.gs)', 'reseedFromScript')
    .addToUi();
}

/** Setup pertama kali: bangun data sheet + grafik, lalu buat deck. */
function setup() {
  buildDataSheets_();
  var id = buildDeck_();
  toast_('Selesai. Google Slides dibuat.', id);
}

/** Bangun ulang HANYA slides (data sheet dianggap sudah benar). */
function rebuildSlides() {
  // pastikan grafik ada; kalau sheet kosong, bangun dulu
  if (!ss_().getSheetByName('S02_TotalActive')) buildDataSheets_();
  var id = buildDeck_();
  toast_('Slides di-update dari data sheet.', id);
}

/** Timpa isi sheet dengan angka dari 00_Data.gs (mis. ganti periode). */
function reseedFromScript() {
  buildDataSheets_();
  SpreadsheetApp.getActiveSpreadsheet().toast('Data sheet di-reset dari 00_Data.gs. Jalankan "Update / Rebuild Slides".', 'CRM Report', 6);
}

function openDeck() {
  var url = cfgGet_('slides_deck_url');
  if (!url) { SpreadsheetApp.getUi().alert('Deck belum dibuat. Jalankan Setup dulu.'); return; }
  var html = HtmlService.createHtmlOutput(
    '<script>window.open("' + url + '","_blank");google.script.host.close();</script>');
  SpreadsheetApp.getUi().showModalDialog(html, 'Membuka Google Slides...');
}

function toast_(msg, deckId) {
  var url = 'https://docs.google.com/presentation/d/' + deckId + '/edit';
  SpreadsheetApp.getActiveSpreadsheet().toast(msg + ' ' + url, 'CRM Report', 8);
  Logger.log(msg + ' -> ' + url);
}

