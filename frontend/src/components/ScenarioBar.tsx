import React from 'react';
import { Scenario } from '../types';
import { AlertTriangle, CloudLightning, Container, Cpu, RotateCcw, Flame } from 'lucide-react';

interface ScenarioBarProps {
  scenarios: Scenario[];
  activeScenarioId: string;
  onApplyScenario: (scenarioId: string) => Promise<void>;
  onResetMitigations: () => Promise<void>;
  isApplying: boolean;
}

export const ScenarioBar: React.FC<ScenarioBarProps> = ({
  scenarios,
  activeScenarioId,
  onApplyScenario,
  onResetMitigations,
  isApplying
}) => {
  const getIcon = (id: string) => {
    switch (id) {
      case 'typhoon-east-asia':
        return <CloudLightning className="w-3.5 h-3.5 text-sky-400" />;
      case 'port-la-slowdown':
        return <Container className="w-3.5 h-3.5 text-amber-400" />;
      case 'foundry-halt':
        return <Cpu className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
      
      {/* Label */}
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <Flame className="w-4 h-4" />
        </span>
        <div>
          <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
            <span>Crisis Simulator Presets</span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
              Live Stress Testing
            </span>
          </span>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Trigger real-time multi-modal shockwaves across the 5 risk domains
          </p>
        </div>
      </div>

      {/* Preset Scenario Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {scenarios.map((sc) => {
          const isActive = activeScenarioId === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => onApplyScenario(sc.id)}
              disabled={isApplying}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border disabled:opacity-50 ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-400/80 shadow-md shadow-blue-900/40 ring-1 ring-blue-400'
                  : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              {getIcon(sc.id)}
              <span>{sc.title.split(' (')[0]}</span>
            </button>
          );
        })}

        {/* Reset Button */}
        <button
          onClick={onResetMitigations}
          title="Reset applied mitigations to initial baseline"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Reset</span>
        </button>
      </div>

    </div>
  );
};
