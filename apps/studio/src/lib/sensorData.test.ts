import { describe, expect, it } from "vitest";
import {
  createScriptedDemoRunReadings,
  createSimulatedReading,
  parseSensorCsv,
  parseSerialReading,
} from "./sensorData";

describe("sensorData", () => {
  it("creates simulated readings with the expected presentation data shape", () => {
    const reading = createSimulatedReading("breathe_atrium", 3, new Date("2026-05-16T10:30:00.000Z"));

    expect(reading).toMatchObject({
      timestamp: "2026-05-16T10:30:00.000Z",
      mode: "breathe_atrium",
    });
    expect(reading.topTempC).toBeGreaterThan(30);
    expect(reading.airflowMs).toBeGreaterThan(0.2);
  });

  it("parses valid CSV rows and skips malformed rows", () => {
    const readings = parseSensorCsv(`timestamp,mode,topTempC,occupiedTempC,humidityPct,airflowMs,co2ppm
2026-05-16T10:30:00.000Z,dead_atrium,34.2,31.4,68,0.18,640
bad,breathe_atrium,not-a-number,31.4,68,0.18,640`);

    expect(readings).toHaveLength(1);
    expect(readings[0].mode).toBe("dead_atrium");
    expect(readings[0].co2ppm).toBe(640);
  });

  it("parses serial JSON readings safely", () => {
    const reading = parseSerialReading(
      JSON.stringify({
        timestamp: "2026-05-16T10:30:00.000Z",
        mode: "breathe_atrium",
        topTempC: 37.2,
        occupiedTempC: 30.8,
        humidityPct: 64,
        airflowMs: 0.68,
        co2ppm: 650,
      }),
    );

    expect(reading?.mode).toBe("breathe_atrium");
    expect(parseSerialReading("{not-json")).toBeNull();
  });

  it("creates a before-and-after demo run", () => {
    const readings = createScriptedDemoRunReadings(new Date("2026-05-16T10:30:00.000Z"));

    expect(readings[0].mode).toBe("dead_atrium");
    const finalReading = readings[readings.length - 1];

    expect(finalReading.mode).toBe("breathe_atrium");
    expect(finalReading.airflowMs).toBeGreaterThan(readings[0].airflowMs);
  });
});
