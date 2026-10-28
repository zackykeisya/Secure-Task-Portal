export default function Avatar({ name = "?", role }) {
  const initials = name.slice(0, 2).toUpperCase();
  const palette =
    role === "admin"
      ? "bg-indigo-100 text-indigo-700"
      : "bg-slate-100 text-slate-700";

  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${palette}`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}