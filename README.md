# SupplyGuard — Decision-Intelligence Platform for Supply Chain Resiliency
**Datathon 2K26 Hackathon MVP**

SupplyGuard is an enterprise-grade decision-intelligence platform that shifts supply chain management from reactive damage control to proactive disruption mitigation. Instead of alerting operations after cargo is stranded, SupplyGuard continuously monitors multi-modal risk signals, predicts disruption probability days ahead of time, decomposes root causes via SHAP, runs high-throughput Monte Carlo outage stress tests, and provides quantified prescriptive mitigation playbooks.

---

## 5-Stage Core Pipeline: Detect → Predict → Explain → Simulate → Recommend

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  1. DETECT   │ ──> │  2. PREDICT  │ ──> │  3. EXPLAIN  │ ──> │ 4. SIMULATE  │ ──> │ 5. RECOMMEND│
│ Multi-domain │     │ Unified      │     │ Native       │     │ NumPy Monte  │     │ Quantified   │
│ Telemetry &  │     │ XGBoost      │     │ TreeSHAP     │     │ Carlo Outage │     │ Trade-Off    │
│ Open-Meteo   │     │ Delay Model  │     │ Attribution  │     │ Stress Test  │     │ Actions      │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

1. **Detect**: Ingests multi-modal signals across 5 risk domains (Supplier Reliability, Logistics Congestion, Live Open-Meteo Weather Severity, Inventory Buffer Erosion, Demand Volatility).
2. **Predict**: A unified gradient-boosted decision tree (`XGBClassifier`) predicts shipment disruption probability and delay severity.
3. **Explain**: Decomposes every prediction using exact TreeSHAP values into ranked root drivers (e.g. *Delivery Reliability Deficit +18%, Weather Severity +12%, Port Congestion +9%*). No black boxes.
4. **Simulate**: A vectorized NumPy Monte Carlo engine simulates port halts and vendor outages over a configurable horizon (3–30 days, 1,000 iterations), projecting inventory drawdown curves and stockout probabilities (e.g., 16% baseline → 82% post-stress).
5. **Recommend**: Prescriptive mitigation engine conditions 2+ ranked mitigation protocols (Option A Recommended vs. Option B Fast Track) with freight cost deltas (\$ and ₹), execution hours, and simulated risk drops (e.g. 81% → 28%).

---

## Tech Stack & Architecture

- **Backend API**: Python 3.13, FastAPI, Uvicorn, Pydantic
- **ML & Explainability**: XGBoost (native TreeSHAP engine with `pred_contribs=True`)
- **Stochastic Simulation**: NumPy vectorized Monte Carlo simulator
- **Weather Integration**: Free Open-Meteo Live Forecast API (hourly/daily precipitation, wind speed, WMO weathercodes) with fallback resilience
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons
- **Interactive Graph**: React Flow (`@xyflow/react`) for DAG Digital Twin topology
- **Data Visualizations**: Recharts (SHAP horizontal attribution bars, stochastic inventory depletion curves)

---

## Project Structure

```
supplyguard/
├── backend/
│   ├── api/
│   │   └── main.py                 # FastAPI endpoints (/health, /kpis, /shipments, /graph, /simulate)
│   ├── data/
│   │   ├── generator.py            # Synthetic dataset generator (Suppliers, Shipments, Inventory)
│   │   ├── weather_client.py       # Open-Meteo API live weather integration & severity index
│   │   ├── dataset.py              # 19-dimensional feature engineering pipeline
│   │   └── storage/                # Persisted JSON tables (suppliers, inventory, shipments)
│   ├── model/
│   │   ├── train.py                # XGBoost training pipeline, metrics & cross-validation
│   │   ├── explain.py              # TreeSHAP feature attribution & dominant domain extractor
│   │   └── storage/                # Serialized XGBoost booster & training metrics
│   ├── simulation/
│   │   └── monte_carlo.py          # NumPy vectorized Monte Carlo disruption simulator
│   └── recommendation/
│       └── engine.py               # Prescriptive mitigation generator (trade-offs in $ & ₹)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx          # Health meter gauge (0-100), pipeline status, quick triggers
│   │   │   ├── KpiStrip.tsx        # Model accuracy/F1, lead time gained, loss avoided, resolution rate
│   │   │   ├── DigitalTwinMap.tsx  # React Flow DAG with custom risk-halo nodes
│   │   │   ├── CustomSupplyNode.tsx# Custom node component with real-time risk halo
│   │   │   ├── NodeDetailPanel.tsx # Operational status & downstream business impact drill-down
│   │   │   ├── ShapDecompositionPanel.tsx # Recharts attribution bar chart & weather radar
│   │   │   ├── WhatIfSimulator.tsx # Interactive Monte Carlo stress tester & trajectory chart
│   │   │   ├── PrescriptionPanel.tsx      # Ranked mitigation options & TMS dispatch action
│   │   │   └── ShipmentsDrawer.tsx        # Filterable active shipments control drawer
│   │   ├── types.ts                # TypeScript domain models
│   │   ├── App.tsx                 # Main layout coordinator
│   │   └── main.jsx / index.css    # Entrypoint & executive dark glassmorphism theme
│   └── package.json
└── README.md
```

