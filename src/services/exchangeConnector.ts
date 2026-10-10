/**
 * CryptoWhale AI Pro - Exchange Connector
 * Module kết nối và thực thi lệnh tốc độ cao (< 150ms) tới sàn Binance Futures
 * Bao gồm bộ lọc quy chuẩn: stepSize, tickSize, minNotional, chống trượt giá (Slippage Guard)
 * và cơ chế bù trừ lệch giờ Internet (Timestamp Drift Correction)
 */

import type { CryptoSymbol } from '../types/index.ts';

export interface SymbolFilterRule {
  stepSize: number;       // Bước nhảy khối lượng (vd: 0.001)
  qtyPrecision: number;   // Số chữ số thập phân khối lượng
  tickSize: number;       // Bước nhảy giá (vd: 0.1)
  pricePrecision: number; // Số chữ số thập phân giá
  minNotional: number;    // Giá trị tối thiểu của vị thế (vd: 5.0 USDT)
  minQty: number;         // Khối lượng tối thiểu
}

// Bảng cấu hình quy chuẩn cho các cặp giao dịch chính trên Binance Futures (USDⓈ-M)
export const BINANCE_FUTURES_RULES: Record<string, SymbolFilterRule> = {
  BTCUSDT: {
    stepSize: 0.001,
    qtyPrecision: 3,
    tickSize: 0.1,
    pricePrecision: 1,
    minNotional: 5.0,
    minQty: 0.001,
  },
  ETHUSDT: {
    stepSize: 0.001,
    qtyPrecision: 3,
    tickSize: 0.01,
    pricePrecision: 2,
    minNotional: 5.0,
    minQty: 0.001,
  },
  SOLUSDT: {
    stepSize: 0.01,
    qtyPrecision: 2,
    tickSize: 0.01,
    pricePrecision: 2,
    minNotional: 5.0,
    minQty: 0.01,
  },
  BNBUSDT: {
    stepSize: 0.01,
    qtyPrecision: 2,
    tickSize: 0.01,
    pricePrecision: 2,
    minNotional: 5.0,
    minQty: 0.01,
  },
  DOGEUSDT: {
    stepSize: 1,          // DOGE không cho phép số thập phân trên Binance Futures!
    qtyPrecision: 0,
    tickSize: 0.00001,
    pricePrecision: 5,
    minNotional: 5.0,
    minQty: 1,
  },
  XRPUSDT: {
    stepSize: 0.1,
    qtyPrecision: 1,
    tickSize: 0.0001,
    pricePrecision: 4,
    minNotional: 5.0,
    minQty: 0.1,
  },
  PAXGUSDT: {
    stepSize: 0.001,
    qtyPrecision: 3,
    tickSize: 0.1,
    pricePrecision: 1,
    minNotional: 5.0,
    minQty: 0.001,
  },
};

export interface OrderExecutionParams {
  exchange: 'BINANCE' | 'BYBIT' | 'OKX' | 'PAPER';
  symbol: CryptoSymbol;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  price: number;
  amountUsdt: number;
  leverage: number;
  marginType?: 'ISOLATED' | 'CROSS';
  stopLoss?: number;
  takeProfit?: number;
  maxSlippagePercent?: number; // Mặc định 0.2% - 0.5%
  isTestnet?: boolean;
  apiKey?: string;
  apiSecret?: string;
}

export interface ExecutionResponse {
  success: boolean;
  orderId?: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  executedPrice?: number;
  quantity?: number;
  notionalUsdt?: number;
  slippagePercent?: number;
  stopLossOrderId?: string;
  takeProfitOrderId?: string;
  error?: string;
  errorCode?: number;
  hint?: string;
  latencyMs?: number;
}

export class ExchangeConnector {
  private static instance: ExchangeConnector;
  private timeOffsetMs: number = 0;
  private lastTimeSync: number = 0;

  public static getInstance(): ExchangeConnector {
    if (!ExchangeConnector.instance) {
      ExchangeConnector.instance = new ExchangeConnector();
    }
    return ExchangeConnector.instance;
  }

  /**
   * Lấy cấu hình lọc cho một symbol cụ thể, với safe fallback
   */
  public getSymbolRule(symbol: string): SymbolFilterRule {
    const cleanSym = symbol.toUpperCase();
    if (BINANCE_FUTURES_RULES[cleanSym]) {
      return BINANCE_FUTURES_RULES[cleanSym];
    }

    // Default safe fallback for other altcoins
    return {
      stepSize: 0.01,
      qtyPrecision: 2,
      tickSize: 0.01,
      pricePrecision: 2,
      minNotional: 5.0,
      minQty: 0.01,
    };
  }

