"""
SHAP / TreeSHAP Explainer for REDEFINE Clean Candidate LightGBM Model
Computes local and global Shapley feature attributions on unseen 2026 holdout test data.
workspace: REDEFINE DATASET/
Ensures:
- Model used: model_new_clean.pkl
- Leakage-free feature space (route_historical_ontime_pct absent)
- Computes TreeSHAP attributions
- Saves:
  REDEFINE DATASET/results/clean_shap_summary.png
  REDEFINE DATASET/results/new_clean_shap_summary.png
  REDEFINE DATASET/results/clean_model_feature_importance.csv
  REDEFINE DATASET/results/new_clean_model_feature_importance.csv
"""

import sys
from pathlib import Path
import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import shap

REDEFINE_DIR = Path(__file__).resolve().parent
if str(REDEFINE_DIR) not in sys.path:
    sys.path.insert(0, str(REDEFINE_DIR))

from redefine_config import (
    MODEL_NEW_CLEAN_PATH,
    METADATA_NEW_CLEAN_PATH,
    NEW_DATASET_CSV,
    TEST_START_DATE,
    CORRUPTED_TARGET_THRESHOLD,
    TARGET_COL,
    RESULTS_DIR,
    CLEAN_SHAP_SUMMARY_PNG,
)
from redefine_feature_engineering import compute_causal_historical_features


def main():
    print("=" * 80)
    print("COMPUTING TREESHAP FEATURE ATTRIBUTIONS (CLEAN CANDIDATE MODEL)")
    print("=" * 80)

    print(f"Loading clean candidate pipeline from '{MODEL_NEW_CLEAN_PATH}'...")
    pipeline = joblib.load(MODEL_NEW_CLEAN_PATH)
    metadata = joblib.load(METADATA_NEW_CLEAN_PATH)
    feature_names = metadata["feature_names"]

    # Load holdout test data sample (1,000 unseen 2026 journeys)
    print("Loading test dataset sample for TreeSHAP...")
    df = pd.read_csv(NEW_DATASET_CSV)
    df = df[df[TARGET_COL] < CORRUPTED_TARGET_THRESHOLD].reset_index(drop=True)

    # Compute causal historical features across timeline
    df_causal, _ = compute_causal_historical_features(df)
    test_df = df_causal[df_causal["date"] >= TEST_START_DATE].sample(n=1000, random_state=42).copy()

    # Preprocess test sample through pipeline transformer steps
    fe_step = pipeline.named_steps["fe"]
    prep_step = pipeline.named_steps["prep"]
    lgbm_reg = pipeline.named_steps["reg"]

    df_fe = fe_step.transform(test_df)
    X_transformed = prep_step.transform(df_fe)

    print(f"Computed transformed feature matrix shape: {X_transformed.shape}")

    # TreeSHAP Explainer
    print("Running TreeExplainer...")
    explainer = shap.TreeExplainer(lgbm_reg)
    shap_values = explainer.shap_values(X_transformed)

    # Global Mean Absolute SHAP values (Feature Attribution, not causal impact)
    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    shap_df = pd.DataFrame({
        "feature": feature_names[:len(mean_abs_shap)],
        "mean_abs_shap_attribution_minutes": mean_abs_shap,
    }).sort_values("mean_abs_shap_attribution_minutes", ascending=False)

    # Save CSVs
    shap_csv_1 = RESULTS_DIR / "clean_model_feature_importance.csv"
    shap_csv_2 = RESULTS_DIR / "new_clean_model_feature_importance.csv"
    shap_df.to_csv(shap_csv_1, index=False)
    shap_df.to_csv(shap_csv_2, index=False)
    print(f"Saved SHAP importance table to '{shap_csv_1}'")

    # Plot top 15 SHAP features
    top_shap = shap_df.head(15).sort_values("mean_abs_shap_attribution_minutes", ascending=True)
    clean_labels = [f.replace("num__", "").replace("cat__", "") for f in top_shap["feature"]]

    plt.figure(figsize=(10, 7))
    plt.barh(clean_labels, top_shap["mean_abs_shap_attribution_minutes"], color="#2ca02c")
    plt.xlabel("Mean |SHAP Attribution| (Marginal Model Prediction Shift in Minutes)")
    plt.title("TreeSHAP Global Feature Attribution: Clean Candidate Model (1,000 Unseen Journeys)")
    plt.tight_layout()

    shap_png_1 = CLEAN_SHAP_SUMMARY_PNG
    shap_png_2 = RESULTS_DIR / "new_clean_shap_summary.png"
    shap_png_3 = RESULTS_DIR / "new_clean_model_feature_importance.png"
    plt.savefig(shap_png_1, dpi=200)
    plt.savefig(shap_png_2, dpi=200)
    plt.savefig(shap_png_3, dpi=200)
    plt.close()
    print(f"Saved SHAP plots to '{shap_png_1}', '{shap_png_2}', and '{shap_png_3}'")

    print("\nTop 10 Influential Features by SHAP (Prediction-Time Attributions):")
    for idx, row in shap_df.head(10).iterrows():
        print(f"  {row['feature']:40s}: {row['mean_abs_shap_attribution_minutes']:.2f} min average prediction impact")


if __name__ == "__main__":
    main()
