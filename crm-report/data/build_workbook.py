#!/usr/bin/env python3
"""
Bangun workbook data CRM Monthly Report (.xlsx) dari data template.

Output: crm_report_data.xlsx  -> di-upload ke Google Drive akan otomatis
menjadi Google Sheet multi-tab yang jadi SUMBER DATA untuk Google Slides.

Semua angka pada slide berasal dari sheet ini. Ubah angka di sheet, lalu
jalankan menu "CRM Report > Generate / Update Slides" (Apps Script) untuk
memperbarui deck.

Jalankan:  python3 build_workbook.py
"""
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# ---------------------------------------------------------------------------
# Palet warna korporat (biru–merah Alfamart-ish) dipakai untuk header sheet.
NAVY = "1F3A5F"
RED = "E4002B"
LIGHT = "EAF0F7"
WHITE = "FFFFFF"

HEAD_FILL = PatternFill("solid", fgColor=NAVY)
SUB_FILL = PatternFill("solid", fgColor=LIGHT)
HEAD_FONT = Font(bold=True, color=WHITE, size=11)
BOLD = Font(bold=True)
THIN = Side(style="thin", color="C7D2DE")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)


def style_header(ws, row, ncols, fill=HEAD_FILL, font=HEAD_FONT):
    for c in range(1, ncols + 1):
        cell = ws.cell(row=row, column=c)
        cell.fill = fill
        cell.font = font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = BORDER


def autosize(ws, widths):
    for i, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(i)].width = w


# 19 bulan berdata (Jan-25 .. Jul-26) + 5 bulan kosong (Agu-26 .. Des-26)
MONTHS_SERIES = [
    "Jan-25", "Feb-25", "Mar-25", "Apr-25", "Mei-25", "Jun-25", "Jul-25",
    "Agu-25", "Sep-25", "Okt-25", "Nov-25", "Des-25",
    "Jan-26", "Feb-26", "Mar-26", "Apr-26", "Mei-26", "Jun-26", "Jul-26",
    "Agu-26", "Sep-26", "Okt-26", "Nov-26", "Des-26",
]
MONTHS_CAL = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul",
              "Agu", "Sep", "Okt", "Nov", "Des"]

N = None  # nilai kosong (bulan yang belum ada datanya)

wb = Workbook()

# ===========================================================================
# 1. CONFIG  — kop, judul, footer, dan ID file (diisi otomatis oleh script)
# ===========================================================================
ws = wb.active
ws.title = "Config"
config_rows = [
    ("key", "value", "keterangan"),
    ("report_title", "CRM MONTHLY REPORT", "Judul utama di cover"),
    ("report_period", "Juli 2026", "Periode laporan"),
    ("report_month_short", "Jul 26", "Label bulan singkat dipakai di narasi"),
    ("brand_primary", NAVY, "Warna utama (hex tanpa #)"),
    ("brand_accent", RED, "Warna aksen (hex tanpa #)"),
    ("footer_text", "CRM Monthly Report  •  All Rights Reserved. @Alfamart 2026", "Footer tiap slide"),
    ("company_name", "PT. SUMBER ALFARIA TRIJAYA Tbk", "Slide penutup"),
    ("company_addr1", "Alfa Tower, Jalan Jalur Sutera Barat Kav. 7-9", "Alamat baris 1"),
    ("company_addr2", "Alam Sutera, Kota Tangerang, Banten 15143", "Alamat baris 2"),
    ("company_web", "www.alfamartku.com", "Website"),
    ("slides_deck_id", "", "DIISI OTOMATIS oleh script (ID Google Slides yg dibuat)"),
    ("slides_deck_name", "CRM Monthly Report - Juli 2026", "Nama file deck yang dibuat/di-update"),
]
for r in config_rows:
    ws.append(r)
style_header(ws, 1, 3)
for row in range(2, len(config_rows) + 1):
    ws.cell(row=row, column=1).font = BOLD
autosize(ws, [22, 52, 46])

