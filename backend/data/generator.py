"""
SupplyGuard - Synthetic Supply Chain Data Generator
Generates realistic multi-tier datasets for Suppliers, Shipments, and Inventory,
fused with real weather indices from Open-Meteo.
"""

import json
import math
import random
import os
from datetime import datetime, timedelta
from backend.data.weather_client import fetch_weather_for_location, PORT_COORDINATES

# Seed for reproducible realistic demo distributions
random.seed(42)

SUPPLIER_CATALOG = [
    {"supplier_id": "SUP-101", "name": "Apex Microtronics Ltd", "location": "Shenzhen", "tenure_months": 48, "tier": "Tier-1", "primary_category": "Semiconductors"},
    {"supplier_id": "SUP-102", "name": "Pacific Precision Castings", "location": "Busan", "tenure_months": 72, "tier": "Tier-1", "primary_category": "Precision Metal Castings"},
    {"supplier_id": "SUP-103", "name": "Formosa Wafer Fabrication", "location": "Kaohsiung", "tenure_months": 36, "tier": "Tier-1", "primary_category": "Silicon Wafers"},
    {"supplier_id": "SUP-104", "name": "Bavaria Auto Sensors GmbH", "location": "Hamburg", "tenure_months": 96, "tier": "Tier-1", "primary_category": "Optical Sensors"},
    {"supplier_id": "SUP-105", "name": "Nippon Magnetics Corp", "location": "Tokyo", "tenure_months": 60, "tier": "Tier-1", "primary_category": "Rare Earth Magnets"},
    {"supplier_id": "SUP-106", "name": "Bharat Dynamic Polymers", "location": "Mumbai (Nhava Sheva)", "tenure_months": 30, "tier": "Tier-2", "primary_category": "Industrial Polymers"},
    {"supplier_id": "SUP-107", "name": "SinoPoly Battery Tech", "location": "Shanghai", "tenure_months": 24, "tier": "Tier-2", "primary_category": "Lithium Cells"},
    {"supplier_id": "SUP-108", "name": "EuroTrans Circuit Systems", "location": "Antwerp", "tenure_months": 54, "tier": "Tier-1", "primary_category": "Power Distribution PCB"},
    {"supplier_id": "SUP-109", "name": "Mekong Harness Assembly", "location": "Singapore", "tenure_months": 18, "tier": "Tier-2", "primary_category": "Wire Harnesses"},
    {"supplier_id": "SUP-110", "name": "CalWest Micro Assembly", "location": "Los Angeles", "tenure_months": 84, "tier": "Tier-1", "primary_category": "Sub-Assembly Modules"},
    {"supplier_id": "SUP-111", "name": "Gulf Marine Lubricants", "location": "Dubai (Jebel Ali)", "tenure_months": 40, "tier": "Tier-2", "primary_category": "Specialty Coolants"},
    {"supplier_id": "SUP-112", "name": "Rhine Hydraulic Systems", "location": "Rotterdam", "tenure_months": 66, "tier": "Tier-1", "primary_category": "Hydraulic Actuators"}
]

WAREHOUSES = [
    {"warehouse_id": "WH-CENTRAL-US", "name": "North America Fulfillment Hub", "location": "Chicago", "coords": {"lat": 41.8781, "lon": -87.6298}},
    {"warehouse_id": "WH-EUROPE-WEST", "name": "Frankfurt Logistics Center", "location": "Frankfurt", "coords": {"lat": 50.1109, "lon": 8.6821}},
    {"warehouse_id": "WH-ASIA-PAC", "name": "Jurong High-Tech Depot", "location": "Singapore", "coords": {"lat": 1.3329, "lon": 103.7436}}
]

PORTS = list(PORT_COORDINATES.keys())
CARRIERS = [
    {"name": "Maersk Ocean Line", "base_score": 0.88, "modes": ["Sea"]},
    {"name": "Mediterranean Shipping Co (MSC)", "base_score": 0.84, "modes": ["Sea"]},
    {"name": "CMA CGM Logistics", "base_score": 0.86, "modes": ["Sea"]},
    {"name": "DHL Global Forwarding", "base_score": 0.94, "modes": ["Air", "Road"]},
    {"name": "FedEx Express Trade", "base_score": 0.95, "modes": ["Air"]},
    {"name": "Eurasia Rail Cargo", "base_score": 0.82, "modes": ["Rail"]},
    {"name": "DB Schenker Multimodal", "base_score": 0.89, "modes": ["Rail", "Road", "Sea"]}
]


