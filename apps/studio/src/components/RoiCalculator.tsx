import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { calculateMonthlySavings } from "../lib/simulation";

export function RoiCalculator() {
  const [baselineCoolingKwh, setBaselineCoolingKwh] = useState(18000);
  const [targetReductionPct, setTargetReductionPct] = useState(8);
  const [tariffPerKwh, setTariffPerKwh] = useState(0.42);

  const result = useMemo(
    () => calculateMonthlySavings(baselineCoolingKwh, targetReductionPct, tariffPerKwh),
    [baselineCoolingKwh, targetReductionPct, tariffPerKwh],
  );

  return (
    <section className="glass rounded-lg p-6">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-atrium-gold text-atrium-ink">
          <Calculator size={22} />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-atrium-gold">ROI calculator</p>
          <h2 className="mt-2 text-2xl font-black text-atrium-paper">Assumed cooling-burden scenario</h2>
          <p className="mt-2 text-sm text-atrium-cloud">
            This calculator is for pitch exploration only. Replace assumptions with measured pilot data.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5">
        <label className="grid gap-2 text-sm text-atrium-cloud">
          Baseline atrium-related cooling load, kWh/month
          <input
            className="w-full accent-atrium-gold"
            type="range"
            min="5000"
            max="60000"
            step="1000"
            value={baselineCoolingKwh}
            onChange={(event) => setBaselineCoolingKwh(Number(event.target.value))}
          />
          <span className="font-semibold text-atrium-paper">{baselineCoolingKwh.toLocaleString()} kWh assumed</span>
        </label>

        <label className="grid gap-2 text-sm text-atrium-cloud">
          Target cooling-burden reduction
          <input
            className="w-full accent-atrium-gold"
            type="range"
            min="1"
            max="20"
            step="1"
            value={targetReductionPct}
            onChange={(event) => setTargetReductionPct(Number(event.target.value))}
          />
          <span className="font-semibold text-atrium-paper">{targetReductionPct}% pilot target</span>
        </label>

        <label className="grid gap-2 text-sm text-atrium-cloud">
          Blended tariff
          <input
            className="w-full accent-atrium-gold"
            type="range"
            min="0.2"
            max="0.9"
            step="0.01"
            value={tariffPerKwh}
            onChange={(event) => setTariffPerKwh(Number(event.target.value))}
          />
          <span className="font-semibold text-atrium-paper">RM {tariffPerKwh.toFixed(2)} / kWh assumed</span>
        </label>
      </div>

      <div className="mt-6 rounded-lg border border-white/15 bg-white/10 p-5">
        <p className="text-sm uppercase tracking-wide text-atrium-solar">Estimated monthly avoided cost</p>
        <strong className="mt-2 block text-4xl font-black text-atrium-paper">
          RM {Math.round(result.savings).toLocaleString()}
        </strong>
        <p className="mt-2 text-sm text-atrium-cloud">
          {Math.round(result.avoidedKwh).toLocaleString()} kWh/month avoided, assumed.
        </p>
      </div>
    </section>
  );
}
