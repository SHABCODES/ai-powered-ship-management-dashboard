import cors from "cors";
import express from "express";
import { getAlerts, getSensorTrend, getShips, savePrediction, simulateTelemetry } from "./db.js";

const app = express();
const port = Number(process.env.PORT ?? 8000);
const aiServiceUrl = process.env.AI_SERVICE_URL ?? "http://localhost:8001";

app.use(cors());
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.get("/ships", async (_request, response, next) => {
  try {
    response.json(await getShips());
  } catch (error) {
    next(error);
  }
});

app.get("/sensor-data", async (_request, response, next) => {
  try {
    response.json(await getSensorTrend());
  } catch (error) {
    next(error);
  }
});

app.get("/alerts", async (_request, response, next) => {
  try {
    response.json(await getAlerts());
  } catch (error) {
    next(error);
  }
});

app.post("/prediction", async (request, response, next) => {
  try {
    const predictionResponse = await fetch(`${aiServiceUrl}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request.body)
    });

    if (!predictionResponse.ok) {
      throw new Error(`AI service returned ${predictionResponse.status}`);
    }

    const prediction = await predictionResponse.json();

    if (request.body.shipId) {
      await savePrediction({
        shipId: Number(request.body.shipId),
        failureProbability: Number(prediction.failureProbability),
        healthScore: Number(prediction.healthScore),
        recommendation: String(prediction.recommendation)
      });
    }

    response.json(prediction);
  } catch {
    const { rpm = 1500, engineTemperature = 80, vibration = 1.2 } = request.body;
    const risk = Math.min(0.95, Math.max(0.02, (rpm - 1200) / 1800 + (engineTemperature - 70) / 100 + vibration / 8));

    response.json({
      failureProbability: Number((risk * 100).toFixed(1)),
      healthScore: Number((100 - risk * 100).toFixed(1)),
      anomaly: risk > 0.55,
      recommendation: risk > 0.55 ? "Schedule inspection for engine and vibration systems." : "Continue normal monitoring."
    });
  }
});

app.post("/simulate", async (_request, response, next) => {
  try {
    response.json(await simulateTelemetry());
  } catch (error) {
    next(error);
  }
});

app.use((error: Error, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error);
  response.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Ship dashboard API running on http://localhost:${port}`);
});
