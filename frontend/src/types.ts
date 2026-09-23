export interface Supplier {
  supplier_id: string;
  name: string;
  location: string;
  tier: string;
  primary_category: string;
  tenure_months: number;
  reliability_score: number;
  defect_rate: number;
  on_time_rate_30d: number;
  delay_freq_90d: number;
  fulfillment_consistency: number;
}

export interface InventoryItem {
  item_id: string;
  item_name: string;
  category: string;
  preferred_suppliers: string[];
  warehouse_id: string;
  current_stock: number;
  daily_demand: number;
  safety_buffer: number;
  unit_cost_usd: number;
  revenue_per_unit_usd: number;
  days_of_supply: number;
  safety_buffer_erosion: number;
}

export interface Shipment {
  shipment_id: string;
  supplier_id: string;
  supplier_name: string;
  item_id: string;
  item_name: string;
  units_shipped: number;
  value_usd: number;
  origin_port: string;
  dest_port: string;
  mode: 'Sea' | 'Air' | 'Rail' | 'Road';
  carrier: string;
  carrier_score: number;
  distance_km: number;
  transit_hops: number;
  port_dwell_hours: number;
  port_congestion_index: number;
  weather_severity_origin: number;
  weather_severity_dest: number;
  route_weather_index: number;
  order_date: string;
  promised_delivery_date: string;
  delay_days: number;
  is_delayed: number;
  delay_probability: number;
  delay_risk_score: number;
  risk_level: 'High' | 'Medium' | 'Low';
  headline_explanation: string;
  dominant_domain: string;
  is_mitigated?: boolean;
  status: string;
}

export interface GraphNodeData {
  id: string;
  node_type: 'Supplier' | 'Port Hub' | 'Transit Corridor' | 'Warehouse';
  label: string;
  sublabel: string;
  risk_score: number;
  status_color: 'emerald' | 'amber' | 'rose';
  operational_status: Record<string, string>;
  business_impact: {
    affected_suppliers: string[];
    exposed_skus: string[];
    exposed_sku_count: number;
    projected_revenue_at_risk_usd: number;
    projected_revenue_at_risk_inr: string;
  };
}

export interface ShapAttribution {
  feature: string;
  label: string;
  shap_value: number;
  impact_percent: number;
  is_risk_amplifier: boolean;
}

export interface RecommendationOption {
  option_id: string;
  is_recommended: boolean;
  strategy_title: string;
  domain_tag: string;
  description: string;
  cost_delta_usd: number;
  cost_delta_inr: number;
  execution_time_hours: number;
  stockout_risk_before: number;
  stockout_risk_after: number;
  risk_reduction_pct: number;
  lead_time_saved_days: number;
  roi_ratio: string;
  action_steps: string[];
}

export interface ShipmentRiskDetail {
  shipment: Shipment;
  is_mitigated: boolean;
  risk_summary: {
    delay_probability: number;
    delay_risk_score: number;
    risk_level: string;
    dominant_domain: string;
    headline_explanation: string;
  };
  shap_breakdown: {
    domain_breakdown: Record<string, number>;
    top_risk_drivers: ShapAttribution[];
    top_protective_factors: ShapAttribution[];
    all_attributions: ShapAttribution[];
    base_margin_value: number;
  };
  live_weather_telemetry: {
    origin: any;
    destination: any;
  };
  prescriptive_recommendations: RecommendationOption[];
}

export interface SimulationResult {
  simulation_meta: {
    target_type: string;
    target_id: string;
    target_name: string;
    horizon_days: number;
    iterations: number;
  };
  comparison: {
    baseline_stockout_prob: number;
    stress_stockout_prob: number;
    prob_delta: number;
    inventory_depletion_percent: number;
    production_delay_days: number;
    projected_revenue_at_risk: number;
  };
  trajectories: Array<{
    day: string;
    baseline_inventory: number;
    stress_inventory: number;
  }>;
  affected_skus: Array<{
    item_id: string;
    item_name: string;
    initial_stock: number;
    baseline_stockout_prob: number;
    stress_stockout_prob: number;
    depletion_percent: number;
    production_delay_days: number;
    potential_revenue_loss: number;
  }>;
  affected_active_shipments: number;
}

export interface KpiData {
  supply_chain_health: {
    score: number;
    label: string;
    status_color: 'emerald' | 'amber' | 'rose';
    active_shipments: number;
    critical_alerts: number;
  };
  kpi_strip: {
    model_accuracy: string;
    model_f1: string;
    roc_auc: string;
    avg_lead_time_gained: string;
    estimated_loss_avoided_usd: string;
    estimated_loss_avoided_inr: string;
    alerts_resolved_vs_missed: string;
  };
}

export interface Scenario {
  id: string;
  title: string;
  domain: string;
  description: string;
  target_type: string;
  target_id: string;
  default_horizon: number;
  affected_hubs: string[];
}

