const CYCLE = {
  "To-Do": "In Progress",
  "In Progress": "Done",
  Done: "To-Do",
};

const style = {
  "To-Do": "bg-slate-100 text-slate-700 ring-slate-200 hover:bg-slate-200",
  "In Progress": "bg-amber-50 text-amber-700 ring-amber-200 hover:bg-amber-100",
  Done: "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100",
};

const dot = {
  "To-Do": "bg-slate-400",
  "In Progress": "bg-amber-500",
  Done: "bg-emerald-500",
};

export default function StatusPicker({ value, onChange, disabled }) {
  const next = CYCLE[value] || "To-Do";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(next)}
      title={`Ubah ke "${next}"`}
      className={`text-[11px] font-medium px-2.5 py-1 rounded-full ring-1 ring-inset
                  inline-flex items-center gap-1.5 transition
                  disabled:opacity-50 disabled:cursor-wait
                  ${style[value] || style["To-Do"]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot[value] || dot["To-Do"]}`} />
      {value}
    </button>
  );
}