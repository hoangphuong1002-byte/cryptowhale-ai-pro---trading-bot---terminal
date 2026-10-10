import React, { useState, useRef, useEffect } from 'react';
import { CryptoSymbol, TradeSignal, ExecutedTrade } from '../types';
import { offlineStorage } from '../services/offlineStorage';
import {
  Bot,
  Sparkles,
  Send,
  Shield,
  Zap,
  TrendingUp,
  TrendingDown,
  Calculator,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  MessageSquare,
  Cpu,
  Download,
  Wifi,
  WifiOff,
  Crosshair,
  Sliders,
  DollarSign,
  Percent,
} from 'lucide-react';

export interface CopilotMessage {
  id: string;
  sender: 'copilot' | 'user';
  text: string;
  suggestedActions?: string[];
  timestamp: number;
  engine?: string;
  isPositionCalcResult?: boolean;
}

interface AITradingCopilotProps {
  symbol: CryptoSymbol;
  currentPrice: number;
  timeframe: string;
  activeSignal: TradeSignal | null;
  openTrades: ExecutedTrade[];
  portfolioBalance: number;
  isOpen: boolean;
  onClose: () => void;
  isOnline?: boolean;
  onApplyOrderPlan?: (plan: {
    side: 'BUY' | 'SELL';
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    amountUsdt?: number;
    leverage?: number;
  }) => void;
}