def generate_synthetic_data(num_historical_shipments: int = 400, num_active_shipments: int = 45):
    """
    Generates synthetic dataset adhering to real-world statistical correlations:
    - Suppliers table
    - Inventory table with safety buffers & demand
    - Shipments table (both historical for training, and active for live monitoring)
    """
    # 1. Suppliers Table
    suppliers = []
    for s in SUPPLIER_CATALOG:
        # Reliability score between 0.62 and 0.98
        reliability = round(random.uniform(0.70, 0.96) if s["tier"] == "Tier-1" else random.uniform(0.62, 0.88), 3)
        # Defect rate between 0.4% and 4.8%
        defect_rate = round(random.uniform(0.005, 0.025) if reliability > 0.85 else random.uniform(0.022, 0.055), 4)
        on_time_rate_30d = round(max(0.40, min(0.99, reliability + random.uniform(-0.08, 0.04))), 3)
        delay_freq_90d = round(max(0.02, min(0.60, (1.0 - reliability) * 1.3 + random.uniform(-0.05, 0.08))), 3)
        fulfillment_consistency = round(random.uniform(0.75, 0.98), 2)
        annual_volume_usd = random.randint(15, 120) * 100_000

        suppliers.append({
            "supplier_id": s["supplier_id"],
            "name": s["name"],
            "location": s["location"],
            "tier": s["tier"],
            "primary_category": s["primary_category"],
            "tenure_months": s["tenure_months"],
            "reliability_score": reliability,
            "defect_rate": defect_rate,
            "on_time_rate_30d": on_time_rate_30d,
            "delay_freq_90d": delay_freq_90d,
            "fulfillment_consistency": fulfillment_consistency,
            "annual_volume_usd": annual_volume_usd
        })

    suppliers_by_id = {s["supplier_id"]: s for s in suppliers}

    # 2. Inventory / SKU Table
    skus = [
        {"item_id": "SKU-MCU-32", "name": "32-Bit Microcontroller Units", "category": "Semiconductors", "cost": 42.5, "rev": 180.0, "sup": ["SUP-101", "SUP-103"], "demand": 120, "buffer": 800, "stock": 950},
        {"item_id": "SKU-SENS-LIDAR", "name": "Solid-State LiDAR Optical Array", "category": "Sensors", "cost": 310.0, "rev": 1250.0, "sup": ["SUP-104", "SUP-105"], "demand": 35, "buffer": 240, "stock": 260},
        {"item_id": "SKU-BATT-LFP", "name": "Lithium Iron Phosphate Pack (48V)", "category": "Energy Storage", "cost": 650.0, "rev": 2200.0, "sup": ["SUP-107"], "demand": 50, "buffer": 300, "stock": 280},
        {"item_id": "SKU-CAST-ALU", "name": "Chassis Subframe Die-Cast Aluminum", "category": "Structural Castings", "cost": 185.0, "rev": 750.0, "sup": ["SUP-102"], "demand": 60, "buffer": 400, "stock": 420},
        {"item_id": "SKU-PCB-PWR", "name": "Multi-layer High-Current Power PCB", "category": "Electronics", "cost": 55.0, "rev": 210.0, "sup": ["SUP-108", "SUP-101"], "demand": 140, "buffer": 950, "stock": 780},
        {"item_id": "SKU-ACT-HYDR", "name": "Precision Servo-Hydraulic Valve", "category": "Actuators", "cost": 420.0, "rev": 1600.0, "sup": ["SUP-112"], "demand": 25, "buffer": 180, "stock": 190},
        {"item_id": "SKU-HARN-HI", "name": "Automotive Grade Heavy Wire Harness", "category": "Interconnect", "cost": 75.0, "rev": 300.0, "sup": ["SUP-109"], "demand": 90, "buffer": 600, "stock": 510},
        {"item_id": "SKU-POLY-ENG", "name": "High-Temp Fluoropolymer Sealant (kg)", "category": "Raw Materials", "cost": 28.0, "rev": 95.0, "sup": ["SUP-106"], "demand": 220, "buffer": 1400, "stock": 1150},
        {"item_id": "SKU-COOL-SYN", "name": "Synthetic Dielectric Coolant (Drum)", "category": "Fluids", "cost": 340.0, "rev": 980.0, "sup": ["SUP-111"], "demand": 18, "buffer": 120, "stock": 95},
        {"item_id": "SKU-MAG-NEO", "name": "Neodymium Permanent Magnet Grade N52", "category": "Rare Earth", "cost": 160.0, "rev": 620.0, "sup": ["SUP-105", "SUP-103"], "demand": 80, "buffer": 550, "stock": 410}
    ]

    inventory = []
    for sku in skus:
        stock = sku["stock"]
        daily_d = sku["demand"]
        buffer = sku["buffer"]
        days_of_supply = round(stock / max(1, daily_d), 1)
        buffer_erosion = round(max(0.0, (buffer - stock) / buffer) if stock < buffer else 0.0, 3)

        inventory.append({
            "item_id": sku["item_id"],
            "item_name": sku["name"],
            "category": sku["category"],
            "preferred_suppliers": sku["sup"],
            "warehouse_id": "WH-CENTRAL-US" if random.random() < 0.6 else "WH-EUROPE-WEST",
            "current_stock": stock,
            "daily_demand": daily_d,
            "daily_demand_std": round(daily_d * 0.18, 1),
            "safety_buffer": buffer,
            "unit_cost_usd": sku["cost"],
            "revenue_per_unit_usd": sku["rev"],
            "days_of_supply": days_of_supply,
            "safety_buffer_erosion": buffer_erosion,
            "lead_time_days": random.randint(8, 24)
        })

    # 3. Shipments Table (Historical + Active)
    shipments = []
    base_date = datetime.now() - timedelta(days=120)

    # Pre-fetch weather dictionary for real hub coordinates
    hub_weather = {}
    for port in PORTS:
        hub_weather[port] = fetch_weather_for_location(port)

    dest_ports = ["Los Angeles", "Rotterdam", "Hamburg", "Singapore"]

    total_shipments = num_historical_shipments + num_active_shipments
    for i in range(total_shipments):
        is_active = (i >= num_historical_shipments)
        shipment_id = f"SHP-2026-{'ACT' if is_active else 'HIST'}-{i+1:04d}"

        # Assign supplier
        sup = random.choice(suppliers)
        origin_port = sup["location"]
        if origin_port not in PORTS:
            origin_port = random.choice(PORTS)

        # Dest port different from origin
        possible_dests = [p for p in dest_ports if p != origin_port]
        dest_port = random.choice(possible_dests)

        # Mode selection
        mode_weights = [0.65, 0.18, 0.12, 0.05]  # Sea, Air, Rail, Road
        mode = random.choices(["Sea", "Air", "Rail", "Road"], weights=mode_weights)[0]

        # Carrier
        valid_carriers = [c for c in CARRIERS if mode in c["modes"]]
        carrier_obj = random.choice(valid_carriers) if valid_carriers else CARRIERS[0]
        carrier_name = carrier_obj["name"]
        carrier_score = round(carrier_obj["base_score"] + random.uniform(-0.08, 0.06), 3)

        # Item payload
        matching_skus = [sku for sku in inventory if sup["supplier_id"] in sku["preferred_suppliers"]]
        selected_sku = random.choice(matching_skus) if matching_skus else inventory[0]
        units_shipped = random.randint(200, 2500)
        value_usd = round(units_shipped * selected_sku["unit_cost_usd"], 2)

        # Distance & transit hops
        distance_km = random.randint(1800, 14500) if mode in ["Sea", "Air"] else random.randint(450, 4200)
        transit_hops = 1 if mode == "Air" else (random.randint(1, 4) if mode == "Sea" else random.randint(1, 3))

        # Port dwell & congestion indices (0-100)
        port_congestion = round(random.uniform(20.0, 85.0), 1)
        port_dwell_hours = round(24.0 + (port_congestion / 100.0) * 110.0 + random.uniform(-8.0, 15.0), 1)

        # Weather Risk features from Open-Meteo
        origin_w = hub_weather.get(origin_port, {"weather_severity_index": 25.0, "precipitation_mm": 5.0, "max_wind_kmh": 20.0})
        dest_w = hub_weather.get(dest_port, {"weather_severity_index": 20.0, "precipitation_mm": 2.0, "max_wind_kmh": 18.0})

        # Add temporal or route variations
        weather_severity_origin = round(min(100.0, max(5.0, origin_w["weather_severity_index"] + random.uniform(-10.0, 15.0))), 1)
        weather_severity_dest = round(min(100.0, max(5.0, dest_w["weather_severity_index"] + random.uniform(-10.0, 15.0))), 1)
        route_weather_index = round((weather_severity_origin * 0.45 + weather_severity_dest * 0.35 + random.uniform(5.0, 30.0) * 0.20), 1)

        # Dates
        if is_active:
            days_ago = random.randint(1, 14)
            order_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
            lead_days = 15 if mode == "Sea" else (5 if mode == "Air" else 10)
            promised_date = (datetime.now() + timedelta(days=lead_days - days_ago)).strftime("%Y-%m-%d")
            actual_delivery_date = None
        else:
            days_ago = random.randint(15, 110)
            order_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
            lead_days = 18 if mode == "Sea" else (6 if mode == "Air" else 12)
            promised_dt = datetime.now() - timedelta(days=days_ago - lead_days)
            promised_date = promised_dt.strftime("%Y-%m-%d")

        # Ground truth delay calculation for training & simulation
        # Fusing: Supplier reliability (Domain 1), Transit/Logistics (Domain 2), Weather/Geo (Domain 3)
        sup_risk_term = (1.0 - sup["reliability_score"]) * 2.8 + sup["defect_rate"] * 10.0
        logistics_risk_term = (port_congestion / 100.0) * 1.8 + (transit_hops * 0.25) + (1.0 - carrier_score) * 2.2
        weather_risk_term = (route_weather_index / 100.0) * 2.1

        latent_risk_score = 0.38 * sup_risk_term + 0.35 * logistics_risk_term + 0.27 * weather_risk_term
        delay_prob = 1.0 / (1.0 + math.exp(-2.6 * (latent_risk_score - 1.15)))

        if not is_active:
            # Deterministic/stochastic outcome for historical
            is_delayed = 1 if (random.random() < delay_prob) else 0
            if is_delayed:
                delay_days = round(max(1.0, random.gauss(4.5 + latent_risk_score * 2.5, 2.0)), 1)
                actual_delivery_date = (datetime.strptime(promised_date, "%Y-%m-%d") + timedelta(days=int(delay_days))).strftime("%Y-%m-%d")
                status = "Delivered (Delayed)"
            else:
                delay_days = 0.0
                actual_delivery_date = promised_date
                status = "Delivered (On-Time)"
        else:
            # Active in-transit shipment
            is_delayed = 1 if delay_prob > 0.50 else 0
            delay_days = round(max(0.0, delay_prob * 8.0 + random.uniform(-1.0, 1.5)), 1) if is_delayed else 0.0
            status = "In Transit - Elevated Risk" if delay_prob > 0.65 else ("In Transit - Moderate Risk" if delay_prob > 0.38 else "In Transit - Normal")

        shipments.append({
            "shipment_id": shipment_id,
            "supplier_id": sup["supplier_id"],
            "supplier_name": sup["name"],
            "item_id": selected_sku["item_id"],
            "item_name": selected_sku["item_name"],
            "units_shipped": units_shipped,
            "value_usd": value_usd,
            "origin_port": origin_port,
            "dest_port": dest_port,
            "mode": mode,
            "carrier": carrier_name,
            "carrier_score": carrier_score,
            "distance_km": distance_km,
            "transit_hops": transit_hops,
            "port_dwell_hours": port_dwell_hours,
            "port_congestion_index": port_congestion,
            "weather_severity_origin": weather_severity_origin,
            "weather_severity_dest": weather_severity_dest,
            "route_weather_index": route_weather_index,
            "order_date": order_date,
            "promised_delivery_date": promised_date,
            "actual_delivery_date": actual_delivery_date,
            "delay_days": delay_days,
            "is_delayed": is_delayed,
            "delay_probability_ground": round(delay_prob, 3),
            "status": status,
            "is_active": is_active
        })

    return {
        "suppliers": suppliers,
        "inventory": inventory,
        "shipments": shipments
    }


def save_dataset_to_disk(target_dir: str):
    """Generates and writes data tables as JSON artifacts."""
    os.makedirs(target_dir, exist_ok=True)
    dataset = generate_synthetic_data()

    with open(os.path.join(target_dir, "suppliers.json"), "w", encoding="utf-8") as f:
        json.dump(dataset["suppliers"], f, indent=2)

    with open(os.path.join(target_dir, "inventory.json"), "w", encoding="utf-8") as f:
        json.dump(dataset["inventory"], f, indent=2)

    with open(os.path.join(target_dir, "shipments.json"), "w", encoding="utf-8") as f:
        json.dump(dataset["shipments"], f, indent=2)

    print(f"Data generation complete: {len(dataset['suppliers'])} suppliers, {len(dataset['inventory'])} SKUs, {len(dataset['shipments'])} shipments.")
    return dataset


if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "storage")
    save_dataset_to_disk(out_dir)