  /**
   * Format quantity chính xác theo stepSize của sàn (tránh mã lỗi -1111)
   */
  public formatQuantity(symbol: string, rawQty: number, targetPrice: number, minNotionalUsdt: number = 5.5): {
    formattedQty: string;
    actualQty: number;
    notional: number;
    isValid: boolean;
    errorReason?: string;
  } {
    const rule = this.getSymbolRule(symbol);

    // 1. Đảm bảo notional không thấp hơn sàn yêu cầu (safe floor 5.5 USDT)
    const requiredMinQty = targetPrice > 0 ? (minNotionalUsdt / targetPrice) : rule.minQty;
    const safeQty = Math.max(rawQty, requiredMinQty, rule.minQty);

    // 2. Làm tròn xuống theo stepSize để không vượt quá số dư ký quỹ
    let steps = Math.floor(safeQty / rule.stepSize);
    if (steps * rule.stepSize < requiredMinQty) {
      steps = Math.ceil(requiredMinQty / rule.stepSize);
    }

    const actualQty = steps * rule.stepSize;
    const formattedQty = actualQty.toFixed(rule.qtyPrecision);
    const notional = actualQty * targetPrice;

    if (notional < rule.minNotional) {
      return {
        formattedQty,
        actualQty,
        notional,
        isValid: false,
        errorReason: `Giá trị lệnh ($${notional.toFixed(2)} USDT) nhỏ hơn mức tối thiểu của sàn ($${rule.minNotional} USDT).`,
      };
    }

    return {
      formattedQty,
      actualQty,
      notional: Math.round(notional * 100) / 100,
      isValid: true,
    };
  }

  /**
   * Format giá và Stop Loss / Take Profit theo đúng tickSize của sàn
   */
  public formatPrice(symbol: string, price: number): string {
    const rule = this.getSymbolRule(symbol);
    return price.toFixed(rule.pricePrecision);
  }

  /**
   * Kiểm tra trượt giá (Slippage Guard)
   * Ngăn chặn việc khớp lệnh giá xấu khi thị trường biến động giật nến
   */
  public checkSlippage(
    requestedPrice: number,
    currentMarketPrice: number,
    side: 'BUY' | 'SELL',
    maxSlippagePercent: number = 0.25
  ): { safe: boolean; slippagePercent: number; diffPrice: number } {
    if (requestedPrice <= 0 || currentMarketPrice <= 0) {
      return { safe: true, slippagePercent: 0, diffPrice: 0 };
    }

    const diff = Math.abs(currentMarketPrice - requestedPrice);
    const slippagePct = (diff / requestedPrice) * 100;

    // Đối với BUY: nếu giá hiện tại cao hơn giá yêu cầu quá mức cho phép -> rủi ro mua đỉnh
    // Đối với SELL: nếu giá hiện tại thấp hơn giá yêu cầu quá mức cho phép -> rủi ro bán đáy
    const isAdverse = side === 'BUY'
      ? currentMarketPrice > requestedPrice
      : currentMarketPrice < requestedPrice;

    const safe = !isAdverse || slippagePct <= maxSlippagePercent;

    return {
      safe,
      slippagePercent: Math.round(slippagePct * 1000) / 1000,
      diffPrice: diff,
    };
  }

  /**
   * Đồng bộ thời gian với sàn Binance để triệt tiêu lỗi -1021 (Timestamp out of range)
   */
  public async syncServerTime(baseUrl: string = 'https://fapi.binance.com'): Promise<number> {
    const now = Date.now();
    // Cache offset trong 10 phút
    if (now - this.lastTimeSync < 600000 && this.timeOffsetMs !== 0) {
      return this.timeOffsetMs;
    }

    try {
      const resp = await fetch(`${baseUrl}/fapi/v1/time`, {
        signal: AbortSignal.timeout(3000),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.serverTime) {
          this.timeOffsetMs = data.serverTime - Date.now();
          this.lastTimeSync = Date.now();
          return this.timeOffsetMs;
        }
      }
    } catch {
      // Giữ nguyên offset cũ nếu timeout
    }
    return this.timeOffsetMs;
  }

  /**
   * Lấy timestamp đã bù trừ lệch giờ
   */
  public getSynchronizedTimestamp(): number {
    return Date.now() + this.timeOffsetMs;
  }

  /**
   * Diễn giải mã lỗi Binance thành gợi ý dễ hiểu bằng tiếng Việt
   */
  public parseBinanceErrorCode(code?: number, defaultMsg?: string): { message: string; hint: string } {
    switch (code) {
      case -2019:
        return {
          message: 'Số dư ký quỹ không đủ (Margin is insufficient).',
          hint: 'Vui lòng nạp thêm USDT vào ví Futures hoặc giảm mức ký quỹ của lệnh.',
        };
      case -4164:
        return {
          message: 'Giá trị lệnh quá nhỏ (Order Notional < Min Notional).',
          hint: 'Binance Futures yêu cầu mỗi lệnh tối thiểu 5 USDT. Hãy tăng khối lượng hoặc số tiền ký quỹ.',
        };
      case -2015:
        return {
          message: 'API Key không hợp lệ hoặc chưa bật quyền Futures.',
          hint: 'Vào Binance > API Management > Bật dấu tích "Enable Futures" và kiểm tra IP whitelist.',
        };
      case -1021:
        return {
          message: 'Lệch thời gian thiết bị (Timestamp out of range).',
          hint: 'Đã tự động kích hoạt bộ bù thời gian. Hãy thử lại.',
        };
      case -1111:
        return {
          message: 'Độ chính xác khối lượng hoặc giá không hợp lệ (Precision over maximum).',
          hint: 'Hệ thống đã tự động làm tròn lại theo stepSize/tickSize của sàn.',
        };
      case -5022:
        return {
          message: 'Lệnh Post-Only bị từ chối do sẽ khớp ngay.',
          hint: 'Chuyển sang lệnh MARKET để khớp tức thì.',
        };
      default:
        return {
          message: defaultMsg || 'Lỗi không xác định từ sàn giao dịch.',
          hint: 'Vui lòng kiểm tra lại kết nối mạng hoặc trạng thái API sàn.',
        };
    }
  }
}

export const exchangeConnector = ExchangeConnector.getInstance();
