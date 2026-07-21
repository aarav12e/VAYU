import os
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

CITIES = [
    "Mumbai", "Delhi", "Bengaluru", "Chennai", "Kolkata", "Hyderabad",
    "Ahmedabad", "Jaipur", "Lucknow", "Chandigarh", "Patna", "Bhubaneswar",
    "Thiruvananthapuram", "Bhopal", "Visakhapatnam", "Guwahati", "Ranchi",
    "Raipur", "Dehradun", "Shimla", "Srinagar", "Panaji", "Leh", "Puducherry",
    "Agartala", "Shillong", "Imphal", "Kohima", "Aizawl", "Itanagar", "Gangtok", "Pune"
]

BASE_AQIS = {
    "Mumbai": 145, "Delhi": 240, "Bengaluru": 95, "Chennai": 112, "Kolkata": 168, "Pune": 130,
    "Hyderabad": 115, "Ahmedabad": 155, "Jaipur": 160, "Lucknow": 195, "Chandigarh": 120,
    "Patna": 220, "Bhubaneswar": 125, "Thiruvananthapuram": 65, "Bhopal": 135, "Visakhapatnam": 110,
    "Guwahati": 140, "Ranchi": 130, "Raipur": 150, "Dehradun": 105, "Shimla": 45, "Srinagar": 85,
    "Panaji": 55, "Leh": 35, "Puducherry": 75, "Agartala": 110, "Shillong": 40, "Imphal": 60,
    "Kohima": 50, "Aizawl": 30, "Itanagar": 45, "Gangtok": 35
}

def extract_features(ts: datetime, lag1: float, lag3: float, lag6: float, mean_6: float) -> list:
    return [
        ts.hour,
        ts.weekday(),
        ts.month,
        np.sin(2 * np.pi * ts.hour / 24),
        np.cos(2 * np.pi * ts.hour / 24),
        np.sin(2 * np.pi * ts.month / 12),
        np.cos(2 * np.pi * ts.month / 12),
        lag1,
        lag3,
        lag6,
        mean_6,
        1 if ts.weekday() >= 5 else 0,
    ]

def train_and_save_all():
    print("🤖 Pre-training GradientBoostingRegressor ML Models for Indian Cities...")
    start_time = datetime(2025, 1, 1, 0, 0, 0)

    for city in CITIES:
        base_aqi = BASE_AQIS.get(city, 125)

        # Generate synthetic historical series (90 days = 2160 hours)
        timestamps = [start_time + timedelta(hours=i) for i in range(2160)]
        aqi_values = []
        for ts in timestamps:
            hour = ts.hour
            factor = 1.25 if 7 <= hour <= 10 else (1.20 if 17 <= hour <= 21 else (0.80 if 1 <= hour <= 5 else 1.0))
            val = base_aqi * factor + np.random.normal(0, 12)
            aqi_values.append(max(10, min(500, val)))

        X, y = [], []
        for i in range(6, len(aqi_values)):
            ts = timestamps[i]
            feat = extract_features(
                ts,
                aqi_values[i - 1],
                aqi_values[i - 3],
                aqi_values[i - 6],
                float(np.mean(aqi_values[i - 6:i]))
            )
            X.append(feat)
            y.append(aqi_values[i])

        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        model = GradientBoostingRegressor(
            n_estimators=80,
            max_depth=4,
            learning_rate=0.1,
            random_state=42
        )
        model.fit(X_scaled, y)

        model_file = os.path.join(MODELS_DIR, f"gbm_{city}.joblib")
        scaler_file = os.path.join(MODELS_DIR, f"scaler_{city}.joblib")

        joblib.dump(model, model_file)
        joblib.dump(scaler, scaler_file)
        print(f"  ✅ Saved: gbm_{city}.joblib & scaler_{city}.joblib")

    print("🎉 All 32 ML Models pre-trained and saved into models/")

if __name__ == "__main__":
    train_and_save_all()
