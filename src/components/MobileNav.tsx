import React from 'react';
import { BarChart2, Radio, Wallet, GraduationCap, History, Brain, ShieldCheck } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface MobileNavProps {
  activeTab: 'terminal' | 'signals' | 'whales' | 'pro-hub' | 'ml-hub' | 'history';
  setActiveTab: (tab: 'terminal' | 'signals' | 'whales' | 'pro-hub' | 'ml-hub' | 'history') => void;
  onOpenAudit?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenAudit,
}) => {
  const navItems = [
    { id: 'terminal', label: 'Biểu Đồ', icon: BarChart2 },
    { id: 'signals', label: 'Tín Hiệu', icon: Radio },
    { id: 'whales', label: 'Cá Voi', icon: Wallet },
    { id: 'ml-hub', label: 'Định Lượng', icon: Brain },
    { id: 'pro-hub', label: 'Pro Hub', icon: GraduationCap },
    { id: 'history', label: 'Hiệu Suất', icon: History },
  ] as const;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 backdrop-blur-md border-t border-slate-800/80 px-1 pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom,0px))] flex items-center justify-between">
      <div className="flex items-center justify-around flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-all min-h-[44px] ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="text-[9px] tracking-tight">{item.label}</span>
            </button>
          );
        })}

        {/* 3rd-Party Quant Audit Tab */}
        {onOpenAudit && (
          <button
            onClick={onOpenAudit}
            className="flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-all min-h-[44px] text-cyan-400 hover:text-cyan-200 cursor-pointer"
            title="Mở Báo Cáo Thẩm Định Độc Lập Bên Thứ 3"
          >
            <div className="relative">
              <ShieldCheck className="w-4 h-4 mb-0.5 text-cyan-400" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            </div>
            <span className="text-[9px] tracking-tight font-bold">Thẩm Định</span>
          </button>
        )}
      </div>

      <div className="pr-1 border-l border-slate-800/60 pl-1">
        <PWAInstallButton compact />
      </div>
    </nav>
  );
};
