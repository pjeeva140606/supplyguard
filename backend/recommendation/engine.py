"""
SupplyGuard - Prescriptive Mitigation Recommendation Engine
Generates quantified, ranked mitigation strategies conditioned on the dominant
risk driver (Weather, Supplier, or Logistics) with cost, time, and risk-reduction trade-offs.
"""

# USD to INR approximate conversion for multi-currency executive view (Datathon 2K26 brief)
USD_TO_INR = 83.5


class PrescriptiveEngine:
    def __init__(self, suppliers_catalog: list[dict], inventory_catalog: list[dict]):
        self.suppliers = {s["supplier_id"]: s for s in suppliers_catalog}
        self.inventory = {i["item_id"]: i for i in inventory_catalog}

    def generate_recommendations(
        self,
        shipment: dict,
        shap_explanation: dict,
        baseline_risk_prob: float = None
    ) -> list[dict]:
        """
        Generates 2+ ranked mitigation choices conditioned on the dominant root-cause domain.
        """
        dominant = shap_explanation.get("dominant_domain", "Logistics & Transit Risk")
        current_prob = baseline_risk_prob or shap_explanation.get("delay_probability", 0.72)
        initial_pct = int(round(current_prob * 100))

        # Safe fallback if risk is already minimal
        if initial_pct < 35:
            return [{
                "option_id": "OPT-STD-MONITOR",
                "is_recommended": True,
                "strategy_title": "Standard Active Telemetry Monitoring",
                "domain_tag": "Nominal Operations",
                "description": "Shipment parameters within safe confidence tolerances. Maintain automated IoT milestone pings.",
                "cost_delta_usd": 0,
                "cost_delta_inr": 0,
                "execution_time_hours": 1,
                "stockout_risk_before": initial_pct,
                "stockout_risk_after": max(5, initial_pct - 5),
                "risk_reduction_pct": 5,
                "lead_time_saved_days": 0.5,
                "roi_ratio": "N/A (Standard Ops)",
                "action_steps": [
                    "Verify container gate-in confirmation",
                    "Maintain continuous marine weather radar tracking"
                ]
            }]

        recommendations = []

        if "Supplier" in dominant:
            # Supplier-driven risk: Quality/defect or vendor delay
            # Find backup supplier
            target_item_id = shipment.get("item_id")
            sku = self.inventory.get(target_item_id)
            current_sup_id = shipment.get("supplier_id")

            # Alternate candidate
            backup_sup_id = "SUP-102"
            if sku and len(sku.get("preferred_suppliers", [])) > 1:
                for sup_id in sku["preferred_suppliers"]:
                    if sup_id != current_sup_id:
                        backup_sup_id = sup_id
                        break
            backup_sup = self.suppliers.get(backup_sup_id, {"name": "Pacific Precision Castings", "location": "Busan"})

            # Option A (Recommended): 35% Procurement Split Reroute
            cost_a_usd = 540.0
            cost_a_inr = round(cost_a_usd * USD_TO_INR)
            mitigated_a = max(18, int(round(initial_pct * 0.35)))
            recommendations.append({
                "option_id": "OPT-SUP-SPLIT",
                "is_recommended": True,
                "strategy_title": f"Reroute 35% Procurement to {backup_sup['name']}",
                "domain_tag": "Supplier Resiliency",
                "description": f"Trigger contingency purchase order allocating 35% volume to pre-qualified backup ({backup_sup['location']}). Absorbs vendor delay with balanced freight delta.",
                "cost_delta_usd": cost_a_usd,
                "cost_delta_inr": cost_a_inr,
                "execution_time_hours": 12,
                "stockout_risk_before": initial_pct,
                "stockout_risk_after": mitigated_a,
                "risk_reduction_pct": initial_pct - mitigated_a,
                "lead_time_saved_days": 3.8,
                "roi_ratio": "4.2x Cost-to-Loss Avoided",
                "action_steps": [
                    f"Issue EDI-850 purchase order delta to {backup_sup['name']}",
                    "Engage safety buffer drawdown protocol at target distribution hub",
                    "Adjust downstream production schedule buffer by +2 shifts"
                ]
            })

            # Option B (Expedited Outsource / Complete Vendor Flip)
            cost_b_usd = 1650.0
            cost_b_inr = round(cost_b_usd * USD_TO_INR)
            mitigated_b = max(12, int(round(initial_pct * 0.20)))
            recommendations.append({
                "option_id": "OPT-SUP-FLIP",
                "is_recommended": False,
                "strategy_title": f"Full 100% Volume Diversion to {backup_sup['name']} (Priority SLA)",
                "domain_tag": "Rapid Vendor Substitution",
                "description": f"Emergency shift of total shipment volume to {backup_sup['name']} under express fabrication tier. Fastest lead time, premium expediting surcharge.",
                "cost_delta_usd": cost_b_usd,
                "cost_delta_inr": cost_b_inr,
                "execution_time_hours": 6,
                "stockout_risk_before": initial_pct,
                "stockout_risk_after": mitigated_b,
                "risk_reduction_pct": initial_pct - mitigated_b,
                "lead_time_saved_days": 6.2,
                "roi_ratio": "2.8x Immediate Mitigation",
                "action_steps": [
                    "Notify primary vendor of temporary contract force-majeure reallocation",
                    f"Dispatch expedited freight carrier to {backup_sup['location']} dock",
                    "Authorize priority customs pre-clearance"
                ]
            })

        elif "Weather" in dominant:
            # Weather-driven risk: Monsoon / typhoon / storm at sea or port
            cost_a_usd = 720.0
            cost_a_inr = round(cost_a_usd * USD_TO_INR)
            mitigated_a = max(22, int(round(initial_pct * 0.38)))
            recommendations.append({
                "option_id": "OPT-WEA-REROUTE",
                "is_recommended": True,
                "strategy_title": "Dynamic Southern Maritime Bypass Routing",
                "domain_tag": "Weather Avoidance",
                "description": "Instruct carrier to deviate shipment 140 nautical miles south of typhoon corridor, bypassing active gale surge zones.",
                "cost_delta_usd": cost_a_usd,
                "cost_delta_inr": cost_a_inr,
                "execution_time_hours": 8,
                "stockout_risk_before": initial_pct,
                "stockout_risk_after": mitigated_a,
                "risk_reduction_pct": initial_pct - mitigated_a,
                "lead_time_saved_days": 4.1,
                "roi_ratio": "5.6x Fuel Delta Efficiency",
                "action_steps": [
                    "Transmit updated waypoint corridor to vessel operations dispatcher",
                    "Notify port berthing authority of revised ETA window (+14 hours)",
                    "Pre-schedule inland intermodal connection for revised arrival slot"
                ]
            })

            # Option B: Partial Air-Bridge Transfer
            cost_b_usd = 2800.0
            cost_b_inr = round(cost_b_usd * USD_TO_INR)
            mitigated_b = max(10, int(round(initial_pct * 0.16)))
            recommendations.append({
                "option_id": "OPT-WEA-AIRBRIDGE",
                "is_recommended": False,
                "strategy_title": "Intermodal Air-Bridge Conversion for Critical Sub-Batch",
                "domain_tag": "Multimodal Expedited",
                "description": "Offload 25% critical assembly components at nearest intermediate hub and fly via chartered DHL Air cargo.",
                "cost_delta_usd": cost_b_usd,
                "cost_delta_inr": cost_b_inr,
                "execution_time_hours": 14,
                "stockout_risk_before": initial_pct,
                "stockout_risk_after": mitigated_b,
                "risk_reduction_pct": initial_pct - mitigated_b,
                "lead_time_saved_days": 7.5,
                "roi_ratio": "2.1x Production Line Save",
                "action_steps": [
                    "Issue partial customs manifest release for air cargo pallet split",
                    "Secure dedicated cargo space on next available direct freighter",
                    "Arrange tarmac-to-warehouse hotshot delivery van"
                ]
            })

        else:
            # Logistics / Port congestion driven risk
            cost_a_usd = 480.0
            cost_a_inr = round(cost_a_usd * USD_TO_INR)
            mitigated_a = max(24, int(round(initial_pct * 0.34)))
            recommendations.append({
                "option_id": "OPT-LOG-PORTDIVERT",
                "is_recommended": True,
                "strategy_title": "Berth Diversion to Secondary Terminal & Rail Shunt",
                "domain_tag": "Logistics Congestion Relief",
                "description": "Bypass congested main terminal berths and divert container to adjacent off-dock inland rail terminal for rail shuttle.",
                "cost_delta_usd": cost_a_usd,
                "cost_delta_inr": cost_a_inr,
                "execution_time_hours": 16,
                "stockout_risk_before": initial_pct,
                "stockout_risk_after": mitigated_a,
                "risk_reduction_pct": initial_pct - mitigated_a,
                "lead_time_saved_days": 3.2,
                "roi_ratio": "4.8x Demurrage Avoided",
                "action_steps": [
                    "Request terminal diversion EDI code swap with port authority",
                    "Book priority rail slot on express intermodal shuttle",
                    "Alert receiver warehouse dock of railhead delivery"
                ]
            })

            # Option B: Premium Express Truck Drayage
            cost_b_usd = 1250.0
            cost_b_inr = round(cost_b_usd * USD_TO_INR)
            mitigated_b = max(14, int(round(initial_pct * 0.22)))
            recommendations.append({
                "option_id": "OPT-LOG-EXPRESSDRAY",
                "is_recommended": False,
                "strategy_title": "Direct Quay-to-Door Dedicated Team Drayage",
                "domain_tag": "Express Surface Logistics",
                "description": "Deploy dual-driver team drayage truck directly to vessel side upon discharge, bypassing container yard dwell queues.",
                "cost_delta_usd": cost_b_usd,
                "cost_delta_inr": cost_b_inr,
                "execution_time_hours": 4,
                "stockout_risk_before": initial_pct,
                "stockout_risk_after": mitigated_b,
                "risk_reduction_pct": initial_pct - mitigated_b,
                "lead_time_saved_days": 5.0,
                "roi_ratio": "3.1x Downtime Mitigation",
                "action_steps": [
                    "Stage dual-driver tractor outside gate 4 hours prior to vessel discharge",
                    "Activate pre-cleared electronic gate pass for direct vessel-side pickup",
                    "Transmit live GPS telemetry to central control tower"
                ]
            })

        return recommendations
