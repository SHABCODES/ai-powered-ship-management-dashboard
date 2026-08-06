INSERT INTO ships (name, imo_number, vessel_type, route, status) VALUES
  ('INS Varuna', 'IMO9321450', 'Container Ship', 'Mumbai to Singapore', 'active'),
  ('MV Samudra', 'IMO8451029', 'Bulk Carrier', 'Chennai to Colombo', 'warning'),
  ('Ocean Prerna', 'IMO7623091', 'Tanker', 'Kochi to Dubai', 'active');

INSERT INTO sensor_readings
  (ship_id, engine_temperature, fuel_usage, rpm, speed, vibration, latitude, longitude, weather_status)
VALUES
  (1, 79.50, 430.20, 1420, 19.40, 1.120, 14.5995, 72.8777, 'Moderate sea'),
  (2, 93.20, 510.80, 1690, 17.80, 2.450, 8.8920, 79.8990, 'Rough sea'),
  (3, 82.10, 466.10, 1515, 18.70, 1.370, 18.1096, 67.4321, 'Clear');

INSERT INTO alerts (ship_id, severity, alert_type, message) VALUES
  (2, 'high', 'Overheating', 'Engine temperature is above normal operating range.'),
  (2, 'medium', 'High vibration', 'Vibration indicates possible bearing wear.'),
  (1, 'low', 'Fuel efficiency', 'Fuel usage increased compared with recent average.');
