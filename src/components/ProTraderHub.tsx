import React, { useState } from 'react';
import { ProTraderProfile, CryptoSymbol, BacktestResult } from '../types';
import { runStrategyBacktest } from '../services/backtest';
import {
  GraduationCap,
  Award,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Brain,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  Play,
  RotateCcw,
  Check,
  X,
  Target,
  BarChart,
} from 'lucide-react';

interface ProTraderHubProps {
  activeStyles: string[];
  onToggleStyle: (styleName: string) => void;
  onRunAiLearningStudy: (trader: ProTraderProfile) => void;
  isAnalyzing: boolean;
}

export const defaultProTraders: ProTraderProfile[] = [
  {
    id: 'trader-gcr',
    name: 'GCR (Gigantic-Cass-Rebirth)',
    tagline: 'Huyền Thoại Contrarian & Quét Thanh Khoản Top Crypto',
    specialty: 'Chu Kỳ Vĩ Mô, Bắt Đáy Đỉnh & High-Beta (SOL/BTC)',
    methodology: [
      'Giao dịch ngược đám đông khi Open Interest đạt đỉnh',
      'Định vị vùng thanh khoản đòn bẩy cao trước khi giá quét sạch',
      'Chiến lược cược bất đối xứng: Rủi ro nhỏ, lợi nhuận cấp số nhân',
    ],
    historicalWinRate: 76.5,
    avgRiskReward: '1:3.4',
    active: true,
    avatarSeed: 'GCR',
    description:
      'GCR biến 1,000 USD thành hơn 100 triệu USD bằng tư duy phản trực giác, nhận biết bẫy tâm lý fomo của đám đông và kiên nhẫn săn lùng các vùng thanh khoản cạn kiệt.',
    coreRule: 'Mua khi mọi người sợ hãi cùng cực, bán khi thị trường hưng phấn vô lý với đòn bẩy cao.',
  },
  {
    id: 'trader-ict',
    name: 'ICT / Smart Money Concepts (SMC)',
    tagline: 'Dòng Tiền Thông Minh & Thuật Toán Săn Thanh Khoản (Algo)',
    specialty: 'Order Blocks (OB), Fair Value Gaps (FVG) & Killzones',
    methodology: [
      'Quét đỉnh/đáy phiên Á (Asia Range Liquidity Sweep)',
      'Xác nhận cấu trúc chuyển dịch thị trường (Market Structure Shift - MSS)',
      'Bắt điểm hồi quy tối ưu OTE (Optimal Trade Entry 0.62 - 0.79 Fib)',
    ],
    historicalWinRate: 71.8,
    avgRiskReward: '1:3.0',
    active: true,
    avatarSeed: 'ICT',
    description:
      'Phương pháp chuẩn mực phân tích cách thuật toán liên ngân hàng và các tạo lập thị trường (MM) săn quét Stop Loss của Retail trước khi đẩy giá theo xu hướng thật.',
    coreRule: 'Giá di chuyển để tìm kiếm thanh khoản (Liquidity) và lấp đầy các khoảng trống giá (Fair Value Gaps).',
  },
  {
    id: 'trader-brandt',
    name: 'Peter Brandt',
    tagline: '50 Năm Kinh Nghiệm Giao Dịch Hàng Hóa & Vàng / BTC',
    specialty: 'Phá Vỡ Mô Hình Cổ Điển (Factor Trading) & Vàng (XAU)',
    methodology: [
      'Nhận diện kênh giá mở rộng, tam giác tích lũy và Head & Shoulders',
      'Quy tắc quản trị vốn nghiêm ngặt: Rủi ro tối đa 1% tài khoản mỗi lệnh',
      'Gồng lãi theo xu hướng lớn vĩ mô (Macro Trend Following)',
    ],
    historicalWinRate: 64.2,
    avgRiskReward: '1:4.2',
    active: true,
    avatarSeed: 'PB',
    description:
      'Nhà giao dịch huyền thoại phố Wall từ thập niên 1970, chuyên gia hàng đầu về phân tích biểu đồ vàng, tiền tệ và tài sản số với tỷ lệ lợi nhuận/rủi ro vượt trội.',
    coreRule: 'Cắt lỗ nhanh như một cỗ máy, để lợi nhuận chạy tự do đến khi cấu trúc bị phá vỡ hoàn toàn.',
  },
  {
    id: 'trader-donalt',
    name: 'DonAlt & Pentoshi',
    tagline: 'Bậc Thầy Giao Dịch Khung Lớn (HTF Swing Trading)',
    specialty: 'Lật Ngưỡng Hỗ Trợ/Kháng Cự (S/R Flips) & Khung Tuần/Ngày',
    methodology: [
      'Bỏ qua nhiễu khung nhỏ, chỉ tập trung vào mức cản tuần/ngày',
      'Đợi nến đóng cửa xác nhận phá vỡ (Break & Retest)',
      'Không bao giờ trung bình giá xuống khi đã chạm Stop Loss',
    ],
    historicalWinRate: 69.4,
    avgRiskReward: '1:2.8',
    active: false,
    avatarSeed: 'DA',
    description:
      'Cặp đôi trader có tầm ảnh hưởng lớn nhất thị trường crypto, nổi tiếng với các cú bắt đáy chu kỳ Bitcoin tại 3.2k (2018) và 16k (2022).',
    coreRule: 'Kiên nhẫn là chìa khóa. 80% thời gian là chờ đợi giá về đúng điểm vào lệnh hoàn hảo.',
  },
  {
    id: 'trader-wyckoff',
    name: 'Richard Wyckoff',
    tagline: 'Quy Luật Cung Cầu & Mô Hình Tích Lũy / Phân Phối',
    specialty: 'Phase C Spring, Cú Rũ Hàng Upthrust & Khối Lượng VSA',
    methodology: [
      'Phát hiện pha tích lũy gom hàng ngầm của tay to (Composite Man)',
      'Điểm Spring rũ bỏ thanh khoản cuối cùng trước khi vào pha Markup',
      'Phân tích chênh lệch khối lượng và bước giá (Volume Spread Analysis)',
    ],
    historicalWinRate: 74.0,
    avgRiskReward: '1:3.2',
    active: true,
    avatarSeed: 'RW',
    description:
      'Phương pháp kinh điển hơn 100 năm qua vẫn giữ nguyên giá trị cốt lõi, giải mã chính xác dấu chân của các tổ chức tài chính lớn và cá mập thị trường.',
    coreRule: 'Khối lượng giao dịch là bằng chứng duy nhất không thể làm giả của dòng tiền tổ chức.',
  },
];

