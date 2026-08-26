//+------------------------------------------------------------------+
//|                                                   ExportOHLC.mq5 |
//|                                            Copyright 2026, Trexa |
//|                                                 https://Trexa.id |
//+------------------------------------------------------------------+
//| Script sederhana untuk mengekspor data OHLC ke file CSV.         |
//| Cara pakai:                                                       |
//|   1. Simpan file ini di folder  MQL5/Scripts  lalu compile.       |
//|   2. Buka chart symbol & timeframe yang diinginkan.               |
//|   3. Drag script "ExportOHLC" dari Navigator ke chart.            |
//|   4. Isi input bila perlu, klik OK.                               |
//|   5. File CSV muncul di folder  MQL5/Files  (Ctrl+Shift+D untuk   |
//|      buka Data Folder). Unggah file itu ke Claude.               |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Trexa"
#property link      "https://Trexa.id"
#property version   "1.00"
#property script_show_inputs

input string          InpSymbol    = "";              // Symbol (kosong = symbol chart)
input ENUM_TIMEFRAMES InpTimeframe = PERIOD_CURRENT;  // Timeframe (PERIOD_CURRENT = chart)
input int             InpBars      = 20000;           // Jumlah bar (0 = semua yang tersedia)
input string          InpFilename  = "";              // Nama file (kosong = otomatis)

//+------------------------------------------------------------------+
string TfToStr(ENUM_TIMEFRAMES tf)
  {
   if(tf == PERIOD_CURRENT)
      tf = (ENUM_TIMEFRAMES)Period();
   string s = EnumToString(tf);        // contoh: "PERIOD_M15"
   StringReplace(s, "PERIOD_", "");    // -> "M15"
   return s;
  }
//+------------------------------------------------------------------+
void OnStart()
  {
   string        sym = (InpSymbol == "" ? Symbol() : InpSymbol);
   ENUM_TIMEFRAMES tf = (InpTimeframe == PERIOD_CURRENT ? (ENUM_TIMEFRAMES)Period() : InpTimeframe);

   //--- pastikan symbol tersedia
   if(!SymbolSelect(sym, true))
     {
      Print("Symbol tidak ditemukan: ", sym);
      return;
     }

   int digits = (int)SymbolInfoInteger(sym, SYMBOL_DIGITS);

   //--- ambil data
   MqlRates rates[];
   ArraySetAsSeries(rates, false); // urut dari lama -> baru
   int copied;
   if(InpBars <= 0)
      copied = CopyRates(sym, tf, 0, TerminalInfoInteger(TERMINAL_MAXBARS), rates);
   else
      copied = CopyRates(sym, tf, 0, InpBars, rates);

   if(copied <= 0)
     {
      Print("Gagal mengambil data (CopyRates=", copied, "). ",
            "Coba scroll chart ke kiri agar history ter-load, lalu ulangi.");
      return;
     }

   //--- nama file
   string fname = InpFilename;
   if(fname == "")
      fname = sym + "_" + TfToStr(tf) + ".csv";

   int h = FileOpen(fname, FILE_WRITE | FILE_TXT | FILE_ANSI);
   if(h == INVALID_HANDLE)
     {
      Print("Gagal membuka file: ", fname, " err=", GetLastError());
      return;
     }

   //--- header (dibaca oleh skrip simulasi Claude)
   FileWriteString(h, "time,open,high,low,close,tick_volume,spread\r\n");

   //--- isi baris
   for(int i = 0; i < copied; i++)
     {
      string line = StringFormat("%s,%.*f,%.*f,%.*f,%.*f,%I64d,%d\r\n",
                                 TimeToString(rates[i].time, TIME_DATE | TIME_MINUTES),
                                 digits, rates[i].open,
                                 digits, rates[i].high,
                                 digits, rates[i].low,
                                 digits, rates[i].close,
                                 rates[i].tick_volume,
                                 (int)rates[i].spread);
      FileWriteString(h, line);
     }

   FileClose(h);

   PrintFormat("OK: %d bar %s %s -> MQL5/Files/%s",
               copied, sym, TfToStr(tf), fname);
   Comment(StringFormat("Export selesai: %d bar\n%s\nFolder: MQL5/Files/%s",
                        copied, sym, fname));
  }
//+------------------------------------------------------------------+
