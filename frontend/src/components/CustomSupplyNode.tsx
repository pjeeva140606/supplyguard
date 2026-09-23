import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Factory, Anchor, Navigation, Warehouse as WarehouseIcon, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { GraphNodeData } from '../types';

interface CustomSupplyNodeProps {
  data: GraphNodeData;
  selected?: boolean;
}

export const CustomSupplyNode: React.FC<CustomSupplyNodeProps> = ({ data, selected }) => {
  const getIcon = () => {
    switch (data.node_type) {
      case 'Supplier':
        return <Factory className="w-4 h-4 text-sky-400" />;
      case 'Port Hub':
        return <Anchor className="w-4 h-4 text-cyan-400" />;
      case 'Transit Corridor':
        return <Navigation className="w-4 h-4 text-violet-400" />;
      case 'Warehouse':
        return <WarehouseIcon className="w-4 h-4 text-emerald-400" />;
      default:
        return <Factory className="w-4 h-4 text-blue-400" />;
    }
  };

  const getStatusStyles = () => {
    if (data.status_color === 'rose') {
      return {
        border: 'border-rose-500/50 hover:border-rose-400',
        badge: 'bg-rose-950/80 text-rose-300 border-rose-500/30',
        glow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]',
        indicator: 'bg-rose-500',
        icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
      };
    }
    if (data.status_color === 'amber') {
      return {
        border: 'border-amber-500/50 hover:border-amber-400',
        badge: 'bg-amber-950/80 text-amber-300 border-amber-500/30',
        glow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]',
        indicator: 'bg-amber-500',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
      };
    }
    return {
      border: 'border-emerald-500/40 hover:border-emerald-400',
      badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30',
      glow: 'shadow-[0_0_12px_rgba(16,185,129,0.2)]',
      indicator: 'bg-emerald-500',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
    };
  };

  const status = getStatusStyles();

  return (
    <div
      className={`relative min-w-[210px] rounded-xl bg-slate-900/90 backdrop-blur-md px-3.5 py-3 border transition-all duration-200 cursor-pointer ${
        status.border
      } ${status.glow} ${selected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-950 shadow-blue-500/40' : ''}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-slate-400 !border-slate-900 !w-2.5 !h-2.5"
      />

      {/* Top Header: Node Type & Risk Pill */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
          <span className="p-1 rounded-md bg-slate-800/80 border border-slate-700/60">
            {getIcon()}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            {data.node_type}
          </span>
        </div>

        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${status.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.indicator} animate-pulse`} />
          <span>{data.risk_score}%</span>
        </div>
      </div>

      {/* Title & Subtitle */}
      <div>
        <h4 className="text-sm font-semibold text-slate-100 truncate tracking-tight">
          {data.label}
        </h4>
        <p className="text-xs text-slate-400 truncate mt-0.5">
          {data.sublabel}
        </p>
      </div>

      {/* Mini metric ticker */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="truncate">
          {data.node_type === 'Supplier' ? 'On-Time: ' + (data.operational_status.on_time_30d || '92%') :
           data.node_type === 'Port Hub' ? 'Dwell: ' + (data.operational_status.avg_vessel_dwell_time || '48h') :
           data.node_type === 'Transit Corridor' ? 'Congest: ' + (data.operational_status.corridor_congestion || '50%') :
           'Fill Rate: ' + (data.operational_status.current_fill_rate || '85%')}
        </span>
        <span className="text-blue-400 font-medium text-[10px] hover:underline">
          Click Node →
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-blue-500 !border-slate-900 !w-2.5 !h-2.5"
      />
    </div>
  );
};
