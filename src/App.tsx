import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  CryptoSymbol,
  MarketPair,
  KlineData,
  TradeSignal,
  WhaleTransaction,
  ExecutedTrade,
  BotSettings,
  ProTraderProfile,
} from './types';
import { apiService } from './services/api';
import { fastCache } from './services/fastCache';
import { useAppVisibilityRecovery } from './hooks/useAppVisibilityRecovery';
import { Header } from './components/Header';
import { MarketTickerBar } from './components/MarketTickerBar';
import { TradingChart } from './components/TradingChart';
import { SignalCard } from './components/SignalCard';
import { WhaleTracker } from './components/WhaleTracker';
import { ProTraderHub, defaultProTraders } from './components/ProTraderHub';
import { MachineLearningHub } from './components/MachineLearningHub';
import { OrderTerminal } from './components/OrderTerminal';
import { TradeHistory } from './components/TradeHistory';
import { AlertSettingsModal } from './components/AlertSettingsModal';
import { LayoutCustomizerModal, LayoutPreferences, DEFAULT_LAYOUT_PREFS } from './components/LayoutCustomizerModal';
import { MobileNav } from './components/MobileNav';
import { MacroNewsBanner } from './components/MacroNewsBanner';
import { LiquidationHeatmap } from './components/LiquidationHeatmap';
import { MultiTimeframeAnalysis } from './components/MultiTimeframeAnalysis';
import { QBPlanCard } from './components/QBPlanCard';
import { RecentSignalsTable } from './components/RecentSignalsTable';
import { ThirdPartyAuditModal } from './components/ThirdPartyAuditModal';
import { DeltaSyncBanner } from './components/DeltaSyncBanner';
import { SystemHealthModal } from './components/SystemHealthModal';
import { offlineStorage, AppOfflineBackupData } from './services/offlineStorage';
import { generateTimeframeSignals, RecentSignalItem } from './services/multiTimeframeSignals';
import { economicCalendarData } from './services/backtest';
import { getLiquidationHeatmap } from './services/liquidation';
import { defaultRiskManager } from './services/riskManager';
import { telegramAlertService } from './services/telegramAlert';
import {
  Sparkles,
  Bot,
  Zap,
  TrendingUp,
  RefreshCw,
  Bell,
  ArrowRight,
  ShieldAlert,
  Shield,
  Sliders,
  CheckCircle,
  AlertOctagon,
  Flame,
  Brain,
  Layout,
  WifiOff,
} from 'lucide-react';

const INITIAL_SETTINGS: BotSettings = {
  autoTradingEnabled: true,
  autoSendTelegram: true,
  telegramBotToken: '',
  telegramChatId: '',
  webhookUrl: '',
  webhookEnabled: false,
  exchange: 'PAPER',
  apiKey: '',
  apiSecret: '',
  riskPerTradePercent: 2,
  defaultLeverage: 10,
  primaryStrategy: 'ICT / Smart Money Concepts (SMC)',
  activeStyles: [
    'GCR (Gigantic-Cass-Rebirth)',
    'ICT / Smart Money Concepts (SMC)',
    'Peter Brandt',
    'Richard Wyckoff',
  ],
  alertPriceWhaleThresholdUsd: 10000000,
  trailingStopEnabled: true,
  autoMoveBreakeven: true,
  macroNewsFilterEnabled: true,
  maxSlippagePercent: 0.2,
  partialTakeProfitPercent: 40,
  activeTradingSession: 'LONDON_NY',
  dynamicAtrTrailingEnabled: true,
  atrMultiplier: 1.8,
  propFirmRiskMode: false,
  propFirmMaxDailyLossPercent: 4.0,
  propFirmMaxTotalDrawdownPercent: 8.0,
};

