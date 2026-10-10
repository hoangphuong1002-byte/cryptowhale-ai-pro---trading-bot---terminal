import React, { useRef, useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { CryptoSymbol, MarketPair } from '../types';

interface MarketTickerBarProps {
  pairs: MarketPair[];
  selectedSymbol: CryptoSymbol;
  onSelectSymbol: (symbol: CryptoSymbol) => void;
}

export const MarketTickerBar: React.FC<MarketTickerBarProps> = ({
  pairs,
  selectedSymbol,
  onSelectSymbol,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const formatPrice = (val: number, isGold: boolean) => {
    if (val >= 1000) {
      return val.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
    }
    if (val >= 1) {
      return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
    }
    return val.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 4 });
  };

  const getCoinIcon = (sym: string) => {
    if (sym.startsWith('BTC')) return { icon: '₿', bg: 'text-amber-400 bg-amber-500/15' };
    if (sym.startsWith('ETH')) return { icon: 'Ξ', bg: 'text-cyan-400 bg-cyan-500/15' };
    if (sym.startsWith('SOL')) return { icon: '◎', bg: 'text-purple-400 bg-purple-500/15' };
    if (sym.startsWith('PAXG') || sym.startsWith('XAU')) return { icon: '🪙', bg: 'text-amber-300 bg-amber-400/20' };
    if (sym.startsWith('BNB')) return { icon: '💎', bg: 'text-yellow-400 bg-yellow-500/15' };
    if (sym.startsWith('DOGE')) return { icon: '🐕', bg: 'text-orange-400 bg-orange-500/15' };
    if (sym.startsWith('XRP')) return { icon: '✕', bg: 'text-sky-400 bg-sky-500/15' };
    return { icon: '●', bg: 'text-slate-400 bg-slate-800' };
  };

  // Mouse Drag-to-Scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftState(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftState - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const scrollByAmount = (amt: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amt, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-[#090d16] border-b border-slate-800/80 py-1.5 px-2 select-none relative group">
      <div className="max-w-[1720px] mx-auto flex items-center gap-1.5">
        {/* Left scroll chevron for desktop */}
        <button
          onClick={() => scrollByAmount(-220)}
          className="hidden md:flex w-6 h-7 rounded items-center justify-center bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800/80 shrink-0 transition-colors"
          title="Cuộn sang trái"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Compact Draggable & Swipeable Coin Tray */}
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className={`flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth flex-1 py-0.5 px-0.5 ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ scrollbarWidth: 'none' }}
        >
          {pairs.map((pair) => {
            const isSelected = pair.symbol === selectedSymbol;
            const isUp = pair.change24h >= 0;
            const isGold = pair.symbol === 'PAXGUSDT';
            const { icon, bg } = getCoinIcon(pair.symbol);
            const displayName = pair.symbol.replace('USDT', '');

            return (
              <button
                key={pair.symbol}
                onClick={() => onSelectSymbol(pair.symbol)}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-left shrink-0 transition-all font-mono text-xs ${
                  isSelected
                    ? 'bg-cyan-950/50 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/40'
                    : 'bg-slate-900/60 border-slate-800/90 text-slate-300 hover:bg-slate-800/70 hover:border-slate-700'
                }`}
              >
                {/* Coin Mini Icon */}
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${bg}`}>
                  {icon}
                </span>

                {/* Coin Ticker */}
                <span className="font-bold text-white tracking-tight">
                  {displayName}
                  {isGold ? ' (Vàng)' : ''}
                </span>

                {/* Price */}
                <span className="text-slate-200 tabular-nums font-semibold">
                  ${formatPrice(pair.price, isGold)}
                </span>

                {/* % Change */}
                <span
                  className={`flex items-center text-[11px] font-bold tabular-nums ${
                    isUp ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isUp ? '+' : ''}
                  {pair.change24h.toFixed(2)}%
                </span>
              </button>
            );
          })}
        </div>

        {/* Right scroll chevron for desktop */}
        <button
          onClick={() => scrollByAmount(220)}
          className="hidden md:flex w-6 h-7 rounded items-center justify-center bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800/80 shrink-0 transition-colors"
          title="Cuộn sang phải"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
