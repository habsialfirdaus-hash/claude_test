//+------------------------------------------------------------------+
//|                                           TrailingReversalPO.mq5 |
//|                                            Copyright 2026, Trexa |
//|                                                 https://Trexa.id |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Trexa"
#property link      "https://Trexa.id"
#property version   "1.60"

/*
   Versi lengkap & sudah bisa di-compile (MQL5).
   Perbaikan dari draf awal:
   - Deklarasi variabel global runningTicket (sebelumnya dipakai tanpa dideklarasikan).
   - Konstanta gaya MQL4 (OP_BUY/OP_SELL/OP_BUYSTOP/OP_SELLSTOP) diganti ke enum MQL5.
   - Logika reversal dirapikan agar konsisten.
   Catatan: karena video referensi tidak dapat diakses, logika di sini mengikuti
   maksud strategi dari kode aslinya, bukan salinan persis versi video.
*/

#include <Trade/Trade.mqh>
#include <Trade/SymbolInfo.mqh>

CTrade      oTrade;
CSymbolInfo oSym;

// DEFAULT: Mode Candle Breakout (IN_UseCandle=true) -> BuyStop/SellStop
// mengacu pada high/low candle (default H4). Hasil backtest terbaik
// (XAUUSDc ~3 bln: PF ~1.6, DD lebih kecil dari mode jarak-tetap).
// Parameter IN_DistancePO/IN_TrailingStart di bawah HANYA dipakai kalau
// IN_UseCandle=false (mode jarak-tetap). Preset jarak-tetap:
//   * XAUUSD  (spread ~90 pts) : D=6000,  TrailingStart=3600,  Step=200
//   * XAUUSDc (spread ~260 pts): D=25000, TrailingStart=15000, Step=300
input    int      IN_MagicNumber   = 123;      //Magic Number
input    double   IN_Lot           = 0.01;     //Lot Size
input    int      IN_DistancePO    = 25000;    //Jarak PO (points) - XAUUSDc (cent)
input    int      IN_TrailingStart = 15000;    //Trailing Start PO (points)
input    int      IN_TrailingStep  = 300;      //Trailing Step PO (points)
input    int      IN_SL            = 0;        //Stop Loss (points, 0 = nonaktif)
input    int      IN_TP            = 0;        //Take Profit (points, 0 = nonaktif)

input    group    "=== Filter Anti-Sideways ==="
input ENUM_TIMEFRAMES IN_FilterTF  = PERIOD_M15; //Timeframe filter
input    bool     IN_UseADX        = true;     //Pakai filter ADX (trend)
input    int      IN_ADXPeriod     = 14;       //Periode ADX
input    double   IN_ADXMin        = 23.0;     //ADX minimal (trending jika >= nilai ini)
input    bool     IN_UseATR        = false;    //Pakai filter ATR (volatilitas)
input    int      IN_ATRPeriod     = 14;       //Periode ATR
input    int      IN_ATRMinPoints  = 0;        //ATR minimal (points)
input    bool     IN_UseTime       = false;    //Pakai filter jam (waktu server)
input    int      IN_StartHour     = 8;        //Jam mulai (0-23)
input    int      IN_EndHour       = 22;       //Jam selesai (0-23)

input    group    "=== Mode Candle Breakout ==="
input    bool     IN_UseCandle     = true;     //Acuan PO dari high/low candle (bukan jarak tetap)
input ENUM_TIMEFRAMES IN_CandleTF  = PERIOD_H4; //Timeframe candle acuan
input    int      IN_CandleLookback= 1;        //Jumlah candle (highest-high / lowest-low)
input    int      IN_CandleBuffer  = 200;      //Buffer di atas high / bawah low (points)

// Menyimpan tiket posisi "pertama" (yang akan ditutup saat terjadi reversal).
ulong runningTicket = 0;

// Handle indikator filter.
int hADX = INVALID_HANDLE;
int hATR = INVALID_HANDLE;

