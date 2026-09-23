import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { SimulationResult } from '../types';
import { Zap, Play, AlertOctagon, TrendingDown, Clock, DollarSign, ShieldAlert } from 'lucide-react';

interface WhatIfSimulatorProps {
  onRunSimulation: (params: { target_type: string; target_id: string; horizon_days: number; iterations: number }) => Promise<SimulationResult>;
  initialTarget?: { type: string; id: string } | null;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  onRunSimulation,
  initialTarget
}) => {
  const [targetType, setTargetType] = useState<string>(initialTarget?.type || 'port');
  const [targetId, setTargetId] = useState<string>(initialTarget?.id || 'Shanghai');
  const [horizonDays, setHorizonDays] = useState<number>(7);
  const [iterations, setIterations] = useState<number>(1000);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  // Sync if initialTarget prop changes
  React.useEffect(() => {
    if (initialTarget) {
      setTargetType(initialTarget.type);
      setTargetId(initialTarget.id);
    }
  }, [initialTarget]);

  const handleSimulate = async () => {
    setIsLoading(true);
    try {
      const res = await onRunSimulation({
        target_type: targetType,
        target_id: targetId,
        horizon_days: horizonDays,
        iterations: iterations
      });
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Run on mount once for instantaneous demo experience
  React.useEffect(() => {
    handleSimulate();
  }, []);

  const comparison = result?.comparison;

  return (
    <div className="rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800/80 p-5 shadow-xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-500/30 text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                What-If Disruption Stress Simulator
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold uppercase">
                NumPy Monte Carlo (1,000 Iterations)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Model severe vendor outages or port halts over a configurable horizon
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="my-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
        
        {/* Outage Type */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Outage Scenario Target
          </label>
          <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
            <button
              onClick={() => {
                setTargetType('port');
                setTargetId('Shanghai');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                targetType === 'port' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Port Halt
            </button>
            <button
              onClick={() => {
                setTargetType('supplier');
                setTargetId('SUP-101');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                targetType === 'supplier' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Vendor Outage
            </button>
          </div>
        </div>

        {/* Target Entity Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            {targetType === 'port' ? 'Select Port Terminal' : 'Select Supplier'}
          </label>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500"
          >
            {targetType === 'port' ? (
              <>
                <option value="Shanghai">Port of Shanghai (China)</option>
                <option value="Singapore">Port of Singapore (Asia Transshipment)</option>
                <option value="Rotterdam">Port of Rotterdam (Europe)</option>
                <option value="Los Angeles">Port of Los Angeles (US West Coast)</option>
                <option value="Hamburg">Port of Hamburg (Germany)</option>
                <option value="Busan">Port of Busan (South Korea)</option>
              </>
            ) : (
              <>
                <option value="SUP-101">Apex Microtronics Ltd (Shenzhen)</option>
                <option value="SUP-102">Pacific Precision Castings (Busan)</option>
                <option value="SUP-103">Formosa Wafer Fab (Kaohsiung)</option>
                <option value="SUP-107">SinoPoly Battery Tech (Shanghai)</option>
                <option value="SUP-104">Bavaria Auto Sensors (Hamburg)</option>
              </>
            )}
          </select>
        </div>

        {/* Horizon Slider */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            <span>Horizon:</span>
            <span className="text-blue-400 font-bold">{horizonDays} Days</span>
          </div>
          <input
            type="range"
            min="3"
            max="30"
            value={horizonDays}
            onChange={(e) => setHorizonDays(Number(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>

        {/* Iterations Selector */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Monte Carlo Trials
          </label>
          <select
            value={iterations}
            onChange={(e) => setIterations(Number(e.target.value))}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="500">500 Iterations</option>
            <option value="1000">1,000 Iterations (Standard)</option>
            <option value="2000">2,000 Iterations (High Precision)</option>
          </select>
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={handleSimulate}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-md shadow-amber-950/40 transition-all border border-amber-400/40 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Simulating...' : 'Run Simulation'}</span>
          </button>
        </div>

      </div>

      {/* Before / After Comparison Card */}
      {comparison && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          
          {/* Card 1: Stockout Probability Before vs After */}
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-rose-500/30">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
              <span>Stockout Probability</span>
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            </div>
            
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xs line-through text-slate-500">
                {comparison.baseline_stockout_prob}%
              </span>
              <span className="text-xl font-extrabold text-rose-400">
                → {comparison.stress_stockout_prob}%
              </span>
            </div>
            <p className="text-[11px] text-rose-300/80 font-medium mt-0.5">
              +{comparison.prob_delta}% Outage Risk Spike
            </p>
          </div>

          {/* Card 2: Inventory Depletion */}
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-amber-500/30">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
              <span>Inventory Depletion</span>
              <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-extrabold text-amber-300 mt-1">
              -{comparison.inventory_depletion_percent}%
            </div>
            <p className="text-[11px] text-amber-300/80 font-medium mt-0.5">
              Safety buffer completely eroded
            </p>
          </div>

          {/* Card 3: Production Delay Days */}
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-blue-500/30">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
              <span>Downstream Line Delay</span>
              <Clock className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-extrabold text-blue-300 mt-1">
              +{comparison.production_delay_days} Days
            </div>
            <p className="text-[11px] text-blue-300/80 font-medium mt-0.5">
              Assembly stoppage forecast
            </p>
          </div>

          {/* Card 4: Revenue at Risk */}
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-violet-500/30">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
              <span>Projected Loss at Risk</span>
              <DollarSign className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div className="text-xl font-extrabold text-violet-300 mt-1">
              ${comparison.projected_revenue_at_risk.toLocaleString()}
            </div>
            <p className="text-[11px] text-violet-300/80 font-medium mt-0.5">
              ₹{roundToLakhs(comparison.projected_revenue_at_risk)} Lakhs Impact
            </p>
          </div>

        </div>
      )}

      {/* Trajectory Depletion Curve Chart */}
      {result && result.trajectories && (
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
            <span>Stochastic Inventory Trajectory: Normal Replenishment vs Halted Outage</span>
            <span className="text-[10px] text-slate-500">Units in Central Depot</span>
          </div>

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={result.trajectories} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-xl bg-slate-950/95 border border-slate-700 p-2.5 shadow-xl text-xs">
                          <div className="font-bold text-white mb-1">{label}</div>
                          <div className="text-emerald-400">
                            Baseline Inventory: {payload[0].value} units
                          </div>
                          <div className="text-rose-400 font-semibold">
                            Disrupted Inventory: {payload[1]?.value} units
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                <Line
                  type="monotone"
                  dataKey="baseline_inventory"
                  name="Baseline Scheduled Replenishment"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="stress_inventory"
                  name="Simulated Outage (Zero Replenishment)"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
};

function roundToLakhs(usd: number): string {
  const inr = usd * 83.5;
  return (inr / 100000).toFixed(1);
}
