import React from 'react';
import {
  Sliders,
  X,
  Check,
  Eye,
  EyeOff,
  Layers,
  Smartphone,
  Monitor,
  Flame,
  Zap,
} from 'lucide-react';

export interface LayoutPreferences {
  showTickerBar: boolean;
  showMacroBanner: boolean;
  showLiquidationHeatmap: boolean;
  showMultiTimeframe: boolean;
  showWhaleRadarWidget: boolean;
  compactMobileMode: boolean;
  chartShowEma: boolean;
  chartShowBollinger: boolean;
  chartShowLevels: boolean;
}

export const DEFAULT_LAYOUT_PREFS: LayoutPreferences = {
  showTickerBar: true,
  showMacroBanner: true,
  showLiquidationHeatmap: true,
  showMultiTimeframe: true,
  showWhaleRadarWidget: true,
  compactMobileMode: false,
  chartShowEma: true,
  chartShowBollinger: false,
  chartShowLevels: true,
};

interface LayoutCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefs: LayoutPreferences;
  onUpdatePrefs: (newPrefs: LayoutPreferences) => void;
  onResetDefaults: () => void;
}

export const LayoutCustomizerModal: React.FC<LayoutCustomizerModalProps> = ({
  isOpen,
  onClose,
  prefs,
  onUpdatePrefs,
  onResetDefaults,
}) => {
  if (!isOpen) return null;

  const toggle = (key: keyof LayoutPreferences) => {
    onUpdatePrefs({
      ...prefs,
      [key]: !prefs[key],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f1422] border border-cyan-800/80 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-mono">Tùy Biến Giao Diện & Biểu Đồ (UI/UX)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tối ưu hóa không gian làm việc theo nhu cầu trên Mobile & Desktop
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex flex-col gap-4 max-h-[65vh] overflow-y-auto no-scrollbar pr-1">
          {/* Dashboard Modules */}
          <div>
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider block mb-2">
              1. Khung Thông Tin & Tiện Ích (Dashboard Modules)
            </span>
            <div className="flex flex-col gap-2">
              <label
                onClick={() => toggle('showTickerBar')}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
              >
                <div>
                  <span className="text-xs font-bold font-mono block">Dải Giá Ticker Kéo Thả (Market Ticker)</span>
                  <span className="text-[11px] text-slate-400">Xem nhanh giá, thay đổi 24h, RSI của các cặp</span>
                </div>
                <div
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                    prefs.showTickerBar ? 'bg-cyan-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      prefs.showTickerBar ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </label>

              <label
                onClick={() => toggle('showMacroBanner')}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
              >
                <div>
                  <span className="text-xs font-bold font-mono block">Lịch Tin Vĩ Mô & Đếm Ngược (Macro Calendar)</span>
                  <span className="text-[11px] text-slate-400">Cảnh báo tin tức CPI, FOMC, Non-farm tránh bão giá</span>
                </div>
                <div
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                    prefs.showMacroBanner ? 'bg-cyan-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      prefs.showMacroBanner ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </label>

              <label
                onClick={() => toggle('showMultiTimeframe')}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
              >
                <div>
                  <span className="text-xs font-bold font-mono block">Ma Trận Đa Khung Thời Gian (15m · 1H · 4H · 1D)</span>
                  <span className="text-[11px] text-slate-400">Tự đánh giá xu hướng và chỉ báo hợp lưu</span>
                </div>
                <div
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                    prefs.showMultiTimeframe ? 'bg-cyan-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      prefs.showMultiTimeframe ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </label>

              <label
                onClick={() => toggle('showLiquidationHeatmap')}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
              >
                <div>
                  <span className="text-xs font-bold font-mono block">Bản Đồ Thanh Lý (Liquidation Heatmap)</span>
                  <span className="text-[11px] text-slate-400">Vùng đòn bẩy lớn dễ bị quét thanh lý</span>
                </div>
                <div
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                    prefs.showLiquidationHeatmap ? 'bg-cyan-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      prefs.showLiquidationHeatmap ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </label>

              <label
                onClick={() => toggle('showWhaleRadarWidget')}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
              >
                <div>
                  <span className="text-xs font-bold font-mono block">Radar Ví Cá Mập Thu Nhỏ (Whale Sentiment)</span>
                  <span className="text-[11px] text-slate-400">Widget hiển thị nhanh dòng tiền rút ví lạnh</span>
                </div>
                <div
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                    prefs.showWhaleRadarWidget ? 'bg-cyan-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      prefs.showWhaleRadarWidget ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Chart Display Preferences */}
          <div>
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider block mb-2">
              2. Tùy Chọn Hiển Thị Biểu Đồ (Trading Chart Layers)
            </span>
            <div className="flex flex-col gap-2">
              <label
                onClick={() => toggle('chartShowLevels')}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
              >
                <div>
                  <span className="text-xs font-bold font-mono block">Nhãn Giá Entry · SL · TP1/TP2/TP3</span>
                  <span className="text-[11px] text-slate-400">Hiển thị đường gióng và nhãn giá hai màu chuẩn bot mẫu</span>
                </div>
                <div
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                    prefs.chartShowLevels ? 'bg-cyan-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      prefs.chartShowLevels ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </label>

              <label
                onClick={() => toggle('chartShowEma')}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
              >
                <div>
                  <span className="text-xs font-bold font-mono block">Đường Trung Bình EMA 20 & EMA 50</span>
                  <span className="text-[11px] text-slate-400">Xác định xu hướng động và hỗ trợ cản</span>
                </div>
                <div
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                    prefs.chartShowEma ? 'bg-cyan-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      prefs.chartShowEma ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onResetDefaults}
            className="text-xs text-slate-400 hover:text-white font-mono"
          >
            Khôi phục mặc định
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-md"
          >
            Áp Dụng Thay Đổi
          </button>
        </div>
      </div>
    </div>
  );
};
