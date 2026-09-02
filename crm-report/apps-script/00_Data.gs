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
