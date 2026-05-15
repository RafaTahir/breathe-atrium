type MetricCardProps = {
  label: string;
  value: string;
  tag: "simulated" | "assumed" | "pilot target";
};

export function MetricCard({ label, value, tag }: MetricCardProps) {
  return (
    <article className="glass rounded-lg p-5">
      <p className="text-sm text-atrium-cloud">{label}</p>
      <strong className="mt-3 block text-4xl font-black leading-none text-atrium-paper">{value}</strong>
      <span className="mt-3 block text-xs font-semibold uppercase tracking-wide text-atrium-solar">{tag}</span>
    </article>
  );
}
