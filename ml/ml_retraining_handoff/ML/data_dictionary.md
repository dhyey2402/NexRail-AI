# Data Dictionary — Indian Railways Train Delay & ETA Prediction System

This data dictionary documents all fields in the historical train delay dataset (`indian-railways-predict-train-delay/`) and supplementary railway network assets (`archive/`).

---

## 1. Primary Historical Dataset (`ir_train.csv` & `ir_test.csv`)

| Column | Type | Description | Missing % | Unique Values | Used for ML? | Reason for Exclusion if Unused |
|---|---|---|---|---|---|---|
| `journey_id` | String | Unique journey identifier format `IR` + 8 digits (e.g. `IR01717809`) | 0.0% | 1,500,000 (Train) / 375,000 (Test) | No | High-cardinality row identifier; zero generalizable predictive signal. |
| `train_number` | Integer / String | 5-digit Indian Railways train identifier (e.g. `12536`) | 0.0% | 4,036 | Yes | Used for train historical delay mapping and grouping. |
| `train_type` | Category | Commercial train classification (e.g. `Vande Bharat Express`, `Rajdhani Express`, `Superfast Express`, `Mail/Express`, `Passenger Train`) | 0.0% | 15 | Yes | Primary operational prioritization factor; higher priority trains receive track clearance. |
| `departure_date` | Date (YYYY-MM-DD) | Scheduled calendar date of journey departure | 0.0% | 2,556 (2018-01-01 to 2024-12-30) | Yes | Used for chronological train/validation/test splitting and seasonal temporal extraction. |
| `year` | Integer | Calendar year of departure (2018 to 2024) | 0.0% | 7 | Yes | Temporal splitting and long-term trend modeling. |
| `month` | Integer | Calendar month of departure (1 to 12) | 0.0% | 12 | Yes | Captures seasonal trends (monsoon, winter fog, summer heat). |
| `day_of_week` | Integer | Day of the week (0 = Monday, 6 = Sunday) | 0.0% | 7 | Yes | Weekly passenger load cycles and weekend traffic variance. |
| `departure_hour` | Integer | Scheduled departure hour in 24-hour format (0 to 23) | 0.0% | 24 | Yes | Diurnal pattern modeling (night vs. morning rush hours). |
| `is_weekend` | Binary (0/1) | 1 if departure occurs on Saturday or Sunday; 0 otherwise | 0.0% | 2 | Yes | Captures weekend passenger transit fluctuation. |
| `is_night_departure` | Binary (0/1) | 1 if departure is between 22:00 (10 PM) and 04:00 (4 AM) | 0.0% | 2 | Yes | Visibility, maintenance blocks, and nocturnal track operations. |
| `is_peak_hour` | Binary (0/1) | 1 if departure is during peak commuter hours (06:00–08:00 or 17:00–20:00) | 0.0% | 2 | Yes | Network congestion during suburban/intercity commuter surges. |
| `is_festival_season` | Binary (0/1) | 1 if departure falls within major national festive surges (Diwali, Chhath, Holi, Eid) | 0.0% | 2 | Yes | Heavy passenger overloading and special train density. |
| `season` | Category | Macro climatic season (`Winter/Fog`, `Summer`, `Pre-Monsoon`, `Monsoon`, `Post-Monsoon`, `Autumn`) | 0.0% | 6 | Yes | Encoded to model broad climate impacts. |
| `zone` | Category | Full administrative name of Indian Railways operational zone | 0.0% | 16 | No | Redundant with `zone_abbr` (compact abbreviation); dropped to prevent multicollinearity. |
| `zone_abbr` | Category | 2-4 letter abbreviation of IR administrative zone (`NR`, `WR`, `NCR`, `ECR`, `SR`, etc.) | 0.0% | 16 | Yes | Key geographical and administrative efficiency proxy. |
| `source_station_category` | Category | Official IR station commercial tier of origin station (`A1`, `A`, `B`, `C`, `D`, `E`) | 0.0% | 6 | Yes | Station platform availability, yard layout, and dispatch complexity. |
| `destination_station_category` | Category | Official IR station commercial tier of terminal station (`A1`, `A`, `B`, `C`, `D`, `E`) | 0.0% | 6 | Yes | Terminal yard congestion and platform re-entry bottlenecks. |
| `distance_km` | Integer | Total scheduled route distance in kilometres (28 to 3,915 km) | 0.0% | 1,558 | Yes | Route length directly impacts cumulative delay propagation. |
| `num_scheduled_stops` | Integer | Total count of intermediate commercial halts along the route (1 to 65) | 0.0% | 58 | Yes | Dwell time variability and stop-and-go speed loss. |
| `scheduled_travel_hours` | Float | Timetabled end-to-end journey duration in decimal hours (0.5 to 72.0 hrs) | 0.0% | 1,978 | Yes | Combined with `distance_km` to derive scheduled commercial speed. |
| `track_doubled` | Binary (0/1) | 1 if predominant route segment consists of double or quadruple tracks; 0 for single track | 0.0% | 2 | Yes | Single track lines require train crossings and siding halts, heavily increasing delay risk. |
| `is_hdn_route` | Binary (0/1) | 1 if route runs over High Density Network (HDN) corridor | 0.0% | 2 | Yes | Heavy freight and superfast express line contention. |
| `traction_type` | Category | Motive power class (`Electric (25kV AC)`, `Diesel`, `Dual`) | 0.0% | 3 | Yes | Acceleration profiles, engine switch halts, and overhead equipment (OHE) risk. |
| `is_electrified` | Binary (0/1) | 1 if route is fully electrified (Electric or Dual traction) | 0.0% | 2 | Yes | Infrastructure modernization indicator. |
| `psr_count` | Integer | Permanent Speed Restrictions enforced across the section (0 to 18) | 0.0% | 19 | Yes | Direct physical speed caps imposing inevitable running loss. |
| `is_circular_route` | Binary (0/1) | 1 if train operates as a loop/circular service; 0 for linear service | 0.0% | 2 | Yes | Operating turnaround dynamics. |
| `is_monsoon_season` | Binary (0/1) | 1 if journey occurs during peak monsoon months (June–September) | 0.0% | 2 | Yes | Waterlogging, caution orders, and reduced track adhesion risk. |
| `is_fog_risk` | Binary (0/1) | 1 if winter fog risk criteria apply (Dec–Feb, nocturnal/morning, Northern belt) | 0.0% | 2 | Yes | Severe speed limit reductions (60 km/h ceiling) under Fog Signal device protocol. |
| `fog_risk_score` | Float | Continuous fog susceptibility index (0.0 to 1.0) | 0.0% | 14 | Yes | Calibrated fog severity score. |
| `zone_fog_index` | Float | Historical fog exposure index for the administrative zone (0.0 to 1.0) | 0.0% | 13 | Yes | Zone-level winter vulnerability metric. |
| `zone_congestion_index` | Float | Route section capacity utilization ratio (0.40 to 0.98; >0.80 indicates saturated line capacity) | 0.0% | 16 | Yes | Crucial predictor of dispatch delays and headway buffering. |
| `season_severity_score` | Float | Historical monthly climatic severity metric (0.20 to 0.95; Aug highest, March lowest) | 0.0% | 11 | Yes | Quantitative environmental impedance proxy. |
| `loco_age_years` | Float | Locomotive operational age in years (0.5 to 45.0) | 0.0% | 412 | Yes | Equipment breakdown and power failure probability. |
| `coach_age_years` | Float | Average rake passenger coach age in years (0.5 to 40.0) | 0.0% | 450 | Yes | Hot-axle, brake-binding, and suspension malfunction risks. |
| `has_lhb_coaches` | Binary (0/1) | 1 if train is equipped with Linke-Hofmann-Busch coaches; 0 for ICF coaches | 0.0% | 2 | Yes | Modern 130–160 km/h speed rating with disc brakes vs 110 km/h ICF coaches. |
| `is_rake_shared` | Binary (0/1) | 1 if rake set is shared with paired return/other services (RSA: Rake Sharing Arrangement) | 0.0% | 2 | Yes | Delay propagation across interconnected services. |
| `maintenance_score` | Float | Preventive periodic overhaul (POH/IOH) rating (1.0 = poor, 10.0 = immaculate) | 0.0% | 91 | Yes | Mechanical readiness indicator. |
| `seat_utilisation_pct` | Float | Boarded passenger count as percentage of authorized berths (30.0% to 100.0%) | 0.0% | 701 | Yes | Station dwell time inflation caused by boarding/deboarding crowds. |
| `is_overloaded` | Binary (0/1) | 1 if seat utilization exceeds 100.0%; 0 otherwise | 0.0% | 1 (Constant 0) | No | **Constant zero variance** across all 1.5M rows (max seat utilisation is 100.0%). Dropped. |
| `late_incoming_rake` | Binary (0/1) | 1 if previous incoming service arrived late at the origin yard | 0.0% | 2 | Yes | **Primary initial condition driver**: Rake turnaround delay directly shifts departure. |
| `is_special_train` | Binary (0/1) | 1 if seasonal clone/holiday special train outside regular master timetable | 0.0% | 2 | Yes | Lower precedence relative to scheduled superfast services. |
| `route_historical_ontime_pct` | Float | Historical on-time arrival percentage recorded for this route (25.0% to 95.0%) | 0.0% | 650 | Yes | Strong baseline prior of section reliability. |
| `primary_delay_cause` | Category | Post-hoc recorded root cause of delay (e.g. `Track Congestion`, `Flooding`, `Signal Failure`, `On Time`) | 0.0% (Train only) | 15 | No | **DATA LEAKAGE**. Post-hoc classification logged after trip completion. Absent in test set. |
| `delay_minutes` | Integer | Destination arrival delay in minutes ($\ge 0$; 0 = on-time) | 0.0% (Train only) | 281 | **TARGET** | **Primary continuous regression target** for ETA calculation. |
| `is_delayed` | Binary (0/1) | 1 if `delay_minutes` $> 15$; 0 otherwise | 0.0% (Train only) | 2 | No | **TARGET LEAKAGE**. Mathematical derivation of the target ($I(\text{delay} > 15)$). |

---

## 2. Supplementary Railway Assets (`archive/`)

| File | Format | Key Entities | Records | Relevance to ML |
|---|---|---|---|---|
| `stations.json` | GeoJSON (FeatureCollection) | Station code, name, zone, state, address, geographic coordinates `[lon, lat]` | 8,300+ stations | Provides geographic coordinates and state mappings for spatial verification. |
| `trains.json` | GeoJSON (FeatureCollection) | Train number, name, type, zone, origin/destination station codes, scheduled duration, distance, coordinate path | 5,208 train services | Provides complementary operational metadata (classes, route polyline) for 37% overlapping train numbers. |
| `schedules.json` | JSON (Array of Objects) | Train number, station code, station name, scheduled arrival time, scheduled departure time, halt day, halt sequence ID | 417,080 station-stop schedules | Detailed station-by-station scheduled timetables. Useful for intermediate ETA calculations in RailRadar integration. |
