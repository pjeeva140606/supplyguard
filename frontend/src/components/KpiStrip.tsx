import React from 'react';
import { Target, Clock, DollarSign, CheckCircle2, TrendingUp } from 'lucide-react';
import { KpiData } from '../types';

interface KpiStripProps {
  kpiData: KpiData | null;
  currency?: 'USD' | 'INR';
}

export const KpiStrip: React.FC<KpiStripProps> = ({ kpiData, currency = 'USD' }) => {
  const kpis = kpiData?.kpi_strip || {
    model_accuracy: '91.2%',
    model_f1: '0.895',
    roc_auc: '0.941',
    avg_lead_time_gained: '4.2 Days Disruption Warning',
    estimated_loss_avoided_usd: '$1,450,000',
    estimated_loss_avoided_inr: '₹12.1 Cr',
    alerts_resolved_vs_missed: '38 Resolved / 2 Pending'
  };

  const cards = [
    {
      title: 'Prediction Model Precision',
      mainValue: `${kpis.model_accuracy}`,
      subValue: `F1-Score: ${kpis.model_f1} | AUC: ${kpis.roc_auc}`,
      icon: <Target className="w-4 h-4 text-sky-400" />,
      accentBorder: 'border-sky-500/30',
      tag: 'XGBoost Unified',
      tagBg: 'bg-sky-950/80 text-sky-300 border-sky-500/30'
    },
    {
      title: 'Disruption Lead Time Gained',
      mainValue: '+4.2 Days',
      subValue: 'Ahead-of-time early warning',
      icon: <Clock className="w-4 h-4 text-cyan-400" />,
      accentBorder: 'border-cyan-500/30',
      tag: 'Predict vs Alert',
      tagBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30'
    },
    {
      title: 'Projected Loss Avoided',
      mainValue: currency === 'USD' ? kpis.estimated_loss_avoided_usd : kpis.estimated_loss_avoided_inr,
      subValue: currency === 'USD' ? `Estimated ${kpis.estimated_loss_avoided_inr} Saved` : `Equivalent to ${kpis.estimated_loss_avoided_usd}`,
      icon: <DollarSign className="w-4 h-4 text-emerald-400" />,
      accentBorder: 'border-emerald-500/30',
      tag: 'Demurrage & Stockout',
      tagBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
    },
    {
      title: 'Disruption Resolution Rate',
      mainValue: kpis.alerts_resolved_vs_missed.split(' / ')[0],
      subValue: kpis.alerts_resolved_vs_missed.split(' / ')[1] || '2 Pending',
      icon: <CheckCircle2 className="w-4 h-4 text-violet-400" />,
      accentBorder: 'border-violet-500/30',
      tag: '95% SLA Target',
      tagBg: 'bg-violet-950/80 text-violet-300 border-violet-500/30'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
      {cards.map((c, i) => (
        <div
          key={i}
          className={`relative overflow-hidden rounded-xl bg-slate-900/80 backdrop-blur-md p-3.5 border ${c.accentBorder} shadow-sm hover:shadow-md hover:border-slate-600 transition-all duration-200`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-400 truncate">
              {c.title}
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${c.tagBg}`}>
                {c.tag}
              </span>
              <span className="p-1 rounded-md bg-slate-800/80 border border-slate-700/60">
                {c.icon}
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <h3 className="text-xl font-bold tracking-tight text-white">
              {c.mainValue}
            </h3>
          </div>

          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {c.subValue}
          </p>
        </div>
      ))}
    </div>
  );
};