//+------------------------------------------------------------------+
//| Hitung SL & TP relatif terhadap harga entry (0 jika nonaktif)    |
//+------------------------------------------------------------------+
void calcSLTP(const bool isBuy, const double price, const double point, double &sl, double &tp)
  {
   sl = 0.0;
   tp = 0.0;
   if(isBuy)
     {
      if(IN_SL > 0) sl = price - (IN_SL * point);
      if(IN_TP > 0) tp = price + (IN_TP * point);
     }
   else
     {
      if(IN_SL > 0) sl = price + (IN_SL * point);
      if(IN_TP > 0) tp = price - (IN_TP * point);
     }
  }

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
  {
//---
   oSym.Name(Symbol());
   oTrade.SetExpertMagicNumber(IN_MagicNumber);
   oTrade.SetDeviationInPoints(10);
   oTrade.SetTypeFillingBySymbol(Symbol());

//--- siapkan indikator filter
   if(IN_UseADX)
     {
      hADX = iADX(Symbol(), IN_FilterTF, IN_ADXPeriod);
      if(hADX == INVALID_HANDLE)
        {
         Print("Gagal membuat handle ADX");
         return(INIT_FAILED);
        }
     }
   if(IN_UseATR)
     {
      hATR = iATR(Symbol(), IN_FilterTF, IN_ATRPeriod);
      if(hATR == INVALID_HANDLE)
        {
         Print("Gagal membuat handle ATR");
         return(INIT_FAILED);
        }
     }

//---
   return(INIT_SUCCEEDED);
  }
//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
//---
   if(hADX != INVALID_HANDLE) IndicatorRelease(hADX);
   if(hATR != INVALID_HANDLE) IndicatorRelease(hATR);
  }
//+------------------------------------------------------------------+
//| Cek apakah pasar layak dibuka posisi baru (lolos semua filter)   |
//| return true = boleh buka straddle baru; false = tunggu           |
//+------------------------------------------------------------------+
bool marketOK()
  {
   //--- Filter jam (waktu server)
   if(IN_UseTime)
     {
      MqlDateTime dt;
      TimeToStruct(TimeCurrent(), dt);
      int h = dt.hour;
      bool inWindow;
      if(IN_StartHour <= IN_EndHour)
         inWindow = (h >= IN_StartHour && h < IN_EndHour);
      else // rentang melewati tengah malam, mis. 22 -> 6
         inWindow = (h >= IN_StartHour || h < IN_EndHour);
      if(!inWindow)
         return false;
     }

   //--- Filter ADX: hanya trading saat pasar trending
   if(IN_UseADX)
     {
      double adx[];
      if(CopyBuffer(hADX, 0, 0, 1, adx) < 1) // buffer 0 = garis ADX utama
         return false;                        // data belum siap -> jangan trading
      if(adx[0] < IN_ADXMin)
         return false;                        // pasar sideways
     }

   //--- Filter ATR: hanya trading saat volatilitas cukup
   if(IN_UseATR && IN_ATRMinPoints > 0)
     {
      double atr[];
      if(CopyBuffer(hATR, 0, 0, 1, atr) < 1)
         return false;
      double atrPoints = atr[0] / oSym.Point();
      if(atrPoints < IN_ATRMinPoints)
         return false;
     }

   return true;
  }
//+------------------------------------------------------------------+
//| Ambil tiket pending BuyStop & SellStop milik EA ini              |
//+------------------------------------------------------------------+
void getTicketPO(ulong &tBuyStop, ulong &tSellStop)
  {
   string pair = oSym.Name();
   tBuyStop = tSellStop = 0;
   int tOrders = OrdersTotal();
   for(int i = tOrders - 1; i >= 0; i--)
     {
      ulong ticket = OrderGetTicket(i);
      if(ticket <= 0) continue;
      if(OrderGetInteger(ORDER_MAGIC) == IN_MagicNumber && OrderGetString(ORDER_SYMBOL) == pair)
        {
         long type = OrderGetInteger(ORDER_TYPE);
         if(type == ORDER_TYPE_BUY_STOP)  tBuyStop  = ticket;
         if(type == ORDER_TYPE_SELL_STOP) tSellStop = ticket;
        }
     }
  }
