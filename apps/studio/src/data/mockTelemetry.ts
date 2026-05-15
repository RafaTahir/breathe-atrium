import type { Scenario, TelemetryPoint } from "../types";

export const scenarios: Scenario[] = [
  {
    key: "day",
    label: "BreatheAtrium day mode",
    description: "Solar-assisted stack ventilation with BMS-aware damper control.",
    solarGainWm2: 760,
    outdoorTempC: 32,
    damperOpeningPct: 72,
    waterAssist: false,
  },
  {
    key: "waterAssist",
    label: "Water-wall assist",
    description: "Optional evaporative support for suitable humidity and maintenance conditions.",
    solarGainWm2: 820,
    outdoorTempC: 33.5,
    damperOpeningPct: 78,
    waterAssist: true,
  },
  {
    key: "nightPurge",
    label: "Night purge prep",
    description: "High damper opening to release stored heat before the next occupancy cycle.",
    solarGainWm2: 320,
    outdoorTempC: 28,
    damperOpeningPct: 88,
    waterAssist: false,
  },
  {
    key: "baseline",
    label: "No passive retrofit",
    description: "Low passive relief. HVAC compensates after heat accumulates.",
    solarGainWm2: 760,
    outdoorTempC: 32,
    damperOpeningPct: 8,
    waterAssist: false,
  },
];

export const telemetry: TelemetryPoint[] = [
  { time: "09:00", baselineZoneTempC: 31.2, breatheZoneTempC: 29.8, roofLayerTempC: 34.8, airflowIndex: 42 },
  { time: "10:00", baselineZoneTempC: 32.8, breatheZoneTempC: 30.2, roofLayerTempC: 36.4, airflowIndex: 58 },
  { time: "11:00", baselineZoneTempC: 34.1, breatheZoneTempC: 30.7, roofLayerTempC: 37.8, airflowIndex: 68 },
  { time: "12:00", baselineZoneTempC: 35.3, breatheZoneTempC: 30.9, roofLayerTempC: 37.9, airflowIndex: 72 },
  { time: "13:00", baselineZoneTempC: 36.1, breatheZoneTempC: 31.4, roofLayerTempC: 38.7, airflowIndex: 76 },
  { time: "14:00", baselineZoneTempC: 36.4, breatheZoneTempC: 31.6, roofLayerTempC: 39.1, airflowIndex: 74 },
  { time: "15:00", baselineZoneTempC: 35.9, breatheZoneTempC: 31.1, roofLayerTempC: 38.3, airflowIndex: 70 },
];

export const claimGuardrail = "All values are simulated demo values until replaced by measured pilot data.";
