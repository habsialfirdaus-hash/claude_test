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
