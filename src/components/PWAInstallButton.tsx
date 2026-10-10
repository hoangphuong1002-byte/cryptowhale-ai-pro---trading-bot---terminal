import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Check, Copy, ExternalLink, Share, AlertTriangle } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }
  }, []);

  // If already running inside standalone installed PWA, hide button
  if (isInstalled) {
    return null;
  }

  // Direct standalone app URL - automatic conversion from internal dev container to shared public preview URL
  const rawUrl = typeof window !== 'undefined' ? window.location.href : '';
  const appDirectUrl = rawUrl.replace('ais-dev-', 'ais-pre-');

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(appDirectUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenDirectApp = () => {
    window.open(appDirectUrl, '_blank', 'noopener,noreferrer');
  };

  const handleButtonClick = () => {
    // If not in iframe and browser natively supports prompt (Android / Chrome Desktop)
    if (isInstallable && !isInIframe) {
      install();
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleButtonClick}
        className={`flex items-center gap-1.5 font-mono text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 rounded-lg shadow-sm transition-all ${
          compact ? 'px-2.5 py-1.5' : 'px-3 py-1.5'
        }`}
        title="Cài đặt CryptoWhale AI Pro trực tiếp lên màn hình điện thoại / máy tính như App Native"
      >
        <Download className="w-3.5 h-3.5 text-white" />
        <span>{compact ? 'Cài App' : 'Cài Đặt App Native'}</span>
      </button>

      {/* Installation Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-[#0b101b] border border-cyan-800/60 w-full max-w-md rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-left max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">
                    Cài Đặt App Lên Màn Hình Chính
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Hoạt động độc lập 100% · Không qua AI Studio
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Crucial Explanation why it previously redirected to AI Studio */}
            <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-3 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200/90 leading-relaxed font-sans">
                <strong className="text-white block font-medium">Vì sao trước đó bị lưu về trang chủ AI Studio?</strong>
                Khi thao tác bên trong trang chỉnh sửa của AI Studio, Safari sẽ lưu nhầm URL của trang mẹ AI Studio. Để cài đặt <strong>chính xác ứng dụng CryptoWhale</strong>, bạn cần mở qua liên kết app độc lập dưới đây.
              </div>
            </div>

            {/* QR Code and Direct URL Container */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center gap-2.5 text-center">
              <span className="text-[11px] font-mono text-cyan-300 font-semibold">
                📱 QUÉT MÃ QR BẰNG CAMERA ĐIỆN THOẠI ĐỂ VÀO APP NGAY:
              </span>
              <div className="p-2 bg-white rounded-xl shadow-md">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(appDirectUrl)}`}
                  alt="QR Code vào App trên điện thoại"
                  className="w-36 h-36"
                  loading="lazy"
                />
              </div>
              <span className="text-[10px] text-slate-400 font-mono break-all max-w-full px-2">
                {appDirectUrl}
              </span>
            </div>

            {/* Primary Action: Open direct tab or Copy link */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleOpenDirectApp}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-900/30 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Mở Ứng Dụng Trong Tab Mới (Safari / Chrome)</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 font-mono text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? '✅ Đã sao chép link app thành công!' : 'Sao chép link gửi sang điện thoại'}</span>
              </button>
            </div>

            {/* Crucial Fix for Mobile Cookie Check screen */}
            <div className="bg-rose-950/20 border border-rose-800/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-sans">
                <strong className="text-white block font-medium">Lưu ý khi mở trên iPhone (Safari):</strong>
                Nếu điện thoại hiện trang <em>"Cookie check"</em> hoặc <em>"Action required to load your app"</em>:
                <br />• Hãy bấm nút <strong className="text-cyan-300">"Authenticate in new window"</strong> (hoặc <strong className="text-cyan-300">"Grant permission"</strong>) để hoàn tất xác thực.
                <br />• Hoặc đơn giản hơn: Mở link bằng <strong className="text-emerald-300">Google Chrome trên điện thoại</strong> để vào thẳng app mà không bị chặn cookie.
              </div>
            </div>

            {/* Step-by-step instructions for iOS Safari & Android */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-300 font-mono">
                {isIOS ? 'HƯỚNG DẪN CÀI ĐẶT TRÊN IPHONE (SAFARI):' : 'HƯỚNG DẪN CÀI ĐẶT TRÊN ANDROID / CHROME:'}
              </span>

              <ol className="flex flex-col gap-2.5 text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 font-sans">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[11px] shrink-0 font-mono">
                    1
                  </span>
                  <span>
                    Bấm nút <strong className="text-cyan-300">"Mở Ứng Dụng Trong Tab Độc Lập"</strong> ở trên (hoặc mở trình duyệt Chrome / Safari).
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[11px] shrink-0 font-mono">
                    2
                  </span>
                  <span>
                    {isIOS ? (
                      <>
                        Nhấn vào biểu tượng <strong className="text-white">Chia Sẻ (Share)</strong>{' '}
                        <Share className="inline w-3.5 h-3.5 text-cyan-400 mx-0.5" /> ở thanh dưới màn hình.
                      </>
                    ) : (
                      <>
                        Nhấn vào biểu tượng <strong className="text-white">Dấu 3 chấm (⋮)</strong> ở góc trên bên phải trình duyệt Chrome.
                      </>
                    )}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[11px] shrink-0 font-mono">
                    3
                  </span>
                  <span>
                    Chọn <strong className="text-emerald-400">"Cài đặt ứng dụng"</strong> hoặc <strong className="text-emerald-400">"Thêm vào Màn hình chính" (Add to Home Screen)</strong>.
                  </span>
                </li>
              </ol>
            </div>

            <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-3 text-xs text-emerald-300 font-sans flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Lợi ích tối đa:</strong> Sau khi cài, app chạy độc lập toàn màn hình như file APK native, tự động lưu trữ thông tin cục bộ và mở lên tức thì trong 0ms không cần tải lại app!
              </span>
            </div>

            <div className="text-[11px] text-slate-400 font-sans text-center">
              Sau khi thêm, mở app từ màn hình chính sẽ chạy toàn màn hình, mượt mà và trực tiếp vào giao diện Trading Bot.
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>
      )}
    </>
  );
};
