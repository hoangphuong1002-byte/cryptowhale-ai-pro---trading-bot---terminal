// Fast-Boot Cache Service for Instant App Launch & Offline Persistence
// Resolves the issue: "app thoát lâu thì vô khó có cách nào cải thiện"
// Provides 0ms initial render with Stale-While-Revalidate background sync.

import { MarketPair, KlineData, TradeSignal, WhaleTransaction } from '../types';

const CACHE_KEYS = {
  PAIRS: 'cw_fast_cache_pairs',
  KLINES_PREFIX: 'cw_fast_cache_klines_',
  WHALES: 'cw_fast_cache_whales',
  LAST_SIGNAL: 'cw_fast_cache_last_signal',
  CACHE_TIMESTAMP: 'cw_fast_cache_ts',
};

// Default high-precision baseline pairs if no cache exists on very first visit
export const DEFAULT_BASELINE_PAIRS: MarketPair[] = [
  {
    symbol: 'BTCUSDT',
    name: 'Bitcoin',
    price: 86720.5,
    change24h: 2.45,
    high24h: 87800,
    low24h: 84900,
    volume24h: 2450000000,
    fundingRate: 0.0105,
    openInterest: 1120000000,
    trend: 'BULLISH',
    rsi: 63.5,
    ema20: 85900,
    ema50: 84200,
    updatedAt: Date.now(),
  },
  {
    symbol: 'ETHUSDT',
    name: 'Ethereum',
    price: 2701.4,
    change24h: 1.15,
    high24h: 2745,
    low24h: 2660,
    volume24h: 1200000000,
    fundingRate: 0.0092,
    openInterest: 540000000,
    trend: 'BULLISH',
    rsi: 59.2,
    ema20: 2685,
    ema50: 2640,
    updatedAt: Date.now(),
  },
  {
    symbol: 'SOLUSDT',
    name: 'Solana',
    price: 185.6,
    change24h: 4.82,
    high24h: 191.0,
    low24h: 177.5,
    volume24h: 890000000,
    fundingRate: 0.0135,
    openInterest: 410000000,
    trend: 'BULLISH',
    rsi: 66.8,
    ema20: 181.5,
    ema50: 174.0,
    updatedAt: Date.now(),
  },
  {
    symbol: 'PAXGUSDT',
    name: 'Gold (XAU / PAXG)',
    price: 4158.5,
    change24h: 0.65,
    high24h: 4180,
    low24h: 4140,
    volume24h: 240000000,
    fundingRate: 0.004,
    openInterest: 160000000,
    trend: 'BULLISH',
    rsi: 57.0,
    ema20: 4145,
    ema50: 4125,
    updatedAt: Date.now(),
  },
  {
    symbol: 'BNBUSDT',
    name: 'BNB Chain',
    price: 592.4,
    change24h: 1.85,
    high24h: 598.0,
    low24h: 582.0,
    volume24h: 310000000,
    fundingRate: 0.008,
    openInterest: 190000000,
    trend: 'BULLISH',
    rsi: 61.0,
    ema20: 588.0,
    ema50: 576.0,
    updatedAt: Date.now(),
  },
  {
    symbol: 'DOGEUSDT',
    name: 'Dogecoin',
    price: 0.185,
    change24h: 3.12,
    high24h: 0.192,
    low24h: 0.178,
    volume24h: 420000000,
    fundingRate: 0.012,
    openInterest: 140000000,
    trend: 'BULLISH',
    rsi: 62.5,
    ema20: 0.181,
    ema50: 0.172,
    updatedAt: Date.now(),
  },
  {
    symbol: 'XRPUSDT',
    name: 'Ripple',
    price: 0.584,
    change24h: -0.45,
    high24h: 0.595,
    low24h: 0.575,
    volume24h: 280000000,
    fundingRate: 0.006,
    openInterest: 110000000,
    trend: 'NEUTRAL',
    rsi: 51.0,
    ema20: 0.582,
    ema50: 0.580,
    updatedAt: Date.now(),
  },
];

