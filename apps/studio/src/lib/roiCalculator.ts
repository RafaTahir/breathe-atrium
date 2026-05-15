export const buildingTypes = [
  "mall",
  "university",
  "government_office",
  "hotel",
  "office_tower",
  "airport_transport_hub",
] as const;

export type BuildingType = (typeof buildingTypes)[number];

export type RoiCalculatorInputs = {
  buildingType: BuildingType;
  atriumFloorAreaM2: number;
  atriumHeightM: number;
  monthlyElectricityCoolingCostRm: number;
  atriumCoolingBurdenSharePct: number;
  expectedCoolingReductionMinPct: number;
  expectedCoolingReductionMaxPct: number;
  pilotCostRm: number;
  retrofitCostRm: number;
  monitoringSubscriptionRmMonth: number;
  electricityEmissionsFactorKgCo2ePerKwh: number;
};

export type MoneyRange = {
  min: number;
  max: number;
};

export type PaybackRange = {
  optimisticYears: number | null;
  conservativeYears: number | null;
};

export type PilotSuccessThreshold = {
  durationDays: number;
  minimumCoolingBurdenReductionPct: number;
  targetMonthlySavingsRangeRm: MoneyRange;
  thresholdStatement: string;
  kpis: string[];
};

export type CommercialPackageStep = {
  name: "Audit" | "Pilot" | "Retrofit" | "Monitoring";
  priceLabel: string;
  description: string;
};

export type RoiCalculationResult = {
  inputs: RoiCalculatorInputs;
  labels: {
    allFinancialOutputs: "assumption";
    emissionsFactor: "editable assumption";
  };
  atriumMonthlyCoolingBurdenRm: number;
  monthlySavingsRangeRm: MoneyRange;
  annualGrossSavingsRangeRm: MoneyRange;
  annualMonitoringCostRm: number;
  annualNetSavingsRangeRm: MoneyRange;
  simplePaybackRange: PaybackRange;
  pilotSuccessThreshold: PilotSuccessThreshold;
  commercialPackage: CommercialPackageStep[];
  riskNote: string;
};

const buildingTypeLabels: Record<BuildingType, string> = {
  mall: "Mall",
  university: "University",
  government_office: "Government office",
  hotel: "Hotel",
  office_tower: "Office tower",
  airport_transport_hub: "Airport / transport hub",
};

const riskNote = "Actual savings require site audit, sensor measurement, and post-install verification.";

export function getBuildingTypeLabel(type: BuildingType) {
  return buildingTypeLabels[type];
}

export function normalizeReductionRange(minPct: number, maxPct: number) {
  const min = clamp(Math.min(minPct, maxPct), 0, 100);
  const max = clamp(Math.max(minPct, maxPct), 0, 100);
  return { min, max };
}

export function calculateBreatheAtriumRoi(inputs: RoiCalculatorInputs): RoiCalculationResult {
  const reduction = normalizeReductionRange(inputs.expectedCoolingReductionMinPct, inputs.expectedCoolingReductionMaxPct);
  const atriumShare = clamp(inputs.atriumCoolingBurdenSharePct, 0, 100);
  const monthlyCoolingCost = nonNegative(inputs.monthlyElectricityCoolingCostRm);
  const atriumMonthlyCoolingBurdenRm = monthlyCoolingCost * (atriumShare / 100);
  const monthlySavingsRangeRm = {
    min: atriumMonthlyCoolingBurdenRm * (reduction.min / 100),
    max: atriumMonthlyCoolingBurdenRm * (reduction.max / 100),
  };
  const annualGrossSavingsRangeRm = {
    min: monthlySavingsRangeRm.min * 12,
    max: monthlySavingsRangeRm.max * 12,
  };
  const annualMonitoringCostRm = nonNegative(inputs.monitoringSubscriptionRmMonth) * 12;
  const annualNetSavingsRangeRm = {
    min: Math.max(0, annualGrossSavingsRangeRm.min - annualMonitoringCostRm),
    max: Math.max(0, annualGrossSavingsRangeRm.max - annualMonitoringCostRm),
  };
  const upfrontCostRm = nonNegative(inputs.pilotCostRm) + nonNegative(inputs.retrofitCostRm);

  return {
    inputs: {
      ...inputs,
      atriumCoolingBurdenSharePct: atriumShare,
      expectedCoolingReductionMinPct: reduction.min,
      expectedCoolingReductionMaxPct: reduction.max,
      monthlyElectricityCoolingCostRm: monthlyCoolingCost,
      pilotCostRm: nonNegative(inputs.pilotCostRm),
      retrofitCostRm: nonNegative(inputs.retrofitCostRm),
      monitoringSubscriptionRmMonth: nonNegative(inputs.monitoringSubscriptionRmMonth),
      electricityEmissionsFactorKgCo2ePerKwh: nonNegative(inputs.electricityEmissionsFactorKgCo2ePerKwh),
    },
    labels: {
      allFinancialOutputs: "assumption",
      emissionsFactor: "editable assumption",
    },
    atriumMonthlyCoolingBurdenRm,
    monthlySavingsRangeRm,
    annualGrossSavingsRangeRm,
    annualMonitoringCostRm,
    annualNetSavingsRangeRm,
    simplePaybackRange: {
      optimisticYears: annualNetSavingsRangeRm.max > 0 ? upfrontCostRm / annualNetSavingsRangeRm.max : null,
      conservativeYears: annualNetSavingsRangeRm.min > 0 ? upfrontCostRm / annualNetSavingsRangeRm.min : null,
    },
    pilotSuccessThreshold: createPilotSuccessThreshold(reduction.min, monthlySavingsRangeRm),
    commercialPackage: createCommercialPackage(inputs),
    riskNote,
  };
}

