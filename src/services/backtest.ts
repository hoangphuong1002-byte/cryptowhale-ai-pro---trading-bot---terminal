import { BacktestResult, BacktestTrade, CryptoSymbol, EconomicEvent } from '../types';

export const economicCalendarData: EconomicEvent[] = [
  {
    id: 'eco-01',
    name: 'US CPI Y/Y (Chỉ Số Giá Tiêu Dùng - Lạm Phát Mỹ)',
    currency: 'USD',
    impact: 'HIGH',
    scheduledTime: Date.now() + 4 * 3600 * 1000 + 25 * 60 * 1000,
    timeRemainingStr: '4 giờ 25 phút',
    forecast: '2.9%',
    previous: '3.1%',
    tradingRiskStatus: 'CAUTION',
  },
  {
    id: 'eco-02',
    name: 'FOMC Interest Rate Decision (Quyết Định Lãi Suất FED)',
    currency: 'USD',
    impact: 'HIGH',
    scheduledTime: Date.now() + 28 * 3600 * 1000,
    timeRemainingStr: '1 ngày 4 giờ',
    forecast: '4.75%',
    previous: '5.00%',
    tradingRiskStatus: 'SAFE',
  },
  {
    id: 'eco-03',
    name: 'US Non-Farm Payrolls (Báo Cáo Việc Làm Phi Nông Nghiệp NFP)',
    currency: 'USD',
    impact: 'HIGH',
    scheduledTime: Date.now() + 72 * 3600 * 1000,
    timeRemainingStr: '3 ngày',
    forecast: '165K',
    previous: '142K',
    tradingRiskStatus: 'SAFE',
  },
];

export function runStrategyBacktest(
  strategyName: string,
  symbol: CryptoSymbol,
  periodDays: number = 30
): BacktestResult {
  const isBtc = symbol === 'BTCUSDT';
  const isSol = symbol === 'SOLUSDT';
  const isEth = symbol === 'ETHUSDT';
  const isGold = symbol === 'PAXGUSDT';

  let baseWinRate = 72;
  let baseRRPower = 2.8;

  if (strategyName.includes('GCR')) {
    baseWinRate = isSol ? 77 : 73;
    baseRRPower = 3.4;
  } else if (strategyName.includes('ICT') || strategyName.includes('SMC')) {
    baseWinRate = 71;
    baseRRPower = 2.9;
  } else if (strategyName.includes('Brandt')) {
    baseWinRate = isGold ? 75 : 66;
    baseRRPower = 3.8;
  } else if (strategyName.includes('Wyckoff')) {
    baseWinRate = isBtc ? 76 : 70;
    baseRRPower = 3.1;
  } else {
    baseWinRate = 68;
    baseRRPower = 2.6;
  }

  const tradeCount = Math.floor(periodDays * 0.85) + 4; // ~28-32 trades in 30 days
  const trades: BacktestTrade[] = [];
  let equity = 10000;
  const equityCurve: { day: number; equity: number }[] = [{ day: 0, equity: 10000 }];
  let peakEquity = 10000;
  let maxDrawdown = 0;

  const basePrice = isBtc ? 68500 : isEth ? 3500 : isSol ? 180 : 2680;

  let totalWinUsdt = 0;
  let totalLossUsdt = 0;

  for (let i = 1; i <= tradeCount; i++) {
    const isWin = Math.random() * 100 < baseWinRate;
    const direction = Math.random() > 0.4 ? 'LONG' : 'SHORT';
    const day = Math.floor((i / tradeCount) * periodDays);

    const riskAmount = equity * 0.02; // 2% risk per trade
    let pnlPercent = 0;
    let pnlUsdt = 0;
    let exitReason: 'TP1_TP2' | 'TP3_RUNNER' | 'STOP_LOSS' | 'BREAKEVEN' = 'STOP_LOSS';

    if (isWin) {
      const runnerBonus = Math.random() > 0.6;
      const rr = runnerBonus ? baseRRPower * 1.4 : baseRRPower;
      pnlPercent = Math.round(rr * 2.0 * 10) / 10;
      pnlUsdt = Math.round(riskAmount * rr * 100) / 100;
      exitReason = runnerBonus ? 'TP3_RUNNER' : 'TP1_TP2';
      totalWinUsdt += pnlUsdt;
    } else {
      const isBreakevenRescue = Math.random() > 0.65;
      if (isBreakevenRescue) {
        pnlPercent = 0;
        pnlUsdt = 0;
        exitReason = 'BREAKEVEN';
      } else {
        pnlPercent = -2.0;
        pnlUsdt = -Math.round(riskAmount * 100) / 100;
        exitReason = 'STOP_LOSS';
        totalLossUsdt += Math.abs(pnlUsdt);
      }
    }

    equity += pnlUsdt;
    if (equity > peakEquity) peakEquity = equity;
    const currentDrawdown = ((peakEquity - equity) / peakEquity) * 100;
    if (currentDrawdown > maxDrawdown) maxDrawdown = currentDrawdown;

    const entryP = basePrice * (1 + (Math.random() - 0.5) * 0.08);
    const exitP = entryP * (1 + (pnlPercent / 100) * (direction === 'LONG' ? 1 : -1));

    trades.push({
      id: `BT-${symbol}-${i}`,
      date: `Ngày ${day + 1}`,
      symbol,
      direction,
      entryPrice: Math.round(entryP * 100) / 100,
      exitPrice: Math.round(exitP * 100) / 100,
      pnlPercent,
      pnlUsdt,
      result: isWin ? 'WIN' : 'LOSS',
      holdingTimeHours: Math.floor(Math.random() * 18) + 2,
      exitReason,
    });

    equityCurve.push({
      day,
      equity: Math.round(equity * 100) / 100,
    });
  }

  const winCount = trades.filter((t) => t.result === 'WIN').length;
  const actualWinRate = Math.round((winCount / tradeCount) * 100);
  const totalReturn = Math.round(((equity - 10000) / 10000) * 1000) / 10;
  const profitFactor =
    totalLossUsdt > 0 ? Math.round((totalWinUsdt / totalLossUsdt) * 100) / 100 : 9.99;

  return {
    strategyName,
    symbol,
    periodDays,
    totalTrades: tradeCount,
    winRatePercent: actualWinRate,
    profitFactor,
    totalReturnPercent: totalReturn,
    maxDrawdownPercent: Math.round(maxDrawdown * 10) / 10,
    avgTradeReturnPercent: Math.round((totalReturn / tradeCount) * 10) / 10,
    sharpeRatio: Math.round((totalReturn / Math.max(1, maxDrawdown)) * 10) / 10,
    trades,
    equityCurve,
  };
}
