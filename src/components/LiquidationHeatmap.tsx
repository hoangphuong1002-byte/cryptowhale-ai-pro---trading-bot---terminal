import React from 'react';
import { LiquidationHeatmapData, CryptoSymbol } from '../types';
import { Flame, Magnet, Compass, Layers, AlertCircle, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { getCurrentTradingSessionInfo } from '../services/liquidation';

interface LiquidationHeatmapProps {
  data: LiquidationHeatmapData;
  symbol: CryptoSymbol;
}

export const LiquidationHeatmap: React.FC<LiquidationHeatmapProps> = ({ data, symbol }) => {
  const sessionInfo = getCurrentTradingSessionInfo();

  const formatUsd = (val: number) => {
    if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    return `$${val.toLocaleString()}`;
  };

  const maxClusterVolume = Math.max(...data.clusters.map((c) => c.volumeUsd), 1);

  return (
    <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              Bản Đồ Nhiệt Thanh Lý (Liquidation Heatmap)
              <span className="text-[10px] text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                COINGLASS / BINANCE FUTURES DATA
              </span>
            </h3>
            <span className="text-xs text-slate-400">
              Nhận diện các vùng tập trung lệnh thanh lý đòn bẩy cao (50x-100x) mà các nhà tạo lập thị trường (MM) săn quét
            </span>
          </div>
        </div>

        {/* Live Trading Session badge */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Phiên:</span>
          <span className="text-cyan-300 font-bold">{sessionInfo.sessionName}</span>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded">
            {sessionInfo.activeKillzone}
          </span>
        </div>
      </div>

      {/* Liquidity Magnet Callout */}
      <div className="bg-slate-900/60 border border-cyan-800/40 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Magnet className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
              NAM CHÂM THANH KHOẢN (LIQUIDITY MAGNET):
              <span className="text-cyan-300 tabular-nums">${data.closestMagnetPrice.toLocaleString()}</span>
            </span>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Cụm thanh lý lớn nhất đang nằm ở hướng{' '}
              <strong className={data.magnetDirection === 'UP' ? 'text-emerald-400' : 'text-rose-400'}>
                {data.magnetDirection === 'UP' ? 'PHÍA TRÊN (Săn quét Short)' : 'PHÍA DƯỚI (Săn quét Long)'}
              </strong>
              . Thuật toán tạo lập thị trường thường có xu hướng kéo giá về vùng này trước khi đảo chiều.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-400 block">TỔNG SHORT LIQ (TRÊN)</span>
            <span className="text-amber-400 font-bold tabular-nums">{formatUsd(data.totalShortLiqUsd)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">TỔNG LONG LIQ (DƯỚI)</span>
            <span className="text-emerald-400 font-bold tabular-nums">{formatUsd(data.totalLongLiqUsd)}</span>
          </div>
        </div>
      </div>

      {/* Visual Heatmap Depth Bars */}
      <div className="flex flex-col gap-2 pt-1 font-mono text-xs">
        <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800/60">
          <span>VÙNG GIÁ THANH LÝ</span>
          <span>QUY MÔ ĐÒN BẨY BỊ THANH LÝ (USD)</span>
          <span>KHOẢNG CÁCH</span>
        </div>

        {data.clusters.map((cluster, i) => {
          const isShort = cluster.side === 'SHORT_LIQ';
          const isCurrentPriceCut =
            i > 0 &&
            data.clusters[i - 1].side === 'SHORT_LIQ' &&
            cluster.side === 'LONG_LIQ';

          const barWidth = Math.round((cluster.volumeUsd / maxClusterVolume) * 100);

          return (
            <React.Fragment key={`${cluster.priceLevel}-${i}`}>
              {/* Market price divider */}
              {isCurrentPriceCut && (
                <div className="my-2 py-1.5 px-3 bg-cyan-950/40 border border-cyan-800/60 rounded-md flex items-center justify-between text-xs text-cyan-300">
                  <span className="font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    GIÁ THỊ TRƯỜNG HIỆN TẠI
                  </span>
                  <span className="text-sm font-bold font-mono tabular-nums text-white">
                    ${data.currentPrice.toLocaleString()} USDT
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 p-1.5 rounded hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-2 w-32">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isShort
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {isShort ? 'SHORT' : 'LONG'}
                  </span>
                  <span className="font-bold text-white tabular-nums">
                    ${cluster.priceLevel.toLocaleString()}
                  </span>
                </div>

                {/* Progress bar visualizer */}
                <div className="flex-1 max-w-md bg-slate-900 h-3.5 rounded-full overflow-hidden flex items-center">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      cluster.intensity === 'EXTREME'
                        ? isShort
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                          : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                        : isShort
                        ? 'bg-amber-500/60'
                        : 'bg-emerald-500/60'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                <div className="w-28 text-right font-bold tabular-nums">
                  <span className={isShort ? 'text-amber-300' : 'text-emerald-300'}>
                    {formatUsd(cluster.volumeUsd)}
                  </span>
                </div>

                <div className="w-16 text-right text-[11px] text-slate-400 tabular-nums">
                  {isShort ? '+' : '-'}
                  {cluster.distancePercent}%
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
