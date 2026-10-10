import React, { useState } from 'react';
import { TradeSignal, BotSettings } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Copy,
  Check,
  Send,
  Zap,
  Target,
  ShieldAlert,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { apiService } from '../services/api';

interface QBPlanCardProps {
  signal: TradeSignal;
  currentPrice: number;
  timeframe: '15m' | '1h' | '4h' | '1d';
  settings: BotSettings;
  onExecuteOrder: (signal: TradeSignal) => void;
  onSaveToJournal: (signal: TradeSignal) => void;
  isHistoricalPreview?: boolean;
  onResetToLive?: () => void;
  onOpenAuditModal?: () => void;
  onToggleDirection?: (dir: 'LONG' | 'SHORT') => void;
}

export const QBPlanCard: React.FC<QBPlanCardProps> = ({
  signal,
  currentPrice,
  timeframe,
  settings,
  onExecuteOrder,
  onSaveToJournal,
  isHistoricalPreview,
  onResetToLive,
  onOpenAuditModal,
  onToggleDirection,
}) => {
  const [copied, setCopied] = useState(false);
  const [sendingTelegram, setSendingTelegram] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);
  const [isExecutingOrder, setIsExecutingOrder] = useState(false);

  const handleQuickExecute = async () => {
    if (isExecutingOrder) return;
    setIsExecutingOrder(true);
    const safetyTimer = setTimeout(() => {
      setIsExecutingOrder(false);
    }, 6000);
    try {
      await onExecuteOrder(signal);
    } finally {
      clearTimeout(safetyTimer);
      setIsExecutingOrder(false);
    }
  };

  const isBuy = signal.direction === 'LONG' || (signal as any).direction === 'BUY';
  const entry = signal.entryPrice;
  const sl = signal.stopLoss;
  const tp1 = signal.tp1;
  const tp2 = signal.tp2;
  const tp3 = signal.tp3;

  // Percentage calculations
  const slDist = entry ? Math.abs(((sl - entry) / entry) * 100).toFixed(2) : '0.00';
  const tp1Dist = entry ? Math.abs(((tp1 - entry) / entry) * 100).toFixed(2) : '0.00';
  const tp2Dist = entry ? Math.abs(((tp2 - entry) / entry) * 100).toFixed(2) : '0.00';
  const tp3Dist = entry ? Math.abs(((tp3 - entry) / entry) * 100).toFixed(2) : '0.00';

  // Dynamic live outcome badge
  const getOutcomeStatus = () => {
    if (isHistoricalPreview && (signal as any).statusLabel) {
      return {
        label: (signal as any).statusLabel,
        color:
          (signal as any).status === 'TP3_HIT' || (signal as any).status === 'TP2_HIT'
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            : (signal as any).status === 'SL_HIT'
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      };
    }

    const cur = currentPrice || entry;
    if (isBuy) {
      if (cur >= tp3) return { label: 'Đã đủ TP3 · Hoàn tất', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      if (cur >= tp2) return { label: 'Đã đạt TP2', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      if (cur >= tp1) return { label: 'Đã đạt TP1', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      if (cur <= sl) return { label: 'Đã chạm SL', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      // Check if price is within entry buffer
      const distPct = Math.abs((cur - entry) / entry);
      if (distPct < 0.0025) {
        return { label: 'Khớp Entry · Đang chạy', color: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60' };
      }
      return { label: 'Chờ khớp Entry (Pending)', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    } else {
      if (cur <= tp3) return { label: 'Đã đủ TP3 · Hoàn tất', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      if (cur <= tp2) return { label: 'Đã đạt TP2', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      if (cur <= tp1) return { label: 'Đã đạt TP1', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      if (cur >= sl) return { label: 'Đã chạm SL', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      const distPct = Math.abs((cur - entry) / entry);
      if (distPct < 0.0025) {
        return { label: 'Khớp Entry · Đang chạy', color: 'bg-rose-950/60 text-rose-300 border-rose-700/60' };
      }
      return { label: 'Chờ khớp Entry (Pending)', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const outcome = getOutcomeStatus();

  const formatPrice = (p: number) => {
    if (!p) return '0.0';
    if (signal.symbol.startsWith('BTC')) return p.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleCopy = () => {
    const text = `🎯 [CRYPTOWHALE QUANT PLAN] #${signal.symbol} (${timeframe.toUpperCase()})\n⚡ HƯỚNG: ${isBuy ? 'LONG (MUA)' : 'SHORT (BÁN)'}\n📌 ENTRY: ${formatPrice(entry)}\n🛑 STOP LOSS: ${formatPrice(sl)} (-${slDist}%)\n🎯 TP1: ${formatPrice(tp1)} (+${tp1Dist}%)\n🎯 TP2: ${formatPrice(tp2)} (+${tp2Dist}%)\n🎯 TP3: ${formatPrice(tp3)} (+${tp3Dist}%)\n⚖️ Đòn bẩy: ${signal.recommendedLeverage || '10x'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendTelegram = async () => {
    setSendingTelegram(true);
    setTelegramStatus(null);
    try {
      const res = await apiService.sendTelegram({
        botToken: settings.telegramBotToken,
        chatId: settings.telegramChatId,
        message: signal.telegramAlertSummary || `Kế hoạch định lượng ${signal.symbol}`,
      });
      if (res.success) {
        setTelegramStatus(res.simulated ? 'Đã gửi mô phỏng Telegram!' : 'Đã báo Telegram thành công!');
      } else {
        setTelegramStatus(res.error || 'Lỗi gửi tin');
      }
    } catch {
      setTelegramStatus('Lỗi kết nối Telegram');
    } finally {
      setSendingTelegram(false);
      setTimeout(() => setTelegramStatus(null), 4000);
    }
  };

  return (
    <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
      {/* Direction Toggle Selector (Long / Short) */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => onToggleDirection && onToggleDirection('LONG')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
              isBuy
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>KẾ HOẠCH LONG</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleDirection && onToggleDirection('SHORT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
              !isBuy
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>KẾ HOẠCH SHORT</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border ${outcome.color}`}>
            {outcome.label}
          </span>
          <button
            onClick={handleCopy}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Sao chép nhanh thông số lệnh"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Strategy Meta strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Khung:</span>
          <span className="text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            {timeframe.toUpperCase()}
          </span>
          <span className="text-slate-400">Đòn bẩy:</span>
          <span className="text-slate-200 font-semibold">{signal.recommendedLeverage || '10x'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">R:R:</span>
          <span className="text-emerald-400 font-bold">{signal.riskRewardRatio || '1:2.6'}</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Zero-Repaint:</span>
          <span className="text-emerald-400 font-bold">100% Cố định</span>
        </div>
      </div>

      {/* Entry Price Box */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-mono text-slate-400">ĐIỂM VÀO LỆNH (ENTRY CỐ ĐỊNH)</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums mt-0.5 tracking-tight">
            ${formatPrice(entry)}
          </div>
          <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
            Vùng giải ngân: {signal.entryRange}
          </span>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono text-slate-400">Giá sàn hiện tại</div>
          <div className="text-sm font-mono font-bold text-cyan-300 tabular-nums">
            ${formatPrice(currentPrice)}
          </div>
          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
            {isBuy ? (currentPrice < entry ? 'Giá đang dưới Entry' : 'Giá đang trên Entry') : (currentPrice > entry ? 'Giá đang trên Entry' : 'Giá đang dưới Entry')}
          </span>
        </div>
      </div>

      {/* Target Levels Grid (SL, TP1, TP2, TP3) */}
      <div className="flex flex-col gap-2 font-mono">
        {/* Stop Loss */}
        <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="text-xs text-rose-400 font-bold">Stop Loss:</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-rose-300 tabular-nums">
              ${formatPrice(sl)}
            </span>
            <span className="text-xs text-rose-400 font-medium">-{slDist}%</span>
          </div>
        </div>

        {/* Take Profit 1 */}
        <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-bold">Take Profit 1 (30% Vị thế):</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-emerald-300 tabular-nums">
              ${formatPrice(tp1)}
            </span>
            <span className="text-xs text-emerald-400 font-medium">+{tp1Dist}%</span>
          </div>
        </div>

        {/* Take Profit 2 */}
        <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-bold">Take Profit 2 (40% Vị thế):</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-emerald-300 tabular-nums">
              ${formatPrice(tp2)}
            </span>
            <span className="text-xs text-emerald-400 font-medium">+{tp2Dist}%</span>
          </div>
        </div>

        {/* Take Profit 3 */}
        <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span className="text-xs text-emerald-300 font-bold">Take Profit 3 (Chốt Hết):</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-emerald-200 tabular-nums">
              ${formatPrice(tp3)}
            </span>
            <span className="text-xs text-emerald-300 font-bold">+{tp3Dist}%</span>
          </div>
        </div>
      </div>

      {/* Action Buttons: 1-Click Execution & Telegram */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="grid grid-cols-2 gap-2">
          {/* Telegram notification */}
          <button
            onClick={handleSendTelegram}
            disabled={sendingTelegram}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <Send className={`w-3.5 h-3.5 ${sendingTelegram ? 'animate-bounce' : ''}`} />
            <span>{sendingTelegram ? 'Đang gửi...' : 'Báo Telegram'}</span>
          </button>

          {/* Quick Execute */}
          <button
            onClick={handleQuickExecute}
            disabled={isExecutingOrder}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <Zap className={`w-3.5 h-3.5 ${isExecutingOrder ? 'animate-spin' : ''}`} />
            <span>{isExecutingOrder ? 'Đang gửi lệnh...' : 'Vào Lệnh Ngay'}</span>
          </button>
        </div>

        {telegramStatus && (
          <div className="text-center text-xs font-mono text-cyan-400 py-1 bg-cyan-950/30 border border-cyan-800/40 rounded-lg">
            {telegramStatus}
          </div>
        )}

        {/* 3rd-Party Quant Audit Trigger */}
        {onOpenAuditModal && (
          <button
            onClick={onOpenAuditModal}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-cyan-950/90 to-blue-950/90 hover:from-cyan-900 hover:to-blue-900 text-cyan-300 border border-cyan-700/60 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Xem Báo Cáo Thẩm Định Độc Lập Bên Thứ 3 (Quant Audit)</span>
          </button>
        )}
      </div>
    </div>
  );
};
