/**
 * CryptoWhale AI Pro - Quantitative Risk Manager
 * Module kiểm soát rủi ro độc lập với Hard Rules (Quy tắc thép)
 * Hỗ trợ chuẩn Prop Firm (FTMO, FundedNext, MFF) và Quants Portfolio Guard
 */

import type { CryptoSymbol, ExecutedTrade, BotSettings } from '../types/index.ts';

export interface RiskCheckResult {
  allowed: boolean;
  reason?: string;
  maxAllowedAmountUsdt: number;
  calculatedQuantity: number;
  riskRewardRatio: number;
  potentialLossUsdt: number;
  potentialProfitUsdt: number;
  currentDailyLossUsdt: number;
  dailyLossLimitUsdt: number;
  warningNotice?: string;
}

export interface RiskProfile {
  maxDailyLossPercent: number;      // Mặc định 4.0% theo chuẩn Prop Firm
  maxTotalDrawdownPercent: number;   // Mặc định 8.0%
  maxRiskPerTradePercent: number;    // Tối đa 1.0% - 2.0% vốn mỗi lệnh
  maxLeverage: number;               // Giới hạn đòn bẩy tối đa
  maxOpenPositions: number;          // Tối đa số vị thế mở đồng thời
  consecutiveLossCircuitBreaker: number; // Tự động ngắt khi dính N lệnh thua liên tiếp
}

export const DEFAULT_RISK_PROFILE: RiskProfile = {
  maxDailyLossPercent: 4.0,
  maxTotalDrawdownPercent: 8.0,
  maxRiskPerTradePercent: 2.0,
  maxLeverage: 20,
  maxOpenPositions: 3,
  consecutiveLossCircuitBreaker: 3,
};

export class QuantitativeRiskManager {
  private profile: RiskProfile;
  private consecutiveLosses: number = 0;
  private isCircuitBreakerTriggered: boolean = false;
  private circuitBreakerReason: string = '';

  constructor(profile: Partial<RiskProfile> = {}) {
    this.profile = { ...DEFAULT_RISK_PROFILE, ...profile };
  }

  public updateProfile(newProfile: Partial<RiskProfile>) {
    this.profile = { ...this.profile, ...newProfile };
  }

  public getProfile(): RiskProfile {
    return { ...this.profile };
  }

  public isCircuitBreakerActive(): { active: boolean; reason: string } {
    return {
      active: this.isCircuitBreakerTriggered,
      reason: this.circuitBreakerReason,
    };
  }

  public resetCircuitBreaker() {
    this.isCircuitBreakerTriggered = false;
    this.circuitBreakerReason = '';
    this.consecutiveLosses = 0;
  }

  /**
   * Tính toán tổng lỗ trong 24h qua từ danh sách giao dịch
   */
  public calculateDailyLoss(trades: ExecutedTrade[]): number {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    return trades
      .filter((t) => t.status === 'LOST' && t.closedAt && t.closedAt > twentyFourHoursAgo)
      .reduce((sum, t) => sum + Math.abs(t.pnlUsdt), 0);
  }

  /**
   * Tính toán Max Drawdown từ vốn ban đầu
   */
  public calculateDrawdown(currentBalance: number, peakBalance: number): number {
    if (peakBalance <= 0) return 0;
    const drawdown = ((peakBalance - currentBalance) / peakBalance) * 100;
    return Math.max(0, drawdown);
  }