//+------------------------------------------------------------------+
//| Hitung level breakout dari high/low candle acuan                 |
//| buyLevel = highest-high + buffer ; sellLevel = lowest-low - buf  |
//+------------------------------------------------------------------+
bool getCandleLevels(double &buyLevel, double &sellLevel)
  {
   int need = MathMax(1, IN_CandleLookback);
   double hi[], lo[];
   //--- mulai dari shift 1 = hanya candle yang SUDAH tertutup
   if(CopyHigh(Symbol(), IN_CandleTF, 1, need, hi) < need) return false;
   if(CopyLow(Symbol(),  IN_CandleTF, 1, need, lo) < need) return false;
   double hh = hi[0], ll = lo[0];
   for(int i = 1; i < need; i++)
     {
      if(hi[i] > hh) hh = hi[i];
      if(lo[i] < ll) ll = lo[i];
     }
   double buf = IN_CandleBuffer * oSym.Point();
   buyLevel  = hh + buf;
   sellLevel = ll - buf;
   return true;
  }
//+------------------------------------------------------------------+
//| Pengelolaan versi Candle Breakout (tanpa trailing points)        |
//+------------------------------------------------------------------+
void manageCandle()
  {
   string pair  = oSym.Name();
   double point = oSym.Point();
   double ask   = oSym.Ask();
   double bid   = oSym.Bid();

   ulong ticketBuy = 0, ticketSell = 0;
   getTicketBuySell(ticketBuy, ticketSell);
   ulong tBuyStop = 0, tSellStop = 0;
   getTicketPO(tBuyStop, tSellStop);

   //--- Reversal: dua posisi terbuka -> tutup posisi pertama
   if(ticketBuy > 0 && ticketSell > 0)
     {
      if(runningTicket > 0)
        {
         oTrade.PositionClose(runningTicket);
         runningTicket = 0;
        }
      return;
     }

   double buyLevel = 0.0, sellLevel = 0.0;
   if(!getCandleLevels(buyLevel, sellLevel))
      return; // data candle belum siap

   double sl = 0.0, tp = 0.0;
   bool inCycle    = (ticketBuy > 0 || ticketSell > 0);
   bool canOpenNew = marketOK();

   //--- jarak minimal broker untuk stop order
   double minDist = (double)SymbolInfoInteger(pair, SYMBOL_TRADE_STOPS_LEVEL) * point;

   //--- Sisi BUY STOP (hanya jika belum ada posisi Buy) ---
   if(ticketBuy == 0 && (inCycle || canOpenNew))
     {
      if(buyLevel > ask + minDist) // valid: level di atas harga
        {
         calcSLTP(true, buyLevel, point, sl, tp);
         if(tBuyStop == 0)
            oTrade.BuyStop(IN_Lot, buyLevel, pair, sl, tp, ORDER_TIME_DAY);
         else if(MathAbs(buyLevel - OrderGetDoubleByTicket(tBuyStop, ORDER_PRICE_OPEN)) > point)
            oTrade.OrderModify(tBuyStop, buyLevel, sl, tp, ORDER_TIME_DAY, 0); // re-anchor candle baru
        }
     }

   //--- Sisi SELL STOP (hanya jika belum ada posisi Sell) ---
   if(ticketSell == 0 && (inCycle || canOpenNew))
     {
      if(sellLevel < bid - minDist)
        {
         calcSLTP(false, sellLevel, point, sl, tp);
         if(tSellStop == 0)
            oTrade.SellStop(IN_Lot, sellLevel, pair, sl, tp, ORDER_TIME_DAY);
         else if(MathAbs(sellLevel - OrderGetDoubleByTicket(tSellStop, ORDER_PRICE_OPEN)) > point)
            oTrade.OrderModify(tSellStop, sellLevel, sl, tp, ORDER_TIME_DAY, 0);
        }
     }

   //--- Catat posisi pertama (yang akan ditutup saat reversal) ---
   if(ticketBuy == 0 && ticketSell > 0)      runningTicket = ticketSell;
   else if(ticketBuy > 0 && ticketSell == 0) runningTicket = ticketBuy;
  }
