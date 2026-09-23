"""
SupplyGuard - Core XGBoost Delay Prediction Model Training Pipeline
Trains a unified gradient-boosted decision tree on fused multi-domain features,
evaluates precision, recall, F1, accuracy, and saves the trained booster.
"""

import os
import json
import numpy as np
import xgboost as xgb
from backend.data.generator import generate_synthetic_data, save_dataset_to_disk
from backend.data.dataset import build_training_matrix, FEATURE_NAMES

MODEL_STORAGE_DIR = os.path.join(os.path.dirname(__file__), "storage")


def calculate_classification_metrics(y_true: np.ndarray, y_prob: np.ndarray, threshold: float = 0.5):
    """Computes standard evaluation metrics: Accuracy, Precision, Recall, F1, and AUC."""
    y_pred = (y_prob >= threshold).astype(int)

    tp = int(np.sum((y_true == 1) & (y_pred == 1)))
    fp = int(np.sum((y_true == 0) & (y_pred == 1)))
    fn = int(np.sum((y_true == 1) & (y_pred == 0)))
    tn = int(np.sum((y_true == 0) & (y_pred == 0)))

    accuracy = round(float(tp + tn) / max(1, len(y_true)), 4)
    precision = round(float(tp) / max(1, tp + fp), 4)
    recall = round(float(tp) / max(1, tp + fn), 4)
    f1 = round(2.0 * (precision * recall) / max(1e-6, precision + recall), 4)

    # Fast AUC calculation via trapezoidal rank sum
    order = np.argsort(y_prob)
    rank = np.empty_like(order)
    rank[order] = np.arange(len(y_prob))
    n_pos = int(np.sum(y_true == 1))
    n_neg = int(np.sum(y_true == 0))
    if n_pos > 0 and n_neg > 0:
        u_val = np.sum(rank[y_true == 1]) - (n_pos * (n_pos + 1)) / 2.0
        auc = round(float(u_val) / (n_pos * n_neg), 4)
    else:
        auc = 0.5

    return {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "roc_auc": auc,
        "confusion_matrix": {"tp": tp, "fp": fp, "fn": fn, "tn": tn}
    }


def train_delay_model(dataset: dict = None):
    """
    Trains XGBoost delay risk classifier and writes artifacts to disk.
    """
    os.makedirs(MODEL_STORAGE_DIR, exist_ok=True)

    if dataset is None:
        dataset = generate_synthetic_data(num_historical_shipments=500, num_active_shipments=50)

    X, y = build_training_matrix(dataset)

    # Stratified 80/20 train/test split
    np.random.seed(42)
    pos_idx = np.where(y == 1)[0]
    neg_idx = np.where(y == 0)[0]
    np.random.shuffle(pos_idx)
    np.random.shuffle(neg_idx)

    train_pos_len = int(len(pos_idx) * 0.8)
    train_neg_len = int(len(neg_idx) * 0.8)

    train_idx = np.concatenate([pos_idx[:train_pos_len], neg_idx[:train_neg_len]])
    test_idx = np.concatenate([pos_idx[train_pos_len:], neg_idx[train_neg_len:]])
    np.random.shuffle(train_idx)
    np.random.shuffle(test_idx)

    X_train, y_train = X[train_idx], y[train_idx]
    X_test, y_test = X[test_idx], y[test_idx]

    dtrain = xgb.DMatrix(X_train, label=y_train, feature_names=FEATURE_NAMES)
    dtest = xgb.DMatrix(X_test, label=y_test, feature_names=FEATURE_NAMES)

    params = {
        "objective": "binary:logistic",
        "eval_metric": ["logloss", "error", "auc"],
        "max_depth": 4,
        "learning_rate": 0.08,
        "subsample": 0.85,
        "colsample_bytree": 0.85,
        "min_child_weight": 2,
        "seed": 42
    }

    evals = [(dtrain, "train"), (dtest, "eval")]
    booster = xgb.train(
        params,
        dtrain,
        num_boost_round=60,
        evals=evals,
        verbose_eval=False
    )

    # Evaluate on test set
    y_prob_test = booster.predict(dtest)
    metrics = calculate_classification_metrics(y_test, y_prob_test)

    # Feature importance (gain & weight)
    importance_dict = booster.get_score(importance_type="gain")
    sorted_importance = sorted(
        [{"feature": k, "importance": round(float(v), 2)} for k, v in importance_dict.items()],
        key=lambda x: x["importance"],
        reverse=True
    )

    # Save model and metrics
    model_path = os.path.join(MODEL_STORAGE_DIR, "delay_xgb_model.json")
    metrics_path = os.path.join(MODEL_STORAGE_DIR, "model_metrics.json")

    booster.save_model(model_path)
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump({
            "metrics": metrics,
            "feature_importance": sorted_importance,
            "feature_names": FEATURE_NAMES,
            "training_samples": len(X_train),
            "test_samples": len(X_test)
        }, f, indent=2)

    print(f"Model successfully trained! Test F1: {metrics['f1_score']}, Accuracy: {metrics['accuracy']}, ROC-AUC: {metrics['roc_auc']}")
    return booster, metrics


def load_trained_model(dataset: dict = None):
    """Loads saved model or triggers auto-training if missing."""
    model_path = os.path.join(MODEL_STORAGE_DIR, "delay_xgb_model.json")
    booster = xgb.Booster()
    if not os.path.exists(model_path):
        booster, _ = train_delay_model(dataset=dataset)
    else:
        booster.load_model(model_path)
    return booster


if __name__ == "__main__":
    train_delay_model()
