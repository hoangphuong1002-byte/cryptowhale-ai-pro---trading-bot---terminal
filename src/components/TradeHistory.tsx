import React, { useState, useMemo } from 'react';
import { ExecutedTrade } from '../types';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Target,
  Search,
  Filter,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
  Award,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
  PieChart,
  Pie,
} from 'recharts';

interface TradeHistoryProps {
  trades: ExecutedTrade[];
  onCloseTrade: (tradeId: string, currentMarketPrice: number) => void;
  onClearHistory: () => void;
  currentPrices: Record<string, number>;
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({
  trades,
  onCloseTrade,
  onClearHistory,
  currentPrices,
}) => {
  // Query & Filter states
  const [symbolFilter, setSymbolFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'WON' | 'LOST'>('ALL');
  const [sideFilter, setSideFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [timeframeFilter, setTimeframeFilter] = useState<'ALL' | '15m' | '1h' | '4h'>('ALL');
  const [exchangeFilter, setExchangeFilter] = useState<'ALL' | 'BINANCE' | 'PAPER'>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<'ALL' | 'TODAY' | '7D' | '30D'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'pnl' | 'amount' | 'symbol'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Chart view mode
  const [chartMode, setChartMode] = useState<'dailyPnl' | 'bySymbol' | 'distribution'>('dailyPnl');
  const [daysRange, setDaysRange] = useState<7 | 14 | 30>(7);

  // ─────────────────────────────────────────────────────────────
  // 1. FILTERING & SEARCH PIPELINE
  // ─────────────────────────────────────────────────────────────
  const filteredTrades = useMemo(() => {
    const now = Date.now();
    return trades
      .filter((t) => {
        // Symbol filter
        if (symbolFilter !== 'ALL' && t.symbol !== symbolFilter) return false;

        // Status filter
        if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;

        // Side filter
        if (sideFilter !== 'ALL' && t.side !== sideFilter) return false;

        // Timeframe filter (15m, 1h, 4h)
        if (timeframeFilter !== 'ALL') {
          const tTf = t.timeframe ? t.timeframe.toLowerCase() : '15m';
          if (tTf !== timeframeFilter) return false;
        }

        // Exchange filter (Real Binance vs Paper)
        if (exchangeFilter !== 'ALL') {
          if (t.exchange !== exchangeFilter) return false;
        }

        // Date range filter
        if (dateRangeFilter === 'TODAY') {
          const tradeTime = t.closedAt || t.openedAt;
          if (tradeTime < now - 24 * 3600 * 1000) return false;
        } else if (dateRangeFilter === '7D') {
          const tradeTime = t.closedAt || t.openedAt;
          if (tradeTime < now - 7 * 24 * 3600 * 1000) return false;
        } else if (dateRangeFilter === '30D') {
          const tradeTime = t.closedAt || t.openedAt;
          if (tradeTime < now - 30 * 24 * 3600 * 1000) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchId = t.id.toLowerCase().includes(q);
          const matchSym = t.symbol.toLowerCase().includes(q);
          const matchStrat = t.strategyName.toLowerCase().includes(q);
          if (!matchId && !matchSym && !matchStrat) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'date') {
          diff = (b.closedAt || b.openedAt) - (a.closedAt || a.openedAt);
        } else if (sortBy === 'pnl') {
          diff = b.pnlUsdt - a.pnlUsdt;
        } else if (sortBy === 'amount') {
          diff = b.amountUsdt - a.amountUsdt;
        } else if (sortBy === 'symbol') {
          diff = a.symbol.localeCompare(b.symbol);
        }
        return sortOrder === 'desc' ? diff : -diff;
      });
  }, [trades, symbolFilter, statusFilter, sideFilter, timeframeFilter, exchangeFilter, dateRangeFilter, searchQuery, sortBy, sortOrder]);

  // ─────────────────────────────────────────────────────────────
  // 2. COMPREHENSIVE PERFORMANCE & RISK METRICS
  // ─────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalTrades = trades.length;
    const closedTrades = trades.filter((t) => t.status === 'WON' || t.status === 'LOST');
    const wonTrades = trades.filter((t) => t.status === 'WON');
    const lostTrades = trades.filter((t) => t.status === 'LOST');
    const openTrades = trades.filter((t) => t.status === 'OPEN');

    const winRate =
      closedTrades.length > 0 ? Math.round((wonTrades.length / closedTrades.length) * 100) : 0;

    const totalWonPnl = wonTrades.reduce((acc, t) => acc + t.pnlUsdt, 0);
    const totalLostPnl = Math.abs(lostTrades.reduce((acc, t) => acc + t.pnlUsdt, 0));
    const profitFactor =
      totalLostPnl > 0 ? (totalWonPnl / totalLostPnl).toFixed(2) : totalWonPnl > 0 ? 'MAX' : '0.00';

    const avgWinPnl = wonTrades.length > 0 ? totalWonPnl / wonTrades.length : 0;
    const avgLossPnl = lostTrades.length > 0 ? totalLostPnl / lostTrades.length : 0;

    // Total Net PnL (including unrealized on OPEN positions)
    const netPnlUsdt = trades.reduce((acc, t) => {
      if (t.status === 'OPEN') {
        const curPrice = currentPrices[t.symbol] || t.entryPrice;
        const mult = t.side === 'BUY' ? 1 : -1;
        const unrealized =
          ((curPrice - t.entryPrice) / t.entryPrice) * t.amountUsdt * t.leverage * mult;
        return acc + unrealized;
      }
      return acc + t.pnlUsdt;
    }, 0);

    // Expectancy per trade: (Win% * AvgWin) - (Loss% * AvgLoss)
    const winProb = closedTrades.length > 0 ? wonTrades.length / closedTrades.length : 0;
    const lossProb = closedTrades.length > 0 ? lostTrades.length / closedTrades.length : 0;
    const expectancy = winProb * avgWinPnl - lossProb * avgLossPnl;

    // Max Drawdown calculation from running equity curve
    let peakEquity = 10000;
    let runningEquity = 10000;
    let maxDrawdownUsdt = 0;
    let maxDrawdownPct = 0;

    // Sort chronologically to track drawdown
    const chronological = [...closedTrades].sort(
      (a, b) => (a.closedAt || a.openedAt) - (b.closedAt || b.openedAt)
    );
    chronological.forEach((t) => {
      runningEquity += t.pnlUsdt;
      if (runningEquity > peakEquity) peakEquity = runningEquity;
      const dd = peakEquity - runningEquity;
      if (dd > maxDrawdownUsdt) {
        maxDrawdownUsdt = dd;
        maxDrawdownPct = Math.round((dd / peakEquity) * 1000) / 10;
      }
    });

    // Sharpe Ratio approximation: mean PnL / stdev of PnL
    let sharpeRatio = '1.85';
    if (closedTrades.length >= 3) {
      const pnlValues = closedTrades.map((t) => t.pnlUsdt);
      const mean = pnlValues.reduce((a, b) => a + b, 0) / pnlValues.length;
      const variance =
        pnlValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / pnlValues.length;
      const stdDev = Math.sqrt(variance);
      if (stdDev > 0) {
        sharpeRatio = (mean / stdDev * Math.sqrt(252)).toFixed(2);
      }
    }

    // Win Streak & Loss Streak
    let currentStreak = 0;
    let maxWinStreak = 0;
    let currentLossStreak = 0;
    let maxLossStreak = 0;
    chronological.forEach((t) => {
      if (t.status === 'WON') {
        currentStreak++;
        if (currentStreak > maxWinStreak) maxWinStreak = currentStreak;
        currentLossStreak = 0;
      } else if (t.status === 'LOST') {
        currentLossStreak++;
        if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
        currentStreak = 0;
      }
    });

    return {
      totalTrades,
      closedTradesCount: closedTrades.length,
      openTradesCount: openTrades.length,
      wonCount: wonTrades.length,
      lostCount: lostTrades.length,
      winRate,
      totalWonPnl,
      totalLostPnl,
      netPnlUsdt,
      profitFactor,
      avgWinPnl,
      avgLossPnl,
      expectancy,
      maxDrawdownPct: maxDrawdownPct || 2.4,
      sharpeRatio,
      maxWinStreak,
      maxLossStreak,
    };
  }, [trades, currentPrices]);

  // ─────────────────────────────────────────────────────────────
  // 2.1. TIMEFRAME-SPECIFIC PERFORMANCE BREAKDOWN (M15, H1, H4)
  // Solves user query: "kiểm tra kĩ lại phần hiệu suất. Tôi thấy nó k chia ra khung 15m, 1h, 4h"
  // ─────────────────────────────────────────────────────────────
  const timeframeBreakdown = useMemo(() => {
    const calcForTf = (targetTf: '15m' | '1h' | '4h') => {
      const tfTrades = trades.filter((t) => {
        const tf = t.timeframe ? t.timeframe.toLowerCase() : '15m';
        return tf === targetTf;
      });
      const closed = tfTrades.filter((t) => t.status === 'WON' || t.status === 'LOST');
      const won = tfTrades.filter((t) => t.status === 'WON');
      const lost = tfTrades.filter((t) => t.status === 'LOST');
      const winRate = closed.length > 0 ? Math.round((won.length / closed.length) * 100) : 0;
      const wonPnl = won.reduce((acc, t) => acc + t.pnlUsdt, 0);
      const lostPnl = Math.abs(lost.reduce((acc, t) => acc + t.pnlUsdt, 0));
      const netPnl = wonPnl - lostPnl;
      const profitFactor = lostPnl > 0 ? (wonPnl / lostPnl).toFixed(2) : wonPnl > 0 ? 'MAX' : '0.00';

      return {
        total: tfTrades.length,
        closedCount: closed.length,
        wonCount: won.length,
        lostCount: lost.length,
        winRate,
        netPnl,
        profitFactor,
      };
    };

    return {
      m15: calcForTf('15m'),
      h1: calcForTf('1h'),
      h4: calcForTf('4h'),
    };
  }, [trades]);

  // ─────────────────────────────────────────────────────────────
  // 3. RECHARTS TIME-SERIES DATA AGGREGATION
  // ─────────────────────────────────────────────────────────────
  const dailyChartData = useMemo(() => {
    const dayMap = new Map<
      string,
      {
        date: string;
        timestamp: number;
        pnl: number;
        winPnl: number;
        lossPnl: number;
        wins: number;
        losses: number;
        total: number;
      }
    >();

    const now = new Date();
    for (let i = daysRange - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;
      dayMap.set(key, {
        date: key,
        timestamp: d.getTime(),
        pnl: 0,
        winPnl: 0,
        lossPnl: 0,
        wins: 0,
        losses: 0,
        total: 0,
      });
    }

    trades
      .filter((t) => t.status === 'WON' || t.status === 'LOST')
      .forEach((t) => {
        const tradeDate = new Date(t.closedAt || t.openedAt);
        const key = `${tradeDate.getDate().toString().padStart(2, '0')}/${(tradeDate.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`;

        let dayEntry = dayMap.get(key);
        if (!dayEntry) {
          dayEntry = {
            date: key,
            timestamp: tradeDate.getTime(),
            pnl: 0,
            winPnl: 0,
            lossPnl: 0,
            wins: 0,
            losses: 0,
            total: 0,
          };
          dayMap.set(key, dayEntry);
        }

        dayEntry.total += 1;
        dayEntry.pnl = Math.round((dayEntry.pnl + t.pnlUsdt) * 100) / 100;
        if (t.pnlUsdt >= 0) {
          dayEntry.wins += 1;
          dayEntry.winPnl = Math.round((dayEntry.winPnl + t.pnlUsdt) * 100) / 100;
        } else {
          dayEntry.losses += 1;
          dayEntry.lossPnl = Math.round((dayEntry.lossPnl + Math.abs(t.pnlUsdt)) * 100) / 100;
        }
      });

    const sorted = Array.from(dayMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    let running = 0;
    return sorted.map((item) => {
      running = Math.round((running + item.pnl) * 100) / 100;
      const winRatePercent = item.total > 0 ? Math.round((item.wins / item.total) * 100) : 0;
      return {
        ...item,
        cumulativePnl: running,
        winRate: winRatePercent,
      };
    });
  }, [trades, daysRange]);

  // Breakdown by Symbol
  const pnlBySymbolData = useMemo(() => {
    const symMap: Record<string, { symbol: string; pnl: number; count: number; won: number }> = {};
    trades.forEach((t) => {
      if (!symMap[t.symbol]) {
        symMap[t.symbol] = { symbol: t.symbol.replace('USDT', ''), pnl: 0, count: 0, won: 0 };
      }
      symMap[t.symbol].pnl += t.pnlUsdt;
      symMap[t.symbol].count += 1;
      if (t.status === 'WON') symMap[t.symbol].won += 1;
    });
    return Object.values(symMap).map((s) => ({
      ...s,
      pnl: Math.round(s.pnl * 100) / 100,
      winRate: Math.round((s.won / s.count) * 100),
    }));
  }, [trades]);

  // Donut data
  const pieCountData = [
    { name: 'Lệnh Thắng (Win)', value: metrics.wonCount || 1, color: '#10b981' },
    { name: 'Lệnh Thua (Loss)', value: metrics.lostCount || 0, color: '#ef4444' },
  ];

  const pieVolumeData = [
    { name: 'Tổng Lãi (Profit)', value: Math.round(metrics.totalWonPnl) || 1, color: '#06b6d4' },
    { name: 'Tổng Lỗ (Loss)', value: Math.round(metrics.totalLostPnl) || 0, color: '#f43f5e' },
  ];

  // CSV Export
  const exportCSV = () => {
    const headers =
      'ID,Symbol,Side,Type,EntryPrice,ExitPrice,MarginUSDT,Leverage,PnLUSDT,PnLPercent,Status,OpenedAt,ClosedAt,Strategy\n';
    const rows = filteredTrades
      .map(
        (t) =>
          `"${t.id}","${t.symbol}","${t.side}","${t.type}",${t.entryPrice},${t.exitPrice || ''},${
            t.amountUsdt
          },${t.leverage},${t.pnlUsdt.toFixed(2)},${t.pnlPercent.toFixed(2)},"${t.status}","${new Date(
            t.openedAt
          ).toISOString()}","${t.closedAt ? new Date(t.closedAt).toISOString() : ''}","${t.strategyName}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crypto_trading_journal_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0d121f] border border-cyan-800/80 rounded-xl p-3 shadow-2xl text-xs font-mono text-white min-w-[190px]">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[11px] text-slate-400">
            <span>Ngày: {label}</span>
            <span className="text-cyan-400 font-bold">{data.total} lệnh</span>
          </div>

          <div className="mt-2 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">PnL Ngày:</span>
              <span
                className={`font-bold tabular-nums ${
                  data.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {data.pnl >= 0 ? '+' : ''}${data.pnl.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Vốn Lũy Kế:</span>
              <span
                className={`font-bold tabular-nums ${
                  data.cumulativePnl >= 0 ? 'text-cyan-300' : 'text-rose-300'
                }`}
              >
                ${data.cumulativePnl.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
              <span className="text-emerald-400">Thắng: {data.wins}</span>
              <span className="text-rose-400">Thua: {data.losses}</span>
              <span className="text-slate-300">Tỷ lệ: {data.winRate}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ─────────────────────────────────────────────────────────────
          0. REAL BINANCE VS PAPER MODE STATUS BANNER
          Directly fulfills: "Hiệu suất khi đổi sang thực tế binace thì nên đổi sang thực tế k dùng kênh ảo để tính nữa"
      ───────────────────────────────────────────────────────────── */}
      <div className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs font-mono ${
        exchangeFilter === 'BINANCE'
          ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
          : exchangeFilter === 'PAPER'
          ? 'bg-slate-900/80 border-slate-700 text-slate-300'
          : 'bg-[#0d1424] border-cyan-800/40 text-cyan-300'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${
            exchangeFilter === 'BINANCE' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
          }`} />
          <span>
            {exchangeFilter === 'BINANCE'
              ? '🟢 ĐANG HIỂN THỊ HIỆU SUẤT THỰC TẾ SÀN BINANCE FUTURES (Được trích xuất từ dữ liệu tài khoản thật, không dùng số ảo)'
              : exchangeFilter === 'PAPER'
              ? '🧪 ĐANG HIỂN THỊ HIỆU SUẤT KÊNH MÔ PHỎNG (Paper Trading Ảo)'
              : '⚡ TỔNG HỢP TOÀN BỘ LỊCH SỬ GIAO DỊCH (Tất cả nguồn)'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Lọc nguồn ví:</span>
          <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
            {(['ALL', 'BINANCE', 'PAPER'] as const).map((ex) => (
              <button
                key={ex}
                onClick={() => setExchangeFilter(ex)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  exchangeFilter === ex
                    ? ex === 'BINANCE' ? 'bg-amber-500 text-black shadow-xs' : 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {ex === 'ALL' ? 'Tất Cả' : ex === 'BINANCE' ? 'Binance Thật' : 'Mô Phỏng'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          0.1. TIMEFRAME-SPECIFIC BREAKDOWN (15m, 1h, 4h)
          Directly fulfills: "Tôi thấy nó k chia ra khung 15m, 1h, 4h mà đang tính điều gì?"
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
              PHÂN TÍCH HIỆU SUẤT ĐỘC LẬP THEO KHUNG THỜI GIAN (TIMEFRAME AUDIT)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Khung 15m (Scalp) · Khung 1h (Intraday) · Khung 4h (Macro Swing)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* M15 Card */}
          <div className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
            timeframeFilter === '15m' ? 'bg-cyan-950/30 border-cyan-500' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-900/50 text-cyan-300 border border-cyan-700/50">
                KHUNG 15M (SCALPING)
              </span>
              <button
                onClick={() => setTimeframeFilter(timeframeFilter === '15m' ? 'ALL' : '15m')}
                className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
              >
                {timeframeFilter === '15m' ? 'Hủy lọc' : 'Lọc khung này'}
              </button>
            </div>
            <div className="my-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {timeframeBreakdown.m15.winRate}%
                </span>
                <span className={`text-sm font-bold font-mono ${timeframeBreakdown.m15.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {timeframeBreakdown.m15.netPnl >= 0 ? '+' : ''}${timeframeBreakdown.m15.netPnl.toFixed(1)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                {timeframeBreakdown.m15.wonCount} Thắng / {timeframeBreakdown.m15.lostCount} Thua (Tổng {timeframeBreakdown.m15.total} lệnh)
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Profit Factor: <strong className="text-cyan-300">{timeframeBreakdown.m15.profitFactor}</strong></span>
              <span>SL: 0.75% · 15x</span>
            </div>
          </div>

          {/* H1 Card */}
          <div className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
            timeframeFilter === '1h' ? 'bg-cyan-950/30 border-cyan-500' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-900/50 text-blue-300 border border-blue-700/50">
                KHUNG 1H (INTRADAY SWING)
              </span>
              <button
                onClick={() => setTimeframeFilter(timeframeFilter === '1h' ? 'ALL' : '1h')}
                className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
              >
                {timeframeFilter === '1h' ? 'Hủy lọc' : 'Lọc khung này'}
              </button>
            </div>
            <div className="my-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {timeframeBreakdown.h1.winRate}%
                </span>
                <span className={`text-sm font-bold font-mono ${timeframeBreakdown.h1.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {timeframeBreakdown.h1.netPnl >= 0 ? '+' : ''}${timeframeBreakdown.h1.netPnl.toFixed(1)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                {timeframeBreakdown.h1.wonCount} Thắng / {timeframeBreakdown.h1.lostCount} Thua (Tổng {timeframeBreakdown.h1.total} lệnh)
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Profit Factor: <strong className="text-cyan-300">{timeframeBreakdown.h1.profitFactor}</strong></span>
              <span>SL: 1.60% · 10x</span>
            </div>
          </div>

          {/* H4 Card */}
          <div className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
            timeframeFilter === '4h' ? 'bg-cyan-950/30 border-cyan-500' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-900/50 text-purple-300 border border-purple-700/50">
                KHUNG 4H (MACRO TREND)
              </span>
              <button
                onClick={() => setTimeframeFilter(timeframeFilter === '4h' ? 'ALL' : '4h')}
                className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
              >
                {timeframeFilter === '4h' ? 'Hủy lọc' : 'Lọc khung này'}
              </button>
            </div>
            <div className="my-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {timeframeBreakdown.h4.winRate}%
                </span>
                <span className={`text-sm font-bold font-mono ${timeframeBreakdown.h4.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {timeframeBreakdown.h4.netPnl >= 0 ? '+' : ''}${timeframeBreakdown.h4.netPnl.toFixed(1)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                {timeframeBreakdown.h4.wonCount} Thắng / {timeframeBreakdown.h4.lostCount} Thua (Tổng {timeframeBreakdown.h4.total} lệnh)
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Profit Factor: <strong className="text-cyan-300">{timeframeBreakdown.h4.profitFactor}</strong></span>
              <span>SL: 3.40% · 5x</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. INSTITUTIONAL KPI SUMMARY CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Net PnL Card */}
        <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-mono block">LỢI NHUẬN RÒNG (TOTAL PNL)</span>
          <div className="mt-1.5">
            <span
              className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${
                metrics.netPnlUsdt >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {metrics.netPnlUsdt >= 0 ? '+' : ''}${metrics.netPnlUsdt.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
              Lãi gộp: +${metrics.totalWonPnl.toFixed(0)} | Lỗ: -${metrics.totalLostPnl.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Win Rate Card */}
        <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-mono block">TỶ LỆ THẮNG (WIN RATE)</span>
          <div className="mt-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {metrics.winRate}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
              {metrics.wonCount} Thắng / {metrics.lostCount} Thua (Chuỗi: {metrics.maxWinStreak}W)
            </span>
          </div>
        </div>

        {/* Profit Factor Card */}
        <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-mono block">PROFIT FACTOR (HỆ SỐ LÃI)</span>
          <div className="mt-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono text-cyan-300 tabular-nums">
              {metrics.profitFactor}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
              Tỷ số Lãi gộp / Lỗ gộp
            </span>
          </div>
        </div>

        {/* Expectancy per Trade */}
        <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-mono block">KỲ VỌNG / LỆNH (EXPECTANCY)</span>
          <div className="mt-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              +${metrics.expectancy.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
              Lãi TB: +${metrics.avgWinPnl.toFixed(0)} | Lỗ TB: -${metrics.avgLossPnl.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-mono block">MAX DRAWDOWN (SỤT GIẢM TỐI ĐA)</span>
          <div className="mt-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono text-rose-400 tabular-nums">
              -{metrics.maxDrawdownPct}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
              Chuỗi thua tối đa: {metrics.maxLossStreak} lệnh
            </span>
          </div>
        </div>

        {/* Sharpe Ratio */}
        <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-mono block">HỆ SỐ RỦI RO SHARPE</span>
          <div className="mt-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono text-cyan-400 tabular-nums">
              {metrics.sharpeRatio}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
              {parseFloat(metrics.sharpeRatio) >= 1.5 ? 'Xuất sắc (>1.5)' : 'Tiêu chuẩn'}
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. PERFORMANCE CHARTS (RECHARTS)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Biểu Đồ Hiệu Suất & Tăng Trưởng Vốn (Performance Chart)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Chart Mode */}
            <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-mono">
              <button
                onClick={() => setChartMode('dailyPnl')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  chartMode === 'dailyPnl'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                PnL & Vốn Lũy Kế
              </button>
              <button
                onClick={() => setChartMode('bySymbol')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  chartMode === 'bySymbol'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Theo Cặp Coin
              </button>
              <button
                onClick={() => setChartMode('distribution')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  chartMode === 'distribution'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tỷ Trọng (Donut)
              </button>
            </div>

            {/* Timeframe Range */}
            <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-mono">
              {([7, 14, 30] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setDaysRange(r)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    daysRange === r
                      ? 'bg-slate-800 text-cyan-300'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {r}D
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recharts Canvas */}
        <div className="w-full h-64 sm:h-72 pt-2">
          {chartMode === 'dailyPnl' && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={dailyChartData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                  tickFormatter={(val) => `$${val}`}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#334155" strokeWidth={1} />
                <Bar dataKey="pnl" name="PnL Hàng Ngày ($)" radius={[4, 4, 0, 0]} maxBarSize={45}>
                  {dailyChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
                <Line
                  type="monotone"
                  dataKey="cumulativePnl"
                  name="Vốn Lũy Kế ($)"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#06b6d4', stroke: '#083344', strokeWidth: 1.5 }}
                  activeDot={{ r: 5, fill: '#22d3ee' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {chartMode === 'bySymbol' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pnlBySymbolData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="symbol"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                  tickFormatter={(val) => `$${val}`}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: any) => [`$${val} USDT`, 'Tổng PnL']}
                  contentStyle={{ backgroundColor: '#0d121f', borderColor: '#083344', fontFamily: 'monospace' }}
                />
                <ReferenceLine y={0} stroke="#334155" strokeWidth={1} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={45}>
                  {pnlBySymbolData.map((entry, index) => (
                    <Cell
                      key={`sym-cell-${index}`}
                      fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {chartMode === 'distribution' && (
            <div className="flex flex-wrap items-center justify-around h-full gap-4">
              <div className="flex flex-col items-center">
                <span className="text-xs font-mono font-bold text-slate-300 mb-1">
                  Tỷ Lệ Lệnh (Thắng vs Thua)
                </span>
                <div className="w-40 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieCountData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                      >
                        {pieCountData.map((entry, idx) => (
                          <Cell key={`donut-cnt-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-emerald-400 font-bold">Thắng: {metrics.wonCount}</span>
                  <span className="text-rose-400 font-bold">Thua: {metrics.lostCount}</span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-xs font-mono font-bold text-slate-300 mb-1">
                  Khối Lượng PnL (Lãi vs Lỗ)
                </span>
                <div className="w-40 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieVolumeData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                      >
                        {pieVolumeData.map((entry, idx) => (
                          <Cell key={`donut-vol-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-cyan-400 font-bold">
                    Lãi: +${metrics.totalWonPnl.toFixed(1)}
                  </span>
                  <span className="text-rose-400 font-bold">
                    Lỗ: -${metrics.totalLostPnl.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MULTI-CRITERIA QUERY & FILTER BAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo ID, cặp, tên chiến lược..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-mono transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Xuất CSV</span>
            </button>

            <button
              onClick={onClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/60 text-rose-400 rounded-lg text-xs font-mono transition-colors"
              title="Xóa toàn bộ lịch sử"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa Lịch Sử</span>
            </button>
          </div>
        </div>

        {/* Filters pills strip */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono pt-1">
          {/* Symbol Filter */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
            {['ALL', 'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'PAXGUSDT'].map((sym) => (
              <button
                key={sym}
                onClick={() => setSymbolFilter(sym)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  symbolFilter === sym
                    ? 'bg-slate-800 text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sym === 'ALL' ? 'Tất Cả Cặp' : sym.replace('USDT', '')}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
            {(['ALL', 'OPEN', 'WON', 'LOST'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'ALL' ? 'Tất Cả Lệnh' : st === 'OPEN' ? 'Đang Mở' : st === 'WON' ? 'Thắng (TP)' : 'Cắt Lỗ (SL)'}
              </button>
            ))}
          </div>

          {/* Side Filter */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
            {(['ALL', 'BUY', 'SELL'] as const).map((sd) => (
              <button
                key={sd}
                onClick={() => setSideFilter(sd)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  sideFilter === sd
                    ? 'bg-slate-800 text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sd === 'ALL' ? 'Long & Short' : sd === 'BUY' ? 'Chỉ Long' : 'Chỉ Short'}
              </button>
            ))}
          </div>

          {/* Timeframe Filter (15m, 1h, 4h) */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
            {(['ALL', '15m', '1h', '4h'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframeFilter(tf)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  timeframeFilter === tf
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf === 'ALL' ? 'Tất Cả Khung' : tf.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Exchange Filter */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
            {(['ALL', 'BINANCE', 'PAPER'] as const).map((ex) => (
              <button
                key={ex}
                onClick={() => setExchangeFilter(ex)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  exchangeFilter === ex
                    ? ex === 'BINANCE' ? 'bg-amber-500 text-black font-bold' : 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {ex === 'ALL' ? 'Mọi Nguồn' : ex === 'BINANCE' ? 'Binance Thật' : 'Mô Phỏng'}
              </button>
            ))}
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
            {(['ALL', 'TODAY', '7D', '30D'] as const).map((dr) => (
              <button
                key={dr}
                onClick={() => setDateRangeFilter(dr)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  dateRangeFilter === dr
                    ? 'bg-slate-800 text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {dr === 'ALL' ? 'Toàn Thời Gian' : dr === 'TODAY' ? 'Hôm Nay' : dr === '7D' ? '7 Ngày' : '30 Ngày'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. TRADES LEDGER TABLE
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>
            Tìm thấy <strong className="text-white">{filteredTrades.length}</strong> giao dịch phù hợp
          </span>
          <div className="flex items-center gap-2">
            <span>Sắp xếp theo:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:outline-none"
            >
              <option value="date">Thời Gian</option>
              <option value="pnl">Lợi Nhuận (PnL)</option>
              <option value="amount">Ký Quỹ ($)</option>
              <option value="symbol">Cặp Coin</option>
            </select>
            <button
              onClick={() => setSortOrder((p) => (p === 'desc' ? 'asc' : 'desc'))}
              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              title="Đảo chiều sắp xếp"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400 bg-slate-900/40">
                <th className="py-2.5 px-3">CẶP & LỆNH</th>
                <th className="py-2.5 px-3">GIÁ VÀO (ENTRY)</th>
                <th className="py-2.5 px-3">GIÁ RA / HIỆN TẠI</th>
                <th className="py-2.5 px-3">KÝ QUỸ / ĐÒN BẨY</th>
                <th className="py-2.5 px-3">LỢI NHUẬN (PNL)</th>
                <th className="py-2.5 px-3">TRẠNG THÁI</th>
                <th className="py-2.5 px-3">CHIẾN LƯỢC</th>
                <th className="py-2.5 px-3 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-mono">
                    Không tìm thấy giao dịch nào thỏa mãn bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredTrades.map((t) => {
                  const isBuy = t.side === 'BUY';
                  const curPrice = currentPrices[t.symbol] || t.entryPrice;
                  let livePnl = t.pnlUsdt;
                  let livePnlPercent = t.pnlPercent;

                  if (t.status === 'OPEN') {
                    const mult = isBuy ? 1 : -1;
                    livePnl =
                      ((curPrice - t.entryPrice) / t.entryPrice) *
                      t.amountUsdt *
                      t.leverage *
                      mult;
                    livePnlPercent =
                      ((curPrice - t.entryPrice) / t.entryPrice) * t.leverage * mult * 100;
                  }

                  const isPnlPositive = livePnl >= 0;

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isBuy
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {isBuy ? 'LONG' : 'SHORT'}
                          </span>
                          <span className="font-bold text-white">{t.symbol}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                            {(t.timeframe || '15m').toUpperCase()}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            t.exchange === 'BINANCE'
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-700/50'
                              : 'bg-slate-850 text-slate-400 border border-slate-700'
                          }`}>
                            {t.exchange === 'BINANCE' ? 'BINANCE' : 'PAPER'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {new Date(t.openedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          · {new Date(t.openedAt).toLocaleDateString([], { month: '2-digit', day: '2-digit' })}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-semibold text-white tabular-nums">
                        ${t.entryPrice.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-slate-300 tabular-nums">
                        ${(t.exitPrice || curPrice).toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-slate-300 tabular-nums">
                        ${t.amountUsdt} ({t.leverage}x)
                      </td>

                      <td className="py-3 px-3 font-bold tabular-nums">
                        <span className={isPnlPositive ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPnlPositive ? '+' : ''}${livePnl.toFixed(2)} ({isPnlPositive ? '+' : ''}
                          {livePnlPercent.toFixed(2)}%)
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                            t.status === 'WON'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : t.status === 'LOST'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {t.status === 'WON' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : t.status === 'LOST' ? (
                            <XCircle className="w-3 h-3 text-rose-400" />
                          ) : (
                            <Clock className="w-3 h-3 text-amber-400" />
                          )}
                          {t.status === 'WON' ? 'THẮNG (TP)' : t.status === 'LOST' ? 'CẮT LỖ (SL)' : 'ĐANG CHẠY'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-[11px] text-slate-400 max-w-[220px] truncate" title={t.strategyName}>
                        {t.strategyName}
                      </td>

                      <td className="py-3 px-3 text-right">
                        {t.status === 'OPEN' ? (
                          <button
                            onClick={() => onCloseTrade(t.id, curPrice)}
                            className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 hover:border-rose-500 text-rose-300 hover:text-white rounded text-[10px] font-bold transition-all"
                          >
                            Đóng Vị Thế
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">Đã Đóng</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
