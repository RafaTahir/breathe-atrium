import sensorReadings from "../../../../assets/demo-data/sensor-readings.json";

export type LiveMode = keyof typeof sensorReadings.modes;

export const liveSensorData = sensorReadings;

export const liveModes = Object.entries(sensorReadings.modes).map(([key, value]) => ({
  key: key as LiveMode,
  ...value,
}));

export function getLiveMode(mode: LiveMode) {
  return sensorReadings.modes[mode];
}