//+------------------------------------------------------------------+
//| Helper: baca ORDER_PRICE_OPEN dari sebuah tiket pending          |
//+------------------------------------------------------------------+
double OrderGetDoubleByTicket(ulong ticket, ENUM_ORDER_PROPERTY_DOUBLE prop)
  {
   if(OrderSelect(ticket))
      return OrderGetDouble(prop);
   return 0.0;
  }
//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
  {
//---
   ManagePO();
  }
//+------------------------------------------------------------------+
//| Logika utama pengelolaan Pending Order + Reversal                |
//+------------------------------------------------------------------+
void ManagePO()
  {
   string pair = oSym.Name();
   oSym.RefreshRates();
   double point = oSym.Point();

   //--- Mode candle breakout: acuan PO dari high/low candle
   if(IN_UseCandle)
     {
      manageCandle();
      return;
     }

   ulong ticketBuy = 0, ticketSell = 0;
   getTicketBuySell(ticketBuy, ticketSell);

   double priceBuyStop = 0.0, priceSellStop = 0.0;
   getPricePO(priceBuyStop, priceSellStop);

   double sl = 0.0, tp = 0.0;

   //--- Status filter & siklus
   bool inCycle    = (ticketBuy > 0 || ticketSell > 0); // sudah ada posisi terbuka
   bool canOpenNew = marketOK();                        // pasar lolos filter anti-sideways

   //--- Kondisi awal: belum ada posisi & belum ada pending -> pasang straddle (difilter)
   if(priceBuyStop == 0 && priceSellStop == 0 && ticketBuy == 0 && ticketSell == 0)
     {
      if(!canOpenNew)
         return; // pasar sideways / di luar jam -> tunggu, jangan pasang straddle

      double vol     = IN_Lot;
      double hargaPO  = oSym.Ask() + (IN_DistancePO / 2 * point);
      calcSLTP(true, hargaPO, point, sl, tp);
      oTrade.BuyStop(vol, hargaPO, pair, sl, tp, ORDER_TIME_DAY);

      hargaPO = hargaPO - (IN_DistancePO * point);
      calcSLTP(false, hargaPO, point, sl, tp);
      oTrade.SellStop(vol, hargaPO, pair, sl, tp, ORDER_TIME_DAY);
      return;
     }

   //--- Jika BuyStop hilang & belum ada posisi Buy -> pasang ulang BuyStop
   //    (saat sedang dalam siklus, penggantian tetap dibolehkan agar reversal berfungsi)
   if(priceBuyStop == 0 && ticketBuy == 0 && (inCycle || canOpenNew))
     {
      double vol     = IN_Lot;
      double hargaPO  = oSym.Ask() + (IN_DistancePO * point);
      calcSLTP(true, hargaPO, point, sl, tp);
      oTrade.BuyStop(vol, hargaPO, pair, sl, tp, ORDER_TIME_DAY);
     }

   //--- Jika SellStop hilang & belum ada posisi Sell -> pasang ulang SellStop
   if(priceSellStop == 0 && ticketSell == 0 && (inCycle || canOpenNew))
     {
      double vol     = IN_Lot;
      double hargaPO  = oSym.Bid() - (IN_DistancePO * point);
      calcSLTP(false, hargaPO, point, sl, tp);
      oTrade.SellStop(vol, hargaPO, pair, sl, tp, ORDER_TIME_DAY);
     }

   //--- Ada 1 posisi terbuka DAN masih ada pending lawannya -> trailing + catat posisi pertama
   if((ticketBuy > 0 || ticketSell > 0) && (priceBuyStop > 0 || priceSellStop > 0))
     {
      trailingPO();

      if(ticketBuy == 0 && ticketSell > 0)
         runningTicket = ticketSell;
      else if(ticketBuy > 0 && ticketSell == 0)
         runningTicket = ticketBuy;
     }
   else
     {
      //--- Kedua posisi terbuka (reversal terjadi) -> tutup posisi pertama, sisakan yang reversal
      if(ticketBuy > 0 && ticketSell > 0)
        {
         if(runningTicket > 0)
           {
            oTrade.PositionClose(runningTicket);
            runningTicket = 0;
           }
        }
     }
  }
