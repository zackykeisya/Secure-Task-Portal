export default function BrandMark({ size = "md" }) {
  const dim = size === "lg" ? "w-9 h-9 text-sm" : "w-7 h-7 text-xs";
  return (
    <div className={`${dim} rounded bg-slate-900 flex items-center justify-center`}>
      <span className="text-white font-bold tracking-tight">ST</span>
    </div>
  );
}