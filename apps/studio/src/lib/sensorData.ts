export const sensorModes = ["dead_atrium", "breathe_atrium"] as const;
export const sensorSources = ["simulated", "csv", "serial"] as const;

export type SensorMode = (typeof sensorModes)[number];
export type SensorSource = (typeof sensorSources)[number];

export type SensorReading = {
  timestamp: string;
  mode: SensorMode;
  topTempC: number;
  occupiedTempC: number;
  humidityPct: number;
  airflowMs: number;
  co2ppm: number;
};

export type SensorModeMeta = {
  label: string;
  summary: string;
};

export const sensorModeMeta: Record<SensorMode, SensorModeMeta> = {
  dead_atrium: {
    label: "Dead Atrium",
    summary: "Baseline heat-trap condition before passive retrofit intervention.",
  },
  breathe_atrium: {
    label: "BreatheAtrium Mode",
    summary: "Solar-assisted stack ventilation with low intake, cross-flow, high exhaust, and BMS-aware controls.",
  },
};

export const sensorSourceLabels: Record<SensorSource, string> = {
  simulated: "Simulated",
  csv: "CSV Playback",
  serial: "Hardware Serial",
};

type SimulatedProfile = {
  topBase: number;
  topDrift: number;
  occupiedBase: number;
  occupiedDrift: number;
  humidityBase: number;
  humidityDrift: number;
  airflowBase: number;
  airflowDrift: number;
  co2Base: number;
  co2Drift: number;
};

const simulatedProfiles: Record<SensorMode, SimulatedProfile> = {
  dead_atrium: {
    topBase: 41.2,
    topDrift: 1.6,
    occupiedBase: 34.0,
    occupiedDrift: 0.8,
    humidityBase: 70,
    humidityDrift: 2.2,
    airflowBase: 0.17,
    airflowDrift: 0.04,
    co2Base: 900,
    co2Drift: 110,
  },
  breathe_atrium: {
    topBase: 37.8,
    topDrift: 0.9,
    occupiedBase: 30.9,
    occupiedDrift: 0.5,
    humidityBase: 64,
    humidityDrift: 1.4,
    airflowBase: 0.66,
    airflowDrift: 0.08,
    co2Base: 670,
    co2Drift: 45,
  },
};

export function createSimulatedReading(mode: SensorMode, tick: number, timestamp = new Date()): SensorReading {
  const profile = simulatedProfiles[mode];
  const slow = Math.sin(tick / 7);
  const medium = Math.sin(tick / 3.5 + 1.4);
  const noise = pseudoNoise(tick + (mode === "dead_atrium" ? 11 : 29)) - 0.5;

  return {
    timestamp: timestamp.toISOString(),
    mode,
    topTempC: roundOne(profile.topBase + slow * profile.topDrift + noise * 0.5),
    occupiedTempC: roundOne(profile.occupiedBase + medium * profile.occupiedDrift + noise * 0.25),
    humidityPct: clamp(Math.round(profile.humidityBase + slow * profile.humidityDrift + noise * 2), 45, 85),
    airflowMs: roundTwo(clamp(profile.airflowBase + medium * profile.airflowDrift + noise * 0.02, 0.04, 1.2)),
    co2ppm: clamp(Math.round(profile.co2Base + slow * profile.co2Drift + noise * 35), 420, 1400),
  };
}

export function createScriptedDemoRunReadings(start = new Date()): SensorReading[] {
  return Array.from({ length: 24 }, (_, index) => {
    const timestamp = new Date(start.getTime() + index * 60_000);
    const mode: SensorMode = index < 9 ? "dead_atrium" : "breathe_atrium";
    const transition = clamp((index - 8) / 15, 0, 1);
    const heatBuildUp = Math.min(index / 8, 1);
    const reliefCurve = 1 - transition;

    if (mode === "dead_atrium") {
      return {
        timestamp: timestamp.toISOString(),
        mode,
        topTempC: roundOne(34.8 + heatBuildUp * 7.4 + Math.sin(index / 2) * 0.3),
        occupiedTempC: roundOne(31.5 + heatBuildUp * 2.8 + Math.sin(index / 2.4) * 0.2),
        humidityPct: Math.round(68 + heatBuildUp * 3),
        airflowMs: roundTwo(0.18 + Math.sin(index) * 0.02),
        co2ppm: Math.round(660 + heatBuildUp * 250),
      };
    }

    return {
      timestamp: timestamp.toISOString(),
      mode,
      topTempC: roundOne(37.4 + reliefCurve * 4.2 + Math.sin(index / 2) * 0.2),
      occupiedTempC: roundOne(30.8 + reliefCurve * 3.0 + Math.sin(index / 2.8) * 0.15),
      humidityPct: Math.round(63 + reliefCurve * 6),
      airflowMs: roundTwo(0.28 + transition * 0.44 + Math.sin(index / 3) * 0.02),
      co2ppm: Math.round(650 + reliefCurve * 240),
    };
  });
}

export function parseSensorCsv(csvText: string): SensorReading[] {
  const rows = csvText
    .trim()
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);

  if (rows.length < 2) return [];

  const headers = splitCsvLine(rows[0]).map((header) => header.trim());

  return rows
    .slice(1)
    .map((row) => parseCsvRow(headers, splitCsvLine(row)))
    .filter((reading): reading is SensorReading => Boolean(reading));
}

export function parseSerialReading(line: string): SensorReading | null {
  try {
    return normalizeSensorReading(JSON.parse(line));
  } catch {
    return null;
  }
}

export function normalizeSensorReading(value: unknown): SensorReading | null {
  if (!isRecord(value)) return null;

  const mode = value.mode;
  if (mode !== "dead_atrium" && mode !== "breathe_atrium") return null;

  const reading: SensorReading = {
    timestamp: typeof value.timestamp === "string" ? value.timestamp : new Date().toISOString(),
    mode,
    topTempC: Number(value.topTempC),
    occupiedTempC: Number(value.occupiedTempC),
    humidityPct: Number(value.humidityPct),
    airflowMs: Number(value.airflowMs),
    co2ppm: Number(value.co2ppm),
  };

  return isValidSensorReading(reading) ? reading : null;
}

export function isValidSensorReading(reading: SensorReading) {
  return (
    Number.isFinite(Date.parse(reading.timestamp)) &&
    sensorModes.includes(reading.mode) &&
    Number.isFinite(reading.topTempC) &&
    Number.isFinite(reading.occupiedTempC) &&
    Number.isFinite(reading.humidityPct) &&
    Number.isFinite(reading.airflowMs) &&
    Number.isFinite(reading.co2ppm)
  );
}

export function formatSensorTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-MY", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
}

function parseCsvRow(headers: string[], values: string[]) {
  const row = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  return normalizeSensorReading(row);
}

function splitCsvLine(row: string) {
  return row.split(",").map((value) => value.trim().replace(/^"|"$/g, ""));
}

function pseudoNoise(seed: number) {
  return Math.sin(seed * 12.9898) * 43758.5453 - Math.floor(Math.sin(seed * 12.9898) * 43758.5453);
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

function roundTwo(value: number) {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