  /**
   * Tính toán Position Size tối ưu theo Stop Loss distance (Kelley / Fixed Fractional Model)
   * Formula: Position Size = (Account Balance * Risk%) / (SL Distance %)
   */
  public calculateOptimalPositionSize(
    balance: number,
    entryPrice: number,
    stopLossPrice: number,
    riskPercent: number = 2.0
  ): { marginUsdt: number; notionalUsdt: number; leverage: number } {
    if (balance <= 0 || entryPrice <= 0 || stopLossPrice <= 0) {
      return { marginUsdt: 20, notionalUsdt: 200, leverage: 10 };
    }

    const slDistancePct = Math.abs(entryPrice - stopLossPrice) / entryPrice;
    if (slDistancePct <= 0) {
      return { marginUsdt: 20, notionalUsdt: 200, leverage: 10 };
    }

    // Số tiền chấp nhận mất tối đa cho lệnh này (Max Risk in USD)
    const riskAmountUsdt = balance * (Math.min(riskPercent, this.profile.maxRiskPerTradePercent) / 100);

    // Tổng quy mô vị thế danh nghĩa cần mở (Notional = Risk Amount / SL%)
    const notionalUsdt = riskAmountUsdt / slDistancePct;

    // Tính đòn bẩy và margin an toàn
    const effectiveLeverage = Math.min(
      this.profile.maxLeverage,
      Math.max(2, Math.round(notionalUsdt / (balance * 0.2)))
    );
    const marginUsdt = Math.round((notionalUsdt / effectiveLeverage) * 100) / 100;

    return {
      marginUsdt: Math.max(10, Math.min(balance * 0.35, marginUsdt)),
      notionalUsdt: Math.round(notionalUsdt * 100) / 100,
      leverage: effectiveLeverage,
    };
  }