const INITIAL_TRADES: ExecutedTrade[] = [
  {
    id: 'ORD-1728045920-101',
    symbol: 'BTCUSDT',
    side: 'BUY',
    type: 'MARKET',
    entryPrice: 85200.0,
    exitPrice: 86850.0,
    amountUsdt: 600,
    leverage: 10,
    stopLoss: 84100.0,
    takeProfit: 86800.0,
    pnlUsdt: 193.66,
    pnlPercent: 32.28,
    status: 'WON',
    openedAt: Date.now() - 18 * 3600 * 1000,
    closedAt: Date.now() - 3 * 3600 * 1000,
    strategyName: 'SMC Asia Sweep + 4H Bullish Order Block',
    exchange: 'BINANCE',
  },
  {
    id: 'ORD-1728045920-102',
    symbol: 'SOLUSDT',
    side: 'BUY',
    type: 'MARKET',
    entryPrice: 178.4,
    exitPrice: 185.5,
    amountUsdt: 400,
    leverage: 10,
    stopLoss: 172.0,
    takeProfit: 185.0,
    pnlUsdt: 159.19,
    pnlPercent: 39.8,
    status: 'WON',
    openedAt: Date.now() - 12 * 3600 * 1000,
    closedAt: Date.now() - 2 * 3600 * 1000,
    strategyName: 'GCR High-Beta Liquidation Squeeze',
    exchange: 'BYBIT',
  },
  {
    id: 'ORD-1728045920-103',
    symbol: 'ETHUSDT',
    side: 'SELL',
    type: 'MARKET',
    entryPrice: 2740.0,
    exitPrice: 2770.0,
    amountUsdt: 500,
    leverage: 8,
    stopLoss: 2770.0,
    takeProfit: 2680.0,
    pnlUsdt: -43.8,
    pnlPercent: -8.76,
    status: 'LOST',
    openedAt: Date.now() - 28 * 3600 * 1000,
    closedAt: Date.now() - 24 * 3600 * 1000,
    strategyName: 'Wyckoff Upthrust After Distribution',
    exchange: 'OKX',
  },
  {
    id: 'ORD-1728045920-104',
    symbol: 'PAXGUSDT',
    side: 'BUY',
    type: 'MARKET',
    entryPrice: 4142.0,
    amountUsdt: 800,
    leverage: 10,
    stopLoss: 4110.0,
    takeProfit: 4190.0,
    pnlUsdt: 31.87,
    pnlPercent: 3.98,
    status: 'OPEN',
    openedAt: Date.now() - 5 * 3600 * 1000,
    strategyName: 'Peter Brandt Classical Gold Factor Breakout',
    exchange: 'PAPER',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'terminal' | 'signals' | 'whales' | 'pro-hub' | 'ml-hub' | 'history'
  >('terminal');
  const [selectedSymbol, setSelectedSymbol] = useState<CryptoSymbol>('BTCUSDT');
  const [activeTimeframe, setActiveTimeframe] = useState<'15m' | '1h' | '4h' | '1d'>('15m');

  // Fast-Boot Cache Hydration: 0ms initial render so the app NEVER hangs on reopen
  const [pairs, setPairs] = useState<MarketPair[]>(() => fastCache.getCachedPairs());
  const [klines, setKlines] = useState<KlineData[]>(() => fastCache.getOrCreateKlines('BTCUSDT', '15m'));
  const [activeSignal, setActiveSignal] = useState<TradeSignal | null>(() => fastCache.getLastSignal());
  const [signalsList, setSignalsList] = useState<TradeSignal[]>([]);
  const [whaleTxs, setWhaleTxs] = useState<WhaleTransaction[]>(() => {
    const cached = fastCache.getCachedWhales();
    return cached ? cached.transactions : [];
  });
  const [whaleNetFlow, setWhaleNetFlow] = useState<number>(() => {
    const cached = fastCache.getCachedWhales();
    return cached ? cached.whaleNetFlow24hUsd : 284500000;
  });
  const [sentimentSummary, setSentimentSummary] = useState<string>(() => {
    const cached = fastCache.getCachedWhales();
    return cached ? cached.sentimentSummary : 'BULLISH ACCUMULATION';
  });

  const [portfolioBalance, setPortfolioBalance] = useState<number>(10850);
  const [realBinanceBalance, setRealBinanceBalance] = useState<number | null>(null);
  const [activeDirection, setActiveDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLayoutCustomizerOpen, setIsLayoutCustomizerOpen] = useState(false);
  const [isKillSwitchOpen, setIsKillSwitchOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [pendingTerminalPlan, setPendingTerminalPlan] = useState<any>(null);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [isAnalyzingSignal, setIsAnalyzingSignal] = useState(false);
  const [killSwitchMessage, setKillSwitchMessage] = useState<string | null>(null);

  // View mode: 'QB_SIMPLE' (Clean, streamlined QB layout) vs 'PRO_TERMINAL' (Full institutional multi-tab workstation)
  // Architecture requirement: "rút gọn bảng qb làm bảng chạy trước để đảm bảo bật là lên, bản toàn diện chỉ khi ổn định hãy mở lên sau"
  // Default on mobile boot is ALWAYS 'QB_SIMPLE' to guarantee 0ms instant display without freezing
  const [viewMode, setViewMode] = useState<'QB_SIMPLE' | 'PRO_TERMINAL'>('QB_SIMPLE');
  const [isSystemStable, setIsSystemStable] = useState<boolean>(false);

  // Check backend engine connectivity silently after boot
  useEffect(() => {
    let cancelled = false;
    const checkStability = async () => {
      try {
        const ok = await apiService.ping();
        if (!cancelled && ok) {
          setIsSystemStable(true);
        }
      } catch {
        // Safe fallback
      }
    };
    const timer = setTimeout(checkStability, 1800);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === 'QB_SIMPLE' ? 'PRO_TERMINAL' : 'QB_SIMPLE'));
  };

  // Historical preview signal state
  const [previewHistoricalSignal, setPreviewHistoricalSignal] = useState<TradeSignal | null>(null);
  const [selectedRecentSignalId, setSelectedRecentSignalId] = useState<string | null>(null);

  // Layout Preferences with safe fallback
  const [layoutPrefs, setLayoutPrefs] = useState<LayoutPreferences>(() => {
    try {
      const saved = localStorage.getItem('cw_layout_prefs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return { ...DEFAULT_LAYOUT_PREFS, ...parsed };
      }
    } catch {}
    return DEFAULT_LAYOUT_PREFS;
  });

  // Settings from localStorage with deep merge
  const [settings, setSettings] = useState<BotSettings>(() => {
    try {
      const saved = localStorage.getItem('cw_bot_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return { ...INITIAL_SETTINGS, ...parsed };
      }
    } catch {}
    return INITIAL_SETTINGS;
  });

  // Trades from localStorage with array guard
  const [trades, setTrades] = useState<ExecutedTrade[]>(() => {
    try {
      const saved = localStorage.getItem('cw_trades');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_TRADES;
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cw_layout_prefs', JSON.stringify(layoutPrefs));
    } catch (e) {
      console.warn('Failed saving layout prefs', e);
    }
  }, [layoutPrefs]);

  useEffect(() => {
    try {
      localStorage.setItem('cw_bot_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed saving settings', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('cw_trades', JSON.stringify(trades));
    } catch (e) {
      console.warn('Failed saving trades', e);
    }
  }, [trades]);

  // Fetch market data smoothly
  const loadMarketData = useCallback(async () => {
    const data = await apiService.getMarketSummary();
    if (data.length > 0) {
      setPairs(data);
    }
  }, []);

  const loadKlines = useCallback(
    async (
      sym: CryptoSymbol,
      interval: '15m' | '1h' | '4h' | '1d' = activeTimeframe,
      silent: boolean = false
    ) => {
      // 1. Immediately hydrate with cached/baseline klines in 0ms so user never waits on mobile
      const instant = fastCache.getOrCreateKlines(sym, interval);
      if (instant.length > 0) {
        setKlines(instant);
      }

      // 2. Silently revalidate fresh exchange candles in the background
      try {
        const fresh = await apiService.getKlines(sym, interval);
        if (fresh.length > 0) {
          setKlines(fresh);
        }
      } catch {
        // Silently keep instant data
      }
    },
    [activeTimeframe]
  );

  // Live Binance Futures balance synchronization
  const refreshBinanceBalance = useCallback(async () => {
    if (settings.exchange === 'BINANCE' && settings.apiKey && settings.apiSecret) {
      try {
        const res = await apiService.getBinanceBalance({
          apiKey: settings.apiKey,
          apiSecret: settings.apiSecret,
          isTestnet: Boolean((settings as any).isTestnet),
        });
        if (res.success && typeof res.availableBalance === 'number') {
          setRealBinanceBalance(res.availableBalance);
          setPortfolioBalance(res.availableBalance);
        }
      } catch (e) {
        console.warn('Failed to fetch Binance balance', e);
      }
    }
  }, [settings.exchange, settings.apiKey, settings.apiSecret]);

  useEffect(() => {
    if (settings.exchange === 'BINANCE' && settings.apiKey && settings.apiSecret) {
      refreshBinanceBalance();
    } else {
      setRealBinanceBalance(null);
    }
  }, [settings.exchange, settings.apiKey, settings.apiSecret, refreshBinanceBalance]);

  const currentPair = pairs.find((p) => p.symbol === selectedSymbol) || pairs[0];

  const tfData = useMemo(() => {
    return generateTimeframeSignals(selectedSymbol, currentPair?.price || 86340, activeTimeframe, activeDirection);
  }, [selectedSymbol, currentPair?.price, activeTimeframe, activeDirection]);

  // Unified, decisive signal synchronized with both chart and order plan (Zero Drift)
  const currentEffectiveSignal = useMemo(() => {
    if (previewHistoricalSignal) return previewHistoricalSignal;
    if (activeSignal && activeSignal.symbol === selectedSymbol) {
      return activeSignal;
    }
    return activeDirection === 'SHORT' ? tfData.shortSetup : tfData.longSetup;
  }, [previewHistoricalSignal, activeSignal, selectedSymbol, activeDirection, tfData]);

  const handleSelectRecentSignal = (item: RecentSignalItem) => {
    setSelectedRecentSignalId(item.id);
    const convertedSignal: TradeSignal = {
      id: item.id,
      symbol: item.symbol,
      direction: item.direction === 'BUY' ? 'LONG' : 'SHORT',
      entryPrice: item.entryPrice,
      entryRange: `${Math.round(item.entryPrice * 0.998 * 10) / 10} - ${Math.round(item.entryPrice * 1.002 * 10) / 10}`,
      stopLoss: item.stopLoss,
      tp1: item.tp1,
      tp2: item.tp2,
      tp3: item.tp3,
      riskRewardRatio: '1:2.8',
      recommendedLeverage: item.timeframe === '15m' ? '15x' : item.timeframe === '1h' ? '10x' : '5x',
      timeframe: item.timeframe.toUpperCase(),
      confidenceScore: item.confidence,
      proTraderStyle: item.proStyle,
      strategyRationale: item.strategyRationale,
      telegramAlertSummary: `Lịch sử ${item.timeStr}: ${item.direction} #${item.symbol}`,
      status: item.status,
      createdAt: item.timestamp,
    };
    (convertedSignal as any).statusLabel = item.statusLabel;
    setPreviewHistoricalSignal(convertedSignal);
  };

  const handleResetToLive = () => {
    setPreviewHistoricalSignal(null);
    setSelectedRecentSignalId(null);
  };

  const handleTimeframeChange = (tf: '15m' | '1h' | '4h' | '1d') => {
    setActiveTimeframe(tf);
    handleResetToLive();
    loadKlines(selectedSymbol, tf);
  };

  // Incremental Delta-Sync: Only transfers tiny new diff candles (~0.4 - 1.2 KB)
  // Directly fulfills: "bấm kết nối chỉ cập nhật các thông tin mới chứ không gọi nguyên cả app về đt"
  const handleDeltaSync = async (): Promise<{ transferBytes?: number; newCandlesCount?: number; latencyMs?: number }> => {
    const lastTime = klines.length > 0 ? klines[klines.length - 1].time : 0;
    const start = performance.now();
    const res = await apiService.deltaSync({
      symbol: selectedSymbol,
      timeframe: activeTimeframe,
      lastCandleTime: lastTime,
    });
    const latencyMs = Math.round(performance.now() - start);

    if (res.success) {
      if (res.newKlines && res.newKlines.length > 0) {
        setKlines((prev) => {
          const map = new Map(prev.map((k) => [k.time, k]));
          for (const nk of res.newKlines) {
            map.set(nk.time, nk);
          }
          return Array.from(map.values()).sort((a, b) => a.time - b.time);
        });
      }

      setPairs((prev) =>
        prev.map((p) =>
          p.symbol === selectedSymbol
            ? { ...p, price: res.currentPrice, change24h: res.change24h || p.change24h, updatedAt: Date.now() }
            : p
        )
      );

      return {
        transferBytes: res.transferBytes,
        newCandlesCount: res.newKlines.length,
        latencyMs,
      };
    }

    return {
      transferBytes: 0,
      newCandlesCount: 0,
      latencyMs,
    };
  };

  // Restore app state from user exported file on mobile/PC
  const handleRestoreBackup = (backup: AppOfflineBackupData) => {
    if (backup.settings) setSettings(backup.settings);
    if (Array.isArray(backup.trades)) setTrades(backup.trades);
    if (typeof backup.portfolioBalance === 'number') setPortfolioBalance(backup.portfolioBalance);
    if (backup.viewMode) setViewMode(backup.viewMode);
    if (backup.layoutPrefs) setLayoutPrefs(backup.layoutPrefs);
    if (Array.isArray(backup.cachedPairs) && backup.cachedPairs.length > 0) setPairs(backup.cachedPairs);
  };

  const handleApplyOrderPlanFromCopilot = (plan: any) => {
    setPendingTerminalPlan(plan);
    setKillSwitchMessage(
      `🎯 ĐÃ NẠP KẾ HOẠCH TỪ AI COPILOT: ${plan.side} #${selectedSymbol} (Entry: $${plan.entryPrice}, SL: $${plan.stopLoss}, TP: $${plan.takeProfit})`
    );
    setTimeout(() => setKillSwitchMessage(null), 5000);
  };

  const loadWhales = useCallback(async () => {
    const data = await apiService.getWhaleTransactions();
    if (data) {
      setWhaleTxs(data.transactions);
      setWhaleNetFlow(data.whaleNetFlow24hUsd);
      setSentimentSummary(data.sentimentSummary);
    }
  }, []);

  const handleForegroundWake = useCallback(() => {
    // Re-validate silently without blocking the UI
    loadMarketData();
    loadKlines(selectedSymbol, activeTimeframe, true);
    loadWhales();
  }, [loadMarketData, loadKlines, selectedSymbol, activeTimeframe, loadWhales]);

  // Background Wake-Up Recovery (Solves: "app thoát lâu thì vô khó có cách nào cải thiện" & "tat mo tren dt lau")
  const { isOnline, wasBackgrounded } = useAppVisibilityRecovery({
    onForegroundWake: handleForegroundWake,
    staleThresholdMs: 15000,
  });

  // Initial load: 0ms Instant Hydration
  useEffect(() => {
    loadMarketData();
    loadKlines(selectedSymbol, activeTimeframe, true);
    loadWhales();
  }, []);

  // When selected symbol changes, reload chart
  useEffect(() => {
    loadKlines(selectedSymbol, activeTimeframe);
  }, [selectedSymbol]);

  // Real-time market tick polling every 4 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const data = await apiService.getMarketSummary();
      if (data.length > 0) {
        setPairs(data);

        // Auto Trailing Breakeven protection
        if (settings.autoMoveBreakeven) {
          setTrades((prevTrades) =>
            prevTrades.map((t) => {
              if (t.status === 'OPEN' && !t.isBreakevenMoved) {
                const curPrice = data.find((p) => p.symbol === t.symbol)?.price || t.entryPrice;
                const isBuy = t.side === 'BUY';
                const gainPct = ((curPrice - t.entryPrice) / t.entryPrice) * (isBuy ? 1 : -1) * 100;
                if (gainPct >= 1.5) {
                  return {
                    ...t,
                    stopLoss: t.entryPrice,
                    isBreakevenMoved: true,
                  };
                }
              }
              return t;
            })
          );
        }

        // Dynamic ATR Trailing Stop
        if (settings.dynamicAtrTrailingEnabled) {
          setTrades((prevTrades) =>
            prevTrades.map((t) => {
              if (t.status === 'OPEN') {
                const curPrice = data.find((p) => p.symbol === t.symbol)?.price || t.entryPrice;
                const isBuy = t.side === 'BUY';
                const gainPct = ((curPrice - t.entryPrice) / t.entryPrice) * (isBuy ? 1 : -1) * 100;
                if (gainPct >= 3.0) {
                  const estimatedAtr = curPrice * 0.008;
                  const trailDistance = estimatedAtr * (settings.atrMultiplier || 1.8);
                  const newTrailingSl = isBuy ? curPrice - trailDistance : curPrice + trailDistance;
                  if (isBuy ? newTrailingSl > t.stopLoss : newTrailingSl < t.stopLoss) {
                    return {
                      ...t,
                      stopLoss: Math.round(newTrailingSl * 100) / 100,
                      atrTrailingActive: true,
                    };
                  }
                }
              }
              return t;
            })
          );
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [settings.autoMoveBreakeven, settings.dynamicAtrTrailingEnabled]);

  // Emergency Panic Kill Switch
  const handleConfirmKillSwitch = async () => {
    let totalPnl = 0;
    let count = 0;

    // 1. Immediately shut off autoTrading
    setSettings((prev) => ({ ...prev, autoTradingEnabled: false }));

    // 2. Flatten local trades
    setTrades((prev) =>
      prev.map((t) => {
        if (t.status === 'OPEN') {
          count++;
          const curP = currentPricesMap[t.symbol] || t.entryPrice;
          const mult = t.side === 'BUY' ? 1 : -1;
          const pnl = ((curP - t.entryPrice) / t.entryPrice) * t.amountUsdt * t.leverage * mult;
          totalPnl += pnl;
          return {
            ...t,
            status: pnl >= 0 ? 'WON' : 'LOST',
            exitPrice: curP,
            pnlUsdt: Math.round(pnl * 100) / 100,
            closedAt: Date.now(),
          };
        }
        return t;
      })
    );

    setPortfolioBalance((p) => p + totalPnl);
    setIsKillSwitchOpen(false);

    // 3. Dispatch backend kill switch to cancel all open orders and flatten real exchange positions
    try {
      const res = await apiService.emergencyKillSwitch({
        exchange: settings.exchange,
        apiKey: settings.apiKey,
        apiSecret: settings.apiSecret,
        isTestnet: Boolean((settings as any).isTestnet),
        telegramBotToken: settings.autoSendTelegram ? settings.telegramBotToken : undefined,
        telegramChatId: settings.autoSendTelegram ? settings.telegramChatId : undefined,
      });

      if (settings.exchange === 'BINANCE' && refreshBinanceBalance) {
        refreshBinanceBalance();
      }

      setKillSwitchMessage(
        `🚨 ĐÃ KÍCH HOẠT KILL SWITCH TOÀN PHẦN: Đã tắt Auto-Trade! Đóng ${count} vị thế cục bộ (${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)} USDT). ${res?.message || ''}`
      );
    } catch {
      setKillSwitchMessage(
        `🚨 ĐÃ KÍCH HOẠT KILL SWITCH CỤC BỘ: Đã tắt Auto-Trade và đóng thành công ${count} vị thế. Tổng PnL: ${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)} USDT.`
      );
    }

    setTimeout(() => setKillSwitchMessage(null), 8000);
  };

  // Generate signal via Gemini AI
  const handleGenerateSignal = async (sym: CryptoSymbol, customStyle?: string) => {
    setIsAnalyzingSignal(true);
    const targetPrice = pairs.find((p) => p.symbol === sym)?.price || currentPair.price;
    const style = customStyle || settings.activeStyles[0] || 'Smart Money Concepts & ICT';

    const newSignal = await apiService.analyzeSignal({
      symbol: sym,
      currentPrice: targetPrice,
      timeframe: '15m/1H',
      traderStyle: style,
      whaleActivity: `${sentimentSummary} - Net flow 24h: +$${(whaleNetFlow / 1_000_000).toFixed(1)}M`,
    });

    if (newSignal) {
      setActiveSignal(newSignal);
      setSignalsList((prev) => [newSignal, ...prev.slice(0, 9)]);

      if (settings.autoSendTelegram && settings.telegramBotToken) {
        apiService.sendTelegram({
          botToken: settings.telegramBotToken,
          chatId: settings.telegramChatId,
          message: newSignal.telegramAlertSummary,
        });
      }

      if (settings.webhookEnabled && settings.webhookUrl) {
        apiService.sendWebhook({
          webhookUrl: settings.webhookUrl,
          payload: {
            event: 'NEW_AI_TRADE_SIGNAL',
            signal: newSignal,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
    setIsAnalyzingSignal(false);
  };

  const currentPricesMap = useMemo(() => {
    const map: Record<string, number> = {};
    pairs.forEach((p) => {
      map[p.symbol] = p.price;
    });
    return map;
  }, [pairs]);

  const handleExecuteOrder = async (signal: TradeSignal) => {
    // Check if user set Binance but hasn't configured API keys
    if (settings.exchange === 'BINANCE' && (!settings.apiKey || !settings.apiSecret)) {
      setKillSwitchMessage(
        '⚠️ Lệnh chưa được gửi: Bạn đang chọn sàn Binance nhưng chưa cài API Key & Secret. Vui lòng vào mục Cài Đặt (góc phải trên) để dán API Key hoặc chuyển sang chế độ Giả Lập (Paper Trading).'
      );
      setTimeout(() => setKillSwitchMessage(null), 7000);
      return;
    }

    const isBuy = signal.direction === 'LONG' || (signal as any).direction === 'BUY';
    const effectiveBal = settings.exchange === 'BINANCE' && typeof realBinanceBalance === 'number'
      ? realBinanceBalance
      : portfolioBalance;
    const amount = settings.exchange === 'BINANCE'
      ? (effectiveBal < 50 ? Math.max(5, Math.floor(effectiveBal * 0.35)) : Math.max(10, Math.min(100, Math.round(effectiveBal * ((settings.riskPerTradePercent || 2) / 100)))))
      : Math.max(20, Math.round(portfolioBalance * ((settings.riskPerTradePercent || 2) / 100)));
    const lev = settings.defaultLeverage || 10;

    // 1. Independent Quantitative Hard Rules Validation
    const riskCheck = defaultRiskManager.validateOrder({
      symbol: signal.symbol,
      side: isBuy ? 'BUY' : 'SELL',
      price: signal.entryPrice,
      amountMarginUsdt: amount,
      leverage: lev,
      stopLoss: signal.stopLoss,
      takeProfit: signal.tp1,
      walletBalance: effectiveBal,
      recentTrades: trades,
      settings,
    });

    if (!riskCheck.allowed) {
      setKillSwitchMessage(`🛡️ QUY TẮC RỦI RO CHẶN LỆNH: ${riskCheck.reason}`);
      setTimeout(() => setKillSwitchMessage(null), 7000);
      return;
    }

    let realOrderResult: any = null;
    try {
      realOrderResult = await apiService.executeOrder({
        exchange: settings.exchange || 'PAPER',
        symbol: signal.symbol,
        side: isBuy ? 'BUY' : 'SELL',
        type: 'MARKET',
        price: signal.entryPrice,
        amount,
        leverage: lev,
        stopLoss: signal.stopLoss,
        takeProfit: signal.tp1,
        maxSlippagePercent: settings.maxSlippagePercent || 0.25,
        isTestnet: Boolean((settings as any).isTestnet),
        apiKey: settings.apiKey,
        apiSecret: settings.apiSecret,
        telegramBotToken: settings.autoSendTelegram ? settings.telegramBotToken : undefined,
        telegramChatId: settings.autoSendTelegram ? settings.telegramChatId : undefined,
      });

      if (!realOrderResult || !realOrderResult.success) {
        const errorText = realOrderResult?.error || 'Không thể kết nối máy chủ gửi lệnh';
        const hintText = realOrderResult?.hint ? `(${realOrderResult.hint})` : '';
        setKillSwitchMessage(`❌ Sàn từ chối lệnh: ${errorText} ${hintText}`);
        setTimeout(() => setKillSwitchMessage(null), 7000);
        return;
      }
    } catch (e: any) {
      setKillSwitchMessage(`❌ Lỗi gửi lệnh: ${e.message || 'Mạng bị nghẽn'}`);
      setTimeout(() => setKillSwitchMessage(null), 6000);
      return;
    }

    const orderId = realOrderResult?.order?.orderId || `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const execPrice = realOrderResult?.order?.executedPrice || signal.entryPrice;

    const newTrade: ExecutedTrade = {
      id: orderId,
      symbol: signal.symbol,
      side: isBuy ? 'BUY' : 'SELL',
      type: 'MARKET',
      entryPrice: execPrice,
      amountUsdt: amount,
      leverage: lev,
      timeframe: (signal.timeframe?.toLowerCase() || activeTimeframe) as any,
      stopLoss: signal.stopLoss,
      takeProfit: signal.tp1,
      pnlUsdt: 0,
      pnlPercent: 0,
      status: 'OPEN',
      openedAt: Date.now(),
      strategyName: `${signal.proTraderStyle} (${signal.riskRewardRatio})`,
      exchange: settings.exchange || 'PAPER',
    };

    setTrades((prev) => [newTrade, ...prev]);

    // Refresh live Binance wallet balance immediately after order execution
    if (settings.exchange === 'BINANCE') {
      refreshBinanceBalance();
    }

    const isReal = realOrderResult?.isRealBinanceOrder;
    setKillSwitchMessage(
      isReal
        ? `⚡ ĐÃ GỬI LỆNH THẬT LÊN BINANCE FUTURES! ${isBuy ? 'BUY' : 'SELL'} #${signal.symbol} tại $${execPrice.toLocaleString()} USDT (Mã: #${orderId})!`
        : `✅ ĐÃ KHỚP LỆNH (${settings.exchange || 'PAPER'}): ${isBuy ? 'BUY' : 'SELL'} #${signal.symbol} tại $${execPrice.toLocaleString()} USDT (${lev}x)!`
    );
    setTimeout(() => setKillSwitchMessage(null), 5000);

    // Auto notify Telegram if token is set
    if (settings.autoSendTelegram && settings.telegramBotToken) {
      apiService.sendTelegram({
        botToken: settings.telegramBotToken,
        chatId: settings.telegramChatId,
        message: `⚡ *KHỚP LỆNH MỚI #${signal.symbol} (${settings.exchange || 'PAPER'})*\n\n` +
          `🎯 Chiều: ${isBuy ? 'BUY / LONG' : 'SELL / SHORT'}\n` +
          `💵 Giá vào: $${execPrice.toLocaleString()} USDT\n` +
          `🛑 Cắt lỗ (SL): $${signal.stopLoss.toLocaleString()} USDT\n` +
          `🎯 Chốt lời (TP1): $${signal.tp1.toLocaleString()} USDT\n` +
          `⚖️ Đòn bẩy: ${lev}x | R:R: ${signal.riskRewardRatio}`,
      });
    }

    if (viewMode === 'PRO_TERMINAL') {
      setActiveTab('history');
    }
  };

  // Bot Automated Trading Engine (Auto-Trade Loop)
  // Directly fulfills user query: "cách bot tự động trade như thế nào"
  useEffect(() => {
    if (!settings.autoTradingEnabled) return;

    // Guard: Check circuit breaker status
    const circuitStatus = defaultRiskManager.isCircuitBreakerActive();
    if (circuitStatus.active) {
      setSettings((prev) => ({ ...prev, autoTradingEnabled: false }));
      setKillSwitchMessage(`🛡️ AUTO-TRADE ĐÃ TỰ TẮT: ${circuitStatus.reason}`);
      setTimeout(() => setKillSwitchMessage(null), 8000);
      return;
    }

    const autoTradeTimer = setInterval(() => {
      if (!currentEffectiveSignal || currentEffectiveSignal.status !== 'ACTIVE') return;

      // 1. Guard against Binance mode without API keys
      if (settings.exchange === 'BINANCE' && (!settings.apiKey || !settings.apiSecret)) {
        setKillSwitchMessage(
          '⚠️ Bot Auto-Trade: Bạn đang chọn sàn Binance nhưng chưa cài API Key & Secret. Vui lòng vào Cài Đặt để nhập hoặc chuyển sang chế độ Giả Lập (Paper Trading).'
        );
        setTimeout(() => setKillSwitchMessage(null), 8000);
        return;
      }

      // 2. Prevent duplicate active trades on the same symbol
      const hasOpenPosition = trades.some(
        (t) => t.symbol === currentEffectiveSignal.symbol && t.status === 'OPEN'
      );
      if (hasOpenPosition) return;

      // 3. High confidence threshold for auto-trade (>= 85%)
      if ((currentEffectiveSignal.confidenceScore || 88) < 85) return;

      // 4. Price proximity check: Current price is within 0.6% of entry
      const curPrice = currentPricesMap[currentEffectiveSignal.symbol] || currentEffectiveSignal.entryPrice;
      const distPct = Math.abs(curPrice - currentEffectiveSignal.entryPrice) / currentEffectiveSignal.entryPrice;
      if (distPct > 0.006) return;

      // 5. Execute automated trade!
      handleExecuteOrder(currentEffectiveSignal);
    }, 15000);

    return () => clearInterval(autoTradeTimer);
  }, [settings.autoTradingEnabled, settings.exchange, settings.apiKey, settings.apiSecret, currentEffectiveSignal, trades, currentPricesMap]);

  const handleSaveToJournal = (signal: TradeSignal) => {
    handleExecuteOrder(signal);
  };

  const handleTradeExecutedFromTerminal = (trade: ExecutedTrade) => {
    setTrades((prev) => [trade, ...prev]);
  };

  const handleCloseTrade = (tradeId: string, currentMarketPrice: number) => {
    setTrades((prev) =>
      prev.map((t) => {
        if (t.id === tradeId && t.status === 'OPEN') {
          const isBuy = t.side === 'BUY';
          const mult = isBuy ? 1 : -1;
          const pnlUsdt = ((currentMarketPrice - t.entryPrice) / t.entryPrice) * t.amountUsdt * t.leverage * mult;
          const pnlPercent = ((currentMarketPrice - t.entryPrice) / t.entryPrice) * t.leverage * mult * 100;
          const status = pnlUsdt >= 0 ? 'WON' : 'LOST';
          const roundedPnlUsdt = Math.round(pnlUsdt * 100) / 100;
          const roundedPnlPercent = Math.round(pnlPercent * 100) / 100;

          setPortfolioBalance((p) => p + roundedPnlUsdt);

          const updatedClosedTrade: ExecutedTrade = {
            ...t,
            exitPrice: currentMarketPrice,
            pnlUsdt: roundedPnlUsdt,
            pnlPercent: roundedPnlPercent,
            status,
            closedAt: Date.now(),
          };

          // Record in risk manager
          defaultRiskManager.recordTradeOutcome(updatedClosedTrade);

          // Check if circuit breaker was triggered by consecutive losses
          const cb = defaultRiskManager.isCircuitBreakerActive();
          if (cb.active) {
            setSettings((s) => ({ ...s, autoTradingEnabled: false }));
            setKillSwitchMessage(`🛡️ KÍCH HOẠT CIRCUIT BREAKER: ${cb.reason}. Auto-Trade đã tự động ngắt!`);
            setTimeout(() => setKillSwitchMessage(null), 9000);

            if (settings.autoSendTelegram && settings.telegramBotToken) {
              const cbMsg = telegramAlertService.formatCircuitBreakerAlert(cb.reason, Math.abs(roundedPnlUsdt), 400);
              telegramAlertService.dispatchTelegram(cbMsg, {
                botToken: settings.telegramBotToken,
                chatId: settings.telegramChatId,
              });
            }
          }

          // Dispatch standard Telegram PnL Alert
          if (settings.autoSendTelegram && settings.telegramBotToken) {
            const closeMsg = telegramAlertService.formatCloseTradeMessage(updatedClosedTrade, currentMarketPrice);
            telegramAlertService.dispatchTelegram(closeMsg, {
              botToken: settings.telegramBotToken,
              chatId: settings.telegramChatId,
            });
          }

          return updatedClosedTrade;
        }
        return t;
      })
  };

  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử giao dịch không?')) {
      setTrades([]);
    }
  };

  const handleToggleStyle = (styleName: string) => {
    setSettings((prev) => {
      const exists = prev.activeStyles.includes(styleName);
      return {
        ...prev,
        activeStyles: exists
          ? prev.activeStyles.filter((s) => s !== styleName)
          : [...prev.activeStyles, styleName],
      };
    });
  };

  const handleRunAiLearningStudy = (trader: ProTraderProfile) => {
    handleGenerateSignal(selectedSymbol, `${trader.name}: ${trader.specialty}`);
    setActiveTab('signals');
  };

  return (
    <div className="min-h-screen bg-[#070a11] text-[#e2e8f0] flex flex-col pb-16 lg:pb-6 font-sans">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        setSettings={setSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onEmergencyKillSwitch={() => setIsKillSwitchOpen(true)}
        onOpenLayoutCustomizer={() => setIsLayoutCustomizerOpen(true)}
        onOpenAudit={() => setIsAuditModalOpen(true)}
        onOpenHealthModal={() => setIsHealthModalOpen(true)}
        isOnline={isOnline}
        viewMode={viewMode}
        onToggleViewMode={toggleViewMode}
        realBinanceBalance={realBinanceBalance}
      />

      {/* Offline Toast if network dropped */}
      {!isOnline && (
        <div className="bg-amber-600/90 text-white text-xs font-mono py-1 px-4 text-center flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Đang chạy ở chế độ ngoại tuyến (Offline Mode) · Dữ liệu cục bộ được bảo toàn an toàn.</span>
        </div>
      )}

      {/* Real-time Ticker Bar for BTC, ETH, SOL, XAU (Customizable) */}
      {layoutPrefs.showTickerBar && (
        <MarketTickerBar
          pairs={pairs}
          selectedSymbol={selectedSymbol}
          onSelectSymbol={setSelectedSymbol}
        />
      )}

      {/* Main Container */}
      <main className="max-w-[1720px] w-full mx-auto px-3 sm:px-5 py-4 sm:py-6 flex-1 flex flex-col gap-5">
        {/* Incremental Delta-Sync & Mobile Offline File Storage Hub */}
        <DeltaSyncBanner
          isOnline={isOnline}
          onDeltaSync={handleDeltaSync}
          onOpenAudit={() => setIsAuditModalOpen(true)}
          onRestoreBackup={handleRestoreBackup}
          appStateForExport={{
            settings,
            trades,
            portfolioBalance,
            viewMode,
            layoutPrefs,
            copilotChatHistory: offlineStorage.getCopilotHistory(),
            cachedPairs: pairs,
          }}
        />

        {/* Macro News & Economic Calendar Banner (Customizable) */}
        {layoutPrefs.showMacroBanner && (
          <MacroNewsBanner
            events={economicCalendarData}
            macroProtectionEnabled={settings.macroNewsFilterEnabled}
            onToggleProtection={() =>
              setSettings((p) => ({ ...p, macroNewsFilterEnabled: !p.macroNewsFilterEnabled }))
            }
          />
        )}

        {killSwitchMessage && (
          <div className="bg-rose-950/60 border border-rose-800 text-rose-200 px-4 py-2.5 rounded-xl text-xs font-mono flex items-center gap-2 animate-fadeIn">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{killSwitchMessage}</span>
          </div>
        )}

        {/* VIEW MODE 1: CHẾ ĐỘ TỐI GIẢN (QB FOCUS MODE) */}
        {viewMode === 'QB_SIMPLE' && (
          <div className="flex flex-col gap-5">
            {/* Quick Status Bar: QB Lite First Architecture */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d121f] border border-cyan-500/30 rounded-2xl p-3.5 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                      BẢNG QB SIÊU TỐC (CHẠY TRƯỚC 0MS)
                    </span>
                    <span className="text-[10px] text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-700/60 font-mono font-semibold">
                      ƯU TIÊN BẬT LÀ LÊN
                    </span>
                    {isSystemStable ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Đã kết nối ổn định
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded-full font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                        Sẵn sàng từ bộ nhớ máy
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Bật ngay tức thì không độ trễ: Kế hoạch SL / TP / Entry, AI Copilot, nến Price Action và lịch sử tín hiệu
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleViewMode}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900/90 hover:to-blue-900/90 text-cyan-300 border border-cyan-600/50 rounded-xl text-xs font-mono font-bold transition-all shadow-xs cursor-pointer"
                  title="Khi hệ thống ổn định, bấm để mở đầy đủ các tab và trạm phân tích nâng cao"
                >
                  <span>Mở Trạm Toàn Diện (Pro Terminal)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </div>
            </div>

            {/* Main Grid: Chart + Recent Signals (Left) & QB Trading Plan Card (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Interactive Technical Chart & Recent Signals Table */}
              <div className="lg:col-span-8 flex flex-col gap-5">
                <TradingChart
                  symbol={selectedSymbol}
                  klines={klines}
                  signal={currentEffectiveSignal}
                  previewSignal={previewHistoricalSignal}
                  onClearPreview={handleResetToLive}
                  onRefresh={() => loadKlines(selectedSymbol, activeTimeframe)}
                  isLoading={isLoadingChart}
                  onSelectSymbol={setSelectedSymbol}
                  pairs={pairs}
                  currentTimeframe={activeTimeframe}
                  onSelectTimeframe={handleTimeframeChange}
                />

                {/* QB-Style Recent Signals Ledger */}
                <RecentSignalsTable
                  signals={tfData.recentSignals}
                  selectedSignalId={selectedRecentSignalId}
                  onSelectSignal={handleSelectRecentSignal}
                  onResetToLive={handleResetToLive}
                  isHistoricalPreviewActive={!!previewHistoricalSignal}
                  timeframe={activeTimeframe}
                />
              </div>

              {/* Right Column: Prominent QB-Style Trading Plan Card & Quick Execution */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <QBPlanCard
                  signal={currentEffectiveSignal}
                  currentPrice={currentPair.price}
                  timeframe={activeTimeframe}
                  settings={settings}
                  onExecuteOrder={handleExecuteOrder}
                  onSaveToJournal={handleSaveToJournal}
                  isHistoricalPreview={!!previewHistoricalSignal}
                  onResetToLive={handleResetToLive}
                  onOpenAuditModal={() => setIsAuditModalOpen(true)}
                  onToggleDirection={setActiveDirection}
                />

                {/* Quick Execution Terminal Widget */}
                <OrderTerminal
                  symbol={selectedSymbol}
                  currentPrice={currentPair.price}
                  activeSignal={currentEffectiveSignal}
                  settings={settings}
                  portfolioBalance={portfolioBalance}
                  realBinanceBalance={realBinanceBalance}
                  onRefreshBinanceBalance={refreshBinanceBalance}
                  onTradeExecuted={handleTradeExecutedFromTerminal}
                  onEmergencyKillSwitch={() => setIsKillSwitchOpen(true)}
                  externalPlan={pendingTerminalPlan}
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODE 2: TRẠM GIAO DỊCH TOÀN DIỆN (PRO TERMINAL MODE) */}
        {viewMode === 'PRO_TERMINAL' && (
          <div className="flex flex-col gap-5">
            {/* TAB 1: TERMINAL & CHART */}
            {activeTab === 'terminal' && (
              <div className="flex flex-col gap-5">
                {/* Quick Signal Dispatch & Status Kicker */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d121f] border border-slate-800/80 rounded-2xl p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
                        AI MARKET INTELLIGENCE SCANNER
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40">
                          SMC + WYCKOFF + ON-CHAIN
                        </span>
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Quét phân tích biến động đa khung thời gian, tương quan ví cá voi và tạo điểm vào lệnh tối ưu
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleGenerateSignal(selectedSymbol)}
                      disabled={isAnalyzingSignal}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isAnalyzingSignal ? 'animate-spin' : ''}`} />
                      <span>
                        {isAnalyzingSignal
                          ? `Đang Phân Tích ${selectedSymbol}...`
                          : `Quét Tín Hiệu Mới Cho ${selectedSymbol}`}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Split Grid: Chart (Left) + Order Terminal & Active Signal (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column: Interactive Technical Chart */}
                  <div className="lg:col-span-8 flex flex-col gap-4">
                    <TradingChart
                      symbol={selectedSymbol}
                      klines={klines}
                      signal={currentEffectiveSignal}
                      previewSignal={previewHistoricalSignal}
                      onClearPreview={handleResetToLive}
                      onRefresh={() => loadKlines(selectedSymbol, activeTimeframe)}
                      isLoading={isLoadingChart}
                      onSelectSymbol={setSelectedSymbol}
                      pairs={pairs}
                      currentTimeframe={activeTimeframe}
                      onSelectTimeframe={handleTimeframeChange}
                    />

                    {/* Multi-Timeframe Self-Evaluation & Confluence Matrix (Customizable) */}
                    {layoutPrefs.showMultiTimeframe && (
                      <MultiTimeframeAnalysis
                        symbol={selectedSymbol}
                        currentPrice={currentPair.price}
                        activeTimeframe={activeTimeframe}
                        onSelectTimeframe={handleTimeframeChange}
                      />
                    )}

                    {/* Recent Signals Ledger with Click-to-Inspect on Chart */}
                    <RecentSignalsTable
                      signals={tfData.recentSignals}
                      selectedSignalId={selectedRecentSignalId}
                      onSelectSignal={handleSelectRecentSignal}
                      onResetToLive={handleResetToLive}
                      isHistoricalPreviewActive={!!previewHistoricalSignal}
                      timeframe={activeTimeframe}
                    />

                {/* Active Signal Preview under the chart */}
                {activeSignal && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Tín Hiệu AI Mới Nhất Cho {selectedSymbol}:
                    </span>
                    <SignalCard
                      signal={activeSignal}
                      settings={settings}
                      currentPrice={currentPricesMap[activeSignal.symbol] || currentPair.price}
                      onExecuteOrder={handleExecuteOrder}
                      onSaveToJournal={handleSaveToJournal}
                    />
                  </div>
                )}
              </div>

              {/* Right Column: Order Placement & Live Execution Terminal */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <OrderTerminal
                  symbol={selectedSymbol}
                  currentPrice={currentPair.price}
                  activeSignal={currentEffectiveSignal}
                  settings={settings}
                  portfolioBalance={portfolioBalance}
                  realBinanceBalance={realBinanceBalance}
                  onRefreshBinanceBalance={refreshBinanceBalance}
                  onTradeExecuted={handleTradeExecutedFromTerminal}
                  onEmergencyKillSwitch={() => setIsKillSwitchOpen(true)}
                  externalPlan={pendingTerminalPlan}
                />

                {/* Whale Sentiment Radar Compact Widget (Customizable) */}
                {layoutPrefs.showWhaleRadarWidget && (
                  <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 font-bold uppercase">Cá Voi Tích Lũy 24h:</span>
                      <span className="text-emerald-400 font-semibold">{sentimentSummary}</span>
                    </div>
                    <div className="text-xs text-slate-300">
                      Net Flow:{' '}
                      <strong className="text-emerald-400 font-mono">
                        +${(whaleNetFlow / 1_000_000).toFixed(1)}M USD
                      </strong>{' '}
                      rút về ví lạnh.
                    </div>
                    <button
                      onClick={() => setActiveTab('whales')}
                      className="mt-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 cursor-pointer"
                    >
                      <span>Xem chi tiết danh sách ví cá mập</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Liquidation Heatmap Section (Customizable) */}
            {layoutPrefs.showLiquidationHeatmap && (
              <LiquidationHeatmap
                data={getLiquidationHeatmap(selectedSymbol, currentPair.price)}
                symbol={selectedSymbol}
              />
            )}
          </div>
        )}

        {/* TAB 2: AI SIGNALS HUB */}
        {activeTab === 'signals' && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0b101b] border border-slate-800 rounded-2xl p-4">
              <div>
                <h2 className="text-base font-bold text-white font-mono">
                  Bảng Điều Khiển Tín Hiệu AI (SL · TP · Entry)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tín hiệu chuẩn hóa cho BTC, ETH, SOL, XAU kèm phân tích Smart Money & thông báo Telegram
                </p>
              </div>

              <div className="flex items-center gap-2">
                {(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'PAXGUSDT'] as const).map((sym) => (
                  <button
                    key={sym}
                    onClick={() => {
                      setSelectedSymbol(sym);
                      handleGenerateSignal(sym);
                    }}
                    disabled={isAnalyzingSignal}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      selectedSymbol === sym
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Quét {sym.replace('USDT', '')}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {signalsList.map((sig) => (
                <SignalCard
                  key={sig.id}
                  signal={sig}
                  settings={settings}
                  currentPrice={currentPricesMap[sig.symbol]}
                  onExecuteOrder={handleExecuteOrder}
                  onSaveToJournal={handleSaveToJournal}
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: WHALE TRACKER */}
        {activeTab === 'whales' && (
          <WhaleTracker
            transactions={whaleTxs}
            netFlowUsd={whaleNetFlow}
            sentimentSummary={sentimentSummary}
            onRefresh={loadWhales}
            isLoading={false}
          />
        )}

        {/* TAB 4: MACHINE LEARNING & REINFORCEMENT LEARNING HUB */}
        {activeTab === 'ml-hub' && <MachineLearningHub />}

        {/* TAB 5: PRO TRADER HUB */}
        {activeTab === 'pro-hub' && (
          <ProTraderHub
            activeStyles={settings.activeStyles}
            onToggleStyle={handleToggleStyle}
            onRunAiLearningStudy={handleRunAiLearningStudy}
            isAnalyzing={isAnalyzingSignal}
          />
        )}

        {/* TAB 6: HISTORY & RISK ANALYTICS */}
        {activeTab === 'history' && (
          <TradeHistory
            trades={trades}
            onCloseTrade={handleCloseTrade}
            onClearHistory={handleClearHistory}
            currentPrices={currentPricesMap}
          />
        )}
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <AlertSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
      />

      {/* System Health Check & Diagnosis Modal */}
      <SystemHealthModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        settings={settings}
      />

      {/* Workspace & Layout Customizer Modal */}
      <LayoutCustomizerModal
        isOpen={isLayoutCustomizerOpen}
        onClose={() => setIsLayoutCustomizerOpen(false)}
        prefs={layoutPrefs}
        onUpdatePrefs={setLayoutPrefs}
        onResetDefaults={() => setLayoutPrefs(DEFAULT_LAYOUT_PREFS)}
      />

      {/* Emergency Panic Kill Switch Confirmation Modal */}
      {isKillSwitchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0f1422] border-2 border-rose-600/80 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-[0_0_30px_rgba(225,29,72,0.3)] flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 mx-auto flex items-center justify-center text-rose-400">
              <Shield className="w-6 h-6 text-rose-400 animate-pulse" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wide">
                XÁC NHẬN KÍCH HOẠT KILL SWITCH KHẨN CẤP
              </h3>
              <p className="text-xs text-rose-200/80 mt-2 leading-relaxed font-sans">
                Hành động này sẽ <strong className="text-white">HỦY TOÀN BỘ LỆNH CHỜ</strong> và{' '}
                <strong className="text-white">ĐÓNG TẤT CẢ VỊ THẾ ĐANG MỞ</strong> ngay lập tức theo giá thị trường để bảo toàn tối đa số dư vốn trước cú sập bất ngờ.
              </p>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 flex items-center justify-between">
              <span>Vị thế đang mở cần đóng:</span>
              <span className="text-rose-400 font-bold tabular-nums">
                {trades.filter((t) => t.status === 'OPEN').length} Lệnh
              </span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsKillSwitchOpen(false)}
                className="flex-1 py-2.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              >
                Hủy Bỏ (Không Đóng)
              </button>
              <button
                onClick={handleConfirmKillSwitch}
                className="flex-1 py-2.5 rounded-lg text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-[0_0_15px_rgba(225,29,72,0.4)] cursor-pointer"
              >
                ĐỒNG Ý ĐÓNG HẾT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Independent 3rd-Party Quant Audit Report Modal */}
      <ThirdPartyAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        activeTimeframe={activeTimeframe}
        exchange={settings.exchange}
      />

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAudit={() => setIsAuditModalOpen(true)}
      />
    </div>
  );
}