# ===========================================================================
# 2. TEXT — judul & narasi tiap slide (bisa diedit user)
# ===========================================================================
ws = wb.create_sheet("Text")
text_rows = [
    ("slide_key", "title", "narrative"),
    ("s02_total_active", "Total Member vs Active Member",
     "Di bulan Jul 26, total member = 26,8 juta member dengan active member = 17,6 juta member (65,6%)."),
    ("s03_profiling", "Profiling Member",
     "Dari total member Alfamart, mayoritas berjenis kelamin perempuan dengan rentang usia terbanyak di 21-40 tahun."),
    ("s04_trend_member", "Tren Total Member vs Active Member", ""),
    ("s05_sales_contrib", "Kontribusi Sales Member",
     "Kontribusi sales member di YTD Jul 26 = 60,91%, naik 4,3 pts vs LY. "
     "Secara value, sales member naik 15,5% vs tahun lalu, sedangkan sales per member turun 3,5%."),
    ("s06_visit_basket", "Visit per Member & Basket Size Member",
     "Struk per Member di YTD Jul 26 = 4,71, turun 3,5% vs LY. "
     "Basket Size member YTD Jul 26 = 68.312, hampir sama dibanding LY."),
    ("s07_trend_contrib", "Tren Kontribusi Sales Member", ""),
    ("s08_trend_member_sales", "Tren Jumlah Member dan Sales Member", ""),
    ("s09_trend_sales_per_member", "Tren Sales Per Member", ""),
    ("s10_trend_trx_per_member", "Tren Transaksi Per Member", ""),
    ("s11_trend_basket", "Tren Basket Size Member", ""),
    ("s12_by_branch", "Kontribusi Sales Member by Branch",
     "Tempel peta/grafik distribusi per branch pada slide ini (gambar)."),
    ("s13_by_dept", "Sales Member by Departement - Top 20 Departement",
     "Kontribusi dari 20 departement = 95,3% terhadap sales member YTD Jul 2026."),
    ("s14_section_redemption", "REDEEMPTION POIN MEMBER", ""),
    ("s15_point_redemption", "Point Redemption", ""),
]
for r in text_rows:
    ws.append(r)
style_header(ws, 1, 3)
for row in range(2, len(text_rows) + 1):
    ws.cell(row=row, column=1).font = BOLD
    ws.cell(row=row, column=3).alignment = Alignment(wrap_text=True, vertical="top")
autosize(ws, [26, 42, 80])

# ===========================================================================
# 3. S02 — Total vs Active Member (bar) + KPI
# ===========================================================================
ws = wb.create_sheet("S02_TotalActive")
ws.append(["Kategori", "Jumlah Member"])
ws.append(["Total Member", 26839543])
ws.append(["Active Member", 17619760])
ws.append([])
ws.append(["KPI", "Nilai", "Formula"])
ws.append(["% Active Member", "=B3/B2", "active / total"])
style_header(ws, 1, 2)
style_header(ws, 5, 3, fill=SUB_FILL, font=BOLD)
ws["B6"].number_format = "0.0%"
autosize(ws, [20, 18, 16])

# ===========================================================================
# 4. S03 — Profiling by umur (Female vs Male) + gender split
# ===========================================================================
ws = wb.create_sheet("S03_Profiling")
ws.append(["Rentang Usia", "Perempuan", "Laki-laki"])
prof = [
    ("<21 tahun", 0.0661059187623879, 0.07110034368884409),
    ("21-30 tahun", 0.3765410954178481, 0.387049181263036),
    ("31-40 tahun", 0.28509676019885777, 0.29259543732175847),
    ("41-50 tahun", 0.17514310772972164, 0.16876014070169773),
    (">=51 tahun", 0.09711311789118458, 0.08049489702466368),
]
for name, f, m in prof:
    ws.append([name, f, m])
ws.append([])
ws.append(["Gender Split", "%"])
ws.append(["Perempuan", 0.66])
ws.append(["Laki-laki", 0.34])
style_header(ws, 1, 3)
style_header(ws, 7, 2, fill=SUB_FILL, font=BOLD)
for r in range(2, 7):
    ws.cell(row=r, column=2).number_format = "0.0%"
    ws.cell(row=r, column=3).number_format = "0.0%"
ws["B8"].number_format = "0%"
ws["B9"].number_format = "0%"
autosize(ws, [16, 14, 14])

# ===========================================================================
# 5. S04 — Tren Total vs Active (Total, Active, %Active computed)
# ===========================================================================
ws = wb.create_sheet("S04_TrendMember")
ws.append(["Bulan", "Total Member", "Active Member", "% Active"])
total = [20817045, 20993855, 21262211, 21353334, 21695168, 22012418, 22364090,
         22713524, 22856131, 23181980, 23527146, 23759146, 24204410, 24582490,
         25119971, 25474731, 25964774, 26424609, 26839543, N, N, N, N, N]
