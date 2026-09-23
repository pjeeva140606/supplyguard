import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine
} from 'recharts';
import { ShipmentRiskDetail } from '../types';
import { Brain, CloudRain, Wind, Thermometer, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ShapDecompositionPanelProps {
  riskDetail: ShipmentRiskDetail | null;
  isLoading: boolean;
}

export const ShapDecompositionPanel: React.FC<ShapDecompositionPanelProps> = ({
  riskDetail,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="h-[420px] rounded-2xl bg-slate-900/80 border border-slate-800/80 p-6 flex flex-col items-center justify-center text-slate-400">
        <Brain className="w-8 h-8 text-blue-400 mb-2 animate-spin" />
        <p className="text-xs font-semibold text-slate-300">Computing TreeSHAP Marginal Values...</p>
      </div>
    );
  }

  if (!riskDetail) {
    return (
      <div className="h-[420px] rounded-2xl bg-slate-900/80 border border-slate-800/80 p-6 flex flex-col items-center justify-center text-slate-400">
        <Brain className="w-8 h-8 text-slate-600 mb-2" />
        <h4 className="text-sm font-semibold text-slate-300">No Shipment Selected</h4>
        <p className="text-xs text-slate-500 mt-1">Select an active shipment to view its SHAP feature attribution breakdown.</p>
      </div>
    );
  }

  const { shipment, risk_summary, shap_breakdown, live_weather_telemetry } = riskDetail;

  // Prepare chart data: combine top risk drivers and protective factors
  const chartData = [
    ...shap_breakdown.top_risk_drivers.slice(0, 5).map((d) => ({
      name: d.label,
      impact: d.impact_percent,
      shap: d.shap_value,
      isAmplifier: true
    })),
    ...shap_breakdown.top_protective_factors.slice(0, 2).map((d) => ({
      name: d.label,
      impact: d.impact_percent,
      shap: d.shap_value,
      isAmplifier: false
    }))
  ];

  return (
    <div className="rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800/80 p-5 shadow-xl">
      
      {/* Header with Dominant Domain */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-950/80 border border-violet-500/30 text-violet-400">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                SHAP Risk Factor Attribution
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold uppercase">
                TreeExplainer Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Shipment {shipment.shipment_id} • {shipment.supplier_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Dominant Driver: </span>
            <span className="font-bold text-rose-400">
              {risk_summary.dominant_domain}
            </span>
          </div>

          <div className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200">
            Delay Risk: <span className="text-rose-400">{risk_summary.delay_risk_score}%</span>
          </div>
        </div>
      </div>

      {/* Headline Explainability Callout Banner */}
      <div className="my-3.5 p-3 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="text-slate-300 font-semibold">Root Cause Attribution: </span>
          <span className="text-slate-200 font-medium leading-relaxed">
            {risk_summary.headline_explanation}
          </span>
        </div>
      </div>

      {/* Main Bar Chart: SHAP Attribution */}
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
          >
            <XAxis
              type="number"
              unit="%"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              width={140}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="rounded-xl bg-slate-950/95 border border-slate-700 p-2.5 shadow-xl text-xs">
                      <div className="font-bold text-white mb-1">{item.name}</div>
                      <div className="text-slate-300">
                        Attribution Impact: <span className={item.impact >= 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                          {item.impact >= 0 ? `+${item.impact}%` : `${item.impact}%`}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Marginal SHAP: {item.shap} log-odds
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine x={0} stroke="#475569" strokeDasharray="3 3" />
            <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.impact >= 0 ? '#f43f5e' : '#10b981'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Open-Meteo Live Telemetry Strip */}
      {live_weather_telemetry && (
        <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
              <CloudRain className="w-3.5 h-3.5 text-blue-400" />
              Open-Meteo Live Radar:
            </span>
            <span className="text-slate-300">
              {live_weather_telemetry.origin?.location || shipment.origin_port}:{' '}
              <strong className="text-white">{live_weather_telemetry.origin?.condition}</strong> (Wind: {live_weather_telemetry.origin?.max_wind_kmh} km/h, Rain: {live_weather_telemetry.origin?.precipitation_mm}mm)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Dest ({shipment.dest_port}):</span>
            <span className="text-slate-200 font-medium">
              {live_weather_telemetry.destination?.condition} • Severity Index {live_weather_telemetry.destination?.weather_severity_index}/100
            </span>
          </div>
        </div>
      )}

    </div>
  );
};