  /**
   * Kiểm tra điều kiện ngặt nghèo (Hard Rules) trước khi gửi bất kỳ lệnh nào lên sàn
   */
  public validateOrder(params: {
    symbol: CryptoSymbol;
    side: 'BUY' | 'SELL';
    price: number;
    amountMarginUsdt: number;
    leverage: number;
    stopLoss: number;
    takeProfit: number;
    walletBalance: number;
    recentTrades: ExecutedTrade[];
    settings: BotSettings;
  }): RiskCheckResult {
    const {
      symbol,
      side,
      price,
      amountMarginUsdt,
      leverage,
      stopLoss,
      takeProfit,
      walletBalance,
      recentTrades,
      settings,
    } = params;

    // 1. Kiểm tra Circuit Breaker nội bộ
    if (this.isCircuitBreakerTriggered) {
      return {
        allowed: false,
        reason: `🚨 KHOÁ BẢO VỆ ĐANG BẬT (Circuit Breaker): ${this.circuitBreakerReason}. Hãy giải phóng hoặc reset trước khi mở lệnh mới!`,
        maxAllowedAmountUsdt: 0,
        calculatedQuantity: 0,
        riskRewardRatio: 0,
        potentialLossUsdt: 0,
        potentialProfitUsdt: 0,
        currentDailyLossUsdt: 0,
        dailyLossLimitUsdt: 0,
      };
    }

    // 2. Kiểm tra số dư ký quỹ khả dụng
    if (amountMarginUsdt > walletBalance) {
      return {
        allowed: false,
        reason: `Ký quỹ $${amountMarginUsdt} USDT vượt quá số dư khả dụng $${walletBalance.toFixed(2)} USDT!`,
        maxAllowedAmountUsdt: walletBalance,
        calculatedQuantity: 0,
        riskRewardRatio: 0,
        potentialLossUsdt: 0,
        potentialProfitUsdt: 0,
        currentDailyLossUsdt: 0,
        dailyLossLimitUsdt: 0,
      };
    }

    // 3. Kiểm tra đòn bẩy tối đa
    if (leverage > this.profile.maxLeverage) {
      return {
        allowed: false,
        reason: `Đòn bẩy ${leverage}x vượt quá mức an toàn tối đa cho phép (${this.profile.maxLeverage}x)!`,
        maxAllowedAmountUsdt: amountMarginUsdt,
        calculatedQuantity: 0,
        riskRewardRatio: 0,
        potentialLossUsdt: 0,
        potentialProfitUsdt: 0,
        currentDailyLossUsdt: 0,
        dailyLossLimitUsdt: 0,
      };
    }

    // 4. Kiểm tra số vị thế mở đồng thời
    const currentOpenPositions = recentTrades.filter((t) => t.status === 'OPEN');
    if (currentOpenPositions.length >= this.profile.maxOpenPositions) {
      return {
        allowed: false,
        reason: `Đã đạt giới hạn tối đa ${this.profile.maxOpenPositions} vị thế mở đồng thời. Cần đóng bớt vị thế trước khi vào lệnh mới!`,
        maxAllowedAmountUsdt: 0,
        calculatedQuantity: 0,
        riskRewardRatio: 0,
        potentialLossUsdt: 0,
        potentialProfitUsdt: 0,
        currentDailyLossUsdt: 0,
        dailyLossLimitUsdt: 0,
      };
    }

    // 5. Kiểm tra lệnh trùng lặp trên cùng symbol
    const hasDuplicate = currentOpenPositions.some((t) => t.symbol === symbol);
    if (hasDuplicate) {
      return {
        allowed: false,
        reason: `Đã có vị thế đang chạy trên cặp #${symbol}. Quy tắc chống Over-exposure chặn mở thêm lệnh trùng lặp!`,
        maxAllowedAmountUsdt: 0,
        calculatedQuantity: 0,
        riskRewardRatio: 0,
        potentialLossUsdt: 0,
        potentialProfitUsdt: 0,
        currentDailyLossUsdt: 0,
        dailyLossLimitUsdt: 0,
      };
    }

    // 6. Kiểm tra giới hạn lỗ ngày (Prop Firm Daily Loss Limit)
    const currentDailyLoss = this.calculateDailyLoss(recentTrades);
    const maxDailyLossAllowed = walletBalance * (this.profile.maxDailyLossPercent / 100);

    if (currentDailyLoss >= maxDailyLossAllowed) {
      this.isCircuitBreakerTriggered = true;
      this.circuitBreakerReason = `Tổng lỗ 24h qua ($${currentDailyLoss.toFixed(2)}) đã chạm trần ${this.profile.maxDailyLossPercent}% vốn`;
      return {
        allowed: false,
        reason: `🛡️ QUY TẮC THÉP PROP FIRM: ${this.circuitBreakerReason}. Hệ thống tự động khóa giao dịch để bảo toàn tài khoản!`,
        maxAllowedAmountUsdt: 0,
        calculatedQuantity: 0,
        riskRewardRatio: 0,
        potentialLossUsdt: 0,
        potentialProfitUsdt: 0,
        currentDailyLossUsdt: currentDailyLoss,
        dailyLossLimitUsdt: maxDailyLossAllowed,
      };
    }

    // 7. Kiểm tra Stop Loss & Take Profit hợp lệ
    const isBuy = side === 'BUY';
    if (isBuy) {
      if (stopLoss >= price) {
        return {
          allowed: false,
          reason: `Lệnh BUY/LONG yêu cầu Stop Loss ($${stopLoss}) phải THẤP HƠN giá vào ($${price})!`,
          maxAllowedAmountUsdt: amountMarginUsdt,
          calculatedQuantity: 0,
          riskRewardRatio: 0,
          potentialLossUsdt: 0,
          potentialProfitUsdt: 0,
          currentDailyLossUsdt: currentDailyLoss,
          dailyLossLimitUsdt: maxDailyLossAllowed,
        };
      }
      if (takeProfit <= price) {
        return {
          allowed: false,
          reason: `Lệnh BUY/LONG yêu cầu Take Profit ($${takeProfit}) phải CAO HƠN giá vào ($${price})!`,
          maxAllowedAmountUsdt: amountMarginUsdt,
          calculatedQuantity: 0,
          riskRewardRatio: 0,
          potentialLossUsdt: 0,
          potentialProfitUsdt: 0,
          currentDailyLossUsdt: currentDailyLoss,
          dailyLossLimitUsdt: maxDailyLossAllowed,
        };
      }
    } else {
      if (stopLoss <= price) {
        return {
          allowed: false,
          reason: `Lệnh SELL/SHORT yêu cầu Stop Loss ($${stopLoss}) phải CAO HƠN giá vào ($${price})!`,
          maxAllowedAmountUsdt: amountMarginUsdt,
          calculatedQuantity: 0,
          riskRewardRatio: 0,
          potentialLossUsdt: 0,
          potentialProfitUsdt: 0,
          currentDailyLossUsdt: currentDailyLoss,
          dailyLossLimitUsdt: maxDailyLossAllowed,
        };
      }
      if (takeProfit >= price) {
        return {
          allowed: false,
          reason: `Lệnh SELL/SHORT yêu cầu Take Profit ($${takeProfit}) phải THẤP HƠN giá vào ($${price})!`,
          maxAllowedAmountUsdt: amountMarginUsdt,
          calculatedQuantity: 0,
          riskRewardRatio: 0,
          potentialLossUsdt: 0,
          potentialProfitUsdt: 0,
          currentDailyLossUsdt: currentDailyLoss,
          dailyLossLimitUsdt: maxDailyLossAllowed,
        };
      }
    }

    // 8. Tính toán tỷ lệ Risk/Reward (R:R >= 1:1.5 là chuẩn an toàn)
    const slDist = Math.abs(price - stopLoss);
    const tpDist = Math.abs(takeProfit - price);
    const rrRatio = slDist > 0 ? Math.round((tpDist / slDist) * 10) / 10 : 1;

    // Tính lỗ / lãi tối đa theo USD
    const notional = amountMarginUsdt * leverage;
    const lossPct = slDist / price;
    const profitPct = tpDist / price;
    const potentialLossUsdt = Math.round(notional * lossPct * 100) / 100;
    const potentialProfitUsdt = Math.round(notional * profitPct * 100) / 100;

    // Kiểm tra nếu khoảng lỗ vượt quá mức rủi ro tối đa cho phép của 1 lệnh
    const maxTradeRiskUsdt = walletBalance * (this.profile.maxRiskPerTradePercent / 100);
    let warningNotice: string | undefined;

    if (potentialLossUsdt > maxTradeRiskUsdt * 1.5) {
      warningNotice = `Cảnh báo: Khoản lỗ tiềm năng ($${potentialLossUsdt.toFixed(2)}) cao hơn mức rủi ro chuẩn 2% tài khoản ($${maxTradeRiskUsdt.toFixed(2)}). Hãy cân nhắc giảm đòn bẩy hoặc ký quỹ.`;
    }

    const calculatedQty = price > 0 ? notional / price : 0;

    return {
      allowed: true,
      maxAllowedAmountUsdt: amountMarginUsdt,
      calculatedQuantity: calculatedQty,
      riskRewardRatio: rrRatio,
      potentialLossUsdt,
      potentialProfitUsdt,
      currentDailyLossUsdt: currentDailyLoss,
      dailyLossLimitUsdt: maxDailyLossAllowed,
      warningNotice,
    };
  }

  /**
   * Theo dõi kết quả lệnh để cập nhật chuỗi thua liên tiếp
   */
  public recordTradeOutcome(trade: ExecutedTrade) {
    if (trade.status === 'LOST') {
      this.consecutiveLosses += 1;
      if (this.consecutiveLosses >= this.profile.consecutiveLossCircuitBreaker) {
        this.isCircuitBreakerTriggered = true;
        this.circuitBreakerReason = `Đã dính ${this.consecutiveLosses} lệnh thua liên tiếp. Tự động ngắt giao dịch để bảo toàn tâm lý và vốn!`;
      }
    } else if (trade.status === 'WON') {
      this.consecutiveLosses = 0;
    }
  }
}

export const defaultRiskManager = new QuantitativeRiskManager();
