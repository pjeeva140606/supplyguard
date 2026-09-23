import React, { useState } from 'react';
import { Shipment } from '../types';
import { X, Search, Filter, ShieldAlert, CheckCircle2, ChevronRight, Anchor, Plane, Train, Truck } from 'lucide-react';

interface ShipmentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  shipments: Shipment[];
  selectedShipmentId: string | null;
  onSelectShipment: (shipment: Shipment) => void;
}

export const ShipmentsDrawer: React.FC<ShipmentsDrawerProps> = ({
  isOpen,
  onClose,
  shipments,
  selectedShipmentId,
  onSelectShipment
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');

  if (!isOpen) return null;

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'Sea': return <Anchor className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Air': return <Plane className="w-3.5 h-3.5 text-sky-400" />;
      case 'Rail': return <Train className="w-3.5 h-3.5 text-violet-400" />;
      default: return <Truck className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const filtered = shipments.filter((s) => {
    const matchesSearch =
      s.shipment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.origin_port.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.dest_port.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMode = filterMode === 'all' || s.mode.toLowerCase() === filterMode.toLowerCase();
    const matchesRisk =
      filterRisk === 'all' ||
      (filterRisk === 'high' && s.delay_risk_score >= 65) ||
      (filterRisk === 'medium' && s.delay_risk_score >= 40 && s.delay_risk_score < 65) ||
      (filterRisk === 'low' && s.delay_risk_score < 40);

    return matchesSearch && matchesMode && matchesRisk;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Active Shipments Control Feed</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {filtered.length} Monitored
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live multi-domain risk scored via XGBoost
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search shipment ID, supplier, SKU, or port..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            {/* Mode Filter */}
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none"
            >
              <option value="all">All Modes</option>
              <option value="sea">Maritime (Sea)</option>
              <option value="air">Air Cargo</option>
              <option value="rail">Intermodal Rail</option>
              <option value="road">Express Road</option>
            </select>

            {/* Risk Filter */}
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">Critical Risk (&gt;65%)</option>
              <option value="medium">Moderate Risk (40-65%)</option>
              <option value="low">Nominal Risk (&lt;40%)</option>
            </select>
          </div>
        </div>

        {/* Shipment Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.map((s) => {
            const isSelected = s.shipment_id === selectedShipmentId;
            const isCritical = s.delay_risk_score >= 65;
            const isMedium = s.delay_risk_score >= 40 && s.delay_risk_score < 65;

            return (
              <div
                key={s.shipment_id}
                onClick={() => {
                  onSelectShipment(s);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-blue-950/40 border-blue-500/60 shadow-md ring-1 ring-blue-500/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                    {getModeIcon(s.mode)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-white">
                        {s.shipment_id}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium truncate">
                        • {s.carrier}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-200 truncate mt-0.5">
                      {s.item_name} ({s.units_shipped.toLocaleString()} units)
                    </div>

                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {s.origin_port} → {s.dest_port} | Value: ${s.value_usd.toLocaleString()}
                    </div>

                    <div className="text-[10px] text-amber-300/80 truncate mt-1 flex items-center gap-1 font-medium">
                      <span>Root Factor:</span>
                      <span className="text-slate-300">{s.headline_explanation}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${
                      isCritical
                        ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                        : isMedium
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    <span>{s.delay_risk_score}% Risk</span>
                  </span>

                  {s.is_mitigated && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Mitigated
                    </span>
                  )}

                  <ChevronRight className="w-4 h-4 text-slate-500 mt-1" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
