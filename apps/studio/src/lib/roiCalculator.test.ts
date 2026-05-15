import { describe, expect, it } from "vitest";
import {
  calculateBreatheAtriumRoi,
  createRoiExportSummary,
  formatCurrencyRange,
  formatPaybackRange,
  normalizeReductionRange,
  type RoiCalculatorInputs,
} from "./roiCalculator";

const baseInputs: RoiCalculatorInputs = {
  buildingType: "mall",
  atriumFloorAreaM2: 1800,
  atriumHeightM: 28,
  monthlyElectricityCoolingCostRm: 100000,
  atriumCoolingBurdenSharePct: 10,
  expectedCoolingReductionMinPct: 5,
  expectedCoolingReductionMaxPct: 15,
  pilotCostRm: 50000,
  retrofitCostRm: 250000,
  monitoringSubscriptionRmMonth: 1000,
  electricityEmissionsFactorKgCo2ePerKwh: 0.6,
};

describe("roiCalculator", () => {
  it("calculates monthly and annual savings as ranges", () => {
    const result = calculateBreatheAtriumRoi(baseInputs);

    expect(result.atriumMonthlyCoolingBurdenRm).toBe(10000);
    expect(result.monthlySavingsRangeRm).toEqual({ min: 500, max: 1500 });
    expect(result.annualGrossSavingsRangeRm).toEqual({ min: 6000, max: 18000 });
    expect(result.annualMonitoringCostRm).toBe(12000);
    expect(result.annualNetSavingsRangeRm).toEqual({ min: 0, max: 6000 });
  });

  it("uses net annual savings after monitoring for payback", () => {
    const result = calculateBreatheAtriumRoi({
      ...baseInputs,
      monitoringSubscriptionRmMonth: 0,
    });

    expect(result.simplePaybackRange.optimisticYears).toBeCloseTo(16.666, 2);
    expect(result.simplePaybackRange.conservativeYears).toBe(50);
  });

  it("returns null payback when net savings are not positive", () => {
    const result = calculateBreatheAtriumRoi(baseInputs);

    expect(result.simplePaybackRange.optimisticYears).toBe(50);
    expect(result.simplePaybackRange.conservativeYears).toBeNull();
    expect(formatPaybackRange(result.simplePaybackRange)).toBe("50.0+ years");
  });

  it("normalizes inverted and out-of-bound reduction ranges", () => {
    expect(normalizeReductionRange(25, 5)).toEqual({ min: 5, max: 25 });
    expect(normalizeReductionRange(-5, 120)).toEqual({ min: 0, max: 100 });
  });

  it("exports a clearly labeled assumptions summary", () => {
    const summary = createRoiExportSummary(calculateBreatheAtriumRoi(baseInputs));

    expect(summary.dataStatus).toBe("assumptions_not_measured");
    expect(summary.buildingType).toBe("Mall");
    expect(summary.assumptions.electricityEmissionsFactorKgCo2ePerKwh.label).toBe("editable assumption");
    expect(summary.outputs.riskNote).toContain("Actual savings require site audit");
  });

  it("formats ranges without false decimal precision", () => {
    expect(formatCurrencyRange({ min: 1200.1, max: 2400.8 })).toBe("RM 1,200 - RM 2,401");
  });
});
