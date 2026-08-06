import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { Activity, AlertTriangle, Fuel, Gauge, MapPin, Ship, ThermometerSun } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import "./styles.css";

type ShipRecord = {
  id: number;
  name: string;
  vesselType: string;
  route: string;
  status: "active" | "warning" | "critical";
  engineTemperature: number;
  fuelUsage: number;
  rpm: number;
  speed: number;
  vibration: number;
  latitude: number;
  longitude: number;
  weatherStatus: string;
  healthScore: number;
};

type AlertRecord = {
  id: number;
  shipName: string;
  severity: "low" | "medium" | "high";
  type: string;
  message: string;
};

type TrendPoint = {
  time: string;
  fuelUsage: number;
  engineTemperature: number;
  healthScore: number;
};

type PredictionRecord = {
  failureProbability: number;
  healthScore: number;
  anomaly: boolean;
  recommendation: string;
};

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const fallbackShips: ShipRecord[] = [
  {
    id: 1,
    name: "INS Varuna",
    vesselType: "Container Ship",
    route: "Mumbai to Singapore",
    status: "active",
    engineTemperature: 79.5,
    fuelUsage: 430.2,
    rpm: 1420,
    speed: 19.4,
    vibration: 1.12,
    latitude: 14.5995,
    longitude: 72.8777,
    weatherStatus: "Moderate sea",
    healthScore: 91
  },
  {
    id: 2,
    name: "MV Samudra",
    vesselType: "Bulk Carrier",
    route: "Chennai to Colombo",
    status: "warning",
    engineTemperature: 93.2,
    fuelUsage: 510.8,
    rpm: 1690,
    speed: 17.8,
    vibration: 2.45,
    latitude: 8.892,
    longitude: 79.899,
    weatherStatus: "Rough sea",
    healthScore: 68
  },
  {
    id: 3,
    name: "Ocean Prerna",
    vesselType: "Tanker",
    route: "Kochi to Dubai",
    status: "active",
    engineTemperature: 82.1,
    fuelUsage: 466.1,
    rpm: 1515,
    speed: 18.7,
    vibration: 1.37,
    latitude: 18.1096,
    longitude: 67.4321,
    weatherStatus: "Clear",
    healthScore: 86
  }
];

const fallbackAlerts: AlertRecord[] = [
  {
    id: 1,
    shipName: "MV Samudra",
    severity: "high",
    type: "Overheating",
    message: "Engine temperature is above normal operating range."
  },
  {
    id: 2,
    shipName: "MV Samudra",
    severity: "medium",
    type: "High vibration",
    message: "Vibration indicates possible bearing wear."
  },
  {
    id: 3,
    shipName: "INS Varuna",
    severity: "low",
    type: "Fuel efficiency",
    message: "Fuel usage increased compared with recent average."
  }
];