active = [13541668, 13481661, 14369613, 14080367, 14244378, 14613080, 14785553,
          14871892, 14833096, 15300482, 15449824, 15683706, 15992030, 16045521,
          17506055, 16632546, 17394397, 17498467, 17619760, N, N, N, N, N]
for i, m in enumerate(MONTHS_SERIES):
    row = i + 2
    ws.append([m, total[i], active[i],
               f"=IF(OR(B{row}=\"\",C{row}=\"\"),\"\",C{row}/B{row})"])
    ws.cell(row=row, column=4).number_format = "0.0%"
style_header(ws, 1, 4)
autosize(ws, [10, 16, 16, 10])

# ===========================================================================
# 6. S05 — Kontribusi Sales Member (YTD vs LY, 3 KPI)
# ===========================================================================
ws = wb.create_sheet("S05_SalesContrib")
ws.append(["Metrik", "YTD Jul 26", "YTD Jul 25", "Delta"])
ws.append(["Sales Member (Rp)", 38184702752510.7, 33063195342471.29, "+15,5%"])
ws.append(["Sales per Member (Rp)", 321721.26973214815, 333579.7307897558, "-3,5%"])
ws.append(["% Contr. Sales Member", 0.6091149422299342, 0.5656518125042255, "+4,3 pts"])
style_header(ws, 1, 4)
ws["B4"].number_format = "0.0%"
ws["C4"].number_format = "0.0%"
autosize(ws, [24, 18, 18, 12])

# ===========================================================================
# 7. S06 — Visit per Member & Basket Size (YTD vs LY)
# ===========================================================================
ws = wb.create_sheet("S06_VisitBasket")
ws.append(["Metrik", "YTD Jul 26", "YTD Jul 25", "Delta"])
ws.append(["Struk per Member", 4.70959740227494, 4.882385070390023, "-3,5%"])
ws.append(["Basket Size (Rp)", 68311.84117282357, 68323.10970570543, "-0,02%"])
style_header(ws, 1, 4)
autosize(ws, [20, 16, 16, 10])


# helper untuk tab tren kalender (2026 vs 2025 + YTD)
def add_calendar_trend(name, header, s2026, s2025, ytd26, ytd25, pct=False):
    ws = wb.create_sheet(name)
    ws.append(["Bulan", header + " 2026", header + " 2025"])
    for i, m in enumerate(MONTHS_CAL):
        ws.append([m, s2026[i], s2025[i]])
    ws.append(["YTD Jul", ytd26, ytd25])
    style_header(ws, 1, 3)
    last = ws.max_row
    ws.cell(row=last, column=1).font = BOLD
    if pct:
        for r in range(2, last + 1):
            ws.cell(row=r, column=2).number_format = "0.0%"
            ws.cell(row=r, column=3).number_format = "0.0%"
    autosize(ws, [10, 16, 16])
    return ws


# 8. S07 — Tren Kontribusi Sales Member (%)
add_calendar_trend(
    "S07_TrendContrib", "Kontribusi",
    [0.6030403581550094, 0.6289157040053209, 0.5829251733078351, 0.5976574054619987,
     0.6325658124344529, 0.604535611592103, 0.6204637045352445, N, N, N, N, N],
    [0.5687517969822217, 0.5798051019772953, 0.5867060815200548, 0.5192647596451941,
     0.5674067826125074, 0.5625686908617799, 0.5724753810321792, 0.5791266425928627,
     0.5839471616726127, 0.5917252432402588, 0.5932773933989567, 0.5942283218931982],
    0.6091149422299342, 0.5656518125042255, pct=True)

# 9. S08 — Tren Jumlah Member & Sales Member (combo)
ws = wb.create_sheet("S08_TrendMemberSales")
ws.append(["Bulan", "Sales Member (Rp)", "Jumlah Member"])
sales8 = [4417374461508.74, 4378719583454.53, 5907331590489.71, 4345446380692.29,
          4597590272122.74, 4668147962567.35, 4748585091635.93, 4693297753440.22,
          4526402700806.52, 4891586124223.42, 4850254376267.61, 5112595722371.64,
          5015328536755.68, 5243364195297.39, 6481133638453.85, 5015823687116.12,
          5746446679993.04, 5244235895972.81, 5438370118921.82, N, N, N, N, N]
