import React from 'react';
import { RecentSignalItem } from '../services/multiTimeframeSignals';
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Eye,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface RecentSignalsTableProps {
  signals: RecentSignalItem[];
  selectedSignalId?: string | null;
  onSelectSignal: (signal: RecentSignalItem) => void;
  onResetToLive: () => void;
  isHistoricalPreviewActive: boolean;
  timeframe: string;
}

export const RecentSignalsTable: React.FC<RecentSignalsTableProps> = ({
  signals,
  selectedSignalId,
  onSelectSignal,
  onResetToLive,
  isHistoricalPreviewActive,
  timeframe,
}) => {
  const formatPrice = (p: number, symbol: string) => {
    if (!p) return '0.0';
    if (symbol.startsWith('BTC')) return p.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getStatusBadge = (status: RecentSignalItem['status'], label: string) => {
    switch (status) {
      case 'TP3_HIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>{label}</span>
          </span>
        );
      case 'TP2_HIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <span>{label}</span>
          </span>
        );
      case 'TP1_HIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <span>{label}</span>
          </span>
        );
      case 'SL_HIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <span>{label}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>{label}</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white font-mono tracking-tight uppercase">
              TÍN HIỆU GẦN ĐÂY
            </span>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
              Khung {timeframe.toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-slate-400 block mt-0.5">
            Bấm chọn dòng bất kỳ để xem lại đường Entry, SL, TP trực tiếp trên biểu đồ
          </span>
        </div>

        {isHistoricalPreviewActive && (
          <button
            onClick={onResetToLive}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shadow-md"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Quay lại tín hiệu mới nhất</span>
          </button>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Thời điểm (UTC+7)</th>
              <th className="py-2.5 px-3">Tín hiệu</th>
              <th className="py-2.5 px-3">Entry</th>
              <th className="py-2.5 px-3">Stop Loss</th>
              <th className="py-2.5 px-3">TP1</th>
              <th className="py-2.5 px-3">TP2</th>
              <th className="py-2.5 px-3">TP3</th>
              <th className="py-2.5 px-3">Kết quả</th>
              <th className="py-2.5 px-3 text-right">Xem chart</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {signals.map((sig) => {
              const isSelected = selectedSignalId === sig.id;
              const isBuy = sig.direction === 'BUY';

              return (
                <tr
                  key={sig.id}
                  onClick={() => onSelectSignal(sig)}
                  className={`transition-colors cursor-pointer group ${
                    isSelected
                      ? 'bg-cyan-950/40 text-white font-semibold'
                      : 'hover:bg-slate-900/60 text-slate-300'
                  }`}
                >
                  {/* Timestamp */}
                  <td className="py-3 px-3 tabular-nums text-slate-400 group-hover:text-slate-200">
                    {sig.timeStr}
                  </td>

                  {/* Direction Badge */}
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                        isBuy
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {isBuy ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{sig.direction}</span>
                    </span>
                  </td>

                  {/* Entry */}
                  <td className="py-3 px-3 font-bold text-white tabular-nums">
                    {formatPrice(sig.entryPrice, sig.symbol)}
                  </td>

                  {/* Stop Loss */}
                  <td className="py-3 px-3 text-rose-400 tabular-nums">
                    {formatPrice(sig.stopLoss, sig.symbol)}
                  </td>

                  {/* TP1 */}
                  <td className="py-3 px-3 text-emerald-400 tabular-nums">
                    {formatPrice(sig.tp1, sig.symbol)}
                  </td>

                  {/* TP2 */}
                  <td className="py-3 px-3 text-emerald-400 tabular-nums">
                    {formatPrice(sig.tp2, sig.symbol)}
                  </td>

                  {/* TP3 */}
                  <td className="py-3 px-3 text-emerald-300 font-bold tabular-nums">
                    {formatPrice(sig.tp3, sig.symbol)}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3">
                    {getStatusBadge(sig.status, sig.statusLabel)}
                  </td>

                  {/* Action Icon */}
                  <td className="py-3 px-3 text-right">
                    <button
                      className={`p-1.5 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-cyan-500 text-white border-cyan-400'
                          : 'bg-slate-900 border-slate-700 text-slate-400 group-hover:text-white group-hover:border-slate-500'
                      }`}
                      title="Hiển thị đường gióng lên biểu đồ"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden flex flex-col gap-2.5">
        {signals.map((sig) => {
          const isSelected = selectedSignalId === sig.id;
          const isBuy = sig.direction === 'BUY';

          return (
            <div
              key={sig.id}
              onClick={() => onSelectSignal(sig)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2.5 font-mono ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Row 1: Time, Direction, Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                      isBuy
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {isBuy ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{sig.direction}</span>
                  </span>
                  <span className="text-xs text-slate-400 tabular-nums">{sig.timeStr}</span>
                </div>

                <div>{getStatusBadge(sig.status, sig.statusLabel)}</div>
              </div>

              {/* Row 2: Price Metrics */}
              <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-800/60">
                <div>
                  <span className="text-slate-500 block text-[10px]">ENTRY</span>
                  <span className="text-white font-bold tabular-nums">
                    {formatPrice(sig.entryPrice, sig.symbol)}
                  </span>
                </div>
                <div>
                  <span className="text-rose-500 block text-[10px]">STOP LOSS</span>
                  <span className="text-rose-400 font-bold tabular-nums">
                    {formatPrice(sig.stopLoss, sig.symbol)}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-500 block text-[10px]">TP3 (MAX)</span>
                  <span className="text-emerald-300 font-bold tabular-nums">
                    {formatPrice(sig.tp3, sig.symbol)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
