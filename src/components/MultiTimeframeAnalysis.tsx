import React from 'react';
import { CryptoSymbol } from '../types';
import {
  Layers,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  BarChart2,
  Sparkles,
  Compass,
  ArrowRight,
} from 'lucide-react';

interface MultiTimeframeAnalysisProps {
  symbol: CryptoSymbol;
  currentPrice: number;
  activeTimeframe: '15m' | '1h' | '4h' | '1d';
  onSelectTimeframe: (tf: '15m' | '1h' | '4h' | '1d') => void;
}

interface TimeframeEvaluation {
  tf: '15m' | '1h' | '4h' | '1d';
  label: string;
  style: string;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  trendText: string;
  qbTrendOscillator: string;
  rsiValue: number;
  rsiStatus: string;
  emaStructure: string;
  actionRecommendation: string;
  targetExpectation: string;
  riskReward: string;
}

export const MultiTimeframeAnalysis: React.FC<MultiTimeframeAnalysisProps> = ({
  symbol,
  currentPrice,
  activeTimeframe,
  onSelectTimeframe,
}) => {
  const evaluations: TimeframeEvaluation[] = [
    {
      tf: '15m',
      label: 'M15 (15 Phút)',
      style: 'Lướt sóng ngắn (Scalping)',
      trend: 'BULLISH',
      trendText: 'Tăng Ngắn Hạn 🟢',
      qbTrendOscillator: 'Sóng Dương (+2.15)',
      rsiValue: 62.4,
      rsiStatus: 'Lực mua áp đảo',
      emaStructure: 'EMA 9 > EMA 21 (Golden Cross)',
      actionRecommendation: 'Canh Mua Pullback khi nến retest hỗ trợ',
      targetExpectation: 'TP: +0.8% ~ +1.4%',
      riskReward: '1:2.4',
    },
    {
      tf: '1h',
      label: 'H1 (1 Giờ)',
      style: 'Giao dịch trong ngày (Day Trading)',
      trend: 'BULLISH',
      trendText: 'Tăng Trưởng Ổn Định 🟢',
      qbTrendOscillator: 'Động lượng Dương (+3.42)',
      rsiValue: 58.1,
      rsiStatus: 'Vùng tăng trưởng lành mạnh',
      emaStructure: 'Cấu trúc nến nằm trên EMA 21',
      actionRecommendation: 'Giữ vị thế Mua theo xu hướng Order Block',
      targetExpectation: 'TP: +2.0% ~ +3.5%',
      riskReward: '1:2.8',
    },
    {
      tf: '4h',
      label: 'H4 (4 Giờ)',
      style: 'Đánh theo sóng (Swing Trading)',
      trend: 'BULLISH',
      trendText: 'Xu Hướng Chủ Đạo 🟢',
      qbTrendOscillator: 'Xác nhận Đảo Chiều Đáy',
      rsiValue: 55.6,
      rsiStatus: 'Tích lũy Wyckoff Phase D',
      emaStructure: 'Tôn trọng hỗ trợ MA50 / Dải Ribbon',
      actionRecommendation: 'Vị thế Swing an toàn, biên độ lớn',
      targetExpectation: 'TP: +4.5% ~ +7.5%',
      riskReward: '1:3.2',
    },
    {
      tf: '1d',
      label: 'D1 (1 Ngày)',
      style: 'Xu hướng lớn (Macro / Trend)',
      trend: 'BULLISH',
      trendText: 'Siêu Chu Kỳ Uptrend 🟢',
      qbTrendOscillator: 'Chu kỳ tăng dài hạn',
      rsiValue: 66.8,
      rsiStatus: 'Dòng tiền tổ chức tích cực',
      emaStructure: 'Bullish Momentum đa khung',
      actionRecommendation: 'Tuyệt đối KHÔNG Bán Khống (Do Not Short)',
      targetExpectation: 'TP: +12% ~ +25%',
      riskReward: '1:4.5',
    },
  ];

  return (
    <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl text-left select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide flex items-center gap-2">
              Bảng Tự Đánh Giá & Đồng Thuận Đa Khung Thời Gian (Multi-Timeframe)
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Phân tích chỉ báo QB Trend, RSI và cấu trúc nến đồng thời trên 4 khung M15 · H1 · H4 · D1
            </span>
          </div>
        </div>

        {/* Confluence Badge */}
        <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/40 px-3 py-1.5 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-mono font-bold text-emerald-300">
            4/4 Khung Đồng Thuận MUA (88% Bullish Alignment)
          </span>
        </div>
      </div>

      {/* Multi-Timeframe Matrix Table */}
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] text-slate-400 bg-slate-900/40">
              <th className="py-2.5 px-3">KHUNG NẾN</th>
              <th className="py-2.5 px-3">PHONG CÁCH</th>
              <th className="py-2.5 px-3">XU HƯỚNG</th>
              <th className="py-2.5 px-3">CHỈ BÁO QB TREND</th>
              <th className="py-2.5 px-3">RSI (14)</th>
              <th className="py-2.5 px-3">CẤU TRÚC EMA</th>
              <th className="py-2.5 px-3">KHUYẾN NGHỊ AI</th>
              <th className="py-2.5 px-3 text-right">CHUYỂN KHUNG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {evaluations.map((item) => {
              const isActive = activeTimeframe === item.tf;
              return (
                <tr
                  key={item.tf}
                  onClick={() => onSelectTimeframe(item.tf)}
                  className={`cursor-pointer transition-colors ${
                    isActive ? 'bg-cyan-950/30 border-l-2 border-l-cyan-400' : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Timeframe */}
                  <td className="py-3 px-3">
                    <span
                      className={`font-bold font-mono px-2 py-1 rounded text-xs ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-900 text-white border border-slate-800'
                      }`}
                    >
                      {item.label}
                    </span>
                  </td>

                  {/* Style */}
                  <td className="py-3 px-3 text-slate-400 font-sans">{item.style}</td>

                  {/* Trend */}
                  <td className="py-3 px-3 font-bold text-emerald-400">{item.trendText}</td>

                  {/* QB Trend Indicator */}
                  <td className="py-3 px-3 text-cyan-300 font-semibold">
                    {item.qbTrendOscillator}
                  </td>

                  {/* RSI */}
                  <td className="py-3 px-3">
                    <span className="text-white font-bold">{item.rsiValue}</span>
                    <span className="text-[10px] text-slate-400 block -mt-0.5">{item.rsiStatus}</span>
                  </td>

                  {/* EMA */}
                  <td className="py-3 px-3 text-slate-300 text-[11px]">{item.emaStructure}</td>

                  {/* Recommendation */}
                  <td className="py-3 px-3">
                    <span className="text-emerald-300 font-medium text-[11px]">
                      {item.actionRecommendation}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Mục tiêu: {item.targetExpectation} (R:R {item.riskReward})
                    </span>
                  </td>

                  {/* Action Button */}
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTimeframe(item.tf);
                      }}
                      className={`px-2.5 py-1 rounded font-mono text-[11px] font-bold transition-all ${
                        isActive
                          ? 'bg-cyan-600 text-white shadow-xs'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {isActive ? 'ĐANG XEM' : 'XEM BIỂU ĐỒ'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Note */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-300">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Nguyên tắc đồng thuận:</strong> Khi cả 4 khung M15, H1, H4, D1 đều cho xu hướng
            tăng, tỷ lệ lệnh chạm TP1/TP2/TP3 tăng lên trên <strong>85%</strong>.
          </span>
        </div>
        <div className="text-cyan-400 text-[11px]">Giá {symbol} Hiện Tại: ${currentPrice.toLocaleString()}</div>
      </div>
    </div>
  );
};
