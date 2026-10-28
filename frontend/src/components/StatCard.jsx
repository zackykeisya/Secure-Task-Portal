export default function StatCard({ label, value, hint, accent = "slate" }) {
  const accents = {
    slate: "border-slate-200",
    indigo: "border-indigo-200",
    emerald: "border-emerald-200",
    amber: "border-amber-200",
  };
  return (
    <div className={`bg-white border ${accents[accent]} rounded-lg p-4`}>
      <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}