import React, { useState, useEffect } from 'react';
import { EconomicEvent } from '../types';
import {
  Calendar,
  Clock,
  CheckCircle,
  ShieldAlert,
  AlertTriangle,
  ChevronRight,
  X,
  TrendingUp,
  Info,
} from 'lucide-react';
import {
  generateLiveMacroCalendar,
  formatRemainingTime,
  getRiskStatus,
  MacroEventDetail,
} from '../services/macroCalendar';

interface MacroNewsBannerProps {
  events?: EconomicEvent[];
  macroProtectionEnabled: boolean;
  onToggleProtection: () => void;
}

export const MacroNewsBanner: React.FC<MacroNewsBannerProps> = ({
  macroProtectionEnabled,
  onToggleProtection,
}) => {
  const [macroEvents, setMacroEvents] = useState<MacroEventDetail[]>(() => generateLiveMacroCalendar());
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Dynamic live countdown tick every 10 seconds
  useEffect(() => {
    const updateCountdown = () => {
      setMacroEvents((prev) =>
        prev.map((e) => ({
          ...e,
          timeRemainingStr: formatRemainingTime(e.scheduledTime),
          tradingRiskStatus: getRiskStatus(e.scheduledTime),
        }))
      );
    };

    const interval = setInterval(updateCountdown, 10000);
    return () => clearInterval(interval);
  }, []);

  const nextHighImpact = macroEvents.find((e) => e.impact === 'HIGH') || macroEvents[0];
  if (!nextHighImpact) return null;

  const isDanger = nextHighImpact.tradingRiskStatus === 'PAUSE_RECOMMENDED';
  const isCaution = nextHighImpact.tradingRiskStatus === 'CAUTION';

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          COMPACT MACRO BANNER
      ───────────────────────────────────────────────────────────── */}
      <div
        className={`bg-[#0b101b] border rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs transition-all ${
          isDanger
            ? 'border-rose-500/70 bg-rose-950/20'
            : isCaution
            ? 'border-amber-500/60 bg-amber-950/15'
            : 'border-slate-800/80 hover:border-slate-700'
        }`}
      >
        <div
          onClick={() => setShowDetailModal(true)}
          className="flex items-center gap-3 cursor-pointer group flex-1 min-w-[260px]"
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
              isDanger
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 animate-pulse'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
            }`}
          >
            <Calendar className="w-4 h-4" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`font-mono font-bold text-[11px] px-1.5 py-0.2 rounded border ${
                  isDanger
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                LỊCH VĨ MÔ
              </span>
              <span className="text-white font-medium group-hover:text-cyan-300 transition-colors">
                {nextHighImpact.name}
              </span>
              <span className="text-[10px] text-slate-500 hidden sm:inline">
                (Bấm để xem 6 tin tuần này)
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-0.5 flex-wrap">
              <span className="flex items-center gap-1 text-cyan-300 font-bold">
                <Clock className="w-3 h-3 text-cyan-400" /> Còn {nextHighImpact.timeRemainingStr}
              </span>
              <span>
                Dự báo: <strong className="text-slate-200">{nextHighImpact.forecast}</strong>
              </span>
              <span>
                Kỳ trước: <strong className="text-slate-400">{nextHighImpact.previous}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Protection Toggle & View All Button */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setShowDetailModal(true)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-mono text-[11px] flex items-center gap-1 transition-colors"
          >
            <span>Chi tiết</span>
            <ChevronRight className="w-3 h-3" />
          </button>

          <button
            onClick={onToggleProtection}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono text-[11px] font-semibold border transition-all ${
              macroProtectionEnabled
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Tự động tạm dừng mở lệnh trước và sau giờ ra tin 30 phút để chống quét râu nến hai đầu"
          >
            {macroProtectionEnabled ? (
              <CheckCircle className="w-3 h-3 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-3 h-3 text-slate-500" />
            )}
            <span>Macro Guard: {macroProtectionEnabled ? 'BẬT' : 'TẮT'}</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          DETAILED MACRO ECONOMIC CALENDAR MODAL
      ───────────────────────────────────────────────────────────── */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-[#0b101b] border border-cyan-800/60 w-full max-w-2xl rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-left max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">
                    Lịch Sự Kiện Kinh Tế & Vĩ Mô Toàn Cầu
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Tự động cập nhật thời gian thực · Cảnh báo rủi ro biến động giật râu
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Guard Info Notice */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5 text-xs">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-slate-300 leading-relaxed font-sans">
                Chế độ <strong>Macro Guard (Bảo vệ tin tức)</strong> đang{' '}
                <strong className={macroProtectionEnabled ? 'text-emerald-400' : 'text-rose-400'}>
                  {macroProtectionEnabled ? 'KÍCH HOẠT' : 'ĐANG TẮT'}
                </strong>
                . Khi bật, bot sẽ tự động không vào lệnh mới trước 30 phút và sau 15 phút quanh thời điểm ra các tin đỏ (High Impact) để bảo toàn vốn cho trader.
              </div>
            </div>

            {/* Event List */}
            <div className="flex flex-col gap-2.5">
              {macroEvents.map((evt) => {
                const isEvtDanger = evt.tradingRiskStatus === 'PAUSE_RECOMMENDED';
                const isEvtCaution = evt.tradingRiskStatus === 'CAUTION';

                return (
                  <div
                    key={evt.id}
                    className={`bg-slate-900/60 border rounded-xl p-3.5 flex flex-col gap-2 transition-all ${
                      isEvtDanger
                        ? 'border-rose-500/50 bg-rose-950/15'
                        : isEvtCaution
                        ? 'border-amber-500/40'
                        : 'border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border ${
                              evt.impact === 'HIGH'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            {evt.impact === 'HIGH' ? '🔴 HIGH IMPACT' : '🟠 MEDIUM'}
                          </span>
                          <span className="text-sm font-bold text-white font-mono">
                            {evt.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 font-sans">{evt.description}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs font-mono font-bold block ${
                            isEvtDanger
                              ? 'text-rose-400 animate-pulse'
                              : isEvtCaution
                              ? 'text-amber-400'
                              : 'text-cyan-400'
                          }`}
                        >
                          {evt.timeRemainingStr === 'Đang diễn ra' ? 'Đang diễn ra' : `Còn ${evt.timeRemainingStr}`}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(evt.scheduledTime).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Stats & Impact details */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs font-mono">
                      <div className="flex items-center gap-3">
                        <span>
                          Dự báo: <strong className="text-white">{evt.forecast}</strong>
                        </span>
                        <span>
                          Kỳ trước: <strong className="text-slate-400">{evt.previous}</strong>
                        </span>
                        <span>
                          Thực tế: <strong className="text-cyan-400">{evt.actual}</strong>
                        </span>
                      </div>

                      <div className="text-[11px] text-amber-300/90 font-sans">
                        Biến động: {evt.historicalVolatility}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 font-sans bg-slate-950/40 px-2.5 py-1 rounded-lg border border-slate-800/40">
                      💡 <strong>Khuyến nghị:</strong> {evt.recommendation}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowDetailModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold transition-colors"
            >
              Đóng Cửa Sổ Lịch Vĩ Mô
            </button>
          </div>
        </div>
      )}
    </>
  );
};
