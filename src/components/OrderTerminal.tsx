import React, { useState, useEffect } from 'react';
import { CryptoSymbol, TradeSignal, BotSettings, ExecutedTrade } from '../types';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Shield,
  Sliders,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Lock,
  Calculator,
  Percent,
  RotateCcw,
} from 'lucide-react';
import { apiService } from '../services/api';
import { exchangeConnector } from '../services/exchangeConnector';

interface OrderTerminalProps {
  symbol: CryptoSymbol;
  currentPrice: number;
  activeSignal?: TradeSignal | null;
  settings: BotSettings;
  portfolioBalance: number;
  realBinanceBalance?: number | null;
  onRefreshBinanceBalance?: () => void;
  onTradeExecuted: (trade: ExecutedTrade) => void;
  onEmergencyKillSwitch?: () => void;
  externalPlan?: {
    side: 'BUY' | 'SELL';
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    amountUsdt?: number;
    leverage?: number;
  } | null;
}

export const OrderTerminal: React.FC<OrderTerminalProps> = ({
  symbol,
  currentPrice,
  activeSignal,
  settings,
  portfolioBalance,
  realBinanceBalance,
  onRefreshBinanceBalance,
  onTradeExecuted,
  onEmergencyKillSwitch,
  externalPlan,
}) => {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [marginType, setMarginType] = useState<'ISOLATED' | 'CROSS'>('ISOLATED');
  const [leverage, setLeverage] = useState<number>(settings.defaultLeverage || 10);
  const isBinanceLive = settings.exchange === 'BINANCE';
  const effectiveWalletBalance = isBinanceLive && realBinanceBalance !== undefined && realBinanceBalance !== null
    ? realBinanceBalance
    : portfolioBalance;

  const [amountUsdt, setAmountUsdt] = useState<number>(() => {
    return isBinanceLive && effectiveWalletBalance < 500 ? Math.max(10, Math.floor(effectiveWalletBalance * 0.25)) : 250;
  });
  const [limitPrice, setLimitPrice] = useState<number>(currentPrice);
  const [stopLoss, setStopLoss] = useState<number>(
    activeSignal?.stopLoss || (side === 'BUY' ? currentPrice * 0.982 : currentPrice * 1.018)
  );
  const [takeProfit, setTakeProfit] = useState<number>(
    activeSignal?.tp1 || (side === 'BUY' ? currentPrice * 1.035 : currentPrice * 0.965)
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastOrderFeedback, setLastOrderFeedback] = useState<string | null>(null);

  // Sync external plan from AI Copilot or QB plan card
  useEffect(() => {
    if (externalPlan) {
      setSide(externalPlan.side);
      if (externalPlan.entryPrice) setLimitPrice(externalPlan.entryPrice);
      if (externalPlan.stopLoss) setStopLoss(externalPlan.stopLoss);
      if (externalPlan.takeProfit) setTakeProfit(externalPlan.takeProfit);
      if (externalPlan.amountUsdt) setAmountUsdt(externalPlan.amountUsdt);
      if (externalPlan.leverage) setLeverage(externalPlan.leverage);
    }
  }, [externalPlan]);

  // Sync SL/TP when active signal changes
  useEffect(() => {
    if (activeSignal && !externalPlan) {
      const isSignalBuy = activeSignal.direction === 'LONG' || (activeSignal as any).direction === 'BUY';
      setSide(isSignalBuy ? 'BUY' : 'SELL');
      setStopLoss(activeSignal.stopLoss);
      setTakeProfit(activeSignal.tp1);
    }
  }, [activeSignal, externalPlan]);

  const targetPrice = orderType === 'MARKET' ? currentPrice : limitPrice;
  const isBuy = side === 'BUY';

  // Precision quantity and notional calculation using exchangeConnector
  const symbolRule = exchangeConnector.getSymbolRule(symbol);
  const rawTargetQty = targetPrice > 0 ? (amountUsdt * leverage) / targetPrice : 0;
  const qtyCalc = exchangeConnector.formatQuantity(symbol, rawTargetQty, targetPrice);
  const positionSize = qtyCalc.notional.toFixed(2);

  // Risk metrics
  const slDistance = Math.abs(targetPrice - stopLoss);
  const tpDistance = Math.abs(takeProfit - targetPrice);
  const maxLossUsdt = targetPrice > 0 ? (amountUsdt * leverage) * (slDistance / targetPrice) : 0;
  const maxProfitUsdt = targetPrice > 0 ? (amountUsdt * leverage) * (tpDistance / targetPrice) : 0;
  const calculatedRR = slDistance > 0 ? (tpDistance / slDistance).toFixed(1) : '1.0';

  // Risk % Presets
  const handleApplyRiskPreset = (percent: number) => {
    const calculated = Math.max(20, Math.round((portfolioBalance * (percent / 100))));
    setAmountUsdt(calculated);
  };

  // TP R:R Presets (1:1.5, 1:2, 1:3)
  const handleApplyRRTP = (ratio: number) => {
    const slDist = Math.abs(targetPrice - stopLoss);
    const tpDist = slDist * ratio;
    const newTP = isBuy ? targetPrice + tpDist : targetPrice - tpDist;
    setTakeProfit(Math.round(newTP * 100) / 100);
  };

  // SL % Presets (-1%, -1.5%, -2%)
  const handleApplySLPercent = (pct: number) => {
    const mult = isBuy ? 1 - pct / 100 : 1 + pct / 100;
    const newSL = targetPrice * mult;
    setStopLoss(Math.round(newSL * 100) / 100);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountUsdt > effectiveWalletBalance) {
      if (isBinanceLive) {
        setLastOrderFeedback(`⚠️ Số dư khả dụng trên ví Binance Futures của bạn chỉ có $${effectiveWalletBalance.toFixed(2)} USDT. Vui lòng giảm mức ký quỹ vốn xuống dưới $${effectiveWalletBalance.toFixed(2)} USDT!`);
      } else {
        setLastOrderFeedback('Số dư tài khoản giả lập không đủ!');
      }
      setTimeout(() => setLastOrderFeedback(null), 5000);
      return;
    }

    if (settings.exchange === 'BINANCE' && (!settings.apiKey || !settings.apiSecret)) {
      setLastOrderFeedback('⚠️ Bạn đã chọn sàn Binance nhưng chưa cài API Key! Vui lòng vào mục Cài Đặt (góc phải trên) để dán API Key & Secret.');
      setTimeout(() => setLastOrderFeedback(null), 6000);
      return;
    }

    if (!qtyCalc.isValid) {
      setLastOrderFeedback(`❌ ${qtyCalc.errorReason || 'Khối lượng lệnh chưa thỏa mãn minNotional 5 USDT.'}`);
      setTimeout(() => setLastOrderFeedback(null), 5000);
      return;
    }

    setIsSubmitting(true);
    setLastOrderFeedback(null);

    // Guaranteed safety timeout: Never leave the button stuck in "Đang gửi lệnh"
    const safetyTimer = setTimeout(() => {
      setIsSubmitting(false);
      setLastOrderFeedback('⚠️ Hết thời gian chờ phản hồi từ sàn. Vui lòng kiểm tra lại trạng thái lệnh.');
    }, 8500);

    try {
      const res = await apiService.executeOrder({
        exchange: settings.exchange || 'PAPER',
        symbol,
        side,
        type: orderType,
        price: targetPrice,
        amount: amountUsdt,
        leverage,
        marginType,
        stopLoss,
        takeProfit,
        maxSlippagePercent: settings.maxSlippagePercent || 0.25,
        isTestnet: Boolean((settings as any).isTestnet),
        apiKey: settings.apiKey,
        apiSecret: settings.apiSecret,
        telegramBotToken: settings.autoSendTelegram ? settings.telegramBotToken : undefined,
        telegramChatId: settings.autoSendTelegram ? settings.telegramChatId : undefined,
      });

      clearTimeout(safetyTimer);

      if (!res.success) {
        setLastOrderFeedback(`❌ Sàn từ chối lệnh: ${res.error || 'Lỗi không xác định'} ${res.hint ? `(${res.hint})` : ''}`);
        return;
      }

      if (res.success && res.order) {
        const newTrade: ExecutedTrade = {
          id: res.order.orderId || `ORD-${Date.now()}`,
          symbol,
          side,
          type: orderType,
          entryPrice: res.order.executedPrice || targetPrice,
          amountUsdt,
          leverage,
          stopLoss,
          takeProfit,
          pnlUsdt: 0,
          pnlPercent: 0,
          status: 'OPEN',
          openedAt: Date.now(),
          strategyName: activeSignal?.proTraderStyle || 'SMC + Wyckoff Quick Terminal Order',
          exchange: settings.exchange,
          timeframe: activeSignal?.timeframe ? (activeSignal.timeframe.toLowerCase() as any) : '15m',
        };

        onTradeExecuted(newTrade);
        setLastOrderFeedback(
          res.isRealBinanceOrder
            ? `⚡ Đã gửi lệnh thật lên sàn BINANCE FUTURES! Mã: #${res.order.orderId} (${side} ${symbol} @ $${(res.order.executedPrice || targetPrice).toLocaleString()})`
            : `✅ Đã khớp lệnh ${side} #${symbol} (${settings.exchange || 'PAPER'}) tại $${(res.order.executedPrice || targetPrice).toLocaleString()}!`
        );
      }
    } catch (err: any) {
      clearTimeout(safetyTimer);
      setLastOrderFeedback(`Lỗi đặt lệnh: ${err.message}`);
    } finally {
      clearTimeout(safetyTimer);
      setIsSubmitting(false);
      setTimeout(() => setLastOrderFeedback(null), 5000);
    }
  };

  return (
    <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
      {/* Terminal Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
            Cửa Sổ Đặt Lệnh (Quick Execution)
          </h3>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span className="text-slate-400">{isBinanceLive ? 'Ví Binance:' : 'Ví Giả Lập:'}</span>
          <span className={`font-bold tabular-nums ${isBinanceLive ? 'text-amber-400' : 'text-emerald-400'}`}>
            ${effectiveWalletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
          </span>
          {isBinanceLive && onRefreshBinanceBalance && (
            <button
              type="button"
              onClick={() => onRefreshBinanceBalance()}
              title="Cập nhật số dư ví Binance Futures từ sàn"
              className="p-1 hover:bg-slate-800 text-cyan-400 rounded transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Exchange Connector Badge */}
      <div className="flex items-center justify-between text-xs font-mono bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
        <span className="text-slate-400">Kênh Giao Dịch:</span>
        <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isBinanceLive ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
          {isBinanceLive ? 'BINANCE FUTURES (TIỀN THẬT)' : 'PAPER TRADING (MÔ PHỎNG ẢO)'}
        </span>
      </div>

      <form onSubmit={handleSubmitOrder} className="flex flex-col gap-3.5">
        {/* Buy / Sell Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setSide('BUY');
              setStopLoss(Math.round(currentPrice * 0.985 * 100) / 100);
              setTakeProfit(Math.round(currentPrice * 1.04 * 100) / 100);
            }}
            className={`py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              isBuy
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>MUA / LONG</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSide('SELL');
              setStopLoss(Math.round(currentPrice * 1.015 * 100) / 100);
              setTakeProfit(Math.round(currentPrice * 0.96 * 100) / 100);
            }}
            className={`py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              !isBuy
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>BÁN / SHORT</span>
          </button>
        </div>

        {/* Order Type: Market / Limit */}
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Khớp Lệnh:</span>
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setOrderType('MARKET')}
              className={`px-3 py-1 rounded text-[11px] font-semibold transition-colors ${
                orderType === 'MARKET' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Market (Thị Trường)
            </button>
            <button
              type="button"
              onClick={() => setOrderType('LIMIT')}
              className={`px-3 py-1 rounded text-[11px] font-semibold transition-colors ${
                orderType === 'LIMIT' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Limit (Chờ)
            </button>
          </div>
        </div>

        {/* Limit Price Input if Limit */}
        {orderType === 'LIMIT' && (
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400 font-mono">Giá Đặt Limit (USDT):</label>
            <input
              type="number"
              step="any"
              value={limitPrice}
              onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
        )}

        {/* Amount Input with Risk Presets */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1 font-semibold text-slate-300">
              <span>Ký Quỹ Vốn (Margin):</span>
            </span>
            {/* 1-Tap Risk % Presets */}
            <div className="flex items-center gap-1">
              {[
                { pct: 1, label: '1%' },
                { pct: 2, label: '2%' },
                { pct: 5, label: '5%' },
                { pct: 10, label: '10%' },
                { pct: 25, label: '25%' },
                { pct: 50, label: '50%' },
                { pct: 100, label: '100%' },
              ].map((p) => (
                <button
                  key={p.pct}
                  type="button"
                  onClick={() => handleApplyRiskPreset(p.pct)}
                  className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-cyan-300 hover:border-slate-700 font-mono transition-colors"
                  title={`Ký quỹ ${p.pct}% số dư`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <input
              type="number"
              min="10"
              max={portfolioBalance}
              value={amountUsdt}
              onChange={(e) => setAmountUsdt(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-3 pr-14 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
            <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-mono">USDT</span>
          </div>
        </div>

        {/* Margin Mode & Leverage Control */}
        <div className="flex flex-col gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400 font-semibold">Chế Độ Ký Quỹ & Đòn Bẩy:</span>
            {/* Isolated vs Cross Selector */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setMarginType('ISOLATED')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                  marginType === 'ISOLATED'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Cô lập rủi ro trong số tiền ký quỹ của lệnh này"
              >
                Isolated (Cô lập)
              </button>
              <button
                type="button"
                onClick={() => setMarginType('CROSS')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                  marginType === 'CROSS'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Dùng toàn bộ số dư tài khoản để chia sẻ rủi ro thanh lý"
              >
                Cross (Toàn phần)
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono pt-1">
            <span className="text-slate-400">Đòn Bẩy:</span>
            <span className="text-cyan-400 font-bold">{leverage}x {marginType === 'ISOLATED' ? 'Isolated' : 'Cross'}</span>
          </div>

          {/* Quick Leverage Selectors */}
          <div className="grid grid-cols-5 gap-1">
            {[2, 5, 10, 20, 50].map((lev) => (
              <button
                key={lev}
                type="button"
                onClick={() => setLeverage(lev)}
                className={`py-1 rounded text-[10px] font-mono font-bold transition-all ${
                  leverage === lev
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {lev}x
              </button>
            ))}
          </div>

          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={leverage}
            onChange={(e) => setLeverage(parseInt(e.target.value, 10))}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>1x</span>
            <span>10x</span>
            <span>25x</span>
            <span>50x</span>
          </div>
        </div>

        {/* Stop Loss & Take Profit Bracket inputs */}
        <div className="grid grid-cols-2 gap-2">
          {/* SL */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] text-rose-400 font-mono">
              <span>Stop Loss:</span>
              <div className="flex gap-1">
                {[1, 1.5, 2].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleApplySLPercent(pct)}
                    className="text-[9px] text-rose-400/80 hover:text-rose-300 underline font-mono"
                  >
                    -{pct}%
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              step="any"
              value={stopLoss}
              onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
              className="bg-slate-900 border border-rose-900/40 rounded-lg px-2.5 py-1.5 text-xs text-rose-300 font-mono focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* TP */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] text-emerald-400 font-mono">
              <span>Take Profit:</span>
              <div className="flex gap-1">
                {[
                  { r: 1.5, label: '1:1.5' },
                  { r: 2.0, label: '1:2' },
                  { r: 3.0, label: '1:3' },
                ].map((rr) => (
                  <button
                    key={rr.r}
                    type="button"
                    onClick={() => handleApplyRRTP(rr.r)}
                    className="text-[9px] text-emerald-400/80 hover:text-emerald-300 underline font-mono"
                  >
                    {rr.label}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              step="any"
              value={takeProfit}
              onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
              className="bg-slate-900 border border-emerald-900/40 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Position Size & Risk-Reward Summary */}
        <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] font-mono flex flex-col gap-1.5 text-slate-400">
          <div className="flex items-center justify-between text-slate-300">
            <span>Tiền Ký Quỹ (Margin):</span>
            <span className="text-cyan-400 font-bold tabular-nums">
              ${amountUsdt} USDT ({((amountUsdt / (portfolioBalance || 1)) * 100).toFixed(1)}% vốn)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Chế Độ & Đòn Bẩy:</span>
            <span className="text-white font-semibold">
              {marginType === 'ISOLATED' ? 'Isolated (Cô lập)' : 'Cross (Toàn phần)'} · {leverage}x
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5">
            <span>Khối Lượng Quy Đổi:</span>
            <span className="text-amber-300 font-bold tabular-nums">
              {qtyCalc.formattedQty} {symbol.replace('USDT', '')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Tổng Giá Trị Vị Thế (Notional):</span>
            <span className="text-white font-bold tabular-nums">${positionSize} USDT</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-800/80 text-[10px]">
            <div className="flex items-center justify-between bg-rose-950/30 px-2 py-1 rounded border border-rose-900/40">
              <span className="text-rose-400">Rủi Ro (Max Loss):</span>
              <span className="text-rose-300 font-bold tabular-nums">-${maxLossUsdt.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900/40">
              <span className="text-emerald-400">Mục Tiêu (TP):</span>
              <span className="text-emerald-300 font-bold tabular-nums">+${maxProfitUsdt.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] pt-1">
            <span>Tỷ Lệ Risk / Reward (R:R):</span>
            <span className="text-cyan-300 font-bold tabular-nums">1 : {calculatedRR}</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span>Giới Hạn Trượt Giá (Slippage):</span>
            <span className="text-slate-300 font-semibold tabular-nums">≤ {settings.maxSlippagePercent || 0.25}%</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span>Tự Động Dời Về Hòa Vốn (BE):</span>
            <span className={`font-semibold ${settings.autoMoveBreakeven ? 'text-emerald-400' : 'text-slate-500'}`}>
              {settings.autoMoveBreakeven ? 'BẬT (Khóa Lãi TP1)' : 'TẮT'}
            </span>
          </div>
        </div>

        {/* Submit Execution Button (Optimized for iPhone 15 Touch Target) */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full min-h-[46px] py-3 rounded-xl font-mono text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98] ${
            isBuy
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
          } disabled:opacity-60 cursor-pointer`}
        >
          <Zap className="w-4 h-4" />
          <span>
            {isSubmitting
              ? 'Đang gửi lệnh sàn...'
              : `Xác Nhận Đặt Lệnh ${isBuy ? 'LONG' : 'SHORT'} ${symbol}`}
        </button>

        {onEmergencyKillSwitch && (
          <button
            type="button"
            onClick={onEmergencyKillSwitch}
            className="w-full py-1.5 rounded-lg font-mono text-[11px] font-bold text-rose-400 bg-rose-950/20 border border-rose-900/40 hover:bg-rose-900/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Nút Khẩn Cấp: Đóng Tất Cả Vị Thế Ngay Lập Tức</span>
          </button>
        )}

        {lastOrderFeedback && (
          <div className="text-center text-xs font-mono text-cyan-400 animate-fadeIn bg-cyan-950/40 border border-cyan-800/40 p-2 rounded-xl">
            {lastOrderFeedback}
          </div>
        )}
      </form>
    </div>
  );
};
