import { motion } from "framer-motion";
import { Wind, SunMedium } from "lucide-react";

type AirflowVisualizerProps = {
  waterAssist: boolean;
  damperOpeningPct: number;
};

export function AirflowVisualizer({ waterAssist, damperOpeningPct }: AirflowVisualizerProps) {
  const speed = Math.max(2.6, 7 - damperOpeningPct / 18);

  return (
    <section className="glass relative min-h-[520px] overflow-hidden rounded-lg p-7">
      <div className="relative z-10 max-w-xl">
        <p className="text-xs font-black uppercase tracking-wider text-atrium-gold">Airflow visualizer</p>
        <h2 className="mt-3 text-3xl font-black leading-tight text-atrium-paper md:text-5xl">
          The atrium breathes through a solar-assisted stack.
        </h2>
        <p className="mt-4 text-atrium-cloud">
          Low intake feeds occupied-zone cross-flow. Solar heat strengthens the upper exhaust path while the
          BMS keeps conventional cooling available.
        </p>
      </div>

      <div className="absolute right-10 top-10 grid h-20 w-20 place-items-center rounded-full bg-atrium-gold text-atrium-ink shadow-[0_0_60px_rgba(242,184,75,0.75)]">
        <SunMedium size={34} />
      </div>

      <div className="absolute bottom-28 left-[18%] h-48 w-[52%] skew-x-[-18deg] border border-white/25 bg-white/10" />
      <div className="absolute bottom-32 right-[13%] h-72 w-20 border border-white/25 bg-atrium-solar/15" />
      <div className="absolute bottom-20 left-10 right-10 h-7 border-t border-white/30 bg-white/10" />

      {[0, 1, 2].map((item) => (
        <motion.div
          key={item}
          className="airflow-ribbon absolute h-4 rounded-full"
          style={{
            left: `${12 + item * 8}%`,
            bottom: `${150 + item * 60}px`,
            width: `${48 - item * 5}%`,
          }}
          animate={{ x: ["-8%", "16%"], opacity: [0.2, 0.9, 0.2] }}
          transition={{ duration: speed, repeat: Infinity, delay: item * -0.9, ease: "linear" }}
        />
      ))}

      <div className="absolute bottom-32 left-16 flex items-center gap-2 rounded-lg bg-atrium-ink/80 px-3 py-2 text-sm text-atrium-paper">
        <Wind size={16} />
        Low-level intake
      </div>
      <div className="absolute bottom-24 left-[42%] rounded-lg bg-atrium-ink/80 px-3 py-2 text-sm text-atrium-paper">
        Occupied zone
      </div>
      <div className="absolute right-[10%] top-44 rounded-lg bg-atrium-ink/80 px-3 py-2 text-sm text-atrium-paper">
        High exhaust
      </div>
      <div
        className={`absolute bottom-40 right-[28%] rounded-lg px-3 py-2 text-sm transition ${
          waterAssist ? "bg-atrium-mint text-atrium-ink" : "bg-atrium-ink/55 text-atrium-cloud/60"
        }`}
      >
        Water-wall assist
      </div>
    </section>
  );
}