//+------------------------------------------------------------------+
//| Trailing pending order mengikuti pergerakan harga                |
//+------------------------------------------------------------------+
void trailingPO()
  {
   oSym.RefreshRates();
   string pair  = oSym.Name();
   double Bid   = oSym.Bid();
   double Ask   = oSym.Ask();
   double point = oSym.Point();

   int tOrders = OrdersTotal();
   for(int i = tOrders - 1; i >= 0; i--)
     {
      ulong ticket = OrderGetTicket(i);
      if(ticket <= 0)
         continue;

      if(OrderGetInteger(ORDER_MAGIC) == IN_MagicNumber && OrderGetString(ORDER_SYMBOL) == pair)
        {
         long   type    = OrderGetInteger(ORDER_TYPE);
         double hargaPO = OrderGetDouble(ORDER_PRICE_OPEN);
         double sl      = OrderGetDouble(ORDER_SL);
         double tp      = OrderGetDouble(ORDER_TP);

         //--- BuyStop dikejar turun saat harga jatuh, menjaga jarak TrailingStart di atas Bid
         if(type == ORDER_TYPE_BUY_STOP)
           {
            if(hargaPO - ((IN_TrailingStart + IN_TrailingStep) * point) >= Bid)
              {
               hargaPO = Bid + (IN_TrailingStart * point);
               calcSLTP(true, hargaPO, point, sl, tp);
               if(!oTrade.OrderModify(ticket, hargaPO, sl, tp, ORDER_TIME_DAY, 0))
                  Print("Gagal Geser PO (BuyStop)");
              }
           }

         //--- SellStop dikejar naik saat harga naik, menjaga jarak TrailingStart di bawah Ask
         if(type == ORDER_TYPE_SELL_STOP)
           {
            if(hargaPO + ((IN_TrailingStart + IN_TrailingStep) * point) <= Ask)
              {
               hargaPO = Ask - (IN_TrailingStart * point);
               calcSLTP(false, hargaPO, point, sl, tp);
               if(!oTrade.OrderModify(ticket, hargaPO, sl, tp, ORDER_TIME_DAY, 0))
                  Print("Gagal Geser PO (SellStop)");
              }
           }
        }
     }
  }
//+------------------------------------------------------------------+
//| Ambil tiket posisi Buy & Sell milik EA ini                       |
//+------------------------------------------------------------------+
void getTicketBuySell(ulong &ticketBuy, ulong &ticketSell)
  {
   string pair = oSym.Name();
   ticketBuy = ticketSell = 0;

   int tPos = PositionsTotal();
   for(int i = tPos - 1; i >= 0; i--)
     {
      ulong ticket = PositionGetTicket(i);
      if(ticket <= 0)
         continue;

      if(PositionGetInteger(POSITION_MAGIC) == IN_MagicNumber && PositionGetString(POSITION_SYMBOL) == pair)
        {
         long type = PositionGetInteger(POSITION_TYPE);
         if(type == POSITION_TYPE_BUY)
            ticketBuy = ticket;
         if(type == POSITION_TYPE_SELL)
            ticketSell = ticket;
        }
     }
  }
//+------------------------------------------------------------------+
//| Ambil harga pending BuyStop & SellStop milik EA ini              |
//+------------------------------------------------------------------+
void getPricePO(double &priceBuyStop, double &priceSellStop)
  {
   string pair = oSym.Name();

   int tOrders = OrdersTotal();
   for(int i = tOrders - 1; i >= 0; i--)
     {
      ulong ticket = OrderGetTicket(i);
      if(ticket <= 0)
         continue;

      if(OrderGetInteger(ORDER_MAGIC) == IN_MagicNumber && OrderGetString(ORDER_SYMBOL) == pair)
        {
         long type = OrderGetInteger(ORDER_TYPE);
         if(type == ORDER_TYPE_BUY_STOP)
            priceBuyStop = OrderGetDouble(ORDER_PRICE_OPEN);
         if(type == ORDER_TYPE_SELL_STOP)
            priceSellStop = OrderGetDouble(ORDER_PRICE_OPEN);
        }
     }
  }
//+------------------------------------------------------------------+
