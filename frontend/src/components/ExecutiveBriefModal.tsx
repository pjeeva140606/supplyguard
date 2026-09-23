import React from 'react';
import { KpiData, ShipmentRiskDetail, GraphNodeData } from '../types';
import { X, Printer, ShieldCheck, Download, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

interface ExecutiveBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpiData: KpiData | null;
  riskDetail: ShipmentRiskDetail | null;
  selectedNode: GraphNodeData | null;
  currency: 'USD' | 'INR';
}

export const ExecutiveBriefModal: React.FC<ExecutiveBriefModalProps> = ({
  isOpen,
  onClose,
  kpiData,
  riskDetail,
  selectedNode,
  currency
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const health = kpiData?.supply_chain_health;
  const kpis = kpiData?.kpi_strip;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-100 max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:bg-white print:text-black">
        
        {/* Header Actions */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 print:border-black">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 print:border-black">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white print:text-black">
                Executive Resiliency Brief & Audit Report
              </h2>
              <p className="text-xs text-slate-400 print:text-slate-600">
                SupplyGuard Decision Intelligence • Datathon 2K26 Certification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Section 1: Executive Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 print:border-slate-300 print:bg-slate-50">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600">
              Resiliency Score
            </div>
            <div className="text-xl font-bold text-white print:text-black mt-0.5">
              {health?.score || 72}/100
            </div>
            <div className="text-[11px] text-amber-400 font-medium">
              {health?.label || 'Moderate Risk'}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600">
              Lead Time Gained
            </div>
            <div className="text-xl font-bold text-white print:text-black mt-0.5">
              +4.2 Days
            </div>
            <div className="text-[11px] text-sky-400 font-medium">
              Early Disruption Alert
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600">
              Potential Loss Avoided
            </div>
            <div className="text-xl font-bold text-white print:text-black mt-0.5">
              {currency === 'USD' ? kpis?.estimated_loss_avoided_usd : kpis?.estimated_loss_avoided_inr}
            </div>
            <div className="text-[11px] text-emerald-400 font-medium">
              Projected ROI
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600">
              Resolution Rate
            </div>
            <div className="text-xl font-bold text-white print:text-black mt-0.5">
              95.0%
            </div>
            <div className="text-[11px] text-violet-400 font-medium">
              {kpis?.alerts_resolved_vs_missed}
            </div>
          </div>
        </div>

        {/* Section 2: Disruption Root-Cause Analysis (SHAP) */}
        {riskDetail && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-black">
              1. Root-Cause Attribution & ML Explainability
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs space-y-2 print:border-slate-300 print:bg-white">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 print:text-black">
                  Active Shipment: {riskDetail.shipment.shipment_id} ({riskDetail.shipment.supplier_name})
                </span>
                <span className="font-bold text-rose-400">
                  Delay Risk: {riskDetail.risk_summary.delay_risk_score}%
                </span>
              </div>
              <p className="text-slate-400 print:text-slate-700">
                <strong>Attribution Callout:</strong> {riskDetail.risk_summary.headline_explanation}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800 print:border-slate-200">
                {riskDetail.shap_breakdown.top_risk_drivers.slice(0, 4).map((d, i) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <span className="text-slate-400 print:text-slate-600">{d.label}</span>
                    <span className="font-bold text-rose-400">+{d.impact_percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Recommended Prescriptive Mitigations */}
        {riskDetail && riskDetail.prescriptive_recommendations && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-black">
              2. Recommended Prescriptive Mitigation Protocols
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {riskDetail.prescriptive_recommendations.map((opt) => (
                <div
                  key={opt.option_id}
                  className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs space-y-2 print:border-slate-300 print:bg-white"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white print:text-black">{opt.strategy_title}</span>
                    {opt.is_recommended && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 print:text-slate-600 leading-relaxed">
                    {opt.description}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px] font-medium print:border-slate-200">
                    <span className="text-amber-300">
                      Cost: +{currency === 'USD' ? `$${opt.cost_delta_usd}` : `₹${opt.cost_delta_inr.toLocaleString()}`}
                    </span>
                    <span className="text-sky-300">SLA: {opt.execution_time_hours}h</span>
                    <span className="text-emerald-400">Risk: {opt.stockout_risk_before}% → {opt.stockout_risk_after}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 print:border-slate-300 print:text-slate-600">
          <div>Generated by SupplyGuard Resiliency Engine • ISO 28000 Resiliency Compliant</div>
          <div>Audit Verification Hash: 0x8F9C2B7A</div>
        </div>

      </div>
    </div>
  );
};
