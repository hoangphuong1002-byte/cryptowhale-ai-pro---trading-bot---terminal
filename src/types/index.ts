export type CryptoSymbol =
  | 'BTCUSDT'
  | 'ETHUSDT'
  | 'SOLUSDT'
  | 'PAXGUSDT'
  | 'BNBUSDT'
  | 'DOGEUSDT'
  | 'XRPUSDT';

export interface MarketPair {
  symbol: CryptoSymbol;
  name: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  fundingRate: number;
  openInterest: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  rsi: number;
  ema20: number;
  ema50: number;
  updatedAt: number;
}

export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradeSignal {
  id: string;
  symbol: CryptoSymbol;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  entryRange: string;
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  riskRewardRatio: string;
  recommendedLeverage: string;
  timeframe: string;
  confidenceScore: number;
  proTraderStyle: string;
  strategyRationale: string;
  whaleActivityCorrelation?: string;
  keySupportResistance?: {
    support: number;
    resistance: number;
  };
  telegramAlertSummary: string;
  status: 'ACTIVE' | 'TP1_HIT' | 'TP2_HIT' | 'TP3_HIT' | 'SL_HIT' | 'CLOSED';
  createdAt: number;
}

export interface WhaleTransaction {
  id: string;
  coin: string;
  amount: number;
  valueUsd: number;
  fromTag: string;
  toTag: string;
  type: 'INFLOW' | 'OUTFLOW' | 'STAKING' | 'TRANSFER';
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  timestamp: number;
  blockchain: string;
  hash: string;
}

export interface ProTraderProfile {
  id: string;
  name: string;
  tagline: string;
  specialty: string;
  methodology: string[];
  historicalWinRate: number;
  avgRiskReward: string;
  active: boolean;
  avatarSeed: string;
  description: string;
  coreRule: string;
}

export interface EconomicEvent {
  id: string;
  name: string;
  currency: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  scheduledTime: number;
  timeRemainingStr: string;
  forecast?: string;
  previous?: string;
  tradingRiskStatus: 'SAFE' | 'CAUTION' | 'PAUSE_RECOMMENDED';
}

export interface BacktestTrade {
  id: string;
  date: string;
  symbol: CryptoSymbol;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  pnlPercent: number;
  pnlUsdt: number;
  result: 'WIN' | 'LOSS';
  holdingTimeHours: number;
  exitReason: 'TP1_TP2' | 'TP3_RUNNER' | 'STOP_LOSS' | 'BREAKEVEN';
}

export interface BacktestResult {
  strategyName: string;
  symbol: CryptoSymbol;
  periodDays: number;
  totalTrades: number;
  winRatePercent: number;
  profitFactor: number;
  totalReturnPercent: number;
  maxDrawdownPercent: number;
  avgTradeReturnPercent: number;
  sharpeRatio: number;
  trades: BacktestTrade[];
  equityCurve: { day: number; equity: number }[];
}

export interface LiquidationCluster {
  priceLevel: number;
  volumeUsd: number;
  side: 'SHORT_LIQ' | 'LONG_LIQ';
  intensity: 'HIGH' | 'EXTREME' | 'MEDIUM';
  distancePercent: number;
}

export interface LiquidationHeatmapData {
  symbol: CryptoSymbol;
  currentPrice: number;
  totalShortLiqUsd: number;
  totalLongLiqUsd: number;
  closestMagnetPrice: number;
  magnetDirection: 'UP' | 'DOWN';
  clusters: LiquidationCluster[];
}

export type TradingSessionType = 'ALL' | 'LONDON' | 'NEW_YORK' | 'LONDON_NY';

export interface ExecutedTrade {
  id: string;
  symbol: CryptoSymbol;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  entryPrice: number;
  exitPrice?: number;
  amountUsdt: number;
  leverage: number;
  stopLoss: number;
  takeProfit: number;
  pnlUsdt: number;
  pnlPercent: number;
  status: 'OPEN' | 'WON' | 'LOST' | 'CANCELLED';
  openedAt: number;
  closedAt?: number;
  strategyName: string;
  exchange: 'BINANCE' | 'BYBIT' | 'OKX' | 'PAPER';
  timeframe?: '15m' | '1h' | '4h' | '1d';
  isBreakevenMoved?: boolean;
  isPartialClosed?: boolean;
  atrTrailingActive?: boolean;
}

export interface DualTimeframeSetup {
  timeframe: '15m' | '1h' | '4h' | '1d';
  longSetup: TradeSignal;
  shortSetup: TradeSignal;
  recommendedDirection: 'LONG' | 'SHORT';
}

export interface BotSettings {
  autoTradingEnabled: boolean;
  autoSendTelegram: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  webhookUrl: string;
  webhookEnabled: boolean;
  exchange: 'BINANCE' | 'BYBIT' | 'OKX' | 'PAPER';
  apiKey: string;
  apiSecret: string;
  riskPerTradePercent: number;
  defaultLeverage: number;
  primaryStrategy: string;
  activeStyles: string[];
  alertPriceWhaleThresholdUsd: number;
  trailingStopEnabled: boolean;
  autoMoveBreakeven: boolean;
  macroNewsFilterEnabled: boolean;
  maxSlippagePercent: number;
  partialTakeProfitPercent: number;
  activeTradingSession: TradingSessionType;
  dynamicAtrTrailingEnabled: boolean;
  atrMultiplier: number;
  propFirmRiskMode: boolean;
  propFirmMaxDailyLossPercent: number;
  propFirmMaxTotalDrawdownPercent: number;
}