export const ProTraderHub: React.FC<ProTraderHubProps> = ({
  activeStyles,
  onToggleStyle,
  onRunAiLearningStudy,
  isAnalyzing,
}) => {
  const [selectedTrader, setSelectedTrader] = useState<ProTraderProfile>(defaultProTraders[0]);

  const [backtestSymbol, setBacktestSymbol] = useState<CryptoSymbol>('BTCUSDT');
  const [backtestResult, setBacktestResult] = useState<BacktestResult>(() =>
    runStrategyBacktest(defaultProTraders[0].name, 'BTCUSDT', 30)
  );
  const [isRunningBacktest, setIsRunningBacktest] = useState(false);

  const handleRunBacktest = () => {
    setIsRunningBacktest(true);
    setTimeout(() => {
      const res = runStrategyBacktest(selectedTrader.name, backtestSymbol, 30);
      setBacktestResult(res);
      setIsRunningBacktest(false);
    }, 450);
  };

  // Min/max for equity curve SVG
  const eqMin = Math.min(...backtestResult.equityCurve.map((e) => e.equity)) * 0.98;
  const eqMax = Math.max(...backtestResult.equityCurve.map((e) => e.equity)) * 1.02;
  const eqRange = eqMax - eqMin || 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Intro Hero Banner */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-5 relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2">
            <Brain className="w-4 h-4" />
            <span>AI QUANTUM DEEP LEARNING & TRADER SYNTHESIS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Học Tập & Kế Thừa Chiến Lược Từ Các Trader Chuyên Nghiệp Hàng Đầu
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Hệ thống AI tích hợp triết lý từ các huyền thoại thị trường (SMC, GCR, Peter Brandt, Wyckoff). Bạn có thể kích hoạt các trường phái trading cụ thể để bot áp dụng vào thuật toán tạo tín hiệu vào lệnh (Entry, SL, TP) với độ chuẩn xác tối ưu.
          </p>
        </div>
      </div>

      {/* Grid of Traders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left List of Profiles */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Danh Sách Trường Phái (Nhấp để xem & kích hoạt):
          </span>

          {defaultProTraders.map((trader) => {
            const isSelected = selectedTrader.id === trader.id;
            const isEnabled = activeStyles.includes(trader.name);

            return (
              <div
                key={trader.id}
                onClick={() => setSelectedTrader(trader)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                    : 'bg-[#0b101b] border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 text-xs">
                      {trader.avatarSeed}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono">{trader.name}</h4>
                      <span className="text-[10px] text-slate-400">{trader.specialty}</span>
                    </div>
                  </div>

                  {/* Toggle active switch */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStyle(trader.name);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all ${
                      isEnabled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {isEnabled ? 'ĐÃ BẬT' : 'TẮT'}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/50">
                  <span>Win Rate: <strong className="text-emerald-400">{trader.historicalWinRate}%</strong></span>
                  <span>Avg R:R: <strong className="text-cyan-400">{trader.avgRiskReward}</strong></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Details Panel for Selected Trader */}
        <div className="lg:col-span-2 bg-[#0b101b] border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white font-mono">{selectedTrader.name}</h3>
                  <span className="text-xs text-cyan-400 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    {selectedTrader.specialty}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{selectedTrader.tagline}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-400 block">TỶ LỆ THẮNG BÌNH QUÂN</span>
                  <span className="text-base font-bold text-emerald-400 tabular-nums">
                    {selectedTrader.historicalWinRate}%
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-400 block">R:R TRUNG BÌNH</span>
                  <span className="text-base font-bold text-cyan-400 tabular-nums">
                    {selectedTrader.avgRiskReward}
                  </span>
                </div>
              </div>
            </div>

            {/* Philosophy Description */}
            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-white block mb-1">Mô Tả & Bối Cảnh Lịch Sử:</span>
              <p>{selectedTrader.description}</p>
            </div>

            {/* Core Golden Rule */}
            <div className="bg-amber-950/20 border border-amber-900/40 rounded-lg p-3">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-1 font-mono">
                <Award className="w-4 h-4" /> NGUYÊN TẮC VÀNG BẤT DI BẤT DỊCH:
              </span>
              <p className="text-xs text-amber-200/90 italic">"{selectedTrader.coreRule}"</p>
            </div>

            {/* Methodology points */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-white">Quy Trình Vào Lệnh & Quản Trị Rủi Ro Cốt Lõi:</span>
              <ul className="flex flex-col gap-2">
                {selectedTrader.methodology.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action to prompt AI to generate signal based on this trader */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-400 font-mono">
              Trạng thái tích hợp:{' '}
              <strong className={activeStyles.includes(selectedTrader.name) ? 'text-emerald-400' : 'text-slate-400'}>
                {activeStyles.includes(selectedTrader.name) ? 'Đang kích hoạt trong AI Bot' : 'Chưa kích hoạt'}
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleStyle(selectedTrader.name)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  activeStyles.includes(selectedTrader.name)
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                }`}
              >
                {activeStyles.includes(selectedTrader.name) ? 'Tắt Khỏi Bot' : 'Bật Cho Bot'}
              </button>

              <button
                onClick={() => onRunAiLearningStudy(selectedTrader)}
                disabled={isAnalyzing}
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>{isAnalyzing ? 'Đang Quét AI...' : 'Tạo Tín Hiệu Theo Phong Cách Này'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: 30-Day Strategy Historical Backtesting Engine */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-5 flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BarChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                Bộ Máy Kiểm Nghiệm Quá Khứ 30 Ngày (Backtesting Simulator)
                <span className="text-[10px] text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  REALISTIC SLIPPAGE & FEES
                </span>
              </h3>
              <span className="text-xs text-slate-400">
                Kiểm chứng tỷ lệ thắng, đường cong vốn và drawdown của phương pháp{' '}
                <strong className="text-white">{selectedTrader.name}</strong> trước khi giao dịch vốn thật.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Symbol selector */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-mono">
              {(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'PAXGUSDT'] as const).map((sym) => (
                <button
                  key={sym}
                  onClick={() => setBacktestSymbol(sym)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                    backtestSymbol === sym ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sym.replace('USDT', '')}
                </button>
              ))}
            </div>

            <button
              onClick={handleRunBacktest}
              disabled={isRunningBacktest}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-semibold transition-colors shadow-xs"
            >
              <Play className={`w-3.5 h-3.5 ${isRunningBacktest ? 'animate-spin' : ''}`} />
              <span>{isRunningBacktest ? 'Đang Tính...' : 'Chạy Backtest'}</span>
            </button>
          </div>
        </div>

        {/* Backtest KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
            <span className="text-[10px] text-slate-400 font-mono block">TỶ LỆ THẮNG (WIN RATE)</span>
            <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums mt-0.5 block">
              {backtestResult.winRatePercent}%
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {backtestResult.trades.filter((t) => t.result === 'WIN').length} Thắng /{' '}
              {backtestResult.trades.filter((t) => t.result === 'LOSS').length} Thua
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
            <span className="text-[10px] text-slate-400 font-mono block">LỢI NHUẬN RÒNG (30D)</span>
            <span className="text-xl font-bold font-mono text-cyan-300 tabular-nums mt-0.5 block">
              +{backtestResult.totalReturnPercent}%
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Vốn $10k → ${(10000 * (1 + backtestResult.totalReturnPercent / 100)).toFixed(0)}</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
            <span className="text-[10px] text-slate-400 font-mono block">PROFIT FACTOR</span>
            <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums mt-0.5 block">
              {backtestResult.profitFactor}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Tỷ số Lãi/Lỗ ròng</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
            <span className="text-[10px] text-slate-400 font-mono block">MAX DRAWDOWN</span>
            <span className="text-xl font-bold font-mono text-rose-400 tabular-nums mt-0.5 block">
              -{backtestResult.maxDrawdownPercent}%
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Độ sụt giảm tối đa</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 font-mono block">SHARPE RATIO</span>
            <span className="text-xl font-bold font-mono text-white tabular-nums mt-0.5 block">
              {backtestResult.sharpeRatio}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Hiệu quả rủi ro</span>
          </div>
        </div>

        {/* Equity Curve SVG */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Đường cong vốn mô phỏng 30 ngày (Khởi đầu: $10,000 USDT)</span>
            <span className="text-emerald-400 font-semibold">
              Đỉnh cao nhất: ${Math.max(...backtestResult.equityCurve.map((e) => e.equity)).toLocaleString()}
            </span>
          </div>

          <div className="h-28 w-full pt-1">
            <svg className="w-full h-full overflow-visible">
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                points={backtestResult.equityCurve
                  .map((pt, idx) => {
                    const x = (idx / (backtestResult.equityCurve.length - 1)) * 96 + 2;
                    const y = 95 - ((pt.equity - eqMin) / eqRange) * 85;
                    return `${x}%,${y}`;
                  })
                  .join(' ')}
              />
              {backtestResult.equityCurve.map((pt, idx) => {
                const x = (idx / (backtestResult.equityCurve.length - 1)) * 96 + 2;
                const y = 95 - ((pt.equity - eqMin) / eqRange) * 85;
                return (
                  <circle
                    key={idx}
                    cx={`${x}%`}
                    cy={y}
                    r="2.5"
                    fill="#10b981"
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Backtest Recent Trade Logs */}
        <div className="overflow-x-auto no-scrollbar">
          <span className="text-xs font-mono text-slate-400 block mb-2 font-semibold">
            Chi Tiết Lệnh Mô Phỏng Gần Nhất ({backtestResult.trades.length} Lệnh):
          </span>
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400 bg-slate-900/50">
                <th className="py-2 px-3">MÃ LỆNH</th>
                <th className="py-2 px-3">LỆNH</th>
                <th className="py-2 px-3">ENTRY</th>
                <th className="py-2 px-3">EXIT</th>
                <th className="py-2 px-3">LỢI NHUẬN</th>
                <th className="py-2 px-3">LÝ DO THOÁT LỆNH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {backtestResult.trades.slice(0, 7).map((t) => {
                const isWin = t.result === 'WIN';
                const isBE = t.exitReason === 'BREAKEVEN';
                return (
                  <tr key={t.id} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-slate-400">{t.id}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t.direction === 'LONG'
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-rose-400 bg-rose-500/10'
                        }`}
                      >
                        {t.direction}
                      </span>
                    </td>
                    <td className="py-2 px-3">${t.entryPrice.toLocaleString()}</td>
                    <td className="py-2 px-3">${t.exitPrice.toLocaleString()}</td>
                    <td className="py-2 px-3 font-bold tabular-nums">
                      <span className={isWin ? 'text-emerald-400' : isBE ? 'text-slate-400' : 'text-rose-400'}>
                        {isWin ? '+' : ''}${t.pnlUsdt.toFixed(2)} ({isWin ? '+' : ''}{t.pnlPercent}%)
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          t.exitReason === 'TP3_RUNNER'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : t.exitReason === 'TP1_TP2'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : t.exitReason === 'BREAKEVEN'
                            ? 'bg-cyan-500/10 text-cyan-300'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {t.exitReason === 'TP3_RUNNER'
                          ? '🎯 Đạt TP3 Runner'
                          : t.exitReason === 'TP1_TP2'
                          ? '🎯 Chốt Lời TP1+TP2'
                          : t.exitReason === 'BREAKEVEN'
                          ? '🛡️ Dời Hòa Vốn (Free-Ride)'
                          : '🛑 Chạm Dừng Lỗ (SL)'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
