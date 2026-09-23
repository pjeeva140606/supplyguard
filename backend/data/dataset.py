"""
SupplyGuard - Multi-Domain Feature Pipeline & Dataset Preprocessing
Transforms raw supplier, logistics, weather, inventory, and demand signals
into unified numerical feature vectors for model training and inference.
"""

import numpy as np

# Unified feature names for ML training and TreeSHAP attribution
FEATURE_NAMES = [
    # Domain 1: Supplier Risk Signals
    "supplier_reliability_score",
    "supplier_defect_rate",
    "supplier_on_time_30d",
    "supplier_delay_freq_90d",
    "supplier_fulfillment_consistency",
    "supplier_tenure_months",

    # Domain 2: Transit & Logistics Risk Signals
    "port_congestion_index",
    "port_dwell_hours",
    "transit_hops",
    "transit_distance_norm",
    "carrier_performance_score",
    "mode_is_sea",
    "mode_is_air",
    "mode_is_rail",

    # Domain 3: Weather & Geographic Risk Signals
    "origin_weather_severity",
    "dest_weather_severity",
    "route_weather_index",

    # Domain 4: Inventory Vulnerability
    "inventory_buffer_erosion",

    # Domain 5: Demand Fluctuation
    "demand_volatility_index"
]

FEATURE_DISPLAY_LABELS = {
    "supplier_reliability_score": "Supplier On-Time Reliability",
    "supplier_defect_rate": "Supplier Historical Defect Rate",
    "supplier_on_time_30d": "Rolling 30-Day Fulfillment Deficit",
    "supplier_delay_freq_90d": "90-Day Disruption Frequency",
    "supplier_fulfillment_consistency": "Fulfillment Variance",
    "supplier_tenure_months": "Supplier Tenure & Contract Maturity",

    "port_congestion_index": "Port Berth Congestion Index",
    "port_dwell_hours": "Terminal Dwell Hours Delay",
    "transit_hops": "Intermodal Transfer Hops",
    "transit_distance_norm": "Route Distance Exposure",
    "carrier_performance_score": "Carrier Schedule Reliability",
    "mode_is_sea": "Maritime Ocean Transit Vulnerability",
    "mode_is_air": "Air Freight Expedited Mode",
    "mode_is_rail": "Intercontinental Rail Channel",

    "origin_weather_severity": "Origin Severe Weather / Gale Signal",
    "dest_weather_severity": "Destination Storm / Yard Flood Risk",
    "route_weather_index": "En-Route Marine Weather Severity",

    "inventory_buffer_erosion": "Safety Buffer Erosion Rate",
    "demand_volatility_index": "Downstream Demand Surge Anomaly"
}


def extract_features_from_shipment(shipment: dict, supplier: dict = None, inventory_item: dict = None) -> list[float]:
    """
    Constructs a single 19-dimensional feature vector for a shipment.
    """
    # 1. Supplier features
    sup_rel = supplier.get("reliability_score", 0.85) if supplier else 0.85
    sup_defect = supplier.get("defect_rate", 0.015) if supplier else 0.015
    sup_on_time = supplier.get("on_time_rate_30d", 0.88) if supplier else 0.88
    sup_delay_90 = supplier.get("delay_freq_90d", 0.12) if supplier else 0.12
    sup_cons = supplier.get("fulfillment_consistency", 0.90) if supplier else 0.90
    sup_tenure = supplier.get("tenure_months", 36) if supplier else 36

    # 2. Logistics features
    port_cong = float(shipment.get("port_congestion_index", 45.0))
    dwell = float(shipment.get("port_dwell_hours", 48.0))
    hops = float(shipment.get("transit_hops", 2))
    dist = float(shipment.get("distance_km", 6000)) / 15000.0  # normalize
    carrier_sc = float(shipment.get("carrier_score", 0.88))
    mode = shipment.get("mode", "Sea")
    is_sea = 1.0 if mode == "Sea" else 0.0
    is_air = 1.0 if mode == "Air" else 0.0
    is_rail = 1.0 if mode == "Rail" else 0.0

    # 3. Weather features
    orig_w = float(shipment.get("weather_severity_origin", 20.0))
    dest_w = float(shipment.get("weather_severity_dest", 18.0))
    route_w = float(shipment.get("route_weather_index", 22.0))

    # 4. Inventory Risk
    buffer_erosion = float(inventory_item.get("safety_buffer_erosion", 0.15)) if inventory_item else 0.15

    # 5. Demand Risk
    # Spikes vs baseline
    demand_volatility = 0.18  # default baseline volatility 18%

    return [
        sup_rel,
        sup_defect,
        sup_on_time,
        sup_delay_90,
        sup_cons,
        float(sup_tenure) / 100.0,
        port_cong / 100.0,
        dwell / 150.0,
        hops / 5.0,
        dist,
        carrier_sc,
        is_sea,
        is_air,
        is_rail,
        orig_w / 100.0,
        dest_w / 100.0,
        route_w / 100.0,
        buffer_erosion,
        demand_volatility
    ]


def build_training_matrix(dataset: dict):
    """
    Builds numpy matrix X, y for all historical shipments.
    """
    suppliers_by_id = {s["supplier_id"]: s for s in dataset["suppliers"]}
    inv_by_id = {i["item_id"]: i for i in dataset["inventory"]}

    X_list = []
    y_list = []

    for shp in dataset["shipments"]:
        if shp.get("is_active"):
            continue  # Reserve active shipments for live evaluation
        sup = suppliers_by_id.get(shp["supplier_id"])
        inv = inv_by_id.get(shp.get("item_id"))
        feat = extract_features_from_shipment(shp, sup, inv)
        X_list.append(feat)
        y_list.append(shp["is_delayed"])

    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list, dtype=np.int32)
    return X, y
