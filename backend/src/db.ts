import pg from "pg";
import { alerts as fallbackAlerts, sensorTrend as fallbackTrend, ships as fallbackShips, type Ship } from "./data.js";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

export const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl
    })
  : null;

type ShipRow = {
  id: number;
  name: string;
  imo_number: string;
  vessel_type: string;
  route: string;
  status: "active" | "warning" | "critical";
  engine_temperature: string;
  fuel_usage: string;
  rpm: number;
  speed: string;
  vibration: string;
  latitude: string;
  longitude: string;
  weather_status: string;
  health_score: string | null;
};

type AlertRow = {
  id: number;
  ship_id: number;
  ship_name: string;
  severity: "low" | "medium" | "high";
  alert_type: string;
  message: string;
  created_at: Date;
};

export async function getShips(): Promise<Ship[]> {
  if (!pool) {
    return fallbackShips;
  }

  const result = await pool.query<ShipRow>(`
    SELECT DISTINCT ON (s.id)
      s.id,
      s.name,
      s.imo_number,
      s.vessel_type,
      s.route,
      s.status,
      r.engine_temperature,
      r.fuel_usage,
      r.rpm,
      r.speed,
      r.vibration,
      r.latitude,
      r.longitude,
      r.weather_status,
      p.health_score
    FROM ships s
    JOIN sensor_readings r ON r.ship_id = s.id
    LEFT JOIN predictions p ON p.ship_id = s.id
    ORDER BY s.id, r.recorded_at DESC, p.created_at DESC
  `);

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    imoNumber: row.imo_number,
    vesselType: row.vessel_type,
    route: row.route,
    status: row.status,
    engineTemperature: Number(row.engine_temperature),
    fuelUsage: Number(row.fuel_usage),
    rpm: row.rpm,
    speed: Number(row.speed),
    vibration: Number(row.vibration),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    weatherStatus: row.weather_status,
    healthScore: row.health_score === null ? fallbackShips.find((ship) => ship.id === row.id)?.healthScore ?? 80 : Number(row.health_score)
  }));
}

export async function getAlerts() {
  if (!pool) {
    return fallbackAlerts;
  }

  const result = await pool.query<AlertRow>(`
    SELECT
      a.id,
      a.ship_id,
      s.name AS ship_name,
      a.severity,
      a.alert_type,
      a.message,
      a.created_at
    FROM alerts a
    JOIN ships s ON s.id = a.ship_id
    ORDER BY a.created_at DESC
    LIMIT 12
  `);

  return result.rows.map((row) => ({
    id: row.id,
    shipId: row.ship_id,
    shipName: row.ship_name,
    severity: row.severity,
    type: row.alert_type,
    message: row.message,
    createdAt: row.created_at.toISOString()
  }));
}

export async function getSensorTrend() {
  if (!pool) {
    return fallbackTrend;
  }

  const result = await pool.query<{
    time: string;
    fuel_usage: string;
    engine_temperature: string;
    health_score: string;
  }>(`
    SELECT
      to_char(recorded_at, 'HH24:MI') AS time,
      ROUND(AVG(fuel_usage), 2) AS fuel_usage,
      ROUND(AVG(engine_temperature), 2) AS engine_temperature,
      ROUND(AVG(100 - LEAST(95, GREATEST(2, ((engine_temperature - 72) / 35 * 35) + ((vibration / 4) * 30)))), 2) AS health_score
    FROM sensor_readings
    GROUP BY date_trunc('hour', recorded_at), to_char(recorded_at, 'HH24:MI')
    ORDER BY date_trunc('hour', recorded_at) DESC
    LIMIT 12
  `);

  return result.rows
    .reverse()
    .map((row) => ({
      time: row.time,
      fuelUsage: Number(row.fuel_usage),
      engineTemperature: Number(row.engine_temperature),
      healthScore: Number(row.health_score)
    }));
}

export async function savePrediction(input: {
  shipId: number;
  failureProbability: number;
  healthScore: number;
  recommendation: string;
}) {
  if (!pool) {
    return;
  }

  await pool.query(
    `
      INSERT INTO predictions (ship_id, failure_probability, health_score, recommendation)
      VALUES ($1, $2, $3, $4)
    `,
    [input.shipId, input.failureProbability, input.healthScore, input.recommendation]
  );
}

export async function simulateTelemetry() {
  if (!pool) {
    return { insertedReadings: 0, insertedAlerts: 0, mode: "fallback" };
  }

  const shipsResult = await pool.query<{ id: number; status: string }>("SELECT id, status FROM ships ORDER BY id");
  let insertedAlerts = 0;

  for (const ship of shipsResult.rows) {
    const roughSea = Math.random() > 0.65;
    const engineTemperature = randomBetween(ship.status === "warning" ? 86 : 75, ship.status === "warning" ? 98 : 87);
    const vibration = randomBetween(ship.status === "warning" ? 1.8 : 0.8, ship.status === "warning" ? 3.1 : 1.7);
    const rpm = Math.round(randomBetween(ship.status === "warning" ? 1540 : 1320, ship.status === "warning" ? 1800 : 1580));
    const fuelUsage = randomBetween(390, 530);
    const speed = randomBetween(16.5, 20.5);

    await pool.query(
      `
        INSERT INTO sensor_readings
          (ship_id, engine_temperature, fuel_usage, rpm, speed, vibration, latitude, longitude, weather_status)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        ship.id,
        engineTemperature,
        fuelUsage,
        rpm,
        speed,
        vibration,
        randomBetween(8, 19),
        randomBetween(67, 81),
        roughSea ? "Rough sea" : "Moderate sea"
      ]
    );

    const alert = buildAlert(engineTemperature, vibration, fuelUsage);

    if (alert) {
      insertedAlerts += 1;
      await pool.query(
        `
          INSERT INTO alerts (ship_id, severity, alert_type, message)
          VALUES ($1, $2, $3, $4)
        `,
        [ship.id, alert.severity, alert.type, alert.message]
      );
    }
  }

  return { insertedReadings: shipsResult.rowCount ?? 0, insertedAlerts, mode: "database" };
}

function randomBetween(min: number, max: number) {
  return Number((min + Math.random() * (max - min)).toFixed(2));
}

function buildAlert(engineTemperature: number, vibration: number, fuelUsage: number) {
  if (engineTemperature >= 92) {
    return {
      severity: "high",
      type: "Overheating",
      message: "Engine temperature is above normal operating range."
    };
  }

  if (vibration >= 2.3) {
    return {
      severity: "medium",
      type: "High vibration",
      message: "Vibration indicates possible bearing wear."
    };
  }

  if (fuelUsage >= 500) {
    return {
      severity: "low",
      type: "Fuel efficiency",
      message: "Fuel usage increased compared with recent average."
    };
  }

  return null;
}