export const AITradingCopilot: React.FC<AITradingCopilotProps> = ({
  symbol,
  currentPrice,
  timeframe,
  activeSignal,
  openTrades,
  portfolioBalance,
  isOpen,
  onClose,
  isOnline = true,
  onApplyOrderPlan,
}) => {
  // Load previous messages from offlineStorage or set initial default
  const [messages, setMessages] = useState<CopilotMessage[]>(() => {
    const saved = offlineStorage.getCopilotHistory();
    if (saved && saved.length > 0) return saved;

    return [
      {
        id: 'init-1',
        sender: 'copilot',
        text: `Xin chào Trader! Tôi là **AI Trading Copilot Thực Chiến** của bạn.\n\nTôi đang theo dõi cặp **#${symbol}** (giá hiện tại **$${currentPrice?.toLocaleString()}** trên khung **${timeframe.toUpperCase()}**).\n\nTôi có thể hỗ trợ bạn:\n1. Phân tích điểm vào lệnh (Entry, SL, TP) theo SMC & Wyckoff.\n2. Tính toán khối lượng vào lệnh & quản trị rủi ro tài khoản.\n3. Nhận diện bẫy quét thanh khoản (Liquidity Sweeps) của cá voi.\n4. Hoạt động 100% kể cả khi thiết bị **không có mạng (Offline Ready)**.`,
        suggestedActions: [
          'Đánh giá setup lệnh hiện tại',
          'Tính khối lượng vào lệnh an toàn',
          'Cảnh báo bẫy giá thanh khoản',
          'Dòng tiền cá voi gom hàng',
        ],
        timestamp: Date.now(),
        engine: 'AI_TRADING_CORE',
      },
    ];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  // Position Sizing Calculator state
  const [calcRiskPct, setCalcRiskPct] = useState(2);
  const [calcCustomBalance, setCalcCustomBalance] = useState(portfolioBalance || 10000);
  const [calcEntry, setCalcEntry] = useState(activeSignal?.entryPrice || currentPrice || 86340);
  const [calcSl, setCalcSl] = useState(activeSignal?.stopLoss || (currentPrice ? currentPrice * 0.985 : 85000));

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Persist messages whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      offlineStorage.saveCopilotHistory(messages);
    }
  }, [messages]);

  // Sync entry and SL when activeSignal or currentPrice changes
  useEffect(() => {
    if (activeSignal) {
      setCalcEntry(activeSignal.entryPrice);
      setCalcSl(activeSignal.stopLoss);
    } else if (currentPrice) {
      setCalcEntry(currentPrice);
      setCalcSl(Math.round(currentPrice * 0.985 * 10) / 10);
    }
  }, [activeSignal, currentPrice]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    // If online, attempt server-side Gemini AI
    if (isOnline) {
      try {
        const res = await fetch('/api/ai-copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: textToSend,
            symbol,
            currentPrice,
            timeframe,
            activeSignal,
            openTrades,
            portfolioBalance,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const aiMsg: CopilotMessage = {
              id: `ai-${Date.now()}`,
              sender: 'copilot',
              text: json.data.answer,
              suggestedActions: json.data.suggestedActions,
              timestamp: Date.now(),
              engine: json.data.engine || 'GEMINI_2.5_FLASH',
            };
            setMessages((prev) => [...prev, aiMsg]);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Fall back seamlessly to local engine
      }
    }

    // OFFLINE / INSTANT QUANTITATIVE HEURISTIC ENGINE (0ms Response)
    const isLong = activeSignal?.direction === 'LONG' || (activeSignal as any)?.direction === 'BUY' || !activeSignal;
    const entry = activeSignal?.entryPrice || currentPrice;
    const sl = activeSignal?.stopLoss || (isLong ? entry * 0.985 : entry * 1.015);
    const tp1 = activeSignal?.tp1 || (isLong ? entry * 1.02 : entry * 0.98);
    const tp2 = activeSignal?.tp2 || (isLong ? entry * 1.045 : entry * 0.955);
    const tp3 = activeSignal?.tp3 || (isLong ? entry * 1.075 : entry * 0.925);
    const slDistPct = Math.abs(((sl - entry) / entry) * 100).toFixed(2);
    const maxRiskDollar = ((portfolioBalance * calcRiskPct) / 100).toFixed(0);

    let generatedText = '';

    if (textToSend.includes('Tính khối lượng') || textToSend.includes('quản lý vốn')) {
      const positionValue = (parseFloat(maxRiskDollar) / (parseFloat(slDistPct) / 100)).toFixed(0);
      generatedText = `📊 **TÍNH TOÁN QUẢN TRỊ VỐN AN TOÀN CHO #${symbol}**\n\n` +
        `• **Số dư tài khoản:** $${portfolioBalance.toLocaleString()} USDT\n` +
        `• **Ngưỡng rủi ro khuyến nghị:** ${calcRiskPct}% tài khoản = **$${maxRiskDollar} USDT**\n` +
        `• **Khoảng cách Stop Loss:** ${slDistPct}%\n` +
        `• **Khối lượng vị thế tối đa (Position Size):** **$${parseInt(positionValue).toLocaleString()} USD**\n` +
        `• **Đòn bẩy khuyến nghị:** 10x Isolated (Ký quỹ thực: ~$${(parseInt(positionValue) / 10).toFixed(0)} USDT)\n\n` +
        `💡 *Nguyên tắc cốt lõi:* Nếu giá chạm SL, bạn chỉ mất đúng $${maxRiskDollar} USDT (${calcRiskPct}% tài khoản), tuyệt đối không bao giờ cháy tài khoản!`;
    } else if (textToSend.includes('bẫy') || textToSend.includes('thanh khoản')) {
      generatedText = `⚠️ **CẢNH BÁO BẪY QUÉT THANH KHOẢN (LIQUIDITY TRAPS):**\n\n` +
        `• Vùng đỉnh/đáy gần nhất đang tập trung lượng lớn lệnh Stop Loss của các trader nhỏ lẻ.\n` +
        `• **Hành vi cá voi:** Rất hay xuất hiện cú quét râu (Stop Hunt / Fakeout) giật qua cản 100-300 giá rồi mới đảo chiều theo xu hướng thật.\n` +
        `• **Khuyến nghị bảo vệ:** Hãy đặt Stop Loss cách xa cụm nến từ 0.5% - 1% hoặc chỉ vào lệnh sau khi nến đã đóng nến xác nhận rút râu (Rejection Pinbar)!`;
    } else {
      generatedText = `🤖 **ĐÁNH GIÁ CHIẾN LƯỢC #${symbol} (${timeframe.toUpperCase()}) [OFFLINE ENGINE]:**\n\n` +
        `• **Định hướng chiến lược:** **${isLong ? 'MUA VÀO (LONG)' : 'BÁN KHỐNG (SHORT)'}** tại vùng $${entry.toLocaleString()} USDT.\n` +
        `• **Cắt lỗ nghiêm ngặt:** $${sl.toLocaleString()} (-${slDistPct}%). Rủi ro 2% tối đa: **$${maxRiskDollar} USD**.\n` +
        `• **Mục tiêu chốt lời:**\n` +
        `   - TP1: **$${tp1.toLocaleString()}** (Khuyến nghị chốt 40% & dời SL về hòa vốn)\n` +
        `   - TP2: **$${tp2.toLocaleString()}** (Chốt tiếp 30%)\n` +
        `   - TP3: **$${tp3.toLocaleString()}** (Gồng lãi cùng cá voi)\n` +
        `• **Kỷ luật giao dịch:** Tuyệt đối không nhồi lệnh trung bình giá (DCA) khi sai xu hướng. Luôn tôn trọng điểm cắt lỗ ban đầu.`;
    }

    const offlineAiMsg: CopilotMessage = {
      id: `ai-${Date.now()}`,
      sender: 'copilot',
      text: generatedText,
      suggestedActions: [
        'Dời SL về Breakeven khi đạt TP1',
        'Tính khối lượng vào lệnh an toàn',
        'Cảnh báo bẫy giá thanh khoản',
      ],
      timestamp: Date.now(),
      engine: isOnline ? 'GEMINI_FALLBACK_QUANT' : 'OFFLINE_LOCAL_QUANT',
    };

    setMessages((prev) => [...prev, offlineAiMsg]);
    setIsLoading(false);
  };

  // Run Position Calculator logic and post to chat
  const handleCalculatePosition = () => {
    const riskDollar = (calcCustomBalance * (calcRiskPct / 100));
    const distancePct = Math.abs((calcEntry - calcSl) / calcEntry);
    const posSizeUsd = distancePct > 0 ? (riskDollar / distancePct) : 0;
    const recommendedLev = Math.min(20, Math.max(3, Math.round(1 / distancePct)));

    const resultText = `🧮 **KẾT QUẢ TÍNH TOÁN QUẢN TRỊ RỦI RO & KHỐI LƯỢNG LỆNH:**\n\n` +
      `• Cặp giao dịch: **#${symbol}**\n` +
      `• Vốn tài khoản: **$${calcCustomBalance.toLocaleString()} USDT**\n` +
      `• Tỷ lệ rủi ro chấp nhận: **${calcRiskPct}%** (Tương đương rủi ro tối đa **$${riskDollar.toFixed(2)} USDT**)\n` +
      `• Giá vào (Entry): **$${calcEntry.toLocaleString()}** | Giá dừng lỗ (SL): **$${calcSl.toLocaleString()}** (${(distancePct * 100).toFixed(2)}%)\n\n` +
      `📌 **KẾT QUẢ KHUYẾN NGHỊ:**\n` +
      `👉 **Khối lượng vị thế tối đa:** **$${posSizeUsd.toFixed(2)} USD**\n` +
      `👉 **Đòn bẩy an toàn:** **${recommendedLev}x Isolated**\n` +
      `👉 **Ký quỹ cần bỏ ra:** **$${(posSizeUsd / recommendedLev).toFixed(2)} USDT**\n\n` +
      `🛡️ *Lưu ý sống còn:* Khi dính SL, bạn chỉ mất đúng $${riskDollar.toFixed(2)} USD. Tài khoản của bạn được bảo vệ an toàn 100%!`;

    const calcMsg: CopilotMessage = {
      id: `calc-${Date.now()}`,
      sender: 'copilot',
      text: resultText,
      timestamp: Date.now(),
      engine: 'RISK_MANAGEMENT_CALCULATOR',
      isPositionCalcResult: true,
      suggestedActions: [
        'Đánh giá setup lệnh hiện tại',
        'Cảnh báo bẫy giá thanh khoản',
      ],
    };

    setMessages((prev) => [...prev, calcMsg]);
    setShowCalculator(false);
  };

  const handleClearHistory = () => {
    if (confirm('Bạn có muốn xóa lịch sử trò chuyện của AI Copilot không?')) {
      setMessages([]);
      localStorage.removeItem('cw_copilot_history');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b101b] border border-cyan-500/40 rounded-3xl w-full max-w-2xl h-[92vh] max-h-[780px] flex flex-col shadow-[0_0_60px_rgba(6,182,212,0.25)] overflow-hidden">
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg relative">
              <Bot className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white font-mono text-sm sm:text-base">
                  AI TRADING COPILOT
                </span>
                {isOnline ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                    <Wifi className="w-3 h-3" />
                    ONLINE AI
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                    <WifiOff className="w-3 h-3" />
                    OFFLINE READY
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>{symbol} @ ${currentPrice?.toLocaleString()}</span>
                <span>·</span>
                <span className="text-cyan-400">Khung {timeframe.toUpperCase()}</span>
                <span>·</span>
                <span className="text-slate-500">Lưu máy cục bộ</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-mono font-medium ${
                showCalculator
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
              }`}
              title="Tính khối lượng vào lệnh & Quản lý vốn"
            >
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">Quản Lý Vốn</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Đóng cửa sổ trợ lý"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Position Size Calculator Drawer */}
        {showCalculator && (
          <div className="bg-slate-900/95 border-b border-cyan-800/50 p-4 shrink-0 animate-fadeIn text-xs font-mono">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5 text-xs">
                <Calculator className="w-4 h-4 text-cyan-400" />
                CÔNG CỤ TÍNH KHỐI LƯỢNG VÀ QUẢN TRỊ RỦI RO
              </span>
              <button
                onClick={() => setShowCalculator(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">VỐN TÀI KHOẢN ($)</label>
                <input
                  type="number"
                  value={calcCustomBalance}
                  onChange={(e) => setCalcCustomBalance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">RỦI RO CHẤP NHẬN (%)</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setCalcRiskPct(pct)}
                      className={`flex-1 py-1 rounded text-xs transition-colors cursor-pointer ${
                        calcRiskPct === pct
                          ? 'bg-cyan-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">GIÁ VÀO (ENTRY)</label>
                <input
                  type="number"
                  value={calcEntry}
                  onChange={(e) => setCalcEntry(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">DỪNG LỖ (SL)</label>
                <input
                  type="number"
                  value={calcSl}
                  onChange={(e) => setCalcSl(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                Mất tối đa: <strong className="text-rose-400">${((calcCustomBalance * calcRiskPct) / 100).toFixed(2)} USD</strong> ({calcRiskPct}%)
              </span>
              <button
                onClick={handleCalculatePosition}
                className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-bold text-xs cursor-pointer shadow-md"
              >
                Tính & Gửi Vào Khung Chat
              </button>
            </div>

            {/* Institutional Risk Benchmarks */}
            <div className="mt-2.5 pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400 gap-1.5">
              <span>Công thức Kelly: Tối ưu 1.8% vốn</span>
              <span>Chuẩn quỹ Prop Firm: &lt; 4% Max Daily Loss</span>
              <span className="text-emerald-400">R:R Mục Tiêu: 1:2.5</span>
            </div>
          </div>
        )}

        {/* Quick Context Bar */}
        <div className="bg-cyan-950/30 px-4 sm:px-6 py-2 border-b border-cyan-900/30 flex items-center justify-between text-[11px] font-mono text-cyan-300 shrink-0">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Phân tích hợp lưu SMC · Wyckoff · Quản trị vốn · Hoạt động Offline</span>
          </div>
          <button
            onClick={handleClearHistory}
            className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer underline"
          >
            Xóa lịch sử
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 font-sans text-xs sm:text-sm">
          {messages.map((m) => {
            const isAi = m.sender === 'copilot';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isAi ? 'items-start' : 'items-end justify-end'}`}
              >
                {isAi && (
                  <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 leading-relaxed ${
                    isAi
                      ? 'bg-slate-900/90 border border-slate-800 text-slate-200 shadow-md'
                      : 'bg-cyan-600 text-white font-medium ml-auto shadow-md'
                  }`}
                >
                  <div className="whitespace-pre-line">{m.text}</div>

                  {m.suggestedActions && m.suggestedActions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                      {m.suggestedActions.map((act, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(act)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-[11px] text-cyan-300 font-mono hover:bg-cyan-900/60 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3 text-cyan-400" />
                          <span>{act}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 1-Click Bridge: Apply Copilot's Setup directly to Order Terminal */}
                  {isAi && onApplyOrderPlan && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">Chuyển kế hoạch:</span>
                      <button
                        onClick={() => {
                          const isLong = activeSignal?.direction === 'LONG' || (activeSignal as any)?.direction === 'BUY' || !m.text.includes('BÁN KHỐNG');
                          const entry = activeSignal?.entryPrice || calcEntry || currentPrice;
                          const sl = activeSignal?.stopLoss || calcSl;
                          const tp = activeSignal?.tp1 || (isLong ? entry * 1.02 : entry * 0.98);
                          onApplyOrderPlan({
                            side: isLong ? 'BUY' : 'SELL',
                            entryPrice: entry,
                            stopLoss: sl,
                            takeProfit: tp,
                            amountUsdt: Math.max(50, Math.round((calcCustomBalance * (calcRiskPct / 100)) * 5)),
                            leverage: 10,
                          });
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-xs transition-all"
                        title="Tự động điền mức giá Entry, Stop Loss, Take Profit này vào Cửa Sổ Đặt Lệnh"
                      >
                        <Zap className="w-3 h-3 text-yellow-300" />
                        <span>Áp Dụng Lên Cửa Sổ Đặt Lệnh</span>
                      </button>
                    </div>
                  )}

                  {m.engine && (
                    <div className="mt-2 text-[10px] text-slate-500 font-mono text-right flex items-center justify-end gap-1">
                      <span>Engine: {m.engine}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-400 font-mono flex items-center gap-2">
                <span>AI đang phân tích dữ liệu lệnh, quét cấu trúc và tính toán rủi ro...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Strip */}
        <div className="px-4 sm:px-6 py-2 bg-slate-900/60 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <span className="text-[10px] font-mono text-slate-500 uppercase whitespace-nowrap">Gợi ý nhanh:</span>
          {[
            'Đánh giá setup lệnh hiện tại',
            'Tính khối lượng vào lệnh an toàn',
            'Cảnh báo bẫy giá thanh khoản',
            'Dời SL về Breakeven khi nào?',
            'Dòng tiền cá voi gom hàng',
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs whitespace-nowrap transition-colors cursor-pointer border border-slate-700/60 shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Query Input Box */}
        <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Hỏi AI về setup lệnh, rủi ro, bẫy giá thanh khoản..."
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-hidden transition-colors"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputQuery.trim() || isLoading}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 text-xs sm:text-sm shadow-md"
          >
            <span>Gửi</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