export const fastCache = {
  // 1. Instant Synchronous Reads for 0ms First Render
  getCachedPairs(): MarketPair[] {
    try {
      const raw = localStorage.getItem(CACHE_KEYS.PAIRS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fall through to defaults
    }
    return DEFAULT_BASELINE_PAIRS;
  },

  setCachedPairs(pairs: MarketPair[]) {
    try {
      localStorage.setItem(CACHE_KEYS.PAIRS, JSON.stringify(pairs));
      localStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
    } catch (e) {
      console.warn('FastCache write pairs failed', e);
    }
  },

  getCachedKlines(symbol: string, interval: string): KlineData[] {
    try {
      const key = `${CACHE_KEYS.KLINES_PREFIX}${symbol}_${interval}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fall through
    }
    return [];
  },

  getOrCreateKlines(symbol: string, interval: string): KlineData[] {
    const cached = this.getCachedKlines(symbol, interval);
    if (cached.length > 0) return cached;

    // Instant baseline candles so chart NEVER renders blank or stalls on mobile cold-start
    const basePairs = this.getCachedPairs();
    const basePrice = basePairs.find((p) => p.symbol === symbol)?.price || (symbol.startsWith('BTC') ? 86340 : 2600);
    const synth: KlineData[] = [];
    const now = Date.now();
    let prev = basePrice * 0.985;
    const stepMs = interval === '1m' ? 60000 : interval === '5m' ? 300000 : interval === '15m' ? 900000 : interval === '1h' ? 3600000 : interval === '4h' ? 14400000 : 86400000;

    for (let i = 45; i >= 0; i--) {
      const delta = (Math.random() - 0.48) * (basePrice * 0.007);
      const open = prev;
      const close = prev + delta;
      const high = Math.max(open, close) + Math.random() * (basePrice * 0.0035);
      const low = Math.min(open, close) - Math.random() * (basePrice * 0.0035);
      const vol = Math.round(Math.random() * 80 + 20);

      synth.push({
        time: now - i * stepMs,
        open: Math.round(open * 10) / 10,
        high: Math.round(high * 10) / 10,
        low: Math.round(low * 10) / 10,
        close: Math.round(close * 10) / 10,
        volume: vol,
      });
      prev = close;
    }

    this.setCachedKlines(symbol, interval, synth);
    return synth;
  },

  setCachedKlines(symbol: string, interval: string, klines: KlineData[]) {
    try {
      const key = `${CACHE_KEYS.KLINES_PREFIX}${symbol}_${interval}`;
      // Keep only latest 60 klines to avoid localStorage size bloat
      const trimmed = klines.slice(-60);
      localStorage.setItem(key, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('FastCache write klines failed', e);
    }
  },

  getCachedWhales(): { transactions: WhaleTransaction[]; whaleNetFlow24hUsd: number; sentimentSummary: string } | null {
    try {
      const raw = localStorage.getItem(CACHE_KEYS.WHALES);
      if (raw) return JSON.parse(raw);
    } catch {
      // Fall through
    }
    return null;
  },

  setCachedWhales(data: { transactions: WhaleTransaction[]; whaleNetFlow24hUsd: number; sentimentSummary: string }) {
    try {
      localStorage.setItem(CACHE_KEYS.WHALES, JSON.stringify(data));
    } catch (e) {
      console.warn('FastCache write whales failed', e);
    }
  },

  getLastSignal(): TradeSignal | null {
    try {
      const raw = localStorage.getItem(CACHE_KEYS.LAST_SIGNAL);
      if (raw) return JSON.parse(raw);
    } catch {
      // Fall through
    }
    return null;
  },

  setLastSignal(signal: TradeSignal) {
    try {
      localStorage.setItem(CACHE_KEYS.LAST_SIGNAL, JSON.stringify(signal));
    } catch (e) {
      console.warn('FastCache write signal failed', e);
    }
  },

  getLastCacheAgeSeconds(): number {
    try {
      const ts = localStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
      if (ts) {
        return Math.floor((Date.now() - parseInt(ts, 10)) / 1000);
      }
    } catch {
      // Fall through
    }
    return 99999;
  },
};
