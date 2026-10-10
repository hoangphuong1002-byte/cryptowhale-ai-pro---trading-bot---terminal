import { EconomicEvent } from '../types';

export interface MacroEventDetail extends EconomicEvent {
  description: string;
  affectedAssets: string[];
  historicalVolatility: string;
  recommendation: string;
  actual?: string;
}

export function formatRemainingTime(scheduledTime: number): string {
  const diffMs = scheduledTime - Date.now();
  if (diffMs <= 0) return 'Đang diễn ra';

  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    const remHours = diffHours % 24;
    return `${diffDays} ngày ${remHours > 0 ? `${remHours} giờ` : ''}`.trim();
  }
  if (diffHours > 0) {
    const remMins = diffMins % 60;
    return `${diffHours} giờ ${remMins > 0 ? `${remMins} phút` : ''}`.trim();
  }
  return `${diffMins} phút`;
}

export function getRiskStatus(scheduledTime: number): 'PAUSE_RECOMMENDED' | 'CAUTION' | 'SAFE' {
  const diffMins = Math.floor((scheduledTime - Date.now()) / (60 * 1000));
  if (diffMins <= 30 && diffMins >= -15) return 'PAUSE_RECOMMENDED';
  if (diffMins <= 120 && diffMins > 30) return 'CAUTION';
  return 'SAFE';
}

export function generateLiveMacroCalendar(): MacroEventDetail[] {
  const now = Date.now();

  const templates = [
    {
      id: 'macro-cpi',
      name: 'US CPI / Lạm Phát Mỹ Y/Y & M/M',
      currency: 'USD',
      impact: 'HIGH' as const,
      offsetMs: 38 * 60 * 1000, // 38 mins from now
      forecast: '2.8%',
      previous: '3.1%',
      actual: 'Chờ công bố',
      description: 'Chỉ số giá tiêu dùng Mỹ đo lường áp lực lạm phát - yếu tố then chốt định hình lộ trình hạ lãi suất của FED.',
      affectedAssets: ['BTC', 'ETH', 'XAU/Vàng', 'DXY'],
      historicalVolatility: '±3.8% biến động trong 15 phút đầu',
      recommendation: 'Dừng mở lệnh mới 30 phút trước/sau tin. Giữ lệnh có SL hòa vốn.',
    },
    {
      id: 'macro-fomc',
      name: 'Quyết Định Lãi Suất FED & Họp Báo Powell',
      currency: 'USD',
      impact: 'HIGH' as const,
      offsetMs: (4 * 3600 + 15 * 60) * 1000, // 4h 15m
      forecast: '4.75%',
      previous: '5.00%',
      actual: 'Chờ công bố',
      description: 'Quyết định chính sách tiền tệ FOMC và bài phát biểu của Chủ tịch Jerome Powell.',
      affectedAssets: ['BTC', 'XAU/Vàng', 'Toàn bộ Altcoins'],
      historicalVolatility: '±5.2% quét thanh khoản 2 đầu',
      recommendation: 'Hệ thống tự động kích hoạt chế độ phòng thủ rủi ro cao.',
    },
    {
      id: 'macro-nfp',
      name: 'Báo Cáo Việc Làm Phi Nông Nghiệp (NFP Mỹ)',
      currency: 'USD',
      impact: 'HIGH' as const,
      offsetMs: 24 * 3600 * 1000, // Tomorrow
      forecast: '168K',
      previous: '142K',
      actual: 'Chờ công bố',
      description: 'Số lượng việc làm mới tạo ra trong tháng, phản ánh sức khỏe nền kinh tế Mỹ.',
      affectedAssets: ['BTC', 'ETH', 'XAU/Vàng'],
      historicalVolatility: '±2.5% biên độ mở rộng',
      recommendation: 'Khuyến nghị chốt lời từng phần trước khi tin ra.',
    },
    {
      id: 'macro-pce',
      name: 'Chỉ Số Lạm Phát PCE Cốt Lõi (Core PCE)',
      currency: 'USD',
      impact: 'HIGH' as const,
      offsetMs: 48 * 3600 * 1000, // 2 days
      forecast: '2.6%',
      previous: '2.7%',
      actual: 'Chờ công bố',
      description: 'Thước đo lạm phát ưa thích nhất của Cục Dự trữ Liên bang Mỹ (FED).',
      affectedAssets: ['Crypto Market', 'Gold Spot'],
      historicalVolatility: '±2.0% xu hướng trung hạn',
      recommendation: 'Chờ đợi xác nhận cấu trúc nến đóng nến H1 sau tin.',
    },
    {
      id: 'macro-jobless',
      name: 'Đơn Xin Trợ Cấp Thất Nghiệp Hàng Tuần',
      currency: 'USD',
      impact: 'MEDIUM' as const,
      offsetMs: (2 * 24 * 3600 + 6 * 3600) * 1000,
      forecast: '218K',
      previous: '221K',
      actual: 'Chờ công bố',
      description: 'Số người nộp đơn xin bảo hiểm thất nghiệp lần đầu trong tuần.',
      affectedAssets: ['BTC', 'DXY'],
      historicalVolatility: '±1.2% rung lắc ngắn hạn',
      recommendation: 'Giao dịch bình thường, tuân thủ nghiêm ngặt Stop Loss.',
    },
    {
      id: 'macro-dxy',
      name: 'Chỉ Số DXY & Lãi Suất Trái Phiếu Mỹ 10Y',
      currency: 'USD',
      impact: 'MEDIUM' as const,
      offsetMs: 4 * 24 * 3600 * 1000,
      forecast: '103.2',
      previous: '104.1',
      actual: 'Chờ công bố',
      description: 'Sức mạnh đồng USD tương quan nghịch biến với giá Bitcoin và Vàng.',
      affectedAssets: ['XAU/Vàng', 'Bitcoin'],
      historicalVolatility: 'Tạo đà xu hướng đa khung thời gian',
      recommendation: 'Theo dõi dòng tiền phân bổ từ tài sản phòng hộ sang rủi ro.',
    },
  ];

  return templates.map((t) => {
    const scheduledTime = now + t.offsetMs;
    const timeRemainingStr = formatRemainingTime(scheduledTime);
    const tradingRiskStatus = getRiskStatus(scheduledTime);

    return {
      ...t,
      scheduledTime,
      timeRemainingStr,
      tradingRiskStatus,
    };
  });
}
