# Final Project Report

## Title

AI-Powered Ship Management Dashboard

## Problem Statement

Marine fleet operators need a fast way to monitor ship condition, detect abnormal telemetry, and prioritize maintenance before failures affect safety, cost, or delivery timelines.

## Objectives

- Monitor ship engine temperature, RPM, speed, fuel usage, vibration, GPS position, and weather status.
- Predict maintenance risk using AI.
- Detect abnormal operating behavior.
- Generate operational alerts.
- Visualize fleet health and performance trends.

## Technology Stack

- Frontend: React, TypeScript, Tailwind CSS, Recharts
- Backend: Node.js, Express
- Database: PostgreSQL
- AI Service: Python, FastAPI, Scikit-learn
- Deployment: Docker Compose for local orchestration

## AI Method

The AI service trains a synthetic prototype model at startup. It uses:

- Random Forest Classifier for failure probability
- Isolation Forest for anomaly detection
- Feature scaling with StandardScaler

Input features:

- RPM
- Engine temperature
- Vibration
- Fuel usage
- Ship speed

Output:

- Failure probability
- Health score
- Anomaly flag
- Maintenance recommendation

## Database Design

Main tables:

- `ships`
- `sensor_readings`
- `alerts`
- `predictions`

## Future Enhancements

- Real AIS/weather API integration
- Authentication and user roles
- Historical report exports
- WebSocket-based live telemetry
- Model training from real vessel maintenance records
