//+------------------------------------------------------------------+
//|                                           TrailingReversalPO.mq5 |
//|                                            Copyright 2026, Trexa |
//|                                                 https://Trexa.id |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Trexa"
#property link      "https://Trexa.id"
#property version   "1.20"

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

input    int      IN_MagicNumber   = 123;      //Magic Number
input    double   IN_Lot           = 0.01;     //Lot Size
input    int      IN_DistancePO    = 500;      //Jarak PO (points)
input    int      IN_TrailingStart = 300;      //Trailing Start PO (points)
input    int      IN_TrailingStep  = 10;       //Trailing Step PO (points)
input    int      IN_SL            = 0;        //Stop Loss (points, 0 = nonaktif)
input    int      IN_TP            = 0;        //Take Profit (points, 0 = nonaktif)

// Menyimpan tiket posisi "pertama" (yang akan ditutup saat terjadi reversal).
ulong runningTicket = 0;

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

//---
   return(INIT_SUCCEEDED);
  }
//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
//---

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

   ulong ticketBuy = 0, ticketSell = 0;
   getTicketBuySell(ticketBuy, ticketSell);

   double priceBuyStop = 0.0, priceSellStop = 0.0;
   getPricePO(priceBuyStop, priceSellStop);

   double sl = 0.0, tp = 0.0;

   //--- Kondisi awal: belum ada posisi & belum ada pending -> pasang straddle
   if(priceBuyStop == 0 && priceSellStop == 0 && ticketBuy == 0 && ticketSell == 0)
     {
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
   if(priceBuyStop == 0 && ticketBuy == 0)
     {
      double vol     = IN_Lot;
      double hargaPO  = oSym.Ask() + (IN_DistancePO * point);
      calcSLTP(true, hargaPO, point, sl, tp);
      oTrade.BuyStop(vol, hargaPO, pair, sl, tp, ORDER_TIME_DAY);
     }

   //--- Jika SellStop hilang & belum ada posisi Sell -> pasang ulang SellStop
   if(priceSellStop == 0 && ticketSell == 0)
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
