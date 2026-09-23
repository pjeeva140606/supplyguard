import { Shield, Activity, RefreshCw, Layers, Zap, FileText, DollarSign } from 'lucide-react';
import { KpiData } from '../types';

interface HeaderProps {
  kpiData: KpiData | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenSimulator: () => void;
  onOpenShipmentsDrawer: () => void;
  currency: 'USD' | 'INR';
  onToggleCurrency: () => void;
  onOpenExecutiveBrief: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  kpiData,
  onRefresh,
  isRefreshing,
  onOpenSimulator,
  onOpenShipmentsDrawer,
  currency,
  onToggleCurrency,
  onOpenExecutiveBrief
}) => {
  const health = kpiData?.supply_chain_health || {
    score: 72,
    label: 'Moderate Risk',
    status_color: 'amber',
    active_shipments: 45,
    critical_alerts: 4
  };

  const getHealthColorClasses = () => {
    if (health.score >= 80) {
      return {
        ring: 'text-emerald-500',
        bg: 'from-emerald-500/20 to-emerald-500/5',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
      };
    }
    if (health.score >= 60) {
      return {
        ring: 'text-amber-500',
        bg: 'from-amber-500/20 to-amber-500/5',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        badge: 'bg-amber-950/80 text-amber-300 border-amber-500/40'
      };
    }
    return {
      ring: 'text-rose-500',
      bg: 'from-rose-500/20 to-rose-500/5',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      badge: 'bg-rose-950/80 text-rose-300 border-rose-500/40'
    };
  };

  const colors = getHealthColorClasses();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-5 py-3 transition-colors">
      <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Datathon 2K26 Info */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/25 border border-blue-400/30">
            <Shield className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                SupplyGuard
              </h1>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                Datathon 2K26
              </span>
            </div>
            
            {/* 5-Stage Pipeline Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
              <span className="text-slate-200 font-medium">Pipeline:</span>
              <span className="text-blue-400 font-semibold">Detect</span>
              <span className="text-slate-600">→</span>
              <span className="text-cyan-400 font-semibold">Predict</span>
              <span className="text-slate-600">→</span>
              <span className="text-violet-400 font-semibold">Explain</span>
              <span className="text-slate-600">→</span>
              <span className="text-amber-400 font-semibold">Simulate</span>
              <span className="text-slate-600">→</span>
              <span className="text-emerald-400 font-semibold">Recommend</span>
            </div>
          </div>
        </div>

        {/* Global Health Meter & Actions */}
        <div className="flex items-center gap-4">
          
          {/* Health Meter Widget */}
          <div className={`flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r ${colors.bg} border ${colors.border}`}>
            {/* Gauge Circle */}
            <div className="relative w-11 h-11 flex items-center justify-center">
              <svg className="w-11 h-11 transform -rotate-90">
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  className="text-slate-800"
                  fill="transparent"
                />
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  className={colors.ring}
                  fill="transparent"
                  strokeDasharray={113}
                  strokeDashoffset={113 - (113 * health.score) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xs font-bold text-slate-100">
                {health.score}
              </span>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                Supply Chain Health
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${colors.badge}`}>
                  {health.label}
                </span>
                <span className="text-xs text-slate-400">
                  ({health.active_shipments} Active)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Currency Switcher */}
            <button
              onClick={onToggleCurrency}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-200 transition-all shadow-sm"
              title="Toggle currency display ($ USD / ₹ INR)"
            >
              <span className={currency === 'USD' ? 'text-emerald-400 font-extrabold' : 'text-slate-400'}>$</span>
              <span className="text-slate-600">/</span>
              <span className={currency === 'INR' ? 'text-amber-400 font-extrabold' : 'text-slate-400'}>₹</span>
            </button>

            {/* Export Brief */}
            <button
              onClick={onOpenExecutiveBrief}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 transition-all shadow-sm"
              title="Export Executive Resiliency Brief"
            >
              <FileText className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden sm:inline">Export Brief</span>
            </button>

            <button
              onClick={onOpenShipmentsDrawer}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 transition-all shadow-sm"
              title="View all monitored shipments"
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Shipments</span>
            </button>

            <button
              onClick={onOpenSimulator}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600/90 to-orange-600/90 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold shadow-md shadow-amber-900/30 transition-all border border-amber-400/40"
            >
              <Zap className="w-3.5 h-3.5 text-amber-200" />
              <span>Stress Simulator</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all disabled:opacity-50"
              title="Refresh live telemetry & weather feeds"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
