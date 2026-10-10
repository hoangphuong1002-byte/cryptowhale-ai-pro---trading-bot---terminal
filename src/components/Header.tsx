import React from 'react';
import {
  Bot,
  Bell,
  Shield,
  Sliders,
  Zap,
  CheckCircle2,
  Brain,
  Layout,
  Radio,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { BotSettings } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeTab: 'terminal' | 'signals' | 'whales' | 'pro-hub' | 'ml-hub' | 'history';
  setActiveTab: (tab: 'terminal' | 'signals' | 'whales' | 'pro-hub' | 'ml-hub' | 'history') => void;
  settings: BotSettings;
  setSettings: React.Dispatch<React.SetStateAction<BotSettings>>;
  onOpenSettings: () => void;
  onEmergencyKillSwitch: () => void;
  onOpenLayoutCustomizer: () => void;
  onOpenAudit?: () => void;
  onOpenHealthModal?: () => void;
  isOnline?: boolean;
  viewMode?: 'QB_SIMPLE' | 'PRO_TERMINAL';
  onToggleViewMode?: () => void;
  realBinanceBalance?: number | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  settings,
  setSettings,
  onOpenSettings,
  onEmergencyKillSwitch,
  onOpenLayoutCustomizer,
  onOpenAudit,
  onOpenHealthModal,
  isOnline = true,
  viewMode = 'QB_SIMPLE',
  onToggleViewMode,
  realBinanceBalance,
}) => {
  const toggleAutoTrading = () => {
    setSettings((prev) => ({
      ...prev,
      autoTradingEnabled: !prev.autoTradingEnabled,
    }));
  };

  return (
    <header className="border-b border-slate-800/80 bg-[#090d16]/95 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 py-2.5">
      <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-3">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5 font-mono">
              CryptoWhale Quant Pro
              {onOpenHealthModal ? (
                <button
                  type="button"
                  onClick={onOpenHealthModal}
                  className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-700/60 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                  title="Bấm để kiểm tra lỗi hệ thống, kết nối Binance & độ trễ API"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>QUANT BOT · KIỂM TRA LỖI</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.2 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE BOT
                </span>
              )}
            </span>
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
              <span>Bot Thông Minh SMC · Wyckoff · Cá Voi</span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-400 font-mono text-[10px] flex items-center gap-1">
                <span>⚡ Khởi Động Tức Thì (Instant Cache)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'terminal'
                ? 'bg-slate-800 text-white shadow-xs border border-slate-700/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Thị Trường & Biểu Đồ
          </button>
          <button
            onClick={() => setActiveTab('signals')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'signals'
                ? 'bg-slate-800 text-white shadow-xs border border-slate-700/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Kế Hoạch Định Lượng
          </button>
          <button
            onClick={() => setActiveTab('whales')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'whales'
                ? 'bg-slate-800 text-white shadow-xs border border-slate-700/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Theo Dõi Ví Cá Voi
          </button>
          <button
            onClick={() => setActiveTab('ml-hub')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ml-hub'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 shadow-xs'
                : 'text-cyan-400 hover:text-cyan-200'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Mô-đun Định Lượng (Quant)</span>
          </button>
          <button
            onClick={() => setActiveTab('pro-hub')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'pro-hub'
                ? 'bg-slate-800 text-white shadow-xs border border-slate-700/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pro Trader Hub
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'bg-slate-800 text-white shadow-xs border border-slate-700/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hiệu Suất & Lịch Sử
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          {/* Binance Live Balance Badge */}
          {settings.exchange === 'BINANCE' && typeof realBinanceBalance === 'number' && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/50 border border-amber-600/50 rounded-lg text-xs font-mono text-amber-300 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Ví Binance:</span>
              <strong className="font-bold tabular-nums">${realBinanceBalance.toFixed(2)}</strong>
            </div>
          )}

          {/* Mode Switcher: QB Simple vs Pro Terminal */}
          {onToggleViewMode && (
            <button
              onClick={onToggleViewMode}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                viewMode === 'QB_SIMPLE'
                  ? 'bg-gradient-to-r from-cyan-950/90 to-blue-950/90 text-cyan-300 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
              title={
                viewMode === 'QB_SIMPLE'
                  ? 'Đang ở Chế Độ QB Gọn. Bấm để mở Trạm Toàn Diện'
                  : 'Đang ở Trạm Toàn Diện. Bấm để chuyển về Chế Độ QB Gọn'
              }
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>{viewMode === 'QB_SIMPLE' ? 'Chế Độ QB Gọn' : 'Trạm Toàn Diện'}</span>
            </button>
          )}

          {/* 3rd-Party Quant Audit Trigger */}
          {onOpenAudit && (
            <button
              onClick={onOpenAudit}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-mono font-bold rounded-lg border bg-gradient-to-r from-cyan-900/60 to-blue-900/60 hover:from-cyan-800/80 hover:to-blue-800/80 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all cursor-pointer"
              title="Mở Báo Cáo Thẩm Định Độc Lập Bên Thứ 3 (Quant Audit)"
            >
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Thẩm Định</span>
            </button>
          )}

          {/* PWA Native App Install Button */}
          <PWAInstallButton />

          {/* Layout Customizer Trigger */}
          <button
            onClick={onOpenLayoutCustomizer}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 hover:bg-slate-800 transition-colors shrink-0"
            title="Tùy biến hiển thị thông tin và biểu đồ (Layout & Display)"
          >
            <Layout className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">Tùy Biến UI</span>
          </button>

          {/* Emergency Panic Kill Switch */}
          <button
            onClick={onEmergencyKillSwitch}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-bold text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-lg hover:bg-rose-900/60 hover:border-rose-600 transition-all shrink-0 cursor-pointer"
            title="Khẩn cấp: Hủy toàn bộ lệnh chờ và đóng tất cả vị thế đang mở"
          >
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">KILL SWITCH</span>
          </button>

          {/* Auto bot switch button */}
          <button
            onClick={toggleAutoTrading}
            className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-mono font-medium rounded-lg border transition-all cursor-pointer ${
              settings.autoTradingEnabled
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Bật/Tắt chế độ bot tự động quét và đặt lệnh"
          >
            <Zap className={`w-3.5 h-3.5 ${settings.autoTradingEnabled ? 'text-emerald-400 fill-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Auto-Trade:</span>
            <span className="font-semibold">
              {settings.autoTradingEnabled ? 'BẬT' : 'TẮT'}
            </span>
          </button>

          {/* Telegram / Webhook settings trigger */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium text-slate-200 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Cài đặt thông báo Telegram và ngưỡng rủi ro"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Cài Đặt</span>
            {settings.autoSendTelegram && (
              <span className="w-2 h-2 rounded-full bg-cyan-400" title="Telegram Active"></span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
