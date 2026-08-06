export type Ship = {
  id: number;
  name: string;
  imoNumber: string;
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

export const ships: Ship[] = [
  {
    id: 1,
    name: "INS Varuna",
    imoNumber: "IMO9321450",
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
    imoNumber: "IMO8451029",
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
    imoNumber: "IMO7623091",
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

export const sensorTrend = [
  { time: "00:00", fuelUsage: 420, engineTemperature: 78, healthScore: 93 },
  { time: "04:00", fuelUsage: 436, engineTemperature: 81, healthScore: 90 },
  { time: "08:00", fuelUsage: 454, engineTemperature: 84, healthScore: 87 },
  { time: "12:00", fuelUsage: 489, engineTemperature: 89, healthScore: 76 },
  { time: "16:00", fuelUsage: 471, engineTemperature: 85, healthScore: 82 },
  { time: "20:00", fuelUsage: 443, engineTemperature: 80, healthScore: 88 }
];

export const alerts = [
  {
    id: 1,
    shipId: 2,
    shipName: "MV Samudra",
    severity: "high",
    type: "Overheating",
    message: "Engine temperature is above normal operating range.",
    createdAt: "2026-05-17T09:35:00Z"
  },
  {
    id: 2,
    shipId: 2,
    shipName: "MV Samudra",
    severity: "medium",
    type: "High vibration",
    message: "Vibration indicates possible bearing wear.",
    createdAt: "2026-05-17T09:20:00Z"
  },
  {
    id: 3,
    shipId: 1,
    shipName: "INS Varuna",
    severity: "low",
    type: "Fuel efficiency",
    message: "Fuel usage increased compared with recent average.",
    createdAt: "2026-05-17T08:55:00Z"
  }
];
