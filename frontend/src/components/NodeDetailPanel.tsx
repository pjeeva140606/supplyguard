import React from 'react';
import { GraphNodeData } from '../types';
import { Activity, AlertTriangle, ShieldCheck, DollarSign, Package, Zap } from 'lucide-react';

interface NodeDetailPanelProps {
  nodeData: GraphNodeData | null;
  onSimulateOutage: (targetType: string, targetId: string) => void;
}

export const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
  nodeData,
  onSimulateOutage
}) => {
  if (!nodeData) {
    return (
      <div className="h-full rounded-2xl bg-slate-900/80 border border-slate-800/80 p-5 flex flex-col items-center justify-center text-center text-slate-400">
        <Activity className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
        <h4 className="text-sm font-semibold text-slate-300">Select a Digital Twin Node</h4>
        <p className="text-xs text-slate-500 max-w-[240px] mt-1">
          Click any Supplier, Port Hub, Transit Corridor, or Warehouse on the map to inspect live metrics.
        </p>
      </div>
    );
  }

  const { operational_status, business_impact } = nodeData;

  const getSimulateParams = () => {
    if (nodeData.node_type === 'Supplier') {
      return { type: 'supplier', id: nodeData.id };
    }
    if (nodeData.node_type === 'Port Hub') {
      const portName = nodeData.label.replace('Port of ', '');
      return { type: 'port', id: portName };
    }
    return { type: 'port', id: 'Shanghai' };
  };

  const simParams = getSimulateParams();

  return (
    <div className="h-full rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800/80 p-5 flex flex-col justify-between shadow-xl">
      
      <div>
        {/* Panel Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                {nodeData.node_type}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {nodeData.id}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              {nodeData.label}
            </h3>
            <p className="text-xs text-slate-400">
              {nodeData.sublabel}
            </p>
          </div>

          <div className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
            nodeData.status_color === 'rose'
              ? 'bg-rose-950/80 text-rose-300 border-rose-500/30'
              : nodeData.status_color === 'amber'
              ? 'bg-amber-950/80 text-amber-300 border-amber-500/30'
              : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              nodeData.status_color === 'rose' ? 'bg-rose-500' : nodeData.status_color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
            }`} />
            <span>Risk Score: {nodeData.risk_score}%</span>
          </div>
        </div>

        {/* Section A: Operational Status */}
        <div className="mt-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Operational Status Telemetry</span>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            {Object.entries(operational_status).map(([key, val]) => (
              <div key={key} className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/50">
                <div className="text-[10px] uppercase font-medium text-slate-400 truncate">
                  {key.replace(/_/g, ' ')}
                </div>
                <div className="text-xs font-semibold text-slate-200 mt-0.5">
                  {val}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section B: Downstream Business Impact */}
        <div className="mt-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            <span>Downstream Business Impact</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-3">
            {/* Revenue at Risk */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/20">
              <span className="text-xs font-medium text-rose-300">
                Projected Revenue at Risk:
              </span>
              <div className="text-right">
                <div className="text-sm font-bold text-rose-200">
                  ${business_impact.projected_revenue_at_risk_usd.toLocaleString()}
                </div>
                <div className="text-[10px] text-rose-400/80">
                  ({business_impact.projected_revenue_at_risk_inr})
                </div>
              </div>
            </div>

            {/* Exposed SKUs */}
            <div>
              <div className="text-[11px] text-slate-400 font-medium mb-1.5 flex items-center justify-between">
                <span>Exposed Product SKUs:</span>
                <span className="text-xs font-semibold text-slate-300">
                  {business_impact.exposed_sku_count} Components
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
                {business_impact.exposed_skus.map((sku, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-slate-800/80 text-[11px] text-slate-300 border border-slate-700/60"
                  >
                    {sku}
                  </span>
                ))}
              </div>
            </div>

            {/* Affected Suppliers */}
            <div>
              <div className="text-[11px] text-slate-400 font-medium mb-1">
                Connected Vendor Network:
              </div>
              <p className="text-xs text-slate-300">
                {business_impact.affected_suppliers.join(', ')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800">
        <button
          onClick={() => onSimulateOutage(simParams.type, simParams.id)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-md shadow-amber-950/40 transition-all border border-amber-400/30"
        >
          <Zap className="w-3.5 h-3.5 text-amber-200" />
          <span>Simulate Outage on {nodeData.label}</span>
        </button>
      </div>

    </div>
  );
};
