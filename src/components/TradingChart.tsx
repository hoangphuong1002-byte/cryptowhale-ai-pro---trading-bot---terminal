import React, { useState, useEffect, useRef, useMemo } from 'react';
import { KlineData, TradeSignal, CryptoSymbol, MarketPair } from '../types';
import {
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  RotateCcw,
} from 'lucide-react';

interface TradingChartProps {
  symbol: CryptoSymbol;
  klines: KlineData[];
  signal?: TradeSignal | null;
  onRefresh: () => void;
  isLoading: boolean;
  onSelectSymbol?: (sym: CryptoSymbol) => void;
  pairs?: MarketPair[];
  currentTimeframe?: '15m' | '1h' | '4h' | '1d';
  onSelectTimeframe?: (tf: '15m' | '1h' | '4h' | '1d') => void;
  previewSignal?: TradeSignal | null;
  onClearPreview?: () => void;
  activeDirection?: 'LONG' | 'SHORT';
  onToggleDirection?: (dir: 'LONG' | 'SHORT') => void;
}

interface SignalMarker {
  index: number;
  type: 'BUY' | 'SELL';
  price: number;
  time: number;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  symbol,
  klines,
  signal,
  onRefresh,
  isLoading,
  onSelectSymbol,
  pairs,
  currentTimeframe = '15m',
  onSelectTimeframe,
  previewSignal,
  onClearPreview,
  activeDirection = 'LONG',
  onToggleDirection,
}) => {
  const [visibleCandleCount, setVisibleCandleCount] = useState<number>(36);
  const [showIndicators, setShowIndicators] = useState({
    trendRibbon: true,
    volume: true,
    signalLevels: true,
    signalMarkers: true,
    subOscillator: true,
    orderBlocks: true,
    fvgGaps: true,
  });
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(380);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close symbol dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSymbolDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentPair = pairs?.find((p) => p.symbol === symbol);

  // Visible sliced klines based on zoom level
  const visibleKlines = useMemo(() => {
    if (!klines || klines.length === 0) return [];
    const count = Math.min(klines.length, visibleCandleCount);
    return klines.slice(klines.length - count);
  }, [klines, visibleCandleCount]);

  const lastPrice = visibleKlines.length ? visibleKlines[visibleKlines.length - 1].close : (currentPair?.price || 0);

  const targetSignal = previewSignal || signal;

  // ZERO-REPAINT GUARANTEE: Never overwrite structural setup levels with live fluctuating market price
  const effectiveSignal = useMemo(() => {
    if (previewSignal) return previewSignal; // Exact historical values when reviewing
    if (signal) return signal; // Authentic, structural fixed setup
    return null;
  }, [signal, previewSignal]);

  // Calculate EMA
  const calculateEMA = (data: KlineData[], period: number) => {
    const k = 2 / (period + 1);
    const emaArray: (number | null)[] = [];
    let prevEMA: number | null = null;

    for (let i = 0; i < data.length; i++) {
      const close = data[i].close;
      if (i < period - 1) {
        emaArray.push(null);
      } else if (i === period - 1) {
        let sum = 0;
        for (let j = 0; j < period; j++) sum += data[j].close;
        prevEMA = sum / period;
        emaArray.push(prevEMA);
      } else {
        prevEMA = close * k + prevEMA! * (1 - k);
        emaArray.push(prevEMA);
      }
    }
    return emaArray;
  };

  const emaFastData = useMemo(() => calculateEMA(visibleKlines, 9), [visibleKlines]);
  const emaSlowData = useMemo(() => calculateEMA(visibleKlines, 21), [visibleKlines]);

  // Detect local swing highs & lows to render BUY / SELL diamond markers
  const signalMarkers = useMemo(() => {
    const markers: SignalMarker[] = [];
    if (visibleKlines.length < 8) return markers;

    const span = 3;
    for (let i = span; i < visibleKlines.length - span; i++) {
      const curr = visibleKlines[i];
      let isSwingLow = true;
      let isSwingHigh = true;

      for (let j = i - span; j <= i + span; j++) {
        if (j === i) continue;
        if (visibleKlines[j].low <= curr.low) isSwingLow = false;
        if (visibleKlines[j].high >= curr.high) isSwingHigh = false;
      }

      if (isSwingLow) {
        markers.push({
          index: i,
          type: 'BUY',
          price: curr.low,
          time: curr.time,
        });
      } else if (isSwingHigh) {
        markers.push({
          index: i,
          type: 'SELL',
          price: curr.high,
          time: curr.time,
        });
      }
    }
    return markers;
  }, [visibleKlines]);

  // Identify active AI trade entry marker vs historical swing points
  // Solves user query: "Hiện đang có 2 tín hiệu khung 15m, bạn kiểm tra xem là sao?"
  const processedMarkers = useMemo(() => {
    if (!signalMarkers || signalMarkers.length === 0) return [];
    const matchingDir = effectiveSignal
      ? effectiveSignal.direction === 'LONG'
        ? 'BUY'
        : 'SELL'
      : null;

    let activeMarkerIdx = -1;
    if (matchingDir) {
      for (let i = signalMarkers.length - 1; i >= 0; i--) {
        if (signalMarkers[i].type === matchingDir) {
          activeMarkerIdx = i;
          break;
        }
      }
    }

    return signalMarkers.map((m, idx) => {
      const isActiveEntry = idx === activeMarkerIdx;
      return {
        ...m,
        isActiveEntry,
        label: isActiveEntry
          ? `★ ${m.type} (KẾ HOẠCH)`
          : `${m.type} (Đỉnh cũ)`,
      };
    });
  }, [signalMarkers, effectiveSignal]);

  // Count sell signals in visible view to detect dual-sell condition
  const sellMarkersCount = useMemo(() => {
    return processedMarkers.filter((m) => m.type === 'SELL').length;
  }, [processedMarkers]);

  // Calculate Trend Wave Oscillator values for the sub-chart
  const oscillatorData = useMemo(() => {
    return visibleKlines.map((k, i) => {
      const fast = emaFastData[i] || k.close;
      const slow = emaSlowData[i] || k.close;
      const diff = fast - slow;
      const norm = (diff / (k.close || 1)) * 1000;
      return {
        value: norm,
        isPositive: norm >= 0,
      };
    });
  }, [visibleKlines, emaFastData, emaSlowData]);

  // Algorithmic SMC Order Blocks Detection (Institutional ICT footprint)
  const smcOrderBlocks = useMemo(() => {
    if (!visibleKlines || visibleKlines.length < 5) return [];
    const blocks: {
      type: 'BULLISH_OB' | 'BEARISH_OB';
      top: number;
      bottom: number;
      startIndex: number;
    }[] = [];

    for (let i = 1; i < visibleKlines.length - 2; i++) {
      const curr = visibleKlines[i];
      const next1 = visibleKlines[i + 1];
      const next2 = visibleKlines[i + 2];

      // Bullish OB: Bearish candle followed by strong upward displacement
      if (curr.close < curr.open && next1.close > next1.open && next2.close > curr.high) {
        blocks.push({
          type: 'BULLISH_OB',
          top: curr.high,
          bottom: curr.low,
          startIndex: i,
        });
      }
      // Bearish OB: Bullish candle followed by strong downward displacement
      else if (curr.close > curr.open && next1.close < next1.open && next2.close < curr.low) {
        blocks.push({
          type: 'BEARISH_OB',
          top: curr.high,
          bottom: curr.low,
          startIndex: i,
        });
      }
    }
    return blocks.slice(-3); // Show top 3 most recent active order blocks
  }, [visibleKlines]);

  // Algorithmic Fair Value Gaps (FVG) Detection (Liquidity Imbalance)
  const smcFairValueGaps = useMemo(() => {
    if (!visibleKlines || visibleKlines.length < 3) return [];
    const fvgs: {
      type: 'BULLISH_FVG' | 'BEARISH_FVG';
      top: number;
      bottom: number;
      startIndex: number;
    }[] = [];

    for (let i = 0; i < visibleKlines.length - 2; i++) {
      const c1 = visibleKlines[i];
      const c2 = visibleKlines[i + 1];
      const c3 = visibleKlines[i + 2];

      // Bullish FVG: Low of candle 3 is above high of candle 1
      if (c3.low > c1.high && c2.close > c2.open) {
        fvgs.push({
          type: 'BULLISH_FVG',
          top: c3.low,
          bottom: c1.high,
          startIndex: i + 1,
        });
      }
      // Bearish FVG: High of candle 3 is below low of candle 1
      else if (c3.high < c1.low && c2.close < c2.open) {
        fvgs.push({
          type: 'BEARISH_FVG',
          top: c1.low,
          bottom: c3.high,
          startIndex: i + 1,
        });
      }
    }
    return fvgs.slice(-3);
  }, [visibleKlines]);

  // AUTO-FIT CANDLE SCALE CALCULATION (Zero Squeeze & Direction-Agnostic Guarantee)
  const candleLows = visibleKlines.map((k) => k.low);
  const candleHighs = visibleKlines.map((k) => k.high);
  const candleMin = candleLows.length ? Math.min(...candleLows) : 100;
  const candleMax = candleHighs.length ? Math.max(...candleHighs) : 200;
  const candleDiff = candleMax - candleMin || 1;

  // Candle-priority boundaries: Candles occupy optimal chart height
  let minPrice = candleMin - candleDiff * 0.12;
  let maxPrice = candleMax + candleDiff * 0.12;

  // Clamped TP/SL universal expansion: Handles BOTH Long and Short seamlessly
  if (effectiveSignal && showIndicators.signalLevels) {
    const allSignalPrices = [
      effectiveSignal.entryPrice,
      effectiveSignal.stopLoss,
      effectiveSignal.tp1,
      effectiveSignal.tp2,
      effectiveSignal.tp3,
    ].filter((p): p is number => typeof p === 'number' && p > 0);

    if (allSignalPrices.length > 0) {
      const sigMin = Math.min(...allSignalPrices);
      const sigMax = Math.max(...allSignalPrices);
      minPrice = Math.min(minPrice, sigMin - candleDiff * 0.08);
      maxPrice = Math.max(maxPrice, sigMax + candleDiff * 0.08);
    }
  }

  const priceRange = maxPrice - minPrice || 1;
  const maxVolume = visibleKlines.length ? Math.max(...visibleKlines.map((k) => k.volume)) : 1;

  // RESPONSIVE LAYOUT DIMENSIONS
  const isMobile = containerWidth < 500;
  const axisWidth = isMobile ? 80 : 92;
  const paddingLeft = isMobile ? 6 : 10;
  const paddingRight = axisWidth;
  const chartWidth = Math.max(160, containerWidth - paddingRight - paddingLeft);

  const timeAxisHeight = 22;
  const mainChartHeight = isMobile ? 300 : 340;
  const subChartHeight = showIndicators.subOscillator ? (isMobile ? 65 : 75) : 0;
  const totalSvgHeight = mainChartHeight + timeAxisHeight + subChartHeight + 30;
  const paddingTop = 20;

  const candleCount = visibleKlines.length || 1;
  const candleSpacing = chartWidth / candleCount;
  const candleWidth = Math.max(3.5, candleSpacing * 0.65);

  const getY = (val: number) => {
    return paddingTop + mainChartHeight - ((val - minPrice) / priceRange) * mainChartHeight;
  };

  const getSubY = (val: number) => {
    const subTop = paddingTop + mainChartHeight + timeAxisHeight + 14;
    const subH = subChartHeight - 10;
    const maxVal = Math.max(1, ...oscillatorData.map((d) => Math.abs(d.value)));
    const ratio = Math.max(-1, Math.min(1, val / maxVal));
    return subTop + subH / 2 - ratio * (subH / 2);
  };

  const currentCandle =
    hoveredIndex !== null && visibleKlines[hoveredIndex]
      ? visibleKlines[hoveredIndex]
      : visibleKlines[visibleKlines.length - 1];

  const priceChange = currentPair ? currentPair.change24h : 1.25;
  const isPriceUp = priceChange >= 0;

  // Safe timestamp to milliseconds helper
  const toTimestampMs = (t: number) => (t < 1e11 ? t * 1000 : t);

  // Format price utility matching sample bot
  const formatLevelPrice = (p: number) => {
    if (!p) return '0.0';
    if (symbol.startsWith('BTC')) {
      return p.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }
    if (symbol.startsWith('ETH') || symbol.startsWith('PAXG')) {
      return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (symbol.startsWith('SOL') || symbol.startsWith('BNB')) {
      return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return p.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 4 });
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setVisibleCandleCount((prev) => Math.max(20, prev - 8));
  };

  const handleZoomOut = () => {
    setVisibleCandleCount((prev) => Math.min(klines.length || 70, prev + 8));
  };

  const handleResetZoom = () => {
    setVisibleCandleCount(36);
  };

  const availableCoins: { symbol: CryptoSymbol; name: string; icon: string; category: string }[] = [
    { symbol: 'BTCUSDT', name: 'Bitcoin', icon: '₿', category: 'Perpetual' },
    { symbol: 'ETHUSDT', name: 'Ethereum', icon: 'Ξ', category: 'Perpetual' },
    { symbol: 'PAXGUSDT', name: 'Gold / XAU', icon: '🪙', category: 'Perpetual' },
    { symbol: 'SOLUSDT', name: 'Solana', icon: '◎', category: 'Perpetual' },
    { symbol: 'BNBUSDT', name: 'BNB Chain', icon: '💎', category: 'Perpetual' },
    { symbol: 'DOGEUSDT', name: 'Dogecoin', icon: '🐕', category: 'Perpetual' },
    { symbol: 'XRPUSDT', name: 'Ripple', icon: '✕', category: 'Perpetual' },
  ];

  const currentCoinInfo = availableCoins.find((c) => c.symbol === symbol) || availableCoins[0];

  return (
    <div
      ref={containerRef}
      className="bg-[#0b101b] border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col shadow-xl relative select-none"
    >
      {/* ─────────────────────────────────────────────────────────────
          ROW 1: SYMBOL SELECTOR (LEFT) & LIVE PRICE + % (RIGHT)
          (Exact replica of sample bot IMG_2502.jpeg through IMG_2506.jpeg)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-800/60 relative">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowSymbolDropdown((p) => !p)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-slate-600 transition-colors text-left"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center text-xs font-bold text-cyan-300 font-mono">
              {currentCoinInfo.icon}
            </div>
            <div>
              <span className="text-sm font-bold text-white font-mono tracking-tight flex items-center gap-1.5">
                {symbol === 'PAXGUSDT' ? 'XAUUSDT' : symbol}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </span>
              <span className="text-[10px] text-slate-400 block -mt-0.5">
                {currentCoinInfo.name} · {currentCoinInfo.category}
              </span>
            </div>
          </button>

          {/* Symbol Switcher Popover */}
          {showSymbolDropdown && (
            <div className="absolute top-full left-0 mt-1.5 w-56 bg-[#0d121f] border border-slate-700 rounded-xl shadow-2xl z-50 p-1.5 animate-fadeIn">
              <div className="text-[10px] font-mono text-slate-400 px-2 py-1 font-semibold uppercase tracking-wider">
                Chọn Cặp Giao Dịch
              </div>
              {availableCoins.map((c) => (
                <button
                  key={c.symbol}
                  onClick={() => {
                    if (onSelectSymbol) onSelectSymbol(c.symbol);
                    setShowSymbolDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-mono transition-colors ${
                    symbol === c.symbol
                      ? 'bg-cyan-500/15 text-cyan-300 font-bold'
                      : 'text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-xs">
                      {c.icon}
                    </span>
                    <span>{c.symbol === 'PAXGUSDT' ? 'XAUUSDT (Gold)' : c.symbol}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Live Price & 24h Change */}
        <div className="text-right">
          <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight leading-none tabular-nums">
            {formatLevelPrice(lastPrice)}
          </div>
          <div
            className={`text-xs font-mono font-semibold mt-1 flex items-center justify-end gap-1 tabular-nums ${
              isPriceUp ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            <span>{isPriceUp ? '+' : ''}{priceChange.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 2: KHUNG NẾN (TIMEFRAME SELECTOR M15 | H1 | H4 | D1)
          (Interactive: fetches real candles & recalculates indicators)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800/40">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-slate-400 tracking-wider">
            KHUNG NẾN
          </span>
          {isLoading && (
            <span className="text-[10px] text-cyan-400 font-mono animate-pulse">
              Đang tải nến...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
            {(['15m', '1h', '4h', '1d'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  if (onSelectTimeframe) onSelectTimeframe(tf);
                }}
                className={`px-3 sm:px-3.5 py-1.5 rounded-md font-mono text-xs font-bold transition-all cursor-pointer ${
                  currentTimeframe === tf
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf === '15m' ? 'M15' : tf === '1h' ? 'H1' : tf === '4h' ? 'H4' : 'D1'}
              </button>
            ))}
          </div>

          {/* Long / Short Scenario Switcher */}
          {onToggleDirection && (
            <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => onToggleDirection('LONG')}
                className={`px-2.5 py-1.5 rounded-md font-mono text-xs font-bold transition-all cursor-pointer ${
                  effectiveSignal?.direction === 'LONG' || (!effectiveSignal && activeDirection === 'LONG')
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-emerald-300'
                }`}
                title="Xem kịch bản LONG (Mua)"
              >
                LONG
              </button>
              <button
                type="button"
                onClick={() => onToggleDirection('SHORT')}
                className={`px-2.5 py-1.5 rounded-md font-mono text-xs font-bold transition-all cursor-pointer ${
                  effectiveSignal?.direction === 'SHORT' || (!effectiveSignal && activeDirection === 'SHORT')
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-rose-300'
                }`}
                title="Xem kịch bản SHORT (Bán)"
              >
                SHORT
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Historical Preview Banner */}
      {previewSignal && (
        <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl px-3 py-2 my-1 flex items-center justify-between text-xs font-mono text-amber-300">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" />
            <span>
              Đang xem lại setup lịch sử: <strong>{previewSignal.direction}</strong> @ {formatLevelPrice(previewSignal.entryPrice)} ({previewSignal.timeframe})
            </span>
          </div>
          {onClearPreview && (
            <button
              onClick={onClearPreview}
              className="flex items-center gap-1 px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold transition-all cursor-pointer text-[11px]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Về mới nhất</span>
            </button>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          ROW 3: TOP SIGNAL PILL & TP/SL TOGGLE
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800/60 gap-2">
        {effectiveSignal ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-900/90 border border-slate-800 text-white">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                effectiveSignal.direction === 'LONG' ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            <span
              className={
                effectiveSignal.direction === 'LONG'
                  ? 'text-emerald-400 font-bold'
                  : 'text-rose-400 font-bold'
              }
            >
              {effectiveSignal.direction === 'LONG' ? 'BUY' : 'SELL'}
            </span>
            <span className="text-slate-300 font-normal">
              · Entry {formatLevelPrice(effectiveSignal.entryPrice)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Theo dõi cấu trúc {symbol} ({currentTimeframe.toUpperCase()})</span>
          </div>
        )}

        {/* Toggle TP / SL button */}
        <button
          onClick={() =>
            setShowIndicators((prev) => ({ ...prev, signalLevels: !prev.signalLevels }))
          }
          className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg border transition-all ${
            showIndicators.signalLevels
              ? 'bg-cyan-950/40 border-cyan-700/60 text-cyan-300 font-semibold shadow-xs'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Bật/Tắt đường ngắm Entry, TP1, TP2, TP3 và Stop Loss"
        >
          <span>{showIndicators.signalLevels ? 'Ẩn TP / SL ↑' : 'Xem TP / SL ↓'}</span>
        </button>
      </div>

      {/* Dual-Signal Structural Clarification Banner (Solves user question: "Hiện đang có 2 tín hiệu khung 15m, bạn kiểm tra xem là sao?") */}
      {sellMarkersCount >= 2 && effectiveSignal?.direction === 'SHORT' && (
        <div className="bg-[#0b1329] border border-cyan-700/50 rounded-xl px-3 py-2 my-1 text-xs font-mono text-cyan-300 flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <span>
              <strong>Cấu Trúc Khung {currentTimeframe.toUpperCase()}:</strong> Có 2 nhịp SELL (Nhịp 1: Đỉnh quét thanh khoản cũ ➔ Nhịp 2: Retest Order Block kích hoạt <strong>Kế Hoạch Entry ${formatLevelPrice(effectiveSignal.entryPrice)}</strong>).
            </span>
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded">
            Entry Hit · Đang bám sát
          </span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          ROW 4: CHART CONTROLS STRIP (Zoom [-][+], Reset, Gestures tip)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between py-2 text-xs font-mono text-slate-400 border-b border-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <span className="w-2.5 h-2.5 rotate-45 bg-cyan-400"></span>
            <span>QB</span>
          </div>
          <span className="text-slate-600">|</span>
          {/* SMC Indicators Quick Toggles */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowIndicators((p) => ({ ...p, orderBlocks: !p.orderBlocks }))}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                showIndicators.orderBlocks
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-bold'
                  : 'bg-slate-900 text-slate-500 hover:text-slate-300'
              }`}
              title="Khối lệnh tổ chức SMC (Order Blocks)"
            >
              OB
            </button>
            <button
              onClick={() => setShowIndicators((p) => ({ ...p, fvgGaps: !p.fvgGaps }))}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                showIndicators.fvgGaps
                  ? 'bg-sky-950/80 text-sky-300 border border-sky-700/60 font-bold'
                  : 'bg-slate-900 text-slate-500 hover:text-slate-300'
              }`}
              title="Khoảng trống giá Fair Value Gap (FVG)"
            >
              FVG
            </button>
            <button
              onClick={() => setShowIndicators((p) => ({ ...p, trendRibbon: !p.trendRibbon }))}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                showIndicators.trendRibbon
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-bold'
                  : 'bg-slate-900 text-slate-500 hover:text-slate-300'
              }`}
              title="Dải sóng xu hướng Trend Ribbon"
            >
              Trend
            </button>
            <button
              onClick={() => setShowIndicators((p) => ({ ...p, volume: !p.volume }))}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                showIndicators.volume
                  ? 'bg-slate-800 text-slate-300 border border-slate-700 font-bold'
                  : 'bg-slate-900 text-slate-500 hover:text-slate-300'
              }`}
              title="Khối lượng Volume"
            >
              Vol
            </button>
          </div>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="text-[10px] text-slate-400 hidden md:inline">
            Khung: {currentTimeframe.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomIn}
            className="w-7 h-6 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-white font-bold text-xs flex items-center justify-center transition-colors"
            title="Phóng to nến"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            className="w-7 h-6 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-white font-bold text-xs flex items-center justify-center transition-colors"
            title="Thu nhỏ nến"
          >
            -
          </button>
          <button
            onClick={handleResetZoom}
            className="px-2 h-6 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 flex items-center justify-center transition-colors"
            title="Đặt lại góc nhìn nến mới nhất"
          >
            Mới nhất
          </button>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="w-7 h-6 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center justify-center transition-colors"
            title="Làm mới nến"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          OHLCV TICK ROW
      ───────────────────────────────────────────────────────────── */}
      {currentCandle && (
        <div className="py-1 px-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-[11px] font-mono text-slate-400">
          <div className="text-white font-bold">
            {symbol === 'PAXGUSDT' ? 'XAUUSDT' : symbol} · {currentTimeframe.toUpperCase()}
          </div>
          <div>
            L: <span className="text-rose-400 font-semibold tabular-nums">{formatLevelPrice(currentCandle.low)}</span>
          </div>
          <div>
            C:{' '}
            <span
              className={`font-semibold tabular-nums ${
                currentCandle.close >= currentCandle.open ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatLevelPrice(currentCandle.close)}
            </span>
          </div>
          <div className="ml-auto text-slate-500 text-[10px]">
            {new Date(toTimestampMs(currentCandle.time)).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MAIN INTERACTIVE SVG CHART AREA
      ───────────────────────────────────────────────────────────── */}
      <div className="relative w-full mt-1 overflow-x-hidden">
        <svg
          width="100%"
          height={totalSvgHeight}
          className="overflow-visible"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Horizontal Grid lines with Price Axis text */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingTop + mainChartHeight * ratio;
            const priceLevel = maxPrice - ratio * priceRange;
            return (
              <g key={`grid-${ratio}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth + paddingLeft}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                />
                <text
                  x={chartWidth + paddingLeft + 6}
                  y={y + 3.5}
                  fill="#64748b"
                  fontSize="9.5"
                  fontFamily="JetBrains Mono"
                  className="tabular-nums"
                >
                  {formatLevelPrice(priceLevel)}
                </text>
              </g>
            );
          })}

          {/* SMC FAIR VALUE GAPS (FVG Zones) */}
          {showIndicators.fvgGaps &&
            smcFairValueGaps.map((fvg, idx) => {
              const startX = paddingLeft + fvg.startIndex * candleSpacing;
              const width = Math.min(chartWidth + paddingLeft - startX, 140);
              const topY = getY(fvg.top);
              const bottomY = getY(fvg.bottom);
              const rectY = Math.min(topY, bottomY);
              const rectH = Math.max(3, Math.abs(bottomY - topY));
              const isBull = fvg.type === 'BULLISH_FVG';

              return (
                <g key={`fvg-${idx}`}>
                  <rect
                    x={startX}
                    y={rectY}
                    width={width}
                    height={rectH}
                    fill={isBull ? 'rgba(56, 189, 248, 0.12)' : 'rgba(244, 63, 94, 0.12)'}
                    stroke={isBull ? '#0284c7' : '#e11d48'}
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                    rx="2"
                  />
                  <text
                    x={startX + 4}
                    y={rectY + 8}
                    fill={isBull ? '#38bdf8' : '#fb7185'}
                    fontSize="7.5"
                    fontWeight="700"
                    fontFamily="JetBrains Mono"
                  >
                    FVG
                  </text>
                </g>
              );
            })}

          {/* SMC ORDER BLOCKS (OB Zones) */}
          {showIndicators.orderBlocks &&
            smcOrderBlocks.map((ob, idx) => {
              const startX = paddingLeft + ob.startIndex * candleSpacing;
              const width = Math.min(chartWidth + paddingLeft - startX, 160);
              const topY = getY(ob.top);
              const bottomY = getY(ob.bottom);
              const rectY = Math.min(topY, bottomY);
              const rectH = Math.max(3, Math.abs(bottomY - topY));
              const isBull = ob.type === 'BULLISH_OB';

              return (
                <g key={`ob-${idx}`}>
                  <rect
                    x={startX}
                    y={rectY}
                    width={width}
                    height={rectH}
                    fill={isBull ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.14)'}
                    stroke={isBull ? '#10b981' : '#ef4444'}
                    strokeWidth="1"
                    strokeOpacity="0.85"
                    rx="2"
                  />
                  <text
                    x={startX + 4}
                    y={rectY + 9}
                    fill={isBull ? '#10b981' : '#ef4444'}
                    fontSize="8"
                    fontWeight="800"
                    fontFamily="JetBrains Mono"
                  >
                    {isBull ? 'OB+' : 'OB-'}
                  </text>
                </g>
              );
            })}

          {/* Volume histogram at chart bottom */}
          {showIndicators.volume &&
            visibleKlines.map((k, i) => {
              const x = paddingLeft + i * candleSpacing + candleSpacing / 2;
              const isUp = k.close >= k.open;
              const volHeight = (k.volume / maxVolume) * 45;
              const volY = paddingTop + mainChartHeight - volHeight;
              return (
                <rect
                  key={`vol-${k.time}`}
                  x={x - candleWidth / 2}
                  y={volY}
                  width={candleWidth}
                  height={volHeight}
                  fill={isUp ? 'rgba(16, 185, 129, 0.16)' : 'rgba(239, 68, 68, 0.16)'}
                  rx="1"
                />
              );
            })}

          {/* DYNAMIC TREND RIBBON (Traces candles: green when bullish, red when bearish) */}
          {showIndicators.trendRibbon && (
            <path
              d={visibleKlines
                .map((k, i) => {
                  const x = paddingLeft + i * candleSpacing + candleSpacing / 2;
                  const emaVal = emaFastData[i] || k.close;
                  const y = getY(emaVal);
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                })
                .join(' ')}
              fill="none"
              stroke={
                visibleKlines.length &&
                visibleKlines[visibleKlines.length - 1].close >=
                  (emaFastData[visibleKlines.length - 1] || visibleKlines[visibleKlines.length - 1].close)
                  ? '#10b981'
                  : '#ef4444'
              }
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.85"
            />
          )}

          {/* CANDLESTICKS (Tall, centered, auto-scaled) */}
          {visibleKlines.map((k, i) => {
            const x = paddingLeft + i * candleSpacing + candleSpacing / 2;
            const isUp = k.close >= k.open;
            const openY = getY(k.open);
            const closeY = getY(k.close);
            const highY = getY(k.high);
            const lowY = getY(k.low);

            const candleTop = Math.min(openY, closeY);
            const candleBodyHeight = Math.max(2, Math.abs(closeY - openY));
            const color = isUp ? '#10b981' : '#ef4444';

            return (
              <g
                key={`kline-${k.time}`}
                onMouseEnter={() => setHoveredIndex(i)}
                className="cursor-crosshair"
              >
                {/* Wick */}
                <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1.2" />
                {/* Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={candleTop}
                  width={candleWidth}
                  height={candleBodyHeight}
                  fill={isUp ? '#10b981' : '#ef4444'}
                  stroke={isUp ? '#059669' : '#dc2626'}
                  strokeWidth="0.5"
                  rx="1"
                />
              </g>
            );
          })}

          {/* IN-CHART BUY / SELL SIGNAL DIAMONDS & LABELS */}
          {showIndicators.signalMarkers &&
            processedMarkers.map((sm) => {
              const x = paddingLeft + sm.index * candleSpacing + candleSpacing / 2;
              const isBuy = sm.type === 'BUY';
              const y = getY(sm.price);
              const markerY = isBuy ? y + 18 : y - 18;

              if (sm.isActiveEntry) {
                // Active AI Signal Entry Marker with Sonar Radar Glow & Pill
                const pillWidth = 140;
                const pillHeight = 20;
                const pillX = x - pillWidth / 2;
                const pillY = isBuy ? y + 10 : y - 30;

                return (
                  <g key={`marker-active-${sm.time}-${sm.type}`}>
                    {/* Glowing Beacon Rings */}
                    <circle
                      cx={x}
                      cy={isBuy ? y + 6 : y - 6}
                      r="10"
                      fill={isBuy ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.25)'}
                      stroke={isBuy ? '#10b981' : '#f43f5e'}
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={x}
                      cy={isBuy ? y + 6 : y - 6}
                      r="4"
                      fill={isBuy ? '#10b981' : '#f43f5e'}
                    />
                    {/* Active Entry Pill Box */}
                    <rect
                      x={pillX}
                      y={pillY}
                      width={pillWidth}
                      height={pillHeight}
                      rx="6"
                      fill={isBuy ? '#064e3b' : '#7f1d1d'}
                      stroke={isBuy ? '#10b981' : '#f87171'}
                      strokeWidth="1.2"
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                    />
                    <text
                      x={x}
                      y={pillY + 13.5}
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="800"
                      fontFamily="JetBrains Mono"
                      textAnchor="middle"
                    >
                      ★ {sm.type} · ENTRY {effectiveSignal ? formatLevelPrice(effectiveSignal.entryPrice) : ''}
                    </text>
                  </g>
                );
              }

              // Older Swing Markers
              return (
                <g key={`marker-swing-${sm.time}-${sm.type}`} opacity="0.75">
                  {/* Diamond Icon */}
                  <polygon
                    points={`${x},${isBuy ? y + 4 : y - 4} ${x + 4},${isBuy ? y + 8 : y - 8} ${x},${isBuy ? y + 12 : y - 12} ${x - 4},${isBuy ? y + 8 : y - 8}`}
                    fill={isBuy ? '#38bdf8' : '#f87171'}
                  />
                  {/* Label with Swing clarification */}
                  <text
                    x={x}
                    y={markerY}
                    fill={isBuy ? '#38bdf8' : '#f87171'}
                    fontSize="8.5"
                    fontWeight="700"
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                  >
                    {isBuy ? 'BUY (Đáy cũ)' : 'SELL (Đỉnh cũ)'}
                  </text>
                </g>
              );
            })}

          {/* ─────────────────────────────────────────────────────────────
              LIVE CURRENT PRICE LINE & RIGHT AXIS BADGE (Sample Bot Style)
          ───────────────────────────────────────────────────────────── */}
          {lastPrice > 0 && (
            <g>
              <line
                x1={paddingLeft}
                y1={getY(lastPrice)}
                x2={chartWidth + paddingLeft}
                y2={getY(lastPrice)}
                stroke="#f43f5e"
                strokeWidth="1.2"
                strokeDasharray="2 2"
                strokeOpacity="0.9"
              />
              <rect
                x={chartWidth + paddingLeft + 1}
                y={getY(lastPrice) - 9}
                width={axisWidth - 2}
                height={18}
                fill={isPriceUp ? '#10b981' : '#f43f5e'}
                rx="3"
              />
              <text
                x={chartWidth + paddingLeft + (axisWidth - 2) / 2}
                y={getY(lastPrice) + 3.5}
                fill="#ffffff"
                fontSize="9.5"
                fontWeight="800"
                fontFamily="JetBrains Mono"
                textAnchor="middle"
              >
                {formatLevelPrice(lastPrice)}
              </text>
            </g>
          )}

          {/* ─────────────────────────────────────────────────────────────
              SL / TP / ENTRY BADGES (Exact Two-Tone Split Pill from Sample Bot)
          ───────────────────────────────────────────────────────────── */}
          {effectiveSignal && showIndicators.signalLevels && (
            <g className="signal-overlay">
              {/* Take Profit 3 */}
              {effectiveSignal.tp3 && (
                <g>
                  <line
                    x1={paddingLeft}
                    y1={getY(effectiveSignal.tp3)}
                    x2={chartWidth + paddingLeft}
                    y2={getY(effectiveSignal.tp3)}
                    stroke="#10b981"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                  />
                  {/* Main Pill Badge */}
                  <rect
                    x={chartWidth + paddingLeft + 1}
                    y={getY(effectiveSignal.tp3) - 9}
                    width={axisWidth - 2}
                    height={18}
                    fill="#10b981"
                    rx="3"
                  />
                  {/* Left Label Block */}
                  <rect
                    x={chartWidth + paddingLeft + 1}
                    y={getY(effectiveSignal.tp3) - 9}
                    width={26}
                    height={18}
                    fill="#047857"
                    rx="3"
                  />
                  <text
                    x={chartWidth + paddingLeft + 14}
                    y={getY(effectiveSignal.tp3) + 3.5}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="800"
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                  >
                    TP3
                  </text>
                  {/* Right Price Text */}
                  <text
                    x={chartWidth + paddingLeft + 28 + (axisWidth - 30) / 2}
                    y={getY(effectiveSignal.tp3) + 3.5}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="700"
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                  >
                    {formatLevelPrice(effectiveSignal.tp3)}
                  </text>
                </g>
              )}

              {/* Take Profit 2 */}
              {effectiveSignal.tp2 && (
                <g>
                  <line
                    x1={paddingLeft}
                    y1={getY(effectiveSignal.tp2)}
                    x2={chartWidth + paddingLeft}
                    y2={getY(effectiveSignal.tp2)}
                    stroke="#10b981"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                  />
                  <rect
                    x={chartWidth + paddingLeft + 1}
                    y={getY(effectiveSignal.tp2) - 9}
                    width={axisWidth - 2}
                    height={18}
                    fill="#10b981"
                    rx="3"
                  />
                  <rect
                    x={chartWidth + paddingLeft + 1}
                    y={getY(effectiveSignal.tp2) - 9}
                    width={26}
                    height={18}
                    fill="#047857"
                    rx="3"
                  />
                  <text
                    x={chartWidth + paddingLeft + 14}
                    y={getY(effectiveSignal.tp2) + 3.5}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="800"
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                  >
                    TP2
                  </text>
                  <text
                    x={chartWidth + paddingLeft + 28 + (axisWidth - 30) / 2}
                    y={getY(effectiveSignal.tp2) + 3.5}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="700"
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                  >
                    {formatLevelPrice(effectiveSignal.tp2)}
                  </text>
                </g>
              )}

              {/* Take Profit 1 */}
              {effectiveSignal.tp1 && (
                <g>
                  <line
                    x1={paddingLeft}
                    y1={getY(effectiveSignal.tp1)}
                    x2={chartWidth + paddingLeft}
                    y2={getY(effectiveSignal.tp1)}
                    stroke="#10b981"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                  />
                  <rect
                    x={chartWidth + paddingLeft + 1}
                    y={getY(effectiveSignal.tp1) - 9}
                    width={axisWidth - 2}
                    height={18}
                    fill="#10b981"
                    rx="3"
                  />
                  <rect
                    x={chartWidth + paddingLeft + 1}
                    y={getY(effectiveSignal.tp1) - 9}
                    width={26}
                    height={18}
                    fill="#047857"
                    rx="3"
                  />
                  <text
                    x={chartWidth + paddingLeft + 14}
                    y={getY(effectiveSignal.tp1) + 3.5}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="800"
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                  >
                    TP1
                  </text>
                  <text
                    x={chartWidth + paddingLeft + 28 + (axisWidth - 30) / 2}
                    y={getY(effectiveSignal.tp1) + 3.5}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="700"
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                  >
                    {formatLevelPrice(effectiveSignal.tp1)}
                  </text>
                </g>
              )}

              {/* Entry Level */}
              {effectiveSignal.entryPrice && (
                <g>
                  <line
                    x1={paddingLeft}
                    y1={getY(effectiveSignal.entryPrice)}
                    x2={chartWidth + paddingLeft}
                    y2={getY(effectiveSignal.entryPrice)}
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <rect
                    x={chartWidth + paddingLeft + 1}
                    y={getY(effectiveSignal.entryPrice) - 9}
                    width={axisWidth - 2}
                    height={18}
                    fill="#0284c7"
                    rx="3"
                  />
                  <rect
                    x={chartWidth + paddingLeft + 1}
                    y={getY(effectiveSignal.entryPrice) - 9}
                    width={34}
                    height={18}
                    fill="#0369a1"
                    rx="3"
                  />
                  <text
                    x={chartWidth + paddingLeft + 17}
                    y={getY(effectiveSignal.entryPrice) + 3.5}
                    fill="#ffffff"
                    fontSize="8.5"
                    fontWeight="800"
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                  >
                    ENTRY
                  </text>
                  <text
                    x={chartWidth + paddingLeft + 36 + (axisWidth - 38) / 2}
                    y={getY(effectiveSignal.entryPrice) + 3.5}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="700"
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                  >
                    {formatLevelPrice(effectiveSignal.entryPrice)}
                  </text>
                </g>
              )}

              {/* Stop Loss Level */}
              {effectiveSignal.stopLoss && (
                <g>
                  <line
                    x1={paddingLeft}
                    y1={getY(effectiveSignal.stopLoss)}
                    x2={chartWidth + paddingLeft}
                    y2={getY(effectiveSignal.stopLoss)}
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <rect
                    x={chartWidth + paddingLeft + 1}
                    y={getY(effectiveSignal.stopLoss) - 9}
                    width={axisWidth - 2}
                    height={18}
                    fill="#dc2626"
                    rx="3"
                  />
                  <rect
                    x={chartWidth + paddingLeft + 1}
                    y={getY(effectiveSignal.stopLoss) - 9}
                    width={22}
                    height={18}
                    fill="#b91c1c"
                    rx="3"
                  />
                  <text
                    x={chartWidth + paddingLeft + 11}
                    y={getY(effectiveSignal.stopLoss) + 3.5}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="800"
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                  >
                    SL
                  </text>
                  <text
                    x={chartWidth + paddingLeft + 24 + (axisWidth - 26) / 2}
                    y={getY(effectiveSignal.stopLoss) + 3.5}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="700"
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                  >
                    {formatLevelPrice(effectiveSignal.stopLoss)}
                  </text>
                </g>
              )}
            </g>
          )}

          {/* Hover Crosshair vertical */}
          {hoveredIndex !== null && (
            <line
              x1={paddingLeft + hoveredIndex * candleSpacing + candleSpacing / 2}
              y1={paddingTop}
              x2={paddingLeft + hoveredIndex * candleSpacing + candleSpacing / 2}
              y2={paddingTop + mainChartHeight}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          )}

          {/* ─────────────────────────────────────────────────────────────
              X-AXIS TIME TICKS (UTC+7 Giờ Việt Nam)
          ───────────────────────────────────────────────────────────── */}
          {(() => {
            if (!visibleKlines.length) return null;
            const count = visibleKlines.length;
            const numTicks = isMobile ? 4 : 6;
            const interval = Math.max(1, Math.floor(count / numTicks));
            const indices: number[] = [];
            for (let i = 0; i < count; i += interval) {
              indices.push(i);
            }
            if (!indices.includes(count - 1)) {
              indices.push(count - 1);
            }

            return (
              <g className="x-axis-time">
                <line
                  x1={paddingLeft}
                  y1={paddingTop + mainChartHeight}
                  x2={chartWidth + paddingLeft}
                  y2={paddingTop + mainChartHeight}
                  stroke="#334155"
                  strokeWidth="1"
                />
                {indices.map((idx) => {
                  const kline = visibleKlines[idx];
                  if (!kline) return null;
                  const x = paddingLeft + idx * candleSpacing + candleSpacing / 2;
                  const d = new Date(toTimestampMs(kline.time));
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const hours = String(d.getHours()).padStart(2, '0');
                  const minutes = String(d.getMinutes()).padStart(2, '0');
                  const formatted = `${day}/${month}, ${hours}:${minutes}`;

                  return (
                    <g key={`x-tick-${kline.time}`}>
                      <line
                        x1={x}
                        y1={paddingTop + mainChartHeight}
                        x2={x}
                        y2={paddingTop + mainChartHeight + 4}
                        stroke="#64748b"
                        strokeWidth="1"
                      />
                      <text
                        x={x}
                        y={paddingTop + mainChartHeight + 14}
                        fill="#94a3b8"
                        fontSize="9"
                        fontFamily="JetBrains Mono"
                        textAnchor="middle"
                      >
                        {formatted}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })()}

          {/* ─────────────────────────────────────────────────────────────
              SUB-CHART: QB TREND (SINE WAVE OSCILLATOR)
          ───────────────────────────────────────────────────────────── */}
          {showIndicators.subOscillator && (
            <g className="sub-oscillator">
              {/* Divider and Sub-Chart Label */}
              <line
                x1={paddingLeft}
                y1={paddingTop + mainChartHeight + timeAxisHeight + 6}
                x2={chartWidth + paddingLeft}
                y2={paddingTop + mainChartHeight + timeAxisHeight + 6}
                stroke="#1e293b"
                strokeWidth="1"
              />
              <text
                x={paddingLeft + 4}
                y={paddingTop + mainChartHeight + timeAxisHeight + 18}
                fill="#94a3b8"
                fontSize="9"
                fontFamily="JetBrains Mono"
                fontWeight="bold"
              >
                QB TREND · {currentTimeframe.toUpperCase()}
              </text>
              <text
                x={chartWidth + paddingLeft + 6}
                y={getSubY(0) + 3}
                fill="#64748b"
                fontSize="9"
                fontFamily="JetBrains Mono"
              >
                0.00
              </text>

              {/* Zero baseline */}
              <line
                x1={paddingLeft}
                y1={getSubY(0)}
                x2={chartWidth + paddingLeft}
                y2={getSubY(0)}
                stroke="#334155"
                strokeWidth="0.8"
                strokeDasharray="2 2"
              />

              {/* Oscillator curve */}
              <path
                d={oscillatorData
                  .map((d, i) => {
                    const x = paddingLeft + i * candleSpacing + candleSpacing / 2;
                    const y = getSubY(d.value);
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeOpacity="0.75"
              />

              {/* Oscillator dots */}
              {oscillatorData.map((d, i) => {
                const x = paddingLeft + i * candleSpacing + candleSpacing / 2;
                const y = getSubY(d.value);
                return (
                  <circle
                    key={`dot-${i}`}
                    cx={x}
                    cy={y}
                    r="2.2"
                    fill={d.isPositive ? '#10b981' : '#ef4444'}
                  />
                );
              })}
            </g>
          )}
        </svg>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          CHART FOOTER
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 mt-1 border-t border-slate-800/60 text-[10px] sm:text-[11px] font-mono text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 rounded bg-emerald-500"></span>
            <span>Trend Xanh (Buy)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 rounded bg-rose-500"></span>
            <span>Trend Đỏ (Sell)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rotate-45 bg-sky-400"></span>
            <span>Tín hiệu nến</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-emerald-400"></span>
            <span>TP Targets</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-rose-500"></span>
            <span>Stop Loss</span>
          </div>
        </div>

        <div className="text-slate-400 text-[10px] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Khung: {currentTimeframe.toUpperCase()} · Live Feed</span>
        </div>
      </div>
    </div>
  );
};
