import joblib
import os
import sys

metadata_path = "c:/Projects/sih26/ml/model_metadata.pkl"
try:
    meta = joblib.load(metadata_path)
    print("KEYS:", meta.keys())
    print("\nFEATURES:", meta.get("feature_names", []))
    print("\nTEST METRICS:", meta.get("test_metrics", {}))
    print("\nPIPELINE STEPS (if any):", meta.get("pipeline_steps", "None"))
except Exception as e:
    print(f"Error loading metadata: {e}")
