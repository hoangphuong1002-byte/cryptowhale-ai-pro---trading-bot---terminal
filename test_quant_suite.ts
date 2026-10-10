/**
 * CryptoWhale AI Pro - Comprehensive Quantitative Test Suite
 * Kiểm thử tự động toàn diện logic: Risk Manager, Exchange Connector, Telegram Alert, Slippage & Precision Guard
 */

import { BINANCE_FUTURES_RULES, ExchangeConnector } from './src/services/exchangeConnector.ts';
import { QuantitativeRiskManager } from './src/services/riskManager.ts';
import { TelegramAlertService } from './src/services/telegramAlert.ts';
import type { BotSettings, ExecutedTrade } from './src/types/index.ts';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, errorDetails: string = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} - ${errorDetails}`);
    failedTests++;
  }
}

console.log('\n=============================================================');
console.log('🧪 BẮT ĐẦU KIỂM THỬ ĐỊNH LƯỢNG: CRYPTOWHALE AI PRO ENGINE');
console.log('=============================================================\n');

// -------------------------------------------------------------
// NHÓM 1: KIỂM THỬ EXCHANGE CONNECTOR & BINANCE PRECISION RULES
// -------------------------------------------------------------
console.log('📦 [NHÓM 1] Kiểm Thử Exchange Connector & Quy Chuẩn Sàn Binance Futures:');

const connector = ExchangeConnector.getInstance();

// 1.1 Kiểm tra rule của các cặp chính
const btcRule = connector.getSymbolRule('BTCUSDT');
assert(btcRule.stepSize === 0.001 && btcRule.qtyPrecision === 3, 'BTCUSDT stepSize phải là 0.001 (3 số thập phân)');
assert(btcRule.tickSize === 0.1 && btcRule.pricePrecision === 1, 'BTCUSDT tickSize phải là 0.1 (1 số thập phân)');

const dogeRule = connector.getSymbolRule('DOGEUSDT');
assert(dogeRule.stepSize === 1 && dogeRule.qtyPrecision === 0, 'DOGEUSDT stepSize phải là 1 (SỐ NGUYÊN, 0 thập phân)');
assert(dogeRule.pricePrecision === 5, 'DOGEUSDT giá phải có 5 chữ số thập phân');

const xrpRule = connector.getSymbolRule('XRPUSDT');
assert(xrpRule.pricePrecision === 4, 'XRPUSDT giá phải có 4 chữ số thập phân');

// 1.2 Kiểm tra formatQuantity cho DOGE (Triệt tiêu lỗi -1111)
const dogeQtyResult = connector.formatQuantity('DOGEUSDT', 5420.78, 0.185);
assert(dogeQtyResult.isValid, 'DOGEUSDT quantity phải hợp lệ');
assert(!dogeQtyResult.formattedQty.includes('.'), `DOGEUSDT không được chứa dấu chấm thập phân (Giá trị: ${dogeQtyResult.formattedQty})`);
assert(parseFloat(dogeQtyResult.formattedQty) >= 30, 'DOGEUSDT minNotional phải thỏa mãn >= 5.5 USDT');

// 1.3 Kiểm tra formatQuantity cho BTCUSDT
const btcQtyResult = connector.formatQuantity('BTCUSDT', 0.023456, 86500);
assert(btcQtyResult.isValid, 'BTCUSDT quantity phải hợp lệ');
assert(btcQtyResult.formattedQty === '0.023', `BTCUSDT phải làm tròn đúng 3 số thập phân (Giá trị: ${btcQtyResult.formattedQty})`);

// 1.4 Kiểm tra minNotional guard (Từ chối lệnh quá nhỏ)
const tinyQtyResult = connector.formatQuantity('BTCUSDT', 0.00001, 86500, 5.5);
assert(tinyQtyResult.notional >= 5.0, `Lệnh nhỏ phải được ép sàn tối thiểu >= 5.0 USDT (Giá trị: $${tinyQtyResult.notional})`);

// 1.5 Kiểm tra Slippage Guard (Chống trượt giá)
const normalSlippage = connector.checkSlippage(86500, 86600, 'BUY', 0.25);
assert(normalSlippage.safe, 'Độ lệch 0.11% (< 0.25%) phải được coi là an toàn');

const badSlippageBuy = connector.checkSlippage(86500, 87500, 'BUY', 0.25);
assert(!badSlippageBuy.safe, `Độ lệch 1.15% (> 0.25%) khi BUY phải bị chặn bởi Slippage Guard (Slippage: ${badSlippageBuy.slippagePercent}%)`);

const badSlippageSell = connector.checkSlippage(86500, 85500, 'SELL', 0.25);
assert(!badSlippageSell.safe, `Độ lệch 1.15% (> 0.25%) khi SELL phải bị chặn bởi Slippage Guard (Slippage: ${badSlippageSell.slippagePercent}%)`);

// 1.6 Kiểm tra Parse Binance Error Code
const err2019 = connector.parseBinanceErrorCode(-2019);
assert(err2019.message.includes('ký quỹ không đủ'), 'Mã -2019 phải giải nghĩa đúng thiếu ký quỹ');

const err1111 = connector.parseBinanceErrorCode(-1111);
assert(err1111.message.includes('không hợp lệ'), 'Mã -1111 phải giải nghĩa đúng lỗi độ chính xác');


// -------------------------------------------------------------
// NHÓM 2: KIỂM THỬ QUANTITATIVE RISK MANAGER & PROP FIRM RULES
// -------------------------------------------------------------
console.log('\n🛡️ [NHÓM 2] Kiểm Thử Quantitative Risk Manager & Quy Tắc Thép:');

const riskManager = new QuantitativeRiskManager({
  maxDailyLossPercent: 4.0,
  maxTotalDrawdownPercent: 8.0,
  maxRiskPerTradePercent: 2.0,
  maxLeverage: 20,
  maxOpenPositions: 3,
  consecutiveLossCircuitBreaker: 3,
});

const mockSettings: BotSettings = {
  autoTradingEnabled: true,
  autoSendTelegram: false,
  telegramBotToken: '',
  telegramChatId: '',
  webhookUrl: '',
  webhookEnabled: false,
  exchange: 'PAPER',
  apiKey: '',
  apiSecret: '',
  riskPerTradePercent: 2,
  defaultLeverage: 10,
  primaryStrategy: 'SMC',
  activeStyles: [],
  alertPriceWhaleThresholdUsd: 10000000,
  trailingStopEnabled: true,
  autoMoveBreakeven: true,
  macroNewsFilterEnabled: true,
  maxSlippagePercent: 0.25,
  partialTakeProfitPercent: 50,
  activeTradingSession: 'ALL',
  dynamicAtrTrailingEnabled: true,
  atrMultiplier: 1.8,
  propFirmRiskMode: true,
  propFirmMaxDailyLossPercent: 4.0,
  propFirmMaxTotalDrawdownPercent: 8.0,
};

// 2.1 Kiểm tra lệnh hợp lệ
const validCheck = riskManager.validateOrder({
  symbol: 'BTCUSDT',
  side: 'BUY',
  price: 86500,
  amountMarginUsdt: 100,
  leverage: 10,
  stopLoss: 85200,
  takeProfit: 89500,
  walletBalance: 5000,
  recentTrades: [],
  settings: mockSettings,
});
assert(validCheck.allowed, 'Lệnh mua BTC chuẩn phải được chấp thuận');
assert(validCheck.riskRewardRatio >= 2.0, `Tỷ lệ R:R phải đạt chuẩn >= 1:2.0 (Thực tế: 1:${validCheck.riskRewardRatio})`);

// 2.2 Kiểm tra chặn đòn bẩy vượt ngưỡng
const overLevCheck = riskManager.validateOrder({
  symbol: 'BTCUSDT',
  side: 'BUY',
  price: 86500,
  amountMarginUsdt: 100,
  leverage: 50, // Vượt maxLeverage 20x
  stopLoss: 85200,
  takeProfit: 89500,
  walletBalance: 5000,
  recentTrades: [],
  settings: mockSettings,
});
assert(!overLevCheck.allowed, 'Đòn bẩy 50x (> 20x) phải bị chặn');

// 2.3 Kiểm tra chặn Stop Loss đặt sai hướng (BUY nhưng SL > Entry)
const wrongSlCheck = riskManager.validateOrder({
  symbol: 'BTCUSDT',
  side: 'BUY',
  price: 86500,
  amountMarginUsdt: 100,
  leverage: 10,
  stopLoss: 87000, // Sai hướng
  takeProfit: 89500,
  walletBalance: 5000,
  recentTrades: [],
  settings: mockSettings,
});
assert(!wrongSlCheck.allowed, 'BUY với SL > Entry phải bị chặn');

// 2.4 Kiểm tra chặn lệnh trùng lặp trên cùng symbol
const duplicateCheck = riskManager.validateOrder({
  symbol: 'BTCUSDT',
  side: 'BUY',
  price: 86500,
  amountMarginUsdt: 100,
  leverage: 10,
  stopLoss: 85200,
  takeProfit: 89500,
  walletBalance: 5000,
  recentTrades: [
    {
      id: 'trade-1',
      symbol: 'BTCUSDT',
      side: 'BUY',
      type: 'MARKET',
      entryPrice: 86000,
      amountUsdt: 100,
      leverage: 10,
      stopLoss: 85000,
      takeProfit: 88000,
      pnlUsdt: 0,
      pnlPercent: 0,
      status: 'OPEN',
      openedAt: Date.now(),
      strategyName: 'SMC',
      exchange: 'PAPER',
    },
  ],
  settings: mockSettings,
});
assert(!duplicateCheck.allowed, 'Lệnh trùng lặp cặp BTCUSDT đang mở phải bị chặn');

// 2.5 Kiểm tra quy tắc trần lỗ ngày (Prop Firm Daily Drawdown Guard)
const heavyLossTrades: ExecutedTrade[] = [
  {
    id: 'loss-1',
    symbol: 'ETHUSDT',
    side: 'BUY',
    type: 'MARKET',
    entryPrice: 2700,
    amountUsdt: 1000,
    leverage: 10,
    stopLoss: 2650,
    takeProfit: 2800,
    pnlUsdt: -250, // Lỗ $250
    pnlPercent: -25,
    status: 'LOST',
    openedAt: Date.now() - 3600000,
    closedAt: Date.now() - 1800000,
    strategyName: 'SMC',
    exchange: 'PAPER',
  },
];
const dailyLossAmount = riskManager.calculateDailyLoss(heavyLossTrades);
assert(dailyLossAmount === 250, `Tính toán lỗ ngày 24h phải bằng $250 (Thực tế: $${dailyLossAmount})`);

// 2.6 Kiểm tra Circuit Breaker sau 3 lệnh thua liên tiếp
const cbManager = new QuantitativeRiskManager();
cbManager.recordTradeOutcome({ status: 'LOST', pnlUsdt: -50 } as ExecutedTrade);
cbManager.recordTradeOutcome({ status: 'LOST', pnlUsdt: -50 } as ExecutedTrade);
assert(!cbManager.isCircuitBreakerActive().active, 'Sau 2 lệnh thua chưa được kích hoạt Circuit Breaker');

cbManager.recordTradeOutcome({ status: 'LOST', pnlUsdt: -50 } as ExecutedTrade);
const cbStatus = cbManager.isCircuitBreakerActive();
assert(cbStatus.active, 'Sau 3 lệnh thua liên tiếp PHẢI kích hoạt Circuit Breaker tự động');
assert(cbStatus.reason.includes('3 lệnh thua liên tiếp'), 'Lý do kích hoạt phải ghi rõ 3 lệnh thua liên tiếp');


// -------------------------------------------------------------
// NHÓM 3: KIỂM THỬ TELEGRAM ALERT SERVICE (IPHONE NOTIFICATIONS)
// -------------------------------------------------------------
console.log('\n📱 [NHÓM 3] Kiểm Thử Telegram Notification Templates cho iPhone 15:');

const tgService = TelegramAlertService.getInstance();

const newOrderMsg = tgService.formatNewOrderMessage({
  symbol: 'BTCUSDT',
  side: 'BUY',
  entryPrice: 86520,
  amountUsdt: 250,
  leverage: 10,
  stopLoss: 85200,
  takeProfit: 89500,
  exchange: 'BINANCE FUTURES',
  isRealOrder: true,
  orderId: 'BIN-987654',
});
assert(newOrderMsg.includes('KHỚP LỆNH MỚI'), 'Bản tin mở lệnh phải có tiêu đề KHỚP LỆNH MỚI');
assert(newOrderMsg.includes('BINANCE FUTURES (LIVE)'), 'Bản tin phải hiển thị rõ sàn Binance Futures');
assert(newOrderMsg.includes('iPhone 15'), 'Bản tin phải có chữ ký tối ưu hóa iPhone 15');

const closeTradeMsg = tgService.formatCloseTradeMessage({
  id: 't-1',
  symbol: 'ETHUSDT',
  side: 'BUY',
  type: 'MARKET',
  entryPrice: 2680,
  amountUsdt: 300,
  leverage: 10,
  stopLoss: 2640,
  takeProfit: 2780,
  pnlUsdt: 111.94,
  pnlPercent: 37.31,
  status: 'WON',
  openedAt: Date.now() - 3600000,
  closedAt: Date.now(),
  strategyName: 'SMC Asia Sweep',
  exchange: 'BINANCE',
}, 2780);
assert(closeTradeMsg.includes('CHỐT LỜI THẮNG LỢI'), 'Lệnh thắng phải có tiêu đề CHỐT LỜI THẮNG LỢI');
assert(closeTradeMsg.includes('+$111.94 USDT'), 'Bản tin phải ghi rõ số tiền lời');

const killSwitchMsg = tgService.formatKillSwitchAlert(3, 245.5);
assert(killSwitchMsg.includes('KILL SWITCH TOÀN DIỆN'), 'Cảnh báo Kill switch phải rõ ràng');
assert(killSwitchMsg.includes('3 lệnh đang mở'), 'Bản tin phải báo cáo đúng số lệnh đã đóng');

// -------------------------------------------------------------
// KẾT LUẬN VÀ TỔNG KẾT
// -------------------------------------------------------------
console.log('\n=============================================================');
console.log(`📊 TỔNG KẾT KIỂM THỬ: ${passedTests} PASSED / ${failedTests} FAILED`);
if (failedTests === 0) {
  console.log('🎉 TẤT CẢ CÁC BÀI TEST ĐÃ VƯỢT QUA 100% HOÀN HẢO!');
  console.log('Hệ thống đạt chuẩn Quantitative Production & Sẵn sàng vận hành 24/7.');
} else {
  console.error(`⚠️ CÓ ${failedTests} BÀI TEST CHƯA ĐẠT.`);
  process.exit(1);
}
console.log('=============================================================\n');
