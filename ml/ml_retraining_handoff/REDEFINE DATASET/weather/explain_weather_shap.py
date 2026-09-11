"""
TreeSHAP Attribution for Weather-Aware ETA Model
Workspace: REDEFINE DATASET/weather/
Computes global Shapley attributions for meteorological features on unseen 2026 holdout journeys.
Generates:
- REDEFINE DATASET/results/weather_shap_feature_importance.csv
- REDEFINE DATASET/results/weather_shap_summary.png
"""

import sys
from pathlib import Path
import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import shap

WEATHER_DIR = Path(__file__).resolve().parent
REDEFINE_DIR = WEATHER_DIR.parent
PROJECT_ROOT = REDEFINE_DIR.parent

if str(REDEFINE_DIR) not in sys.path:
    sys.path.insert(0, str(REDEFINE_DIR))
if str(WEATHER_DIR) not in sys.path:
    sys.path.insert(0, str(WEATHER_DIR))

from redefine_config import TEST_START_DATE, RESULTS_DIR

ENRICHED_DATASET_CSV = REDEFINE_DIR / "ml_training_dataset_weather.csv"
MODEL_WEATHER_V1_PATH = REDEFINE_DIR / "model_weather_v1.pkl"
METADATA_WEATHER_V1_PATH = REDEFINE_DIR / "model_weather_v1_metadata.pkl"

SHAP_CSV_PATH = RESULTS_DIR / "weather_shap_feature_importance.csv"
SHAP_PNG_PATH = RESULTS_DIR / "weather_shap_summary.png"


def main():
    print("=" * 80)
    print("COMPUTING TREESHAP ATTRIBUTION FOR WEATHER-AWARE MODEL")
    print("=" * 80)

    print(f"Loading weather-aware model pipeline from '{MODEL_WEATHER_V1_PATH}'...")
    pipeline = joblib.load(MODEL_WEATHER_V1_PATH)
    metadata = joblib.load(METADATA_WEATHER_V1_PATH)
    feature_names = metadata["feature_names"]

    # Sample 1,000 holdout test journeys from 2026
    print(f"Loading test sample from '{ENRICHED_DATASET_CSV}'...")
    df = pd.read_csv(ENRICHED_DATASET_CSV)
    test_df = df[df["date"] >= TEST_START_DATE].sample(n=1000, random_state=42).copy()

    fe_step = pipeline.named_steps["fe"]
    prep_step = pipeline.named_steps["prep"]
    lgbm_reg = pipeline.named_steps["reg"]

    df_fe = fe_step.transform(test_df)
    X_trans = prep_step.transform(df_fe)

    print(f"Computed transformed feature matrix: shape {X_trans.shape}")

    # TreeSHAP Explainer
    print("Running TreeExplainer...")
    explainer = shap.TreeExplainer(lgbm_reg)
    shap_values = explainer.shap_values(X_trans)

    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    shap_df = pd.DataFrame({
        "feature": feature_names[:len(mean_abs_shap)],
        "mean_abs_shap_minutes": mean_abs_shap,
    }).sort_values("mean_abs_shap_minutes", ascending=False)

    shap_df.to_csv(SHAP_CSV_PATH, index=False)
    print(f"Saved SHAP importance table to '{SHAP_CSV_PATH}'")

    # Plot top 20 SHAP features with weather highlighted in orange
    top_shap = shap_df.head(20).sort_values("mean_abs_shap_minutes", ascending=True)
    clean_labels = [f.replace("num__", "").replace("cat__", "") for f in top_shap["feature"]]
    colors = ["#ff7f0e" if ("weather" in f or "rain" in f or "fog" in f) else "#2ca02c" for f in top_shap["feature"]]

    plt.figure(figsize=(10, 8))
    plt.barh(clean_labels, top_shap["mean_abs_shap_minutes"], color=colors)
    plt.xlabel("Mean |SHAP Attribution| (Delay Shift in Minutes)")
    plt.title("TreeSHAP Global Attributions: Weather-Aware Model (Orange = Weather)")
    plt.tight_layout()
    plt.savefig(SHAP_PNG_PATH, dpi=200)
    plt.close()
    print(f"Saved SHAP summary plot to '{SHAP_PNG_PATH}'")

    print("\nTop Weather Features by SHAP Attribution:")
    weather_shap = shap_df[shap_df["feature"].str.contains("weather|rain|fog|temp|wind|disruption")].head(8)
    for _, row in weather_shap.iterrows():
        print(f"  {row['feature']:40s}: {row['mean_abs_shap_minutes']:.2f} min marginal impact")


if __name__ == "__main__":
    main()