const fallbackTrend: TrendPoint[] = [
  { time: "00:00", fuelUsage: 420, engineTemperature: 78, healthScore: 93 },
  { time: "04:00", fuelUsage: 436, engineTemperature: 81, healthScore: 90 },
  { time: "08:00", fuelUsage: 454, engineTemperature: 84, healthScore: 87 },
  { time: "12:00", fuelUsage: 489, engineTemperature: 89, healthScore: 76 },
  { time: "16:00", fuelUsage: 471, engineTemperature: 85, healthScore: 82 },
  { time: "20:00", fuelUsage: 443, engineTemperature: 80, healthScore: 88 }
];

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`);

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Ship;
}) {
  return (
    <section className="stat-card">
      <div className="stat-icon">
        <Icon size={20} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{hint}</span>
      </div>
    </section>
  );
}

function App() {
  const [ships, setShips] = useState<ShipRecord[]>(fallbackShips);
  const [alerts, setAlerts] = useState<AlertRecord[]>(fallbackAlerts);
  const [trend, setTrend] = useState<TrendPoint[]>(fallbackTrend);
  const [prediction, setPrediction] = useState<PredictionRecord | null>(null);
  const [predictionStatus, setPredictionStatus] = useState("Ready to analyze the selected vessel.");
  const [isLoading, setIsLoading] = useState(true);
  const [isPredicting, setIsPredicting] = useState(false);
  const [apiStatus, setApiStatus] = useState<"live" | "fallback">("fallback");

  useEffect(() => {
    let isActive = true;

    async function loadDashboardData() {
      try {
        const [shipsData, alertsData, trendData] = await Promise.all([
          getJson<ShipRecord[]>("/ships"),
          getJson<AlertRecord[]>("/alerts"),
          getJson<TrendPoint[]>("/sensor-data")
        ]);

        if (!isActive) {
          return;
        }

        setShips(shipsData);
        setAlerts(alertsData);
        setTrend(trendData);
        setApiStatus("live");
      } catch {
        if (isActive) {
          setApiStatus("fallback");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      isActive = false;
    };
  }, []);

  const selectedShip = ships.find((shipItem) => shipItem.status === "warning") ?? ships[0];

  const fleetAverageHealth = useMemo(() => {
    return Math.round(ships.reduce((sum, shipItem) => sum + shipItem.healthScore, 0) / ships.length);
  }, [ships]);

  const highAlerts = alerts.filter((alert) => alert.severity === "high").length;
  const totalFuelUsage = Math.round(ships.reduce((sum, shipItem) => sum + shipItem.fuelUsage, 0)).toLocaleString();

  async function runPrediction() {
    setIsPredicting(true);
    setPrediction(null);
    setPredictionStatus(`Sending ${selectedShip.name} telemetry to the AI service...`);

    try {
      const predictionResult = await fetch(`${apiUrl}/prediction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rpm: selectedShip.rpm,
          engineTemperature: selectedShip.engineTemperature,
          vibration: selectedShip.vibration,
          fuelUsage: selectedShip.fuelUsage,
          speed: selectedShip.speed,
          shipId: selectedShip.id
        })
      });

      if (!predictionResult.ok) {
        throw new Error(`Prediction returned ${predictionResult.status}`);
      }

      const result = (await predictionResult.json()) as PredictionRecord;
      setPrediction(result);
      setPredictionStatus(`Prediction complete for ${selectedShip.name}.`);
      setApiStatus("live");
    } catch {
      setApiStatus("fallback");
      setPredictionStatus("Prediction failed. Check that the backend and AI service are running.");
    } finally {
      setIsPredicting(false);
    }
  }

  return (
    <main className="dashboard">
      <aside className="sidebar">
        <div className="brand">
          <Ship size={28} />
          <div>
            <strong>SmartFleet AI</strong>
            <span>Ship management dashboard</span>
          </div>
        </div>
        <nav>
          <button className="active"><Gauge size={18} /> Monitoring</button>
          <button><Activity size={18} /> Analytics</button>
          <button><AlertTriangle size={18} /> Alerts</button>
          <button><MapPin size={18} /> Fleet Map</button>
        </nav>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p>Fleet Operations</p>
            <h1>AI-Powered Ship Management Dashboard</h1>
          </div>
          <div className="topbar-actions">
            <span className={`api-pill ${apiStatus}`}>{apiStatus === "live" ? "API live" : "Fallback data"}</span>
            <button className="primary-action" disabled={isPredicting} onClick={runPrediction} type="button">
              {isPredicting ? "Predicting..." : "Run Prediction"}
            </button>
          </div>
        </header>

        {isLoading ? <div className="loading-line">Loading live fleet data...</div> : null}

        <section className={`prediction-banner ${prediction ? "complete" : isPredicting ? "running" : "idle"}`}>
          <div>
            <p>AI Maintenance Prediction</p>
            <strong>{predictionStatus}</strong>
          </div>
          {prediction ? (
            <div className="prediction-result">
              <span>{prediction.failureProbability}% failure risk</span>
              <span>{prediction.healthScore}% health score</span>
            </div>
          ) : null}
        </section>

        <section className="stats-grid">
          <StatCard label="Active ships" value={`${ships.length}`} hint={`${ships.length} vessels reporting`} icon={Ship} />
          <StatCard label="Fleet health" value={`${fleetAverageHealth}%`} hint="Average operating score" icon={Activity} />
          <StatCard label="Fuel usage" value={`${totalFuelUsage} L/h`} hint="Across monitored fleet" icon={Fuel} />
          <StatCard label="Critical alerts" value={`${highAlerts}`} hint="Needs maintenance review" icon={AlertTriangle} />
        </section>

        <section className="main-grid">
          <article className="panel ship-focus">
            <div className="panel-heading">
              <div>
                <p>Selected Vessel</p>
                <h2>{selectedShip.name}</h2>
              </div>
              <span className={`status ${selectedShip.status}`}>{selectedShip.status}</span>
            </div>
            <div className="metric-strip">
              <div><ThermometerSun size={18} /><span>{selectedShip.engineTemperature} C</span><small>Engine temp</small></div>
              <div><Gauge size={18} /><span>{selectedShip.rpm} RPM</span><small>Engine load</small></div>
              <div><Fuel size={18} /><span>{selectedShip.fuelUsage} L/h</span><small>Fuel usage</small></div>
              <div><MapPin size={18} /><span>{selectedShip.speed} kn</span><small>{selectedShip.weatherStatus}</small></div>
            </div>
            <p className="insight">
              {prediction
                ? `Failure risk is ${prediction.failureProbability}% with a health score of ${prediction.healthScore}%. ${prediction.recommendation}`
                : "Fuel efficiency decreased due to increased RPM, elevated vibration, and rough sea conditions. Run prediction to get the AI maintenance recommendation."}
            </p>
            <button className="secondary-action" disabled={isPredicting} onClick={runPrediction} type="button">
              {isPredicting ? "Analyzing..." : `Analyze ${selectedShip.name}`}
            </button>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <div>
                <p>Predictive Maintenance</p>
                <h2>Health Trend</h2>
              </div>
            </div>
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d8e0e8" />
                  <XAxis dataKey="time" stroke="#607080" />
                  <YAxis stroke="#607080" />
                  <Tooltip />
                  <Line type="monotone" dataKey="healthScore" stroke="#0f766e" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        <section className="main-grid lower">
          <article className="panel">
            <div className="panel-heading">
              <div>
                <p>Analytics</p>
                <h2>Fuel and Temperature</h2>
              </div>
            </div>
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d8e0e8" />
                  <XAxis dataKey="time" stroke="#607080" />
                  <YAxis stroke="#607080" />
                  <Tooltip />
                  <Area type="monotone" dataKey="fuelUsage" stroke="#2563eb" fill="#bfdbfe" />
                  <Area type="monotone" dataKey="engineTemperature" stroke="#f59e0b" fill="#fde68a" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="panel alerts-panel">
            <div className="panel-heading">
              <div>
                <p>Alert System</p>
                <h2>Latest Alerts</h2>
              </div>
            </div>
            {alerts.map((alert) => (
              <div className={`alert ${alert.severity}`} key={alert.id}>
                <strong>{alert.type}</strong>
                <span>{alert.shipName}</span>
                <p>{alert.message}</p>
              </div>
            ))}
          </article>
        </section>

        <section className="panel fleet-table">
          <div className="panel-heading">
            <div>
              <p>Ship Monitoring</p>
              <h2>Fleet Overview</h2>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Ship</th>
                <th>Route</th>
                <th>Temp</th>
                <th>RPM</th>
                <th>Speed</th>
                <th>Health</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ships.map((shipItem) => (
                <tr key={shipItem.id}>
                  <td>
                    <strong>{shipItem.name}</strong>
                    <span>{shipItem.vesselType}</span>
                  </td>
                  <td>{shipItem.route}</td>
                  <td>{shipItem.engineTemperature} C</td>
                  <td>{shipItem.rpm}</td>
                  <td>{shipItem.speed} kn</td>
                  <td>{shipItem.healthScore}%</td>
                  <td><span className={`status ${shipItem.status}`}>{shipItem.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
