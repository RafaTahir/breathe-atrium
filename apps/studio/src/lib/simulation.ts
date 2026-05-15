import type { Scenario } from "../types";

export function calculateScenarioMetrics(scenario: Scenario) {
  const solarHeat = (scenario.solarGainWm2 - 300) * 0.007;
  const damperRelief = scenario.damperOpeningPct * 0.06;
  const waterRelief = scenario.waterAssist ? 1.4 : 0;
  const baselinePenalty = scenario.damperOpeningPct < 20 ? 3.4 : 0;

  const zoneTempC = clamp(
    scenario.outdoorTempC + solarHeat + baselinePenalty - damperRelief - waterRelief,
    25.5,
    39.5,
  );
  const roofLayerTempC = clamp(zoneTempC + 5.5 + solarHeat * 0.8 - damperRelief * 0.25, zoneTempC + 2.2, 47);
  const comfortHoursPct = clamp(Math.round((scenario.damperOpeningPct - 15) * 0.42 + (scenario.waterAssist ? 6 : 0)), -8, 38);
  const coolingBurdenPct = clamp(Math.round((scenario.damperOpeningPct - 18) * -0.22 - (scenario.waterAssist ? 5 : 0)), -22, 8);

  return {
    zoneTempC,
    roofLayerTempC,
    comfortHoursPct,
    coolingBurdenPct,
  };
}

export function calculateMonthlySavings(
  baselineCoolingKwh: number,
  targetReductionPct: number,
  tariffPerKwh: number,
) {
  const avoidedKwh = baselineCoolingKwh * (targetReductionPct / 100);
  return {
    avoidedKwh,
    savings: avoidedKwh * tariffPerKwh,
  };
}

export type DesignInputs = {
  atriumHeightM: number;
  floorAreaM2: number;
  roofGlazingPct: number;
  occupancy: number;
  discomfortSeverity: number;
};

export function recommendDesign(inputs: DesignInputs) {
  const heatRisk = inputs.roofGlazingPct * 0.38 + inputs.discomfortSeverity * 9 + inputs.atriumHeightM * 0.5;
  const inletAreaM2 = Math.max(2.4, inputs.floorAreaM2 * 0.006 + inputs.occupancy * 0.012);
  const outletAreaM2 = inletAreaM2 * (inputs.atriumHeightM > 22 ? 1.3 : 1.12);
  const chimneyHeightM = Math.max(4, inputs.atriumHeightM * 0.28);
  const sensorCount = Math.max(8, Math.round(inputs.floorAreaM2 / 240) + 6);

  return {
    heatRisk: Math.round(heatRisk),
    inletAreaM2,
    outletAreaM2,
    chimneyHeightM,
    sensorCount,
    waterWall: inputs.discomfortSeverity >= 4 && inputs.roofGlazingPct >= 55,
    bmsIntegration: true,
  };
}

export type RoiInputs = {
  monthlyCoolingCost: number;
  atriumCoolingSharePct: number;
  expectedReductionMinPct: number;
  expectedReductionMaxPct: number;
  pilotCost: number;
  retrofitCost: number;
};

export function calculateRoi(inputs: RoiInputs) {
  const atriumMonthlyCost = inputs.monthlyCoolingCost * (inputs.atriumCoolingSharePct / 100);
  const blendedReductionPct = (inputs.expectedReductionMinPct + inputs.expectedReductionMaxPct) / 2;
  const monthlySavings = atriumMonthlyCost * (blendedReductionPct / 100);
  const annualSavings = monthlySavings * 12;
  const totalProgramCost = inputs.pilotCost + inputs.retrofitCost;
  const paybackYears = annualSavings > 0 ? totalProgramCost / annualSavings : Infinity;

  return {
    atriumMonthlyCost,
    blendedReductionPct,
    annualSavings,
    totalProgramCost,
    paybackYears,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
