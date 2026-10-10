import { CryptoSymbol, LiquidationCluster, LiquidationHeatmapData, TradingSessionType } from '../types';

export function getLiquidationHeatmap(symbol: CryptoSymbol, currentPrice: number): LiquidationHeatmapData {
  const isBtc = symbol === 'BTCUSDT';
  const isSol = symbol === 'SOLUSDT';
  const mult = isBtc ? 1 : isSol ? 0.003 : 0.05;

  const shortDeltas = [0.008, 0.016, 0.024, 0.035];
  const longDeltas = [0.009, 0.018, 0.027, 0.040];

  const clusters: LiquidationCluster[] = [];

  let totalShortLiq = 0;
  let totalLongLiq = 0;

  // Short liquidations (above market price - buy stop orders)
  shortDeltas.forEach((delta, idx) => {
    const price = currentPrice * (1 + delta);
    const volume = Math.round((45 + Math.random() * 85 + (3 - idx) * 35) * 1_000_000 * mult);
    totalShortLiq += volume;
    clusters.push({
      priceLevel: Math.round(price * 100) / 100,
      volumeUsd: volume,
      side: 'SHORT_LIQ',
      intensity: idx === 1 ? 'EXTREME' : idx === 0 ? 'HIGH' : 'MEDIUM',
      distancePercent: Math.round(delta * 1000) / 10,
    });
  });

  // Long liquidations (below market price - sell stop orders)
  longDeltas.forEach((delta, idx) => {
    const price = currentPrice * (1 - delta);
    const volume = Math.round((35 + Math.random() * 75 + (3 - idx) * 30) * 1_000_000 * mult);
    totalLongLiq += volume;
    clusters.push({
      priceLevel: Math.round(price * 100) / 100,
      volumeUsd: volume,
      side: 'LONG_LIQ',
      intensity: idx === 1 ? 'EXTREME' : idx === 0 ? 'HIGH' : 'MEDIUM',
      distancePercent: Math.round(delta * 1000) / 10,
    });
  });

  // Magnet direction: whichever side has the highest liquidity cluster
  const maxShort = Math.max(...clusters.filter((c) => c.side === 'SHORT_LIQ').map((c) => c.volumeUsd));
  const maxLong = Math.max(...clusters.filter((c) => c.side === 'LONG_LIQ').map((c) => c.volumeUsd));

  const isUpMagnet = maxShort >= maxLong;
  const closestMagnet = isUpMagnet
    ? clusters.find((c) => c.side === 'SHORT_LIQ' && c.intensity === 'EXTREME') || clusters[0]
    : clusters.find((c) => c.side === 'LONG_LIQ' && c.intensity === 'EXTREME') || clusters[4];

  return {
    symbol,
    currentPrice,
    totalShortLiqUsd: totalShortLiq,
    totalLongLiqUsd: totalLongLiq,
    closestMagnetPrice: closestMagnet.priceLevel,
    magnetDirection: isUpMagnet ? 'UP' : 'DOWN',
    clusters: clusters.sort((a, b) => b.priceLevel - a.priceLevel),
  };
}

export function getCurrentTradingSessionInfo(): {
  currentSession: 'ASIA' | 'LONDON' | 'NEW_YORK' | 'OFF_HOURS';
  sessionName: string;
  isHighLiquidity: boolean;
  activeKillzone: string;
  timeRemainingInSession: string;
} {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMins = now.getUTCMinutes();
  const timeInDec = utcHours + utcMins / 60;

  // London: 07:00 UTC - 15:00 UTC (14:00 - 22:00 VN)
  // London Open Killzone: 07:00 - 10:00 UTC (14:00 - 17:00 VN)
  // New York: 12:30 UTC - 20:30 UTC (19:30 - 03:30 VN)
  // New York Open Killzone: 12:30 - 15:30 UTC (19:30 - 22:30 VN)
  // Asia: 00:00 - 07:00 UTC (07:00 - 14:00 VN)

  if (timeInDec >= 12.5 && timeInDec <= 20.5) {
    return {
      currentSession: 'NEW_YORK',
      sessionName: 'Phiên New York (Mỹ)',
      isHighLiquidity: true,
      activeKillzone: timeInDec <= 15.5 ? '⚡ NY Open Killzone (Biến động cực cao)' : 'Mid-day NY',
      timeRemainingInSession: `${Math.floor(20.5 - timeInDec)}h ${Math.floor(((20.5 - timeInDec) % 1) * 60)}m`,
    };
  } else if (timeInDec >= 7 && timeInDec < 12.5) {
    return {
      currentSession: 'LONDON',
      sessionName: 'Phiên London (Châu Âu)',
      isHighLiquidity: true,
      activeKillzone: timeInDec <= 10 ? '⚡ London Open Killzone (Săn thanh khoản đỉnh/đáy)' : 'London Expansion',
      timeRemainingInSession: `${Math.floor(15 - timeInDec)}h ${Math.floor(((15 - timeInDec) % 1) * 60)}m`,
    };
  } else if (timeInDec >= 0 && timeInDec < 7) {
    return {
      currentSession: 'ASIA',
      sessionName: 'Phiên Tokyo / Châu Á',
      isHighLiquidity: false,
      activeKillzone: 'Tích lũy biên độ hẹp (Asia Range)',
      timeRemainingInSession: `${Math.floor(7 - timeInDec)}h ${Math.floor(((7 - timeInDec) % 1) * 60)}m`,
    };
  }

  return {
    currentSession: 'OFF_HOURS',
    sessionName: 'Giao phiên (Thanh khoản thấp)',
    isHighLiquidity: false,
    activeKillzone: 'Không có Killzone',
    timeRemainingInSession: 'Chờ mở phiên',
  };
}