export function createRoiExportSummary(result: RoiCalculationResult) {
  return {
    project: "BreatheAtrium Studio ROI Calculator",
    dataStatus: "assumptions_not_measured",
    buildingType: getBuildingTypeLabel(result.inputs.buildingType),
    assumptions: {
      atriumFloorAreaM2: result.inputs.atriumFloorAreaM2,
      atriumHeightM: result.inputs.atriumHeightM,
      monthlyElectricityCoolingCostRm: result.inputs.monthlyElectricityCoolingCostRm,
      atriumCoolingBurdenSharePct: result.inputs.atriumCoolingBurdenSharePct,
      expectedCoolingReductionRangePct: {
        min: result.inputs.expectedCoolingReductionMinPct,
        max: result.inputs.expectedCoolingReductionMaxPct,
      },
      pilotCostRm: result.inputs.pilotCostRm,
      retrofitCostRm: result.inputs.retrofitCostRm,
      monitoringSubscriptionRmMonth: result.inputs.monitoringSubscriptionRmMonth,
      electricityEmissionsFactorKgCo2ePerKwh: {
        value: result.inputs.electricityEmissionsFactorKgCo2ePerKwh,
        label: result.labels.emissionsFactor,
      },
    },
    outputs: {
      atriumMonthlyCoolingBurdenRm: roundCurrency(result.atriumMonthlyCoolingBurdenRm),
      monthlySavingsRangeRm: roundRange(result.monthlySavingsRangeRm),
      annualGrossSavingsRangeRm: roundRange(result.annualGrossSavingsRangeRm),
      annualMonitoringCostRm: roundCurrency(result.annualMonitoringCostRm),
      annualNetSavingsRangeRm: roundRange(result.annualNetSavingsRangeRm),
      simplePaybackRangeYears: {
        optimistic: roundYearsOrNull(result.simplePaybackRange.optimisticYears),
        conservative: roundYearsOrNull(result.simplePaybackRange.conservativeYears),
      },
      pilotSuccessThreshold: result.pilotSuccessThreshold,
      commercialPackage: result.commercialPackage,
      riskNote: result.riskNote,
    },
  };
}

function createPilotSuccessThreshold(
  minimumCoolingBurdenReductionPct: number,
  targetMonthlySavingsRangeRm: MoneyRange,
): PilotSuccessThreshold {
  return {
    durationDays: 90,
    minimumCoolingBurdenReductionPct,
    targetMonthlySavingsRangeRm,
    thresholdStatement: `Pilot should demonstrate at least ${formatPercent(minimumCoolingBurdenReductionPct)} cooling-burden reduction against a weather-aware baseline before savings are claimed.`,
    kpis: [
      "Matched-weather pre/post atrium temperature profile",
      "Occupied-zone comfort hours",
      "Roof-layer heat build-up",
      "Humidity and CO2 stability",
      "HVAC runtime or cooling-load proxy",
      "Facilities team acceptance",
    ],
  };
}

function createCommercialPackage(inputs: RoiCalculatorInputs): CommercialPackageStep[] {
  return [
    {
      name: "Audit",
      priceLabel: "Paid feasibility scope",
      description: `${getBuildingTypeLabel(inputs.buildingType)} atrium survey, airflow diagnosis, sensor plan, and retrofit concept.`,
    },
    {
      name: "Pilot",
      priceLabel: `RM ${formatCompactMoney(nonNegative(inputs.pilotCostRm))} assumed`,
      description: "90-day instrumented pilot with baseline, commissioning, and decision-gate report.",
    },
    {
      name: "Retrofit",
      priceLabel: `RM ${formatCompactMoney(nonNegative(inputs.retrofitCostRm))} assumed`,
      description: "Low-level intake, high-level outlet, solar chimney path, optional water wall, and BMS handoff.",
    },
    {
      name: "Monitoring",
      priceLabel: `RM ${formatCompactMoney(nonNegative(inputs.monitoringSubscriptionRmMonth))} / month assumed`,
      description: "Dashboard subscription, reporting, anomaly review, and seasonal optimization support.",
    },
  ];
}

export function formatCurrency(value: number) {
  return `RM ${roundCurrency(value).toLocaleString("en-MY")}`;
}

export function formatCurrencyRange(range: MoneyRange) {
  return `${formatCurrency(range.min)} - ${formatCurrency(range.max)}`;
}

export function formatPaybackRange(range: PaybackRange) {
  const optimistic = roundYearsOrNull(range.optimisticYears);
  const conservative = roundYearsOrNull(range.conservativeYears);

  if (optimistic === null && conservative === null) return "Not yet positive";
  if (optimistic !== null && conservative === null) return `${optimistic.toFixed(1)}+ years`;
  if (optimistic === null || conservative === null) return "Not yet positive";
  return `${optimistic.toFixed(1)} - ${conservative.toFixed(1)} years`;
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function roundRange(range: MoneyRange) {
  return {
    min: roundCurrency(range.min),
    max: roundCurrency(range.max),
  };
}

function roundCurrency(value: number) {
  return Math.round(value);
}

function roundYearsOrNull(value: number | null) {
  return value === null || !Number.isFinite(value) ? null : Math.round(value * 10) / 10;
}

function formatCompactMoney(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return `${Math.round(value)}`;
}

function nonNegative(value: number) {
  return Math.max(0, value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
