import React from 'react';
import { Radio, AlertCircle, ArrowUpRight } from 'lucide-react';

export const LiveAlertTicker: React.FC = () => {
  const alerts = [
    { time: '11:42 AM', tag: 'Open-Meteo', text: 'Live Radar: Gale Force 8 wind swell detected near Port of Shanghai coordinates', color: 'text-sky-400' },
    { time: '11:35 AM', tag: 'XGBoost ML', text: 'Delay probability spiked +28% for Trans-Pacific Sea Lane (Container Dwell 74h)', color: 'text-rose-400' },
    { time: '11:20 AM', tag: 'TMS Webhook', text: 'Automated EDI-850 contingency reroute prepared for Pacific Precision Castings', color: 'text-emerald-400' },
    { time: '11:05 AM', tag: 'Digital Twin', text: 'Port of Los Angeles terminal dwell exceeds 80 hours threshold; rail shunt prioritized', color: 'text-amber-400' },
  ];

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs overflow-hidden shadow-inner">
      <div className="flex items-center gap-1.5 text-blue-400 font-bold shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
        <span className="uppercase tracking-wider text-[10px] font-extrabold">Live Stream</span>
      </div>

      <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-6 whitespace-nowrap text-slate-300">
        {alerts.map((al, i) => (
          <div key={i} className="flex items-center gap-1.5 shrink-0 text-[11px]">
            <span className="text-slate-500 font-mono">[{al.time}]</span>
            <span className={`font-semibold ${al.color}`}>[{al.tag}]:</span>
            <span className="text-slate-300">{al.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
