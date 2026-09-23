"""
SupplyGuard - SHAP Explainability Engine
Decomposes XGBoost risk scores into exact TreeSHAP attributions,
ranks top contributing positive and negative factors, and identifies the dominant root cause.
"""

import numpy as np
import xgboost as xgb
from backend.data.dataset import (
    extract_features_from_shipment,
    FEATURE_NAMES,
    FEATURE_DISPLAY_LABELS
)
from backend.model.train import load_trained_model


class ShapExplainerEngine:
    def __init__(self, booster: xgb.Booster = None):
        if booster is None:
            self.booster = load_trained_model()
        else:
            self.booster = booster

    def explain_shipment(self, shipment: dict, supplier: dict = None, inventory_item: dict = None) -> dict:
        """
        Computes TreeSHAP feature contributions and generates human-interpretable root causes.
        """
        feats = extract_features_from_shipment(shipment, supplier, inventory_item)
        X_mat = np.array([feats], dtype=np.float32)
        dmatrix = xgb.DMatrix(X_mat, feature_names=FEATURE_NAMES)

        # Predict probability
        pred_prob = float(self.booster.predict(dmatrix)[0])

        # Native TreeSHAP computation: output shape (1, num_features + 1 bias)
        # Returns exact Shapley values in margin (log-odds) space
        contribs = self.booster.predict(dmatrix, pred_contribs=True)[0]
        feature_contribs = contribs[:-1]
        base_value = float(contribs[-1])

        # Decompose positive risk drivers (factors pushing delay risk UP)
        # and negative protective factors (factors keeping delay risk DOWN)
        attribution_items = []
        total_abs_contrib = float(np.sum(np.abs(feature_contribs))) + 1e-6

        # Grouping by the 3 core predictive domains
        domain_impacts = {
            "Supplier Risk": 0.0,
            "Logistics & Transit Risk": 0.0,
            "Weather & Geographic Risk": 0.0,
            "Inventory & Demand Signals": 0.0
        }

        for i, val in enumerate(feature_contribs):
            feat_name = FEATURE_NAMES[i]
            val_float = float(val)
            pct_contribution = round((val_float / total_abs_contrib) * 100.0, 1)

            # Assign to domain
            if "supplier" in feat_name:
                domain_impacts["Supplier Risk"] += val_float
            elif any(k in feat_name for k in ["port", "transit", "carrier", "mode"]):
                domain_impacts["Logistics & Transit Risk"] += val_float
            elif "weather" in feat_name:
                domain_impacts["Weather & Geographic Risk"] += val_float
            else:
                domain_impacts["Inventory & Demand Signals"] += val_float

            attribution_items.append({
                "feature": feat_name,
                "label": FEATURE_DISPLAY_LABELS.get(feat_name, feat_name),
                "shap_value": round(val_float, 4),
                "impact_percent": pct_contribution,
                "is_risk_amplifier": val_float > 0
            })

        # Rank factors by magnitude of positive disruption contribution
        risk_amplifiers = sorted(
            [it for it in attribution_items if it["shap_value"] > 0],
            key=lambda x: x["shap_value"],
            reverse=True
        )

        protective_factors = sorted(
            [it for it in attribution_items if it["shap_value"] <= 0],
            key=lambda x: x["shap_value"]
        )

        # Determine dominant risk domain
        dominant_domain = max(domain_impacts.items(), key=lambda x: x[1])[0]

        # Top 3 headline callouts (e.g. "Delivery Reliability Deficit +18%, Weather Severity +12%, Port Congestion +9%")
        top_callouts = []
        for it in risk_amplifiers[:3]:
            sign = "+" if it["impact_percent"] >= 0 else ""
            top_callouts.append(f"{it['label']} {sign}{it['impact_percent']}%")

        if not top_callouts:
            top_callouts = ["High Historical Reliability", "Favorable Weather En-Route", "Low Berth Dwell Time"]

        headline_explanation = ", ".join(top_callouts)

        return {
            "delay_probability": round(pred_prob, 3),
            "delay_risk_score": int(round(pred_prob * 100)),
            "base_margin_value": round(base_value, 4),
            "headline_explanation": headline_explanation,
            "dominant_domain": dominant_domain,
            "domain_breakdown": {
                k: round(float(v), 3) for k, v in domain_impacts.items()
            },
            "top_risk_drivers": risk_amplifiers[:6],
            "top_protective_factors": protective_factors[:3],
            "all_attributions": attribution_items
        }
