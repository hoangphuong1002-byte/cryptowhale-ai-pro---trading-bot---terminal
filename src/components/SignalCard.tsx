import React, { useState, useMemo } from 'react';
import { TradeSignal, BotSettings } from '../types';
import {
  Send,
  Zap,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  Copy,
  Check,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { apiService } from '../services/api';

interface SignalCardProps {
  signal: TradeSignal;
  settings: BotSettings;
  currentPrice?: number;
  onExecuteOrder: (signal: TradeSignal) => void;
  onSaveToJournal: (signal: TradeSignal) => void;
}

export const SignalCard: React.FC<SignalCardProps> = ({
  signal,
  settings,
  currentPrice,
  onExecuteOrder,
  onSaveToJournal,
}) => {
  const [copied, setCopied] = useState(false);
  const [sendingTelegram, setSendingTelegram] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);

  const isLong = signal.direction === 'LONG' || (signal as any).direction === 'BUY';

  // Distance percentages
  const entry = signal.entryPrice;
  const slDist = Math.abs(((signal.stopLoss - entry) / entry) * 100).toFixed(2);
  const tp1Dist = Math.abs(((signal.tp1 - entry) / entry) * 100).toFixed(2);
  const tp2Dist = Math.abs(((signal.tp2 - entry) / entry) * 100).toFixed(2);
  const tp3Dist = Math.abs(((signal.tp3 - entry) / entry) * 100).toFixed(2);

  // Dynamic QB-Style Outcome Status
  const outcomeStatus = useMemo(() => {
    const cur = currentPrice || entry;
    if (isLong) {
      if (cur >= signal.tp3) return { label: 'Đã đủ TP3 · Hoàn tất', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      if (cur >= signal.tp2) return { label: 'Đã đạt TP2', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      if (cur >= signal.tp1) return { label: 'Đã đạt TP1', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      if (cur <= signal.stopLoss) return { label: 'Đã chạm SL', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      return { label: 'Đang theo dõi · Entry Hit', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    } else {
      if (cur <= signal.tp3) return { label: 'Đã đủ TP3 · Hoàn tất', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      if (cur <= signal.tp2) return { label: 'Đã đạt TP2', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      if (cur <= signal.tp1) return { label: 'Đã đạt TP1', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      if (cur >= signal.stopLoss) return { label: 'Đã chạm SL', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      return { label: 'Đang theo dõi · Entry Hit', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  }, [currentPrice, entry, isLong, signal.tp1, signal.tp2, signal.tp3, signal.stopLoss]);

  const handleCopy = () => {
    navigator.clipboard.writeText(signal.telegramAlertSummary);
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
        message: signal.telegramAlertSummary,
      });

      if (res.success) {
        setTelegramStatus(res.simulated ? 'Đã gửi mô phỏng Telegram!' : 'Đã gửi qua Bot Telegram thật thành công!');
      } else {
        setTelegramStatus(res.error || 'Lỗi gửi tin nhắn');
      }
    } catch (e: any) {
      setTelegramStatus(e.message || 'Lỗi kết nối Telegram');
    } finally {
      setSendingTelegram(false);
      setTimeout(() => setTelegramStatus(null), 4000);
    }
  };

  return (
    <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4 relative overflow-hidden">
      {/* Glow accent depending on direction */}
      <div
        className={`absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-20 ${
          isLong ? 'bg-emerald-500' : 'bg-rose-500'
        }`}
      />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 ${
              isLong
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}
          >
            {isLong ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{signal.direction}</span>
          </div>

          <div>
            <span className="text-base font-bold font-mono text-white tracking-tight">{signal.symbol}</span>
            <span className="text-xs text-slate-400 ml-2 font-mono">{signal.timeframe}</span>
            <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${outcomeStatus.color}`}>
              {outcomeStatus.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-cyan-300">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Độ tin cậy: {signal.confidenceScore}%</span>
          </div>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Sao chép nội dung tín hiệu"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Primary Key Metric Grid (Entry, SL, TP1, TP2, TP3) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Entry */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-2.5 flex flex-col">
          <span className="text-[11px] text-slate-400 font-mono">ĐIỂM VÀO (ENTRY)</span>
          <span className="text-base font-bold font-mono text-white tabular-nums mt-0.5">
            ${signal.entryPrice.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
            Vùng: {signal.entryRange}
          </span>
        </div>

        {/* Stop Loss */}
        <div className="bg-rose-950/20 border border-rose-900/40 rounded-lg p-2.5 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-rose-400 font-mono">STOP LOSS (SL)</span>
            <span className="text-[10px] font-mono text-rose-400">-{slDist}%</span>
          </div>
          <span className="text-base font-bold font-mono text-rose-300 tabular-nums mt-0.5">
            ${signal.stopLoss.toLocaleString()}
          </span>
          <span className="text-[10px] text-rose-400/80 font-mono mt-0.5">Invalidation Point</span>
        </div>

        {/* TP1 & TP2 */}
        <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-2.5 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-emerald-400 font-mono">TARGET (TP1 & TP2)</span>
            <span className="text-[10px] font-mono text-emerald-400">+{tp1Dist}% / +{tp2Dist}%</span>
          </div>
          <span className="text-base font-bold font-mono text-emerald-300 tabular-nums mt-0.5">
            ${signal.tp1.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-400/80 font-mono mt-0.5">
            TP2: ${signal.tp2.toLocaleString()}
          </span>
        </div>

        {/* Risk / Reward & Leverage */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-2.5 flex flex-col">
          <span className="text-[11px] text-slate-400 font-mono">TỶ LỆ R:R / ĐÒN BẨY</span>
          <span className="text-base font-bold font-mono text-cyan-300 tabular-nums mt-0.5">
            {signal.riskRewardRatio}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
            Khuyên dùng: {signal.recommendedLeverage}
          </span>
        </div>
      </div>

      {/* TP3 Runner target */}
      <div className="bg-slate-900/50 border border-slate-800/60 rounded-lg px-3 py-2 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">Mục tiêu mở rộng TP3 (Moonbag Runner):</span>
          <span className="text-emerald-300 font-bold tabular-nums">${signal.tp3.toLocaleString()}</span>
        </div>
        <span className="text-emerald-400 text-[11px]">+{tp3Dist}%</span>
      </div>

      {/* Institutional Strategy & Pro Trader Rationale */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-lg p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>Chiến Lược & Triết Lý Pro Trader:</span>
          <span className="text-amber-300 font-mono text-[11px]">{signal.proTraderStyle}</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">{signal.strategyRationale}</p>

        {signal.whaleActivityCorrelation && (
          <div className="flex items-start gap-2 pt-2 border-t border-slate-800/40 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-cyan-300">Tương quan ví cá voi:</strong> {signal.whaleActivityCorrelation}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          {/* Send to Telegram Button */}
          <button
            onClick={handleSendTelegram}
            disabled={sendingTelegram}
            className="flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Send className={`w-3.5 h-3.5 ${sendingTelegram ? 'animate-bounce' : ''}`} />
            <span>{sendingTelegram ? 'Đang gửi...' : 'Báo Telegram Ngay'}</span>
          </button>

          {/* Auto-execute order on exchange */}
          <button
            onClick={() => onExecuteOrder(signal)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Tự Động Đặt Lệnh</span>
          </button>

          {/* Save to trade journal */}
          <button
            onClick={() => onSaveToJournal(signal)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700/80 transition-colors"
          >
            <span>Lưu Nhật Ký</span>
          </button>
        </div>

        {telegramStatus && (
          <span className="text-xs font-mono text-cyan-400 animate-fadeIn">{telegramStatus}</span>
        )}
      </div>
    </div>
  );
};