---

## Synthetic Data Assumptions (For Jury Q&A)

1. **Suppliers (12 Global Tier-1 & Tier-2 Vendors)**:
   - Reliability scores sampled from beta distributions centered at 0.70–0.96 for Tier-1, 0.62–0.88 for Tier-2.
   - Defect rates between 0.5% and 5.5%, inversely correlated with tenure and supplier maturity.
   - Locations mapped to major manufacturing clusters: Shenzhen, Busan, Kaohsiung, Hamburg, Tokyo, Mumbai (Nhava Sheva), Shanghai, Antwerp, Singapore, Rotterdam.

2. **Shipments (445 Historical & 45 Active In-Transit)**:
   - Latent disruption risk is generated via a non-linear fusion of:
     $$\text{Risk} = 0.38 \cdot \text{SupplierRisk} + 0.35 \cdot \text{LogisticsRisk} + 0.27 \cdot \text{WeatherRisk}$$
   - Ocean freight exhibits higher berth dwell variance (24–130h) than Air cargo (<18h).
   - High winds (>45 km/h) and heavy precipitation (>30mm) directly amplify transit dwell and vessel speed degradation.

3. **Inventory & SKUs (10 Critical Automotive/Tech Assemblies)**:
   - Stochastic daily demand modeled as Gaussian $\mathcal{N}(\mu, \sigma^2)$ where $\sigma = 0.18\mu$.
   - Safety buffer erosion triggers alerts when active stock dips below buffer thresholds.
   - Financial exposure calculated using real unit bills of materials (\$28–\$650/unit) and finished goods value (\$95–\$2,200/unit).

4. **Weather Integration (Open-Meteo)**:
   - Queries live WMO weather codes, max wind speeds (km/h), and precipitation (mm) at origin/dest/transshipment coordinates.
   - Standardized Weather Severity Index (0–100) dynamically feeds the geographic risk domain with zero API keys required.

---

## Production Deployment Story (For Jury Q&A)

In a live enterprise enterprise deployment:

1. **Continuous Rolling Retraining**:
   - Model retrains nightly on rolling 90-day closed shipment records via an automated cron job or Airflow DAG.
   - Drift detection monitors feature distributions (PSI/KS tests); if model F1 drops below 0.85, shadow models are automatically trained and evaluated before hot-swapping.

2. **Enterprise Integration (ERP / TMS / WMS via Webhooks)**:
   - SupplyGuard exposes bi-directional webhooks with SAP S/4HANA, Oracle Transportation Management (OTM), and Blue Yonder.
   - When shipment status updates (`GATE_IN`, `VESSEL_BERTHED`, `CUSTOMS_HOLD`), webhook payloads trigger instantaneous inference and SHAP decomposition in `<15ms`.

3. **Prescriptive Action Automation**:
   - Authorized mitigation actions (e.g. "Reroute 35% to Supplier B" or "Convert to Air Freight") generate signed EDI-850 / EDI-204 transactions dispatched directly to the TMS broker.

4. **Incident Alerting**:
   - Critical alerts (>65% disruption risk) push actionable rich cards into dedicated Slack / Microsoft Teams channels and PagerDuty escalations for logistics coordinators.

---

## Quick Start Guide

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 2. Start Backend API
```bash
# From project root:
python -m uvicorn backend.api.main:app --host 127.0.0.1 --port 8000
```
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/health`

### 3. Start Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
- Access web application: `http://127.0.0.1:5173`
