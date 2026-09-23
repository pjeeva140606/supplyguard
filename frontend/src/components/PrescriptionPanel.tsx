import React, { useState } from 'react';
import { RecommendationOption, Shipment } from '../types';
import { Sparkles, CheckCircle2, Clock, DollarSign, TrendingDown, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface PrescriptionPanelProps {
  recommendations: RecommendationOption[];
  currentShipment: Shipment | null;
  onApplyMitigation: (shipmentId: string, optionId: string) => Promise<void>;
  isMitigated?: boolean;
}

export const PrescriptionPanel: React.FC<PrescriptionPanelProps> = ({
  recommendations,
  currentShipment,
  onApplyMitigation,
  isMitigated
}) => {
  const [applyingOptionId, setApplyingOptionId] = useState<string | null>(null);
  const [successOptionId, setSuccessOptionId] = useState<string | null>(null);

  const handleApply = async (optionId: string) => {
    if (!currentShipment) return;
    setApplyingOptionId(optionId);
    try {
      await onApplyMitigation(currentShipment.shipment_id, optionId);
      setSuccessOptionId(optionId);
    } catch (e) {
      console.error(e);
    } finally {
      setApplyingOptionId(null);
    }
  };

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-5 flex flex-col items-center justify-center text-slate-400">
        <Sparkles className="w-8 h-8 text-slate-600 mb-2" />
        <h4 className="text-sm font-semibold text-slate-300">No Active Prescriptions</h4>
        <p className="text-xs text-slate-500 mt-1">Select an active high-risk shipment to generate ranked mitigation options.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800/80 p-5 shadow-xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                Prescriptive Mitigation Engine
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold uppercase">
                Ranked Trade-Off Matrix
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Conditioned on dominant risk root cause: cost, speed & stockout risk reduction
            </p>
          </div>
        </div>

        {isMitigated && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-md">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Mitigation Protocol Active</span>
          </div>
        )}
      </div>

      {/* Cards: Option A (Recommended) vs Option B */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {recommendations.map((opt) => {
          const isSelectedSuccess = successOptionId === opt.option_id || isMitigated;
          return (
            <div
              key={opt.option_id}
              className={`relative rounded-xl p-4 transition-all duration-200 flex flex-col justify-between ${
                opt.is_recommended
                  ? 'bg-slate-950/90 border-2 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                  : 'bg-slate-950/70 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Recommended Badge */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  {opt.domain_tag}
                </span>

                {opt.is_recommended ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    Option A (Recommended)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-semibold">
                    Option B (Expedited Track)
                  </span>
                )}
              </div>

              {/* Title & Desc */}
              <div>
                <h4 className="text-sm font-bold text-white leading-snug">
                  {opt.strategy_title}
                </h4>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {opt.description}
                </p>
              </div>

              {/* Trade-off Matrix Strip */}
              <div className="grid grid-cols-3 gap-2 my-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-center">
                
                <div>
                  <div className="text-[10px] uppercase font-medium text-slate-400">
                    Cost Delta
                  </div>
                  <div className="text-xs font-bold text-amber-300 mt-0.5">
                    +${opt.cost_delta_usd}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    +₹{opt.cost_delta_inr.toLocaleString()}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-medium text-slate-400">
                    Execution
                  </div>
                  <div className="text-xs font-bold text-sky-300 mt-0.5 flex items-center justify-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {opt.execution_time_hours} Hours
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Lead Save: +{opt.lead_time_saved_days}d
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-medium text-slate-400">
                    Stockout Risk
                  </div>
                  <div className="text-xs font-bold text-emerald-400 mt-0.5">
                    {opt.stockout_risk_before}% → {opt.stockout_risk_after}%
                  </div>
                  <div className="text-[9px] text-emerald-500/80 font-semibold">
                    -{opt.risk_reduction_pct}% Δ
                  </div>
                </div>

              </div>

              {/* Operational Implementation Steps */}
              <div className="mb-3 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300">Action Steps:</span>
                {opt.action_steps.map((st, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <span className="truncate">{st}</span>
                  </div>
                ))}
              </div>

              {/* Trigger Button */}
              <button
                onClick={() => handleApply(opt.option_id)}
                disabled={applyingOptionId !== null || isSelectedSuccess}
                className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all shadow-md ${
                  isSelectedSuccess
                    ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 cursor-default'
                    : opt.is_recommended
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
                }`}
              >
                {isSelectedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Dispatched to TMS / Active</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>{applyingOptionId === opt.option_id ? 'Authorizing...' : 'Authorize Mitigation Protocol'}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
};
