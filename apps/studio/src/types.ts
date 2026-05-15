export type ScenarioKey = "day" | "waterAssist" | "nightPurge" | "baseline";

export type Scenario = {
  key: ScenarioKey;
  label: string;
  description: string;
  solarGainWm2: number;
  outdoorTempC: number;
  damperOpeningPct: number;
  waterAssist: boolean;
};

export type TelemetryPoint = {
  time: string;
  baselineZoneTempC: number;
  breatheZoneTempC: number;
  roofLayerTempC: number;
  airflowIndex: number;
};
