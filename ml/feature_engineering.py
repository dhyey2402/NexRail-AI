
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

class RailwayFeatureEngineer(BaseEstimator, TransformerMixin):
    def __init__(self):
        self.global_target_mean_ = 97.71958438257734
        self.train_type_delay_map_ = {}
        self.zone_delay_map_ = {}
        self.traction_delay_map_ = {}
        self.feature_names_out_ = []

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        df = X.copy()
        df['sin_hour'] = np.sin(2 * np.pi * df['departure_hour'] / 24.0)
        df['cos_hour'] = np.cos(2 * np.pi * df['departure_hour'] / 24.0)
        df['sin_month'] = np.sin(2 * np.pi * df['month'] / 12.0)
        df['cos_month'] = np.cos(2 * np.pi * df['month'] / 12.0)
        df['scheduled_speed_kmh'] = df['distance_km'] / df['scheduled_travel_hours'].clip(lower=0.1)
        df['stops_per_100km'] = (df['num_scheduled_stops'] / df['distance_km'].clip(lower=1.0)) * 100.0
        df['psr_per_100km'] = (df['psr_count'] / df['distance_km'].clip(lower=1.0)) * 100.0
        df['avg_stop_spacing_km'] = df['distance_km'] / df['num_scheduled_stops'].clip(lower=1)
        df['avg_rolling_stock_age'] = (df['loco_age_years'] + df['coach_age_years']) / 2.0
        df['single_track_hdn_bottleneck'] = (1 - df['track_doubled']) * df['is_hdn_route']
        df['rake_delay_pressure'] = df['late_incoming_rake'] * (1.0 + 0.5 * df['is_rake_shared'])
        df['composite_congestion_risk'] = df['zone_congestion_index'] * df['season_severity_score']
        df['composite_fog_risk'] = df['fog_risk_score'] * df['season_severity_score']
        df['maintenance_deficit'] = (10.0 - df['maintenance_score']) * (df['avg_rolling_stock_age'] / 20.0)
        df['hist_train_type_avg_delay'] = df['train_type'].map(self.train_type_delay_map_).fillna(self.global_target_mean_)
        df['hist_zone_avg_delay'] = df['zone_abbr'].map(self.zone_delay_map_).fillna(self.global_target_mean_)
        df['hist_traction_avg_delay'] = df['traction_type'].map(self.traction_delay_map_).fillna(self.global_target_mean_)
        return df
