"""
SupplyGuard - Monte Carlo Stress Testing & Disruption Simulator
Runs high-throughput stochastic simulations with NumPy modeling vendor outages,
port halts, daily demand uncertainty, buffer drawdown, and revenue at risk.
"""

import numpy as np


class MonteCarloStressSimulator:
    def __init__(self, inventory_catalog: list[dict], shipments_catalog: list[dict], suppliers_catalog: list[dict]):
        self.inventory = {item["item_id"]: item for item in inventory_catalog}
        self.shipments = shipments_catalog
        self.suppliers = {sup["supplier_id"]: sup for sup in suppliers_catalog}

    def run_stress_test(
        self,
        target_type: str,  # 'supplier' or 'port'
        target_id: str,    # e.g. 'SUP-101' or 'Shanghai'
        horizon_days: int = 7,
        iterations: int = 1000
    ) -> dict:
        """
        Simulates supply chain dynamics across N iterations for both Baseline and Disruption states.
        Returns before/after comparison metrics, daily trajectory curves, and SKU exposure.
        """
        np.random.seed(42)

        # 1. Identify exposed SKUs and shipments
        affected_skus = []
        affected_shipments = []
        revenue_at_risk = 0.0

        for sku_id, sku in self.inventory.items():
            is_affected = False
            if target_type == "supplier" and target_id in sku.get("preferred_suppliers", []):
                is_affected = True
            elif target_type == "port":
                # Check if any preferred supplier is located at the port
                for sup_id in sku.get("preferred_suppliers", []):
                    sup = self.suppliers.get(sup_id)
                    if sup and sup.get("location", "").lower() == target_id.lower():
                        is_affected = True
                        break

            if is_affected:
                affected_skus.append(sku)

        # If no specific SKU mapped, pick primary high-volume SKUs
        if not affected_skus:
            affected_skus = list(self.inventory.values())[:3]

        for shp in self.shipments:
            if not shp.get("is_active"):
                continue
            if target_type == "supplier" and shp.get("supplier_id") == target_id:
                affected_shipments.append(shp)
                revenue_at_risk += float(shp.get("value_usd", 0.0))
            elif target_type == "port" and (
                shp.get("origin_port", "").lower() == target_id.lower() or
                shp.get("dest_port", "").lower() == target_id.lower()
            ):
                affected_shipments.append(shp)
                revenue_at_risk += float(shp.get("value_usd", 0.0))

        # 2. Vectorized Monte Carlo across affected SKUs
        sku_results = []
        total_baseline_stockouts = 0
        total_stress_stockouts = 0
        total_trials = len(affected_skus) * iterations

        # Trajectory tracking across horizon days
        daily_baseline_trajectory = np.zeros(horizon_days, dtype=np.float64)
        daily_stress_trajectory = np.zeros(horizon_days, dtype=np.float64)

        for sku in affected_skus:
            initial_stock = float(sku["current_stock"])
            daily_mean = float(sku["daily_demand"])
            daily_std = float(sku.get("daily_demand_std", daily_mean * 0.18))
            safety_buffer = float(sku["safety_buffer"])
            unit_rev = float(sku.get("revenue_per_unit_usd", 250.0))

            # Simulate daily demand matrix: shape (iterations, horizon_days)
            demand_matrix = np.random.normal(daily_mean, daily_std, size=(iterations, horizon_days))
            demand_matrix = np.maximum(0.0, demand_matrix)

            # Cumulative demand
            cum_demand = np.cumsum(demand_matrix, axis=1)

            # --- Baseline Case ---
            # Baseline replenishment arrives normally with 15% random delay variance
            replenishment_base = np.zeros((iterations, horizon_days))
            # Normal scheduled arrivals on day 3 or 5
            arrival_day = min(horizon_days - 1, max(1, horizon_days // 2))
            replenishment_units = daily_mean * horizon_days * 0.85
            # Some shipments might be delayed slightly
            normal_arrival_prob = 0.85
            arrivals_mask = np.random.rand(iterations) < normal_arrival_prob
            replenishment_base[arrivals_mask, arrival_day:] = replenishment_units

            stock_baseline = initial_stock - cum_demand + replenishment_base
            stockout_baseline_mask = np.any(stock_baseline <= 0, axis=1)
            baseline_stockout_prob = float(np.mean(stockout_baseline_mask))

            # --- Stress Case (Halt / Outage) ---
            # All scheduled replenishments frozen or delayed past horizon
            stock_stress = initial_stock - cum_demand
            stockout_stress_mask = np.any(stock_stress <= 0, axis=1)
            stress_stockout_prob = float(np.mean(stockout_stress_mask))

            # Depletion calculation
            final_stock_stress = np.maximum(0.0, stock_stress[:, -1])
            depletion_pct = float(np.mean((initial_stock - final_stock_stress) / max(1.0, initial_stock)) * 100.0)

            # Production delay estimation (days stock was 0)
            zero_days = np.sum(stock_stress <= 0, axis=1)
            avg_production_delay_days = float(np.mean(zero_days))

            total_baseline_stockouts += int(np.sum(stockout_baseline_mask))
            total_stress_stockouts += int(np.sum(stockout_stress_mask))

            daily_baseline_trajectory += np.mean(stock_baseline, axis=0)
            daily_stress_trajectory += np.mean(stock_stress, axis=0)

            sku_results.append({
                "item_id": sku["item_id"],
                "item_name": sku["item_name"],
                "initial_stock": initial_stock,
                "baseline_stockout_prob": round(baseline_stockout_prob * 100.0, 1),
                "stress_stockout_prob": round(stress_stockout_prob * 100.0, 1),
                "depletion_percent": round(depletion_pct, 1),
                "production_delay_days": round(avg_production_delay_days, 1),
                "potential_revenue_loss": round(avg_production_delay_days * daily_mean * unit_rev, 2)
            })

        # Normalize trajectories
        num_skus = max(1, len(affected_skus))
        daily_baseline_trajectory /= num_skus
        daily_stress_trajectory /= num_skus

        chart_trajectories = []
        for day in range(horizon_days):
            chart_trajectories.append({
                "day": f"Day {day + 1}",
                "baseline_inventory": round(float(daily_baseline_trajectory[day]), 1),
                "stress_inventory": round(float(daily_stress_trajectory[day]), 1)
            })

        overall_baseline_prob = round((total_baseline_stockouts / max(1, total_trials)) * 100.0, 1)
        overall_stress_prob = round((total_stress_stockouts / max(1, total_trials)) * 100.0, 1)

        # Average depletion and production delay
        avg_depletion = round(float(np.mean([s["depletion_percent"] for s in sku_results])), 1)
        avg_delay_days = round(float(np.mean([s["production_delay_days"] for s in sku_results])), 1)

        # If revenue at risk from active shipments was 0, calculate based on exposed SKU values
        if revenue_at_risk == 0.0:
            revenue_at_risk = sum(s["potential_revenue_loss"] for s in sku_results)

        target_name = target_id
        if target_type == "supplier" and target_id in self.suppliers:
            target_name = self.suppliers[target_id]["name"]

        return {
            "simulation_meta": {
                "target_type": target_type,
                "target_id": target_id,
                "target_name": target_name,
                "horizon_days": horizon_days,
                "iterations": iterations
            },
            "comparison": {
                "baseline_stockout_prob": overall_baseline_prob,
                "stress_stockout_prob": overall_stress_prob,
                "prob_delta": round(overall_stress_prob - overall_baseline_prob, 1),
                "inventory_depletion_percent": avg_depletion,
                "production_delay_days": avg_delay_days,
                "projected_revenue_at_risk": round(revenue_at_risk, 2)
            },
            "trajectories": chart_trajectories,
            "affected_skus": sku_results,
            "affected_active_shipments": len(affected_shipments)
        }
