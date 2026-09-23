import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { KpiStrip } from './components/KpiStrip';
import { ScenarioBar } from './components/ScenarioBar';
import { LiveAlertTicker } from './components/LiveAlertTicker';
import { ExecutiveBriefModal } from './components/ExecutiveBriefModal';
import { DigitalTwinMap } from './components/DigitalTwinMap';
import { NodeDetailPanel } from './components/NodeDetailPanel';
import { ShapDecompositionPanel } from './components/ShapDecompositionPanel';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { PrescriptionPanel } from './components/PrescriptionPanel';
import { ShipmentsDrawer } from './components/ShipmentsDrawer';
import {
  KpiData,
  Shipment,
  GraphNodeData,
  ShipmentRiskDetail,
  SimulationResult,
  Scenario
} from './types';
import { Node, Edge } from '@xyflow/react';
import { Activity, ShieldAlert, Sparkles, Zap, Network, ArrowRight } from 'lucide-react';

// Resilient API base URL — reads VITE_API_URL env var (set in Vercel dashboard)
// Falls back to localhost for local dev
const ENV_API = (import.meta as any).env?.VITE_API_URL as string | undefined;
let activeApiBase: string = ENV_API?.replace(/\/$/, '') || 'http://127.0.0.1:8000';

async function resilientFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  try {
    const res = await fetch(`${activeApiBase}${endpoint}`, options);
    if (res.ok) return res;
    throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    // In local dev: if port 8000 fails, fallback to 8001
    if (activeApiBase.includes('127.0.0.1')) {
      const altBase = activeApiBase.includes(':8000') ? 'http://127.0.0.1:8001' : 'http://127.0.0.1:8000';
      activeApiBase = altBase;
      return await fetch(`${altBase}${endpoint}`, options);
    }
    throw err;
  }
}

