import React from 'react';
import { Bot, Sparkles, MessageSquare } from 'lucide-react';

interface FloatingAIAssistantProps {
  onOpen: () => void;
  isAnalyzing?: boolean;
}

export const FloatingAIAssistant: React.FC<FloatingAIAssistantProps> = ({
  onOpen,
  isAnalyzing = false,
}) => {
  return (
    <div className="fixed bottom-16 lg:bottom-6 right-3 sm:right-6 z-40 flex items-center gap-2">
      <button
        onClick={onOpen}
        className="group relative flex items-center gap-2.5 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.45)] border border-cyan-400/50 transition-all transform hover:scale-105 active:scale-95 cursor-pointer font-mono"
        title="Mở Trợ Lý AI Giao Dịch Thực Chiến (AI Trading Copilot)"
      >
        {/* Animated radar beacon */}
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border border-slate-900"></span>
        </span>

        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Bot className={`w-4 h-4 sm:w-4.5 sm:h-4.5 text-white ${isAnalyzing ? 'animate-spin' : 'animate-pulse'}`} />
        </div>

        <div className="flex flex-col text-left">
          <span className="text-[11px] sm:text-xs font-bold tracking-tight text-white flex items-center gap-1">
            <span>AI COPILOT</span>
            <Sparkles className="w-3 h-3 text-cyan-200" />
          </span>
          <span className="text-[9px] text-cyan-100 hidden sm:inline">Hỏi Điểm Vào & Quản Lý Vốn</span>
        </div>
      </button>
    </div>
  );
};
