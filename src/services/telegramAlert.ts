/**
 * CryptoWhale AI Pro - Telegram Notification Engine
 * Tự động gửi thông báo lệnh khớp, PnL, cảnh báo rủi ro & Kill Switch
 * Định dạng Markdown tối ưu hiển thị trên màn hình khóa & thông báo iPhone 15
 */

import type { CryptoSymbol, TradeSignal, ExecutedTrade } from '../types/index.ts';

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

export class TelegramAlertService {
  private static instance: TelegramAlertService;

  public static getInstance(): TelegramAlertService {
    if (!TelegramAlertService.instance) {
      TelegramAlertService.instance = new TelegramAlertService();
    }
    return TelegramAlertService.instance;
  }

  /**
   * Format tin nhắn mở vị thế mới (New Order Filled)
   */
  public formatNewOrderMessage(params: {
    symbol: CryptoSymbol;
    side: 'BUY' | 'SELL';
    entryPrice: number;
    amountUsdt: number;
    leverage: number;
    stopLoss: number;
    takeProfit: number;
    exchange: string;
    strategyName?: string;
    isRealOrder?: boolean;
    orderId?: string;
  }): string {
    const isBuy = params.side === 'BUY';
    const dirIcon = isBuy ? '🟢' : '🔴';
    const dirText = isBuy ? 'BUY / LONG' : 'SELL / SHORT';
    const tag = params.isRealOrder ? '⚡ BINANCE FUTURES (LIVE)' : '📝 PAPER TRADING';
    const notional = (params.amountUsdt * params.leverage).toFixed(2);
    const slPct = Math.abs(((params.stopLoss - params.entryPrice) / params.entryPrice) * 100).toFixed(2);
    const tpPct = Math.abs(((params.takeProfit - params.entryPrice) / params.entryPrice) * 100).toFixed(2);

    return (
      `🎯 *CRYPTOWHALE BOT - KHỚP LỆNH MỚI*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `${dirIcon} *Lệnh:* \`${dirText}\` | #${params.symbol}\n` +
      `🏛️ *Kênh:* ${tag}\n` +
      `💵 *Entry:* \`$${params.entryPrice.toLocaleString()}\` USDT\n` +
      `🛑 *Stop Loss:* \`$${params.stopLoss.toLocaleString()}\` (-${slPct}%)\n` +
      `🎯 *Take Profit:* \`$${params.takeProfit.toLocaleString()}\` (+${tpPct}%)\n` +
      `⚖️ *Ký Quỹ:* \`$${params.amountUsdt}\` USDT (${params.leverage}x)\n` +
      `📦 *Quy Mô:* \`$${notional}\` USDT\n` +
      `📊 *Chiến Lược:* _${params.strategyName || 'SMC & Wyckoff Liquidity'}\_\n` +
      (params.orderId ? `🆔 *Mã Lệnh:* \`#${params.orderId}\`\n` : '') +
      `⏰ *Thời Gian:* ${new Date().toLocaleTimeString('vi-VN')} ${new Date().toLocaleDateString('vi-VN')}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📱 _Thông báo tự động đẩy về iPhone 15_`
    );
  }

  /**
   * Format tin nhắn đóng lệnh chốt lời / cắt lỗ (Trade Closed / PnL Report)
   */
  public formatCloseTradeMessage(trade: ExecutedTrade, exitPrice: number): string {
    const isWin = trade.status === 'WON' || (trade.pnlUsdt || 0) >= 0;
    const icon = isWin ? '🚀' : '🛑';
    const title = isWin ? '✅ CHỐT LỜI THẮNG LỢI (TP HIT)' : '⚠️ CẮT LỖ BẢO VỆ VỐN (SL HIT)';
    const pnlPrefix = isWin ? '+' : '';
    const pnlUsdt = trade.pnlUsdt.toFixed(2);
    const pnlPct = trade.pnlPercent.toFixed(2);

    return (
      `${icon} *CRYPTOWHALE - ${title}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📌 *Cặp:* #${trade.symbol} (${trade.side})\n` +
      `💰 *PnL Lợi Nhuận:* *${pnlPrefix}$${pnlUsdt} USDT* (${pnlPrefix}${pnlPct}%)\n` +
      `🚪 *Giá Ra (Exit):* \`$${exitPrice.toLocaleString()}\` USDT\n` +
      `🏁 *Giá Vào (Entry):* \`$${trade.entryPrice.toLocaleString()}\` USDT\n` +
      `⏱️ *Thời Gian Giữ:* ${trade.closedAt ? Math.round((trade.closedAt - trade.openedAt) / 60000) : 0} phút\n` +
      `📊 *Chiến Lược:* _${trade.strategyName}_\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🛡️ _Kỷ luật thép - Tích lũy lãi kép_`
    );
  }

