import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any
import os

try:
    from sklearn.ensemble import GradientBoostingRegressor
    from sklearn.preprocessing import StandardScaler
    import joblib
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


def get_aqi_category(aqi: float) -> str:
    if aqi <= 50: return "Good"
    if aqi <= 100: return "Satisfactory"
    if aqi <= 200: return "Moderate"
    if aqi <= 300: return "Poor"
    if aqi <= 400: return "Very Poor"
    return "Severe"


class ForecastingAgent:
    """
    Hyperlocal AQI Forecasting Agent.
    Loads pre-trained GradientBoostingRegressor ML models & StandardScaler joblib artifacts
    from models/ directory for all 32 Indian state and UT capital cities.
    """

    BASE_AQIS = {
        "Mumbai": 145, "Delhi": 240, "Bengaluru": 95, "Chennai": 112, "Kolkata": 168, "Pune": 130,
        "Hyderabad": 115, "Ahmedabad": 155, "Jaipur": 160, "Lucknow": 195, "Chandigarh": 120,
        "Patna": 220, "Bhubaneswar": 125, "Thiruvananthapuram": 65, "Bhopal": 135, "Visakhapatnam": 110,
        "Guwahati": 140, "Ranchi": 130, "Raipur": 150, "Dehradun": 105, "Shimla": 45, "Srinagar": 85,
        "Panaji": 55, "Leh": 35, "Puducherry": 75, "Agartala": 110, "Shillong": 40, "Imphal": 60,
        "Kohima": 50, "Aizawl": 30, "Itanagar": 45, "Gangtok": 35
    }

    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.scalers: Dict[str, Any] = {}
        self.model_dir = os.path.join(os.path.dirname(__file__), "../models")
        self._load_pretrained_models()

    def _load_pretrained_models(self):
        """Load pre-trained .joblib model files if available."""
        if not SKLEARN_AVAILABLE:
            return

        for city in self.BASE_AQIS.keys():
            model_path = os.path.join(self.model_dir, f"gbm_{city}.joblib")
            scaler_path = os.path.join(self.model_dir, f"scaler_{city}.joblib")
            if os.path.exists(model_path) and os.path.exists(scaler_path):
                try:
                    self.models[city] = joblib.load(model_path)
                    self.scalers[city] = joblib.load(scaler_path)
                except Exception as e:
                    print(f"Error loading model for {city}: {e}")

    def _extract_features(self, timestamp: datetime, aqi_lag1: float,
                           aqi_lag3: float, aqi_lag6: float, aqi_rolling_mean: float) -> List[float]:
        return [
            timestamp.hour,
            timestamp.weekday(),
            timestamp.month,
            np.sin(2 * np.pi * timestamp.hour / 24),
            np.cos(2 * np.pi * timestamp.hour / 24),
            np.sin(2 * np.pi * timestamp.month / 12),
            np.cos(2 * np.pi * timestamp.month / 12),
            aqi_lag1,
            aqi_lag3,
            aqi_lag6,
            aqi_rolling_mean,
            1 if timestamp.weekday() >= 5 else 0,
        ]

    def predict(self, city: str, history: List[Dict], hours: int = 72) -> List[Dict[str, Any]]:
        base_aqi = self.BASE_AQIS.get(city, 125)
        now = datetime.utcnow()
        forecasts = []

        model = self.models.get(city)
        scaler = self.scalers.get(city)

        current_val = base_aqi
        if history and len(history) > 0:
            current_val = history[-1].get("aqi", base_aqi)

        for h in range(1, hours + 1):
            forecast_time = now + timedelta(hours=h)

            if model and scaler:
                try:
                    feats = self._extract_features(
                        forecast_time,
                        current_val,
                        current_val * 0.98,
                        current_val * 0.95,
                        current_val * 0.96
                    )
                    scaled_feats = scaler.transform([feats])
                    predicted_aqi = float(model.predict(scaled_feats)[0])
                except Exception:
                    predicted_aqi = self._diurnal_fallback(city, base_aqi, forecast_time)
            else:
                predicted_aqi = self._diurnal_fallback(city, base_aqi, forecast_time)

            predicted_aqi = float(np.clip(predicted_aqi, 10, 500))
            forecasts.append({
                "city": city,
                "ward": city,
                "forecastTime": forecast_time.isoformat(),
                "predictedAQI": round(predicted_aqi),
                "category": get_aqi_category(predicted_aqi),
                "confidence": round(max(0.65, 0.98 - (h / hours) * 0.25), 2),
            })

            current_val = predicted_aqi

        return forecasts

    def _diurnal_fallback(self, city: str, base_aqi: float, forecast_time: datetime) -> float:
        hour = forecast_time.hour
        if 7 <= hour <= 10: factor = 1.25
        elif 17 <= hour <= 21: factor = 1.20
        elif 1 <= hour <= 5: factor = 0.78
        else: factor = 1.0

        noise = np.random.normal(0, 5)
        return float(np.clip(base_aqi * factor + noise, 10, 500))
