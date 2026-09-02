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