  /**
   * Format cảnh báo kích hoạt khẩn cấp "KILL SWITCH"
   */
  public formatKillSwitchAlert(count: number, totalPnl: number): string {
    return (
      `🚨 *CẢNH BÁO: KÍCH HOẠT KILL SWITCH TOÀN DIỆN*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⚡ *Hành động:* Đã ngắt khẩn cấp toàn bộ hệ thống giao dịch!\n` +
      `📦 *Vị thế đã đóng:* ${count} lệnh đang mở\n` +
      `💵 *Tổng PnL thực hiện:* ${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)} USDT\n` +
      `🛑 *Trạng thái:* Tất cả lệnh chờ đã bị hủy, Auto-Trade đã TẮT.\n` +
      `⏰ *Thời gian:* ${new Date().toLocaleTimeString('vi-VN')} ${new Date().toLocaleDateString('vi-VN')}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🛡️ _Tài khoản đang ở chế độ an toàn 100%_`
    );
  }

  /**
   * Format cảnh báo vi phạm giới hạn rủi ro Prop Firm (Circuit Breaker)
   */
  public formatCircuitBreakerAlert(reason: string, currentLossUsdt: number, limitLossUsdt: number): string {
    return (
      `🛡️ *KHÓA BẢO VỆ TÀI KHOẢN (CIRCUIT BREAKER)*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⚠️ *Lý do:* ${reason}\n` +
      `📉 *Khoản lỗ 24h:* \`-$${currentLossUsdt.toFixed(2)}\` USDT\n` +
      `🛑 *Hạn mức tối đa:* \`$${limitLossUsdt.toFixed(2)}\` USDT\n` +
      `🔒 *Hệ thống:* Tự động chặn mở lệnh mới trong 24h để bảo toàn vốn.\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🧠 _Hãy giữ kỷ luật và không trả thù thị trường!_`
    );
  }

  /**
   * Format thông báo dòng tiền cá voi đột biến
   */
  public formatWhaleAlert(coin: string, amount: number, valueUsd: number, type: string, sentiment: string): string {
    const icon = sentiment === 'BULLISH' ? '🟢' : sentiment === 'BEARISH' ? '🔴' : '🟡';
    return (
      `🐋 *PHÁT HIỆN GIAO DỊCH CÁ VOI ĐỘT BIẾN*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `${icon} *Đồng coin:* #${coin}\n` +
      `💎 *Giá trị:* *$${(valueUsd / 1_000_000).toFixed(2)} TRIỆU USD*\n` +
      `📦 *Khối lượng:* \`${amount.toLocaleString()}\` ${coin}\n` +
      `🔄 *Hành động:* ${type}\n` +
      `🧭 *Tâm lý dự báo:* ${sentiment}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⚡ _CryptoWhale AI On-Chain Detector_`
    );
  }

  /**
   * Dispatch gửi tin nhắn tới Telegram Bot API
   */
  public async dispatchTelegram(
    message: string,
    config?: Partial<TelegramConfig>
  ): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
    const token = config?.botToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = config?.chatId || process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      // Return simulated success so the system doesn't crash when user hasn't setup bot yet
      return {
        success: true,
        simulated: true,
      };
    }

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.description || `HTTP ${res.status}` };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

export const telegramAlertService = TelegramAlertService.getInstance();