export function App() {
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [graphNodes, setGraphNodes] = useState<Node<GraphNodeData>[]>([]);
  const [graphEdges, setGraphEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [riskDetail, setRiskDetail] = useState<ShipmentRiskDetail | null>(null);
  const [isRiskDetailLoading, setIsRiskDetailLoading] = useState<boolean>(false);

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('nominal-ops');
  const [isScenarioApplying, setIsScenarioApplying] = useState<boolean>(false);

  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [isExecutiveBriefOpen, setIsExecutiveBriefOpen] = useState<boolean>(false);

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isShipmentsDrawerOpen, setIsShipmentsDrawerOpen] = useState<boolean>(false);
  const [simulatorTarget, setSimulatorTarget] = useState<{ type: string; id: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active view tab: 'pipeline' (SHAP + Prescription) or 'simulator' (Monte Carlo)
  const [activeTab, setActiveTab] = useState<'pipeline' | 'simulator'>('pipeline');

  // Load Dashboard Data
  const loadDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Fetch KPIs
      const kpisRes = await resilientFetch('/kpis');
      if (kpisRes.ok) {
        const kpis = await kpisRes.json();
        setKpiData(kpis);
      }

      // 2. Fetch Graph
      const graphRes = await resilientFetch('/graph');
      if (graphRes.ok) {
        const graph = await graphRes.json();
        setGraphNodes(graph.nodes);
        setGraphEdges(graph.edges);

        if (graph.nodes.length > 0 && !selectedNode) {
          const highRiskNode = graph.nodes.find((n: any) => n.data?.risk_score > 60) || graph.nodes[0];
          setSelectedNode(highRiskNode.data);
        }
      }

      // 3. Fetch Shipments
      const shipmentsRes = await resilientFetch('/shipments?limit=50&active_only=true');
      if (shipmentsRes.ok) {
        const data = await shipmentsRes.json();
        setShipments(data);
        if (data.length > 0 && !selectedShipment) {
          setSelectedShipment(data[0]);
          loadShipmentRisk(data[0].shipment_id);
        }
      }

      // 4. Fetch Scenarios
      const scenariosRes = await resilientFetch('/scenarios');
      if (scenariosRes.ok) {
        const scData = await scenariosRes.json();
        setScenarios(scData);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedNode, selectedShipment]);

  // Fetch SHAP detail and Prescriptive Recommendations
  const loadShipmentRisk = async (shipmentId: string) => {
    setIsRiskDetailLoading(true);
    try {
      const res = await resilientFetch(`/shipments/${shipmentId}/risk`);
      if (res.ok) {
        const data = await res.json();
        setRiskDetail(data);
      }
    } catch (err) {
      console.error('Failed to load shipment risk:', err);
    } finally {
      setIsRiskDetailLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleSelectShipment = (shp: Shipment) => {
    setSelectedShipment(shp);
    loadShipmentRisk(shp.shipment_id);
  };

  const handleSelectNode = (nodeData: GraphNodeData) => {
    setSelectedNode(nodeData);
  };

  const handleSimulateOutageFromNode = (type: string, id: string) => {
    setSimulatorTarget({ type, id });
    setActiveTab('simulator');
    const el = document.getElementById('lower-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRunSimulation = async (params: { target_type: string; target_id: string; horizon_days: number; iterations: number }) => {
    const res = await resilientFetch('/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Simulation failed');
    return await res.json();
  };

  const handleApplyMitigation = async (shipmentId: string, optionId: string) => {
    const res = await resilientFetch('/apply-mitigation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipment_id: shipmentId, option_id: optionId })
    });
    if (res.ok) {
      setToastMessage(`Mitigation authorized! TMS dispatch confirmed for ${shipmentId}. Disruption probability de-escalated.`);
      loadShipmentRisk(shipmentId);
      const kpisRes = await resilientFetch('/kpis');
      if (kpisRes.ok) {
        setKpiData(await kpisRes.json());
      }
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const handleApplyScenario = async (scenarioId: string) => {
    setIsScenarioApplying(true);
    try {
      const res = await resilientFetch('/scenarios/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: scenarioId })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveScenarioId(scenarioId);
        setToastMessage(`Crisis Scenario Applied: ${data.scenario?.title}. Telemetry feeds updated.`);
        await loadDashboardData();
        if (selectedShipment) {
          loadShipmentRisk(selectedShipment.shipment_id);
        }
        setTimeout(() => setToastMessage(null), 5000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScenarioApplying(false);
    }
  };

  const handleResetMitigations = async () => {
    try {
      const res = await resilientFetch('/reset-mitigations', { method: 'POST' });
      if (res.ok) {
        setActiveScenarioId('nominal-ops');
        setToastMessage('All simulation shockwaves and mitigations reset to nominal baseline.');
        await loadDashboardData();
        if (selectedShipment) {
          loadShipmentRisk(selectedShipment.shipment_id);
        }
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      
      {/* Top Header */}
      <Header
        kpiData={kpiData}
        onRefresh={loadDashboardData}
        isRefreshing={isRefreshing}
        onOpenSimulator={() => {
          setActiveTab('simulator');
          const el = document.getElementById('lower-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenShipmentsDrawer={() => setIsShipmentsDrawerOpen(true)}
        currency={currency}
        onToggleCurrency={() => setCurrency((c) => (c === 'USD' ? 'INR' : 'USD'))}
        onOpenExecutiveBrief={() => setIsExecutiveBriefOpen(true)}
      />

      {/* Main Command Center Container */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-6 py-4 space-y-4">
        
        {/* Live Alert Ticker */}
        <LiveAlertTicker />

        {/* Crisis Scenario Presets Bar */}
        <ScenarioBar
          scenarios={scenarios}
          activeScenarioId={activeScenarioId}
          onApplyScenario={handleApplyScenario}
          onResetMitigations={handleResetMitigations}
          isApplying={isScenarioApplying}
        />

        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xl animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-emerald-400 hover:text-white text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Executive KPI Summary Strip */}
        <KpiStrip kpiData={kpiData} currency={currency} />

        {/* Top Half: 1. Digital Twin Map (React Flow) + 2. Node Detail Panel */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          
          {/* Panel 1: Digital Twin DAG Map (8 cols) */}
          <div className="lg:col-span-8 flex flex-col">
            <DigitalTwinMap
              initialNodes={graphNodes}
              initialEdges={graphEdges}
              selectedNodeId={selectedNode?.id || null}
              onSelectNode={handleSelectNode}
            />
          </div>

          {/* Panel 2: Node Detail Panel (4 cols) */}
          <div className="lg:col-span-4 flex flex-col">
            <NodeDetailPanel
              nodeData={selectedNode}
              onSimulateOutage={handleSimulateOutageFromNode}
            />
          </div>

        </section>

        {/* Middle Navigation Strip: Active Shipment Ticker & Mode Switcher */}
        <div id="lower-section" className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
          
          {/* Current Shipment Context Pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Inspected Shipment:
              </span>
              <button
                onClick={() => setIsShipmentsDrawerOpen(true)}
                className="px-3 py-1 rounded-lg bg-blue-950/60 border border-blue-500/40 text-blue-300 text-xs font-bold hover:bg-blue-900/60 transition-all flex items-center gap-1.5"
              >
                <span>{selectedShipment?.shipment_id || 'Select Shipment'}</span>
                <span className="text-[10px] text-blue-400">({selectedShipment?.carrier || ''})</span>
                <ArrowRight className="w-3 h-3 text-blue-400" />
              </button>
            </div>

            {selectedShipment && (
              <span className="hidden md:inline text-xs text-slate-300 font-medium">
                {selectedShipment.item_name} • {selectedShipment.origin_port} → {selectedShipment.dest_port}
              </span>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'pipeline'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>SHAP Explain & Prescriptions</span>
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'simulator'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-200" />
              <span>What-If Stress Simulator</span>
            </button>
          </div>

        </div>

        {/* Lower Half: Panel 3 (SHAP) + Panel 5 (Prescriptions) OR Panel 4 (What-If Simulator) */}
        {activeTab === 'pipeline' ? (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Panel 3: SHAP Decomposition (6 cols) */}
            <div className="lg:col-span-6">
              <ShapDecompositionPanel
                riskDetail={riskDetail}
                isLoading={isRiskDetailLoading}
              />
            </div>

            {/* Panel 5: Prescriptive Mitigation Panel (6 cols) */}
            <div className="lg:col-span-6">
              <PrescriptionPanel
                recommendations={riskDetail?.prescriptive_recommendations || []}
                currentShipment={selectedShipment}
                onApplyMitigation={handleApplyMitigation}
                isMitigated={riskDetail?.is_mitigated}
              />
            </div>

          </section>
        ) : (
          /* Panel 4: What-If Stress Simulator */
          <section>
            <WhatIfSimulator
              onRunSimulation={handleRunSimulation}
              initialTarget={simulatorTarget}
            />
          </section>
        )}

      </main>

      {/* Slide-out Shipments Drawer */}
      <ShipmentsDrawer
        isOpen={isShipmentsDrawerOpen}
        onClose={() => setIsShipmentsDrawerOpen(false)}
        shipments={shipments}
        selectedShipmentId={selectedShipment?.shipment_id || null}
        onSelectShipment={handleSelectShipment}
      />

      {/* Executive Brief Audit Modal */}
      <ExecutiveBriefModal
        isOpen={isExecutiveBriefOpen}
        onClose={() => setIsExecutiveBriefOpen(false)}
        kpiData={kpiData}
        riskDetail={riskDetail}
        selectedNode={selectedNode}
        currency={currency}
      />

      {/* Footer */}
      <footer className="mt-8 border-t border-slate-900 bg-slate-950/60 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>SupplyGuard</strong> — Decision-Intelligence Platform for Supply Chain Resiliency • Datathon 2K26
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>FastAPI: :8000</span>
            <span>•</span>
            <span>XGBoost + Native TreeSHAP</span>
            <span>•</span>
            <span>Open-Meteo Live API</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
