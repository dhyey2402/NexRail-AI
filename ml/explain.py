"""
Explainability module for Train Delay & ETA Prediction using SHAP (SHapley Additive exPlanations).
Translates mathematical feature contributions into human-understandable operational reasoning.
"""

from typing import List, Dict, Any, Tuple
import numpy as np
import shap


class DelayExplainer:
    """
    Computes local SHAP explanations for individual train delay predictions
    and generates plain-language domain summaries.
    """

    def __init__(self, model, preprocessor, feature_names: List[str]):
        self.model = model
        self.preprocessor = preprocessor
        self.feature_names = feature_names
        try:
            self.explainer = shap.TreeExplainer(self.model)
        except Exception as e:
            print(f"Warning: Could not initialize TreeExplainer ({e}); using fallback.")
            self.explainer = None

    def explain_prediction(
        self,
        features_dict: Dict[str, Any],
        transformed_vector: np.ndarray,
        predicted_delay: float,
        top_k: int = 3
    ) -> List[str]:
        """
        Generates top_k plain-language operational reasons explaining why
        the model predicted the specific delay for this journey.
        """
        if self.explainer is not None:
            try:
                shap_values = self.explainer(transformed_vector)
                values = shap_values.values[0]
                
                # Get indices sorted by absolute impact
                top_indices = np.argsort(np.abs(values))[::-1]
                
                reasons = []
                for idx in top_indices:
                    feat_name = self.feature_names[idx] if idx < len(self.feature_names) else f"feature_{idx}"
                    val = values[idx]
                    impact_str = f"+{val:.1f} min" if val > 0 else f"{val:.1f} min"
                    
                    reason_text = self._format_feature_reason(feat_name, val, impact_str, features_dict)
                    if reason_text and reason_text not in reasons:
                        reasons.append(reason_text)
                    if len(reasons) >= top_k:
                        break
                        
                if reasons:
                    return reasons
            except Exception as e:
                # Safe fallback on exception
                pass

        # Robust Fallback Explanation based on domain rules and input features
        return self._fallback_explanation(features_dict, predicted_delay, top_k)

    def _format_feature_reason(
        self,
        raw_feat_name: str,
        shap_val: float,
        impact_str: str,
        features_dict: Dict[str, Any]
    ) -> str:
        """
        Maps a transformed feature name to an operational explanation.
        """
        name = raw_feat_name.lower()
        sign = "increased" if shap_val > 0 else "reduced"

        if "late_incoming_rake" in name or "rake_delay_pressure" in name:
            if features_dict.get("late_incoming_rake", 0) == 1:
                return f"Late incoming rake from prior trip {sign} delay by {impact_str}"
            else:
                return f"Punctual incoming rake turnaround {sign} delay by {impact_str}"

        if "route_historical_ontime_pct" in name:
            ontime = features_dict.get("route_historical_ontime_pct", 70)
            return f"Route historical on-time punctuality ({ontime}%) {sign} projected delay ({impact_str})"

        if "zone_congestion_index" in name or "composite_congestion_risk" in name:
            cong = features_dict.get("zone_congestion_index", 0.7)
            return f"Section traffic congestion index ({cong}) {sign} delay by {impact_str}"

        if "season_severity_score" in name or "is_monsoon_season" in name or "season" in name:
            return f"Adverse seasonal weather conditions {sign} delay by {impact_str}"

        if "track_doubled" in name or "single_track" in name:
            if features_dict.get("track_doubled", 1) == 1:
                return f"Doubled/quadrupled track corridor {sign} bottleneck delay ({impact_str})"
            else:
                return f"Single-track route segment {sign} crossing wait time ({impact_str})"

        if "fog_risk" in name or "zone_fog" in name:
            return f"Dense winter fog caution protocol {sign} delay by {impact_str}"

        if "maintenance_score" in name or "maintenance_deficit" in name:
            maint = features_dict.get("maintenance_score", 7)
            return f"Rolling stock maintenance quality rating ({maint}/10) {sign} delay ({impact_str})"

        if "train_type" in name or "hist_train_type" in name:
            t_type = features_dict.get("train_type", "Train")
            return f"Operating priority class '{t_type}' {sign} scheduled line clearance ({impact_str})"

        if "psr_count" in name or "psr_per_100km" in name:
            psr = features_dict.get("psr_count", 0)
            return f"Permanent Speed Restrictions ({psr} active) {sign} delay by {impact_str}"

        if "distance_km" in name or "scheduled_travel_hours" in name:
            return f"Scheduled distance and journey runtime {sign} delay by {impact_str}"

        return f"Operational factor '{raw_feat_name}' {sign} projected delay ({impact_str})"

    def _fallback_explanation(
        self,
        features_dict: Dict[str, Any],
        predicted_delay: float,
        top_k: int
    ) -> List[str]:
        """
        Deterministic operational fallback explanation when SHAP is unavailable.
        """
        reasons = []

        if features_dict.get("late_incoming_rake", 0) == 1:
            reasons.append("Late incoming rake turnaround from preceding service added initial delay")

        cong = float(features_dict.get("zone_congestion_index", 0.5))
        if cong > 0.75:
            reasons.append(f"High network capacity utilization ({cong}) on the zone corridor contributed to dispatch delay")

        ontime = float(features_dict.get("route_historical_ontime_pct", 70))
        if ontime < 60:
            reasons.append(f"Route historical on-time punctuality is below average ({ontime}%), indicating regular section delays")
        elif ontime > 80:
            reasons.append(f"Strong historical route reliability ({ontime}%) moderated delay accumulation")

        if features_dict.get("track_doubled", 1) == 0:
            reasons.append("Single-track section requires operational halts for opposing train crossings")
        elif features_dict.get("track_doubled", 1) == 1 and len(reasons) < top_k:
            reasons.append("Doubled track infrastructure minimized crossing wait times")

        if features_dict.get("is_monsoon_season", 0) == 1 or features_dict.get("is_fog_risk", 0) == 1:
            reasons.append("Environmental factors (monsoon / fog caution orders) impacted running speed")

        if not reasons:
            reasons.append("Standard operating variability and scheduled line clearance conditions")

        return reasons[:top_k]