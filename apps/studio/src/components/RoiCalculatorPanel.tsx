import { useMemo, useState } from "react";
import { BadgeDollarSign, Building2, ClipboardCheck, Download, FileText, PackageCheck, Printer } from "lucide-react";
import {
  buildingTypes,
  calculateBreatheAtriumRoi,
  createRoiExportSummary,
  formatCurrency,
  formatCurrencyRange,
  formatPaybackRange,
  formatPercent,
  getBuildingTypeLabel,
  type BuildingType,
  type RoiCalculatorInputs,
} from "../lib/roiCalculator";

const defaultInputs: RoiCalculatorInputs = {
  buildingType: "mall",
  atriumFloorAreaM2: 1800,
  atriumHeightM: 28,
  monthlyElectricityCoolingCostRm: 85000,
  atriumCoolingBurdenSharePct: 10,
  expectedCoolingReductionMinPct: 5,
  expectedCoolingReductionMaxPct: 15,
  pilotCostRm: 45000,
  retrofitCostRm: 260000,
  monitoringSubscriptionRmMonth: 2500,
  electricityEmissionsFactorKgCo2ePerKwh: 0.6,
};

type SavingsTone = "muted" | "cool" | "warm" | "gold";

export function RoiCalculatorPanel() {
  const [inputs, setInputs] = useState<RoiCalculatorInputs>(defaultInputs);
  const result = useMemo(() => calculateBreatheAtriumRoi(inputs), [inputs]);
  const summary = useMemo(() => createRoiExportSummary(result), [result]);
  const summaryJson = useMemo(() => JSON.stringify(summary, null, 2), [summary]);

  const savingsData = useMemo<Array<{ label: string; value: number; tone: SavingsTone }>>(
    () => [
      { label: "Monthly low", value: Math.round(result.monthlySavingsRangeRm.min), tone: "muted" },
      { label: "Monthly high", value: Math.round(result.monthlySavingsRangeRm.max), tone: "cool" },
      { label: "Annual low", value: Math.round(result.annualGrossSavingsRangeRm.min), tone: "warm" },
      { label: "Annual high", value: Math.round(result.annualGrossSavingsRangeRm.max), tone: "gold" },
    ],
    [result],
  );
  const maxSavingsValue = Math.max(...savingsData.map((item) => item.value), 1);

  function update<K extends keyof RoiCalculatorInputs>(key: K, value: RoiCalculatorInputs[K]) {
    setInputs((current) => ({ ...current, [key]: value }));
  }

  async function copySummaryJson() {
    try {
      await navigator.clipboard.writeText(summaryJson);
    } catch {
      downloadSummaryJson();
    }
  }

  function downloadSummaryJson() {
    const blob = new Blob([summaryJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "breatheatrium-roi-summary.assumptions.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="surface-card rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="brand-mark grid h-11 w-11 place-items-center rounded-lg text-[#090616]">
              <BadgeDollarSign size={23} />
            </div>
            <div>
              <p className="eyebrow">Business assumptions</p>
              <h3 className="mt-2 text-2xl font-black text-atrium-paper">Commercial ROI range</h3>
              <p className="body-copy mt-2 text-sm">
                Use ranges for early buyer conversations. These outputs are assumptions until a site audit and pilot
                verify them.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5">
            <label className="grid gap-2 text-sm text-atrium-cloud">
              Building type
              <select
                className="min-h-11 rounded-lg border border-white/15 bg-[#05030b]/80 px-3 font-semibold text-atrium-paper outline-none transition focus:border-[#d7ff3f]"
                onChange={(event) => update("buildingType", event.target.value as BuildingType)}
                value={inputs.buildingType}
              >
                {buildingTypes.map((type) => (
                  <option key={type} value={type}>
                    {getBuildingTypeLabel(type)}
                  </option>
                ))}
              </select>
            </label>

            <RoiSlider label="Atrium floor area" min={200} max={10000} step={100} unit="m2" value={inputs.atriumFloorAreaM2} onChange={(value) => update("atriumFloorAreaM2", value)} />
            <RoiSlider label="Atrium height" min={6} max={60} step={1} unit="m" value={inputs.atriumHeightM} onChange={(value) => update("atriumHeightM", value)} />
            <RoiSlider label="Current monthly electricity/cooling cost" min={10000} max={600000} step={5000} unit="RM" value={inputs.monthlyElectricityCoolingCostRm} onChange={(value) => update("monthlyElectricityCoolingCostRm", value)} />
            <RoiSlider label="Estimated atrium share of cooling burden" min={1} max={40} step={1} unit="%" value={inputs.atriumCoolingBurdenSharePct} onChange={(value) => update("atriumCoolingBurdenSharePct", value)} />
            <div className="grid gap-5 md:grid-cols-2">
              <RoiSlider label="Reduction range low" min={1} max={25} step={1} unit="%" value={inputs.expectedCoolingReductionMinPct} onChange={(value) => update("expectedCoolingReductionMinPct", value)} />
              <RoiSlider label="Reduction range high" min={3} max={35} step={1} unit="%" value={inputs.expectedCoolingReductionMaxPct} onChange={(value) => update("expectedCoolingReductionMaxPct", value)} />
            </div>
            <RoiSlider label="Pilot cost" min={10000} max={250000} step={5000} unit="RM" value={inputs.pilotCostRm} onChange={(value) => update("pilotCostRm", value)} />
            <RoiSlider label="Full retrofit cost" min={50000} max={1500000} step={10000} unit="RM" value={inputs.retrofitCostRm} onChange={(value) => update("retrofitCostRm", value)} />
            <RoiSlider label="Monitoring subscription" min={0} max={20000} step={500} unit="RM/month" value={inputs.monitoringSubscriptionRmMonth} onChange={(value) => update("monitoringSubscriptionRmMonth", value)} />
            <RoiSlider
              label="Electricity emissions factor"
              min={0}
              max={1.2}
              step={0.01}
              unit="kgCO2e/kWh"
              value={inputs.electricityEmissionsFactorKgCo2ePerKwh}
              onChange={(value) => update("electricityEmissionsFactorKgCo2ePerKwh", value)}
              tag="editable assumption"
            />
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ResultCard label="Monthly savings range" value={formatCurrencyRange(result.monthlySavingsRangeRm)} tag="assumption" />
            <ResultCard label="Annual savings range" value={formatCurrencyRange(result.annualGrossSavingsRangeRm)} tag="assumption" />
            <ResultCard label="Simple payback range" value={formatPaybackRange(result.simplePaybackRange)} tag="net of monitoring" />
            <ResultCard label="Atrium cooling burden" value={formatCurrency(result.atriumMonthlyCoolingBurdenRm)} tag="assumption" />
          </div>

          <div className="surface-card rounded-lg p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Savings range</p>
                <h3 className="mt-2 text-2xl font-black text-atrium-paper">No single magic number</h3>
              </div>
              <span className="status-pill rounded-lg px-3 py-2 text-xs font-black uppercase tracking-[0.14em]">
                assumptions
              </span>
            </div>
            <div className="mt-6 grid gap-4">
              {savingsData.map((item) => (
                <SavingsBar
                  key={item.label}
                  label={item.label}
                  tone={item.tone}
                  value={item.value}
                  widthPct={Math.max(6, (item.value / maxSavingsValue) * 100)}
                />
              ))}
            </div>
          </div>

          <div className="surface-card rounded-lg p-6">
            <div className="flex items-start gap-3">
              <ClipboardCheck className="mt-1 shrink-0 text-[#d7ff3f]" />
              <div>
                <p className="eyebrow">90-day pilot success threshold</p>
                <h3 className="mt-2 text-2xl font-black text-atrium-paper">
                  {formatPercent(result.pilotSuccessThreshold.minimumCoolingBurdenReductionPct)} cooling-burden reduction target
                </h3>
                <p className="body-copy mt-2">{result.pilotSuccessThreshold.thresholdStatement}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-2 md:grid-cols-2">
              {result.pilotSuccessThreshold.kpis.map((kpi) => (
                <div className="rounded-lg border border-white/12 bg-white/[0.07] px-3 py-2 text-sm text-atrium-cloud" key={kpi}>
                  {kpi}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="surface-card rounded-lg p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="eyebrow">Suggested commercial package</p>
            <h3 className="mt-2 text-3xl font-black text-atrium-paper">Audit, pilot, retrofit, monitoring</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="platform-button-secondary min-h-10 px-3" onClick={copySummaryJson}>
              <FileText size={16} />
              Copy JSON
            </button>
            <button className="platform-button-secondary min-h-10 px-3" onClick={downloadSummaryJson}>
              <Download size={16} />
              Export JSON
            </button>
            <button className="platform-button min-h-10 px-3" onClick={() => window.print()}>
              <Printer size={16} />
              Print summary
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-4">
          {result.commercialPackage.map((step) => (
            <article className="surface-card surface-card-hover rounded-lg p-5" key={step.name}>
              <PackageCheck className="text-[#d7ff3f]" size={22} />
              <h4 className="mt-4 text-xl font-black text-atrium-paper">{step.name}</h4>
              <p className="mt-2 text-sm font-black uppercase tracking-[0.12em] text-[#20f0d0]">{step.priceLabel}</p>
              <p className="body-copy mt-3 text-sm">{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="printable-roi-summary surface-card rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Building2 className="mt-1 shrink-0 text-[#d7ff3f]" />
          <div>
            <p className="eyebrow">Printable HTML summary</p>
            <h3 className="mt-2 text-2xl font-black text-atrium-paper">
              {getBuildingTypeLabel(inputs.buildingType)} atrium, {inputs.atriumFloorAreaM2.toLocaleString()} m2, {inputs.atriumHeightM} m
            </h3>
            <p className="body-copy mt-2">{result.riskNote}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <SummaryLine label="Monthly savings" value={formatCurrencyRange(result.monthlySavingsRangeRm)} />
          <SummaryLine label="Annual gross savings" value={formatCurrencyRange(result.annualGrossSavingsRangeRm)} />
          <SummaryLine label="Payback" value={formatPaybackRange(result.simplePaybackRange)} />
        </div>

        <details className="mt-5 rounded-lg border border-white/15 bg-[#05030b]/70 p-4">
          <summary className="cursor-pointer font-bold text-atrium-paper">Exportable JSON summary</summary>
          <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap text-xs leading-5 text-atrium-cloud">{summaryJson}</pre>
        </details>
      </section>
    </section>
  );
}

function RoiSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  tag = "assumption",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  tag?: string;
  onChange: (value: number) => void;
}) {
  const valueLabel = unit.startsWith("RM")
    ? `RM ${value.toLocaleString("en-MY")}${unit === "RM/month" ? " / month" : ""}`
    : `${value.toLocaleString("en-MY")} ${unit}`;

  return (
    <label className="grid gap-3 text-sm text-atrium-cloud">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <strong className="text-right text-atrium-paper">{valueLabel}</strong>
      </span>
      <input
        className="range-input w-full"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-[#20f0d0]">{tag}</span>
    </label>
  );
}

function ResultCard({ label, value, tag }: { label: string; value: string; tag: string }) {
  return (
    <article className="metric-card rounded-lg p-5">
      <p className="text-sm text-atrium-cloud">{label}</p>
      <strong className="mt-3 block text-3xl font-black leading-tight text-atrium-paper">{value}</strong>
      <span className="mt-3 block text-[11px] font-black uppercase tracking-[0.16em] text-[#20f0d0]">{tag}</span>
    </article>
  );
}

function SavingsBar({
  label,
  value,
  widthPct,
  tone,
}: {
  label: string;
  value: number;
  widthPct: number;
  tone: SavingsTone;
}) {
  const toneClass: Record<SavingsTone, string> = {
    muted: "from-white/30 to-white/10",
    cool: "from-[#20f0d0] to-cyan-200",
    warm: "from-[#ff8a3d] to-[#f2b84b]",
    gold: "from-[#d7ff3f] to-[#f2b84b]",
  };

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-atrium-cloud">{label}</span>
        <strong className="text-right text-atrium-paper">{formatCurrency(value)}</strong>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[#05030b]/80 ring-1 ring-white/10">
        <div
          className={`h-full rounded-full bg-gradient-to-r shadow-[0_0_22px_rgba(98,232,207,0.2)] ${toneClass[tone]}`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card rounded-lg p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#20f0d0]">{label}</p>
      <p className="mt-2 text-xl font-black text-atrium-paper">{value}</p>
    </div>
  );
}
