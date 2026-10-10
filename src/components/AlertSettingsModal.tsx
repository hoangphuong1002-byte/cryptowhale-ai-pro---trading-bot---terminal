import React, { useState } from 'react';
import { BotSettings, TradingSessionType } from '../types';
import {
  X,
  Send,
  Sliders,
  Webhook,
  Key,
  Shield,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Zap,
  Clock,
  ChevronDown,
  ChevronUp,
  Brain,
  Award,
} from 'lucide-react';
import { apiService } from '../services/api';

interface AlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BotSettings;
  onSaveSettings: (newSettings: BotSettings) => void;
}

export const AlertSettingsModal: React.FC<AlertSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<BotSettings>(settings);
  const [testTgStatus, setTestTgStatus] = useState<string | null>(null);
  const [testingTg, setTestingTg] = useState(false);

  const [testWebhookStatus, setTestWebhookStatus] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [showAdvancedWebhook, setShowAdvancedWebhook] = useState(false);

  const [testExchangeStatus, setTestExchangeStatus] = useState<{
    success: boolean;
    message: string;
    availableBalance?: number;
    canTrade?: boolean;
    hint?: string;
  } | null>(null);
  const [testingExchange, setTestingExchange] = useState(false);

  if (!isOpen) return null;

  const handleTestExchange = async () => {
    const key = (formData.apiKey || '').trim();
    const secret = (formData.apiSecret || '').trim();

    if (!key || !secret) {
      setTestExchangeStatus({
        success: false,
        message: 'Vui lòng nhập API Key và API Secret từ sàn Binance!',
        hint: 'Đăng nhập Binance > Avatar Tài khoản > API Management > Copy API Key và Secret Key dán vào 2 ô bên dưới.',
      });
      return;
    }

    setTestingExchange(true);
    setTestExchangeStatus(null);

    // Safety timeout guard: Never leave the UI stuck in loading state
    const safetyTimer = setTimeout(() => {
      setTestingExchange(false);
    }, 8500);

    try {
      const res = await apiService.testExchangeConnection({
        exchange: formData.exchange,
        apiKey: key,
        apiSecret: secret,
        isTestnet: Boolean((formData as any).isTestnet),
      });

      clearTimeout(safetyTimer);

      if (res.success) {
        setTestExchangeStatus({
          success: true,
          message: res.message || 'Kết nối thành công!',
          availableBalance: res.availableBalance,
          canTrade: res.canTrade,
        });
      } else {
        setTestExchangeStatus({
          success: false,
          message: res.error || 'Xác thực API thất bại',
          hint: res.hint,
        });
      }
    } catch (err: any) {
      clearTimeout(safetyTimer);
      setTestExchangeStatus({
        success: false,
        message: `Lỗi kết nối: ${err.message}`,
        hint: 'Kiểm tra đường truyền Internet hoặc thử bật/tắt Testnet.',
      });
    } finally {
      clearTimeout(safetyTimer);
      setTestingExchange(false);
    }
  };

  const handleTestTelegram = async () => {
    setTestingTg(true);
    setTestTgStatus(null);
    try {
      const res = await apiService.sendTelegram({
        botToken: formData.telegramBotToken,
        chatId: formData.telegramChatId,
        message: `🤖 *KẾT NỐI CRYPTOWHALE AI PRO THÀNH CÔNG!*\n\nBot đã sẵn sàng gửi tín hiệu Entry, Stop Loss & Take Profit cho bạn theo thời gian thực.\nThời gian: ${new Date().toLocaleString()}`,
      });

      if (res.success) {
        setTestTgStatus(res.simulated ? 'Thử nghiệm mô phỏng thành công!' : 'Đã gửi tin nhắn thật đến Telegram của bạn!');
      } else {
        setTestTgStatus(`Lỗi: ${res.error}`);
      }
    } catch (e: any) {
      setTestTgStatus(`Lỗi kết nối: ${e.message}`);
    } finally {
      setTestingTg(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!formData.webhookUrl) {
      setTestWebhookStatus('Vui lòng nhập Webhook URL trước khi thử nghiệm');
      return;
    }
    setTestingWebhook(true);
    setTestWebhookStatus(null);
    try {
      const res = await apiService.sendWebhook({
        webhookUrl: formData.webhookUrl,
        payload: {
          event: 'CRYPTOWHALE_WEBHOOK_PING',
          message: 'Kết nối Webhook cảnh báo giá theo thời gian thực thành công!',
          timestamp: new Date().toISOString(),
        },
      });

      if (res.success) {
        setTestWebhookStatus(`Thành công! Mã HTTP: ${res.status || 200}`);
      } else {
        setTestWebhookStatus(`Thất bại: ${res.error || res.message}`);
      }
    } catch (e: any) {
      setTestWebhookStatus(`Lỗi gửi: ${e.message}`);
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 sticky top-0 bg-[#0b101b] z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono">
                Cài Đặt Bot, Telegram & Webhook
              </h2>
              <span className="text-[11px] text-slate-400">
                Tùy chỉnh thông báo thời gian thực và kết nối sàn giao dịch
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 sm:p-6 flex flex-col gap-6">
          {/* Section 1: Telegram Bot Configuration */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                1. Cấu Hình Bot Telegram (Báo SL/TP/Entry Tức Thì)
              </h3>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 leading-relaxed">
              <span className="text-sky-300 font-semibold block mb-1">Hướng dẫn nhanh 2 bước:</span>
              <ol className="list-decimal pl-4 flex flex-col gap-1 text-[11px] text-slate-400">
                <li>
                  Mở Telegram, chat với <strong className="text-white">@BotFather</strong>, gõ <code className="text-sky-400">/newbot</code> để lấy <strong className="text-white">Bot Token</strong>.
                </li>
                <li>
                  Nhắn tin với <strong className="text-white">@userinfobot</strong> để lấy <strong className="text-white">ID Chat</strong> của bạn (hoặc ID Group/Channel).
                </li>
              </ol>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-400 font-mono">Telegram Bot Token:</label>
                <input
                  type="text"
                  placeholder="ví dụ: 789123456:AAFl1aBcDeFgHi..."
                  value={formData.telegramBotToken}
                  onChange={(e) => setFormData({ ...formData, telegramBotToken: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-400 font-mono">Telegram Chat ID / Group ID:</label>
                <input
                  type="text"
                  placeholder="ví dụ: 123456789 hoặc -10012345678"
                  value={formData.telegramChatId}
                  onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.autoSendTelegram}
                  onChange={(e) => setFormData({ ...formData, autoSendTelegram: e.target.checked })}
                  className="rounded border-slate-700 accent-sky-500"
                />
                <span>Tự động bắn tín hiệu sang Telegram khi AI phát hiện kèo mới</span>
              </label>

              <button
                type="button"
                onClick={handleTestTelegram}
                disabled={testingTg}
                className="px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 rounded-lg text-xs font-mono transition-colors"
              >
                {testingTg ? 'Đang gửi...' : 'Gửi Thử Tin Nhắn Telegram'}
              </button>
            </div>

            {testTgStatus && (
              <span className="text-xs font-mono text-cyan-300 bg-slate-900 p-2 rounded border border-slate-800">
                {testTgStatus}
              </span>
            )}
          </div>

          {/* Section 2: Trading Sessions & Primary Strategy */}
          <div className="flex flex-col gap-3 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                2. Phiên Giao Dịch & Chiến Lược Chủ Đạo (Trading Sessions & Strategy)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-400 font-mono">Phiên Giao Dịch Ưu Tiên:</label>
                <select
                  value={formData.activeTradingSession || 'ALL'}
                  onChange={(e: any) =>
                    setFormData({ ...formData, activeTradingSession: e.target.value as TradingSessionType })
                  }
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-cyan-500"
                >
                  <option value="ALL">Tất Cả Phiên (24/7 Liên Tục)</option>
                  <option value="LONDON">Chỉ Phiên London (14:00 - 22:00 VN)</option>
                  <option value="NEW_YORK">Chỉ Phiên New York (19:30 - 03:30 VN)</option>
                  <option value="LONDON_NY">Phiên London & New York (Thanh Khoản Đỉnh Cao)</option>
                </select>
                <span className="text-[10px] text-slate-500">
                  Bot sẽ hạn chế mở lệnh mới ngoài khung giờ thanh khoản để tránh bẫy sideway.
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-400 font-mono">Chiến Lược Chủ Đạo Dẫn Đường:</label>
                <select
                  value={formData.primaryStrategy || 'ICT / Smart Money Concepts (SMC)'}
                  onChange={(e) => setFormData({ ...formData, primaryStrategy: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-cyan-500"
                >
                  <option value="ICT / Smart Money Concepts (SMC)">ICT / Smart Money Concepts (SMC - Khuyên dùng)</option>
                  <option value="GCR (Gigantic-Cass-Rebirth)">GCR Contrarian & Quét Thanh Khoản Đỉnh/Đáy</option>
                  <option value="Peter Brandt">Peter Brandt Classical Breakout & Vàng</option>
                  <option value="Richard Wyckoff">Richard Wyckoff Accumulation & VSA</option>
                </select>
                <span className="text-[10px] text-slate-500">
                  Chiến lược chủ đạo giúp lọc bỏ các tín hiệu mâu thuẫn giữa các trường phái khác nhau.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Exchange Integration & Risk Management */}
          <div className="flex flex-col gap-3 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                3. Kết Nối Sàn & Quản Lý Rủi Ro (Auto-Order API)
              </h3>
            </div>

            {/* Security Warning Banner */}
            <div className="bg-rose-950/20 border border-rose-900/50 rounded-lg p-3 text-xs text-rose-300 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-mono">QUY TẮC AN TOÀN BẢO MẬT API KEY:</strong>
                <span>
                  Khi tạo API Key trên sàn Binance/Bybit/OKX, hãy chắc chắn <strong className="text-rose-200">CHỈ BẬT QUYỀN ĐỌC & GIAO DỊCH (TRADE)</strong>. Tuyệt đối <strong className="text-rose-400 underline">KHÔNG BẬT QUYỀN RÚT TIỀN (WITHDRAW)</strong> để bảo vệ 100% tài sản của bạn.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-400 font-mono">Sàn Giao Dịch:</label>
                <select
                  value={formData.exchange}
                  onChange={(e: any) => setFormData({ ...formData, exchange: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-amber-500"
                >
                  <option value="PAPER">Tài Khoản Giả Lập (Paper Simulation)</option>
                  <option value="BINANCE">Binance Futures</option>
                  <option value="BYBIT">Bybit Perpetual</option>
                  <option value="OKX">OKX Futures</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-400 font-mono">Tỷ Lệ Ký Quỹ / Vốn Mỗi Lệnh (%):</label>
                <input
                  type="number"
                  min="0.5"
                  max="50"
                  step="0.5"
                  value={formData.riskPerTradePercent}
                  onChange={(e) => setFormData({ ...formData, riskPerTradePercent: parseFloat(e.target.value) || 2 })}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 font-mono">% Vốn ký quỹ bot tự động trích ra cho mỗi lệnh</span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-400 font-mono">Đòn Bẩy Ký Quỹ (Leverage):</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.defaultLeverage}
                  onChange={(e) => setFormData({ ...formData, defaultLeverage: parseInt(e.target.value, 10) || 10 })}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 font-mono">Đòn bẩy mặc định cho bot tự động (1x - 50x)</span>
              </div>
            </div>

            {formData.exchange !== 'PAPER' && (
              <div className="flex flex-col gap-3 mt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-400 font-mono">API Key:</label>
                    <input
                      type="password"
                      placeholder="Nhập API Key từ sàn..."
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-400 font-mono">API Secret:</label>
                    <input
                      type="password"
                      placeholder="Nhập API Secret..."
                      value={formData.apiSecret}
                      onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Testnet option & Test connection button */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={Boolean((formData as any).isTestnet)}
                      onChange={(e) => setFormData({ ...formData, isTestnet: e.target.checked } as any)}
                      className="rounded border-slate-700 accent-amber-500"
                    />
                    <span>Sử dụng Binance Futures Testnet (Tài khoản thử nghiệm)</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleTestExchange}
                    disabled={testingExchange}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>{testingExchange ? 'Đang xác thực...' : 'Kiểm Tra Kết Nối Binance'}</span>
                  </button>
                </div>

                {/* Connection Status Badge */}
                {testExchangeStatus && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-mono flex flex-col gap-1 ${
                      testExchangeStatus.success
                        ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{testExchangeStatus.success ? '✅ KẾT NỐI SÀN THÀNH CÔNG' : '❌ LỖI XÁC THỰC SÀN'}</span>
                      {typeof testExchangeStatus.availableBalance === 'number' && (
                        <span className="text-white bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700">
                          Số dư: ${testExchangeStatus.availableBalance.toLocaleString()} USDT
                        </span>
                      )}
                    </div>
                    <span>{testExchangeStatus.message}</span>
                    {testExchangeStatus.hint && (
                      <span className="text-[11px] text-amber-300/90 bg-black/40 p-1.5 rounded mt-1">
                        💡 Hướng dẫn sửa: {testExchangeStatus.hint}
                      </span>
                    )}
                  </div>
                )}

                {/* Step-by-Step Guide for Binance & Auto-Trading */}
                <div className="bg-[#070b14] border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-mono font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>HƯỚNG DẪN 3 BƯỚC GỬI LỆNH LÊN BINANCE & BẬT BOT TỰ ĐỘNG:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300 leading-relaxed font-mono">
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <strong className="text-white block mb-0.5">Bước 1: Tạo API Key</strong>
                      <span>Đăng nhập Binance ➔ API Management ➔ Tạo API. Bật <strong className="text-emerald-400">Enable Futures</strong>. Tuyệt đối KHÔNG chọn Withdraw.</span>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <strong className="text-white block mb-0.5">Bước 2: Gửi Lệnh Thủ Công</strong>
                      <span>Tại Bảng QB ngoài màn hình, bấm <strong className="text-amber-400">[Đặt Lệnh Nhanh]</strong> hoặc vào tab <strong className="text-cyan-400">Trạm Lệnh</strong>. Lệnh sẽ gửi trực tiếp lên Binance kèm SL/TP!</span>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <strong className="text-white block mb-0.5">Bước 3: Bot Tự Động Trade</strong>
                      <span>Bật công tắc <strong className="text-emerald-400">Auto-Trade</strong> trên góc phải Header. Khi AI phát hiện setup đủ chuẩn R:R & On-chain, bot tự động vào lệnh và dời SL về hòa vốn.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Prop Firm Risk Mode */}
            <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-lg flex flex-col gap-2 mt-1">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white font-mono">
                    Chế Độ Thi Quỹ (Prop Firm Evaluation Guard)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.propFirmRiskMode}
                  onChange={(e) => setFormData({ ...formData, propFirmRiskMode: e.target.checked })}
                  className="rounded border-slate-700 accent-amber-500"
                />
              </label>

              {formData.propFirmRiskMode && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-900/30 text-[11px] font-mono text-slate-300">
                  <div>
                    <span className="text-slate-400 block">Chặn Lỗ Tối Đa Trong Ngày:</span>
                    <span className="text-rose-400 font-bold">4.0% Tài Khoản (Auto-Halt)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Giới Hạn Drawdown Tổng:</span>
                    <span className="text-rose-400 font-bold">8.0% Tài Khoản (Hard Cap)</span>
                  </div>
                  <span className="col-span-2 text-[10px] text-amber-300/80">
                    Bot sẽ tự động khóa lệnh trong 24h nếu tổng lỗ trong ngày chạm 4% để bảo vệ tài khoản quỹ của bạn.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Advanced Risk Management & Automation */}
          <div className="flex flex-col gap-3 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                4. Quản Trị Rủi Ro Chuyên Nghiệp (Dynamic ATR, Breakeven & Lọc Tin)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Auto Move Breakeven */}
              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoMoveBreakeven}
                  onChange={(e) => setFormData({ ...formData, autoMoveBreakeven: e.target.checked })}
                  className="rounded border-slate-700 accent-emerald-500 mt-0.5"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Tự Động Dời SL Về Hòa Vốn (Breakeven)</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    Khi giá chạm TP1 hoặc đi được 50% mục tiêu, bot tự động dời SL về giá Entry để loại bỏ 100% rủi ro lỗ.
                  </span>
                </div>
              </label>

              {/* Dynamic ATR Trailing */}
              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dynamicAtrTrailingEnabled}
                  onChange={(e) => setFormData({ ...formData, dynamicAtrTrailingEnabled: e.target.checked })}
                  className="rounded border-slate-700 accent-cyan-500 mt-0.5"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Trailing Stop Động (ATR Trailing)</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    Sau khi giá vượt TP2, tự động trượt Stop Loss bám theo 1.8x ATR để gồng lãi tối đa xu hướng mạnh (Mega-Trend).
                  </span>
                </div>
              </label>
            </div>

            {/* Slippage & Partial TP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Giới Hạn Trượt Giá Tối Đa (Slippage):</span>
                  <span className="text-cyan-400 font-bold">{formData.maxSlippagePercent || 0.2}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={formData.maxSlippagePercent || 0.2}
                  onChange={(e) => setFormData({ ...formData, maxSlippagePercent: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] text-slate-500 font-mono">
                  Hủy khớp lệnh nếu độ trượt giá thực tế vượt quá {formData.maxSlippagePercent || 0.2}%.
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Tỷ Lệ Chốt Lời Từng Phần Tại TP1 (Scale-Out):</span>
                  <span className="text-emerald-400 font-bold">{formData.partialTakeProfitPercent || 40}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  step="10"
                  value={formData.partialTakeProfitPercent || 40}
                  onChange={(e) => setFormData({ ...formData, partialTakeProfitPercent: parseInt(e.target.value, 10) })}
                  className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] text-slate-500 font-mono">
                  Đóng {formData.partialTakeProfitPercent || 40}% tại TP1, để phần còn lại gồng lãi TP2/TP3.
                </span>
              </div>
            </div>
          </div>

          {/* Section 5 (HIDDEN ACCORDION): Advanced Developer Webhook Configuration */}
          <div className="pt-3 border-t border-slate-800 flex flex-col">
            <button
              type="button"
              onClick={() => setShowAdvancedWebhook(!showAdvancedWebhook)}
              className="flex items-center justify-between text-xs font-mono text-slate-400 hover:text-slate-200 py-1.5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Webhook className="w-4 h-4 text-slate-400" />
                <span>⚙️ Cài Đặt Nâng Cao: Tích Hợp Webhook (Discord / Slack / Dev)</span>
              </div>
              {showAdvancedWebhook ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvancedWebhook && (
              <div className="flex flex-col gap-3 pt-3 animate-fadeIn">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400 font-mono">Webhook URL Endpoint:</label>
                  <input
                    type="url"
                    placeholder="https://discord.com/api/webhooks/... hoặc https://hooks.slack.com/..."
                    value={formData.webhookUrl}
                    onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.webhookEnabled}
                      onChange={(e) => setFormData({ ...formData, webhookEnabled: e.target.checked })}
                      className="rounded border-slate-700 accent-emerald-500"
                    />
                    <span>Kích hoạt đẩy Webhook sự kiện</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleTestWebhook}
                    disabled={testingWebhook}
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-mono transition-colors"
                  >
                    {testingWebhook ? 'Đang test...' : 'Thử Nghiệm Webhook'}
                  </button>
                </div>

                {testWebhookStatus && (
                  <span className="text-xs font-mono text-emerald-300 bg-slate-900 p-2 rounded border border-slate-800">
                    {testWebhookStatus}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Footer Save Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold border border-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Lưu Cấu Hình
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
