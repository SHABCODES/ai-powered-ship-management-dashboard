import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler

app = FastAPI(title="Ship Maintenance AI Service")


class PredictionInput(BaseModel):
    rpm: float = Field(ge=0)
    engineTemperature: float = Field(ge=0)
    vibration: float = Field(ge=0)
    fuelUsage: float = Field(default=450, ge=0)
    speed: float = Field(default=18, ge=0)


def build_training_data() -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(42)
    normal = np.column_stack(
        [
            rng.normal(1450, 120, 500),
            rng.normal(80, 5, 500),
            rng.normal(1.15, 0.25, 500),
            rng.normal(430, 35, 500),
            rng.normal(18.8, 1.1, 500),
        ]
    )
    risky = np.column_stack(
        [
            rng.normal(1720, 120, 260),
            rng.normal(94, 4, 260),
            rng.normal(2.55, 0.35, 260),
            rng.normal(520, 40, 260),
            rng.normal(17.2, 1.2, 260),
        ]
    )

    x = np.vstack([normal, risky])
    y = np.array([0] * len(normal) + [1] * len(risky))
    return x, y


training_x, training_y = build_training_data()
scaler = StandardScaler()
scaled_x = scaler.fit_transform(training_x)

failure_model = RandomForestClassifier(n_estimators=120, random_state=42, max_depth=7)
failure_model.fit(scaled_x, training_y)

anomaly_model = IsolationForest(contamination=0.12, random_state=42)
anomaly_model.fit(scaled_x)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "model": "random-forest + isolation-forest"}


@app.post("/predict")
def predict(payload: PredictionInput) -> dict[str, float | bool | str]:
    features = np.array(
        [[payload.rpm, payload.engineTemperature, payload.vibration, payload.fuelUsage, payload.speed]],
        dtype=float,
    )
    scaled_features = scaler.transform(features)

    model_probability = float(failure_model.predict_proba(scaled_features)[0][1])
    anomaly_score = float(anomaly_model.decision_function(scaled_features)[0])
    is_anomaly = anomaly_model.predict(scaled_features)[0] == -1

    adjusted_probability = clamp(model_probability + (0.12 if is_anomaly else 0), 0.02, 0.95)
    failure_probability = round(adjusted_probability * 100, 1)
    health_score = round(100 - failure_probability, 1)

    recommendation = build_recommendation(payload, failure_probability, is_anomaly)

    return {
        "failureProbability": failure_probability,
        "healthScore": health_score,
        "anomaly": bool(is_anomaly or failure_probability >= 55),
        "anomalyScore": round(anomaly_score, 3),
        "recommendation": recommendation,
    }


def clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(value, upper))


def build_recommendation(payload: PredictionInput, failure_probability: float, is_anomaly: bool) -> str:
    causes: list[str] = []

    if payload.engineTemperature >= 90:
        causes.append("high engine temperature")
    if payload.vibration >= 2.2:
        causes.append("elevated vibration")
    if payload.rpm >= 1650:
        causes.append("high RPM load")
    if payload.fuelUsage >= 500:
        causes.append("fuel inefficiency")

    if failure_probability >= 60:
        return f"High maintenance risk caused by {', '.join(causes) or 'combined abnormal telemetry'}. Schedule inspection within 24 hours."

    if failure_probability >= 35 or is_anomaly:
        return f"Moderate risk detected from {', '.join(causes) or 'unusual operating pattern'}. Monitor the next telemetry cycle and prepare inspection."

    return "Normal operating condition. Continue routine monitoring."
