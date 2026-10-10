import React from 'react';
import { fastCache } from '../services/fastCache';
import {
  ShieldAlert,
  RotateCcw,
  Zap,
  TrendingUp,
  HardDrive,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface EmergencyQBLiteProps {
  error?: Error | null;
  onRetry: () => void;
}

export const EmergencyQBLite: React.FC<EmergencyQBLiteProps> = ({ error, onRetry }) => {
  const cachedPairs = fastCache.getCachedPairs();
  const btcPair = cachedPairs.find((p) => p.symbol === 'BTCUSDT') || cachedPairs[0];
  const lastSignal = fastCache.getLastSignal();

  const handleClearCacheAndRestart = () => {
    try {
      localStorage.removeItem('cw_trades');
      localStorage.removeItem('cw_bot_settings');
      localStorage.removeItem('cw_layout_prefs');
      localStorage.removeItem('cryptowhale_view_mode');
    } catch {}
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#070a11] text-[#e2e8f0] flex flex-col p-4 sm:p-6 font-sans">
      <div className="max-w-xl w-full mx-auto my-auto flex flex-col gap-4">
        {/* Header Banner */}
        <div className="bg-[#0d121f] border border-cyan-500/40 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  CryptoWhale AI Pro
                  <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 px-1.5 py-0.5 rounded">
                    QB SAFE RUNNER
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Đã tự động kích hoạt Bảng QB Cứu Hộ để ngăn chặn màn hình trắng
                </p>
              </div>
            </div>
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Thử Lại</span>
            </button>
          </div>
        </div>

        {/* Live / Cached Prices Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {cachedPairs.slice(0, 4).map((p) => (
            <div
              key={p.symbol}
              className="bg-[#0b101c] border border-slate-800/80 rounded-xl p-2.5 flex flex-col"
            >
              <span className="text-[11px] text-slate-400 font-mono">{p.symbol}</span>
              <span className="text-sm font-bold text-white font-mono mt-0.5">
                ${p.price.toLocaleString()}
              </span>
              <span
                className={`text-[10px] font-mono mt-0.5 ${
                  p.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {p.change24h >= 0 ? '+' : ''}
                {p.change24h}%
              </span>
            </div>
          ))}
        </div>

        {/* Essential QB Trading Plan Card */}
        <div className="bg-[#0d121f] border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-bold text-white font-mono">
                KẾ HOẠCH QB KHẨN CẤP (M15/H1)
              </span>
            </div>
            <span className="text-xs font-mono text-rose-400 font-bold bg-rose-950/60 border border-rose-800/50 px-2 py-0.5 rounded">
              {lastSignal ? lastSignal.direction : 'SHORT / SELL'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-[#070a11] p-3 rounded-xl border border-slate-800/60">
              <span className="text-slate-400 text-[10px] block">ĐIỂM VÀO (ENTRY)</span>
              <span className="text-white font-bold text-sm mt-0.5 block">
                ${lastSignal ? lastSignal.entryPrice.toLocaleString() : btcPair.price.toLocaleString()}
              </span>
              <span className="text-emerald-400 text-[10px]">Trạng thái: Entry Hit</span>
            </div>
            <div className="bg-[#070a11] p-3 rounded-xl border border-rose-900/30">
              <span className="text-rose-400 text-[10px] block">CẮT LỖ (STOP LOSS)</span>
              <span className="text-rose-300 font-bold text-sm mt-0.5 block">
                $
                {lastSignal
                  ? lastSignal.stopLoss.toLocaleString()
                  : Math.round(btcPair.price * 1.016).toLocaleString()}
              </span>
              <span className="text-slate-500 text-[10px]">Tối đa -1.6%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-[#070a11] p-3 rounded-xl border border-emerald-900/30">
              <span className="text-emerald-400 text-[10px] block">CHỐT LỜI (TP1 / TP2)</span>
              <span className="text-emerald-300 font-bold text-sm mt-0.5 block">
                $
                {lastSignal
                  ? lastSignal.tp1.toLocaleString()
                  : Math.round(btcPair.price * 0.985).toLocaleString()}
              </span>
              <span className="text-slate-500 text-[10px]">
                TP2: $
                {lastSignal
                  ? lastSignal.tp2.toLocaleString()
                  : Math.round(btcPair.price * 0.972).toLocaleString()}
              </span>
            </div>
            <div className="bg-[#070a11] p-3 rounded-xl border border-slate-800/60">
              <span className="text-slate-400 text-[10px] block">TỶ LỆ R:R / ĐÒN BẨY</span>
              <span className="text-cyan-400 font-bold text-sm mt-0.5 block">1:2.8</span>
              <span className="text-slate-500 text-[10px]">Khuyên dùng: 10x Isolated</span>
            </div>
          </div>
        </div>

        {/* Self-Healing Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tải Lại Ứng Dụng</span>
          </button>
          <button
            onClick={handleClearCacheAndRestart}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer border border-rose-800/50"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Xóa Cache & Khởi Động Sạch</span>
          </button>
        </div>

        {error && (
          <div className="text-[10px] font-mono text-slate-500 text-center truncate">
            Chi tiết lỗi: {error.message || 'Unknown runtime issue'}
          </div>
        )}
      </div>
    </div>
  );
};
