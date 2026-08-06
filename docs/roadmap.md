# Roadmap

## Stage 1 - Frontend Dashboard

- Build monitoring cards for fleet, alerts, fuel, and health.
- Add fleet table and alert section.
- Add trend charts using simulated values.

## Stage 2 - Backend API

- Serve ships, sensor data, and alerts.
- Proxy prediction requests to the AI service.
- Replace mock data with PostgreSQL queries.

## Stage 3 - PostgreSQL Database

- Store ships, telemetry, alerts, and predictions.
- Add indexes for ship id and timestamp.

## Stage 4 - AI Integration

- Train or simulate a failure-risk model.
- Add anomaly detection using Isolation Forest.
- Return clear maintenance recommendations.

## Stage 5 - Deployment

- Containerize frontend, backend, AI service, and database.
- Deploy frontend to Vercel and APIs to Render or Railway.