jml8 = [13541668, 13481661, 14369613, 14080367, 14244378, 14613080, 14785553,
        14871892, 14833096, 15300482, 15449824, 15683706, 15992030, 16045521,
        17506055, 16632546, 17394397, 17498464, 17619760, N, N, N, N, N]
for i, m in enumerate(MONTHS_SERIES):
    ws.append([m, sales8[i], jml8[i]])
style_header(ws, 1, 3)
autosize(ws, [10, 18, 16])

# 10. S09 — Tren Sales per Member
add_calendar_trend(
    "S09_TrendSalesPerMember", "Sales/Member",
    [313614.2526468297, 326780.551114382, 370222.39667668415, 301566.8008443277,
     330361.936662308, 299696.92745447886, 308651.7704510062, N, N, N, N, N],
    [326206.0819618927, 324790.8090445628, 411098.8647007898, 308617.4089561934,
     322765.25321939227, 319449.9696550864, 321163.84768536757, 315581.7533801496,
     305155.62636461866, 319701.4397470236, 313935.8983162274, 325981.354303099],
    321721.26973214815, 333579.7307897558)

# 11. S10 — Tren Transaksi per Member
add_calendar_trend(
    "S10_TrendTrxPerMember", "Struk/Member",
    [4.528464929092804, 4.373104494394417, 4.838451038797719, 4.648130959625784,
     5.016471625891946, 4.7146497544013, 4.802459284348935, N, N, N, N, N],
    [4.8787962457800615, 4.620819126070593, 5.128524686085839, 4.870513034212816,
     5.131615925946363, 4.733506283411847, 4.803295216621252, 4.754517986010119,
     4.610926471452757, 4.7717105905552515, 4.575506814834913, 4.629892641445842],
    4.70959740227494, 4.882385070390023)

# 12. S11 — Tren Basket Size
add_calendar_trend(
    "S11_TrendBasket", "Basket Size",
    [69253.98729093318, 74725.07266479902, 76516.71861676598, 64879.153247568254,
     65855.43810457982, 63567.166823940766, 64269.52362863182, N, N, N, N, N],
    [66862.0015119603, 70288.57875264969, 80159.28358815136, 63364.45602102221,
     62897.3909733645, 67486.96431957225, 66863.23309340158, 66375.13083528756,
     66180.97865014833, 66999.33570569336, 68612.26767237466, 70407.97261365874],
    68311.84117282357, 68323.10970570543)

# ===========================================================================
# 13. S15 — Point Redemption (tabel + tren rate)
# ===========================================================================
ws = wb.create_sheet("S15_Redemption")
ws.append(["Metrik", "2026", "2025", "2026 vs 2025"])
ws.append(["Issued Point", 131499745941, 125274796303, "+5,0%"])
ws.append(["Redemp Point", 80322882241, 76763900922, "+4,6%"])
ws.append(["% Redemption Rate", 0.6108, 0.6128, "-0,19%"])
ws["B4"].number_format = "0.00%"
ws["C4"].number_format = "0.00%"
style_header(ws, 1, 4)
ws.append([])
ws.append(["Bulan", "Redemption Rate 2026", "Redemption Rate 2025"])
rate26 = [0.7884482355854628, 0.5737591899302854, 0.48223661628516273, 0.687555013841083,
          0.5949930164253318, 0.6515147001010176, 0.5954836796777726, N, N, N, N, N]
rate25 = [0.578193945270244, 0.5922819947606582, 0.5139597657325711, 0.6396232409257835,
          0.7205360278647829, 0.6582972178446708, 0.6235676306184152, 0.516088448876211,
          0.6034009218040162, 0.6399858745501065, 0.5873013507577727, 0.6641523988861396]
hdr2 = ws.max_row
style_header(ws, hdr2, 3, fill=SUB_FILL, font=BOLD)
for i, m in enumerate(MONTHS_CAL):
    ws.append([m, rate26[i], rate25[i]])
    r = ws.max_row
    ws.cell(row=r, column=2).number_format = "0.0%"
    ws.cell(row=r, column=3).number_format = "0.0%"
autosize(ws, [22, 22, 22, 14])

# ===========================================================================
wb.save("crm_report_data.xlsx")
print("OK -> crm_report_data.xlsx  (%d tab)" % len(wb.sheetnames))
print("Tabs:", ", ".join(wb.sheetnames))
