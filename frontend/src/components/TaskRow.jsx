import { safeHTML } from "../utils/sanitize";
import StatusPicker from "./StatusPicker";

export default function TaskRow({ task, onStatusChange, updating }) {
  const createdLabel = task.created_at
    ? new Date(task.created_at).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <li className="py-3.5 flex items-start gap-4 group">
      <div className="flex-1 min-w-0">
        <h3
          className={`font-medium text-slate-900 truncate ${
            task.status === "Done" ? "line-through text-slate-500" : ""
          }`}
        >
          {task.title}
        </h3>

        {task.description ? (
          <p
            className="mt-1 text-sm text-slate-600 line-clamp-2"
            dangerouslySetInnerHTML={{ __html: safeHTML(task.description) }}
          />
        ) : (
          <p className="mt-1 text-sm text-slate-400 italic">
            Tanpa deskripsi
          </p>
        )}

        {createdLabel && (
          <p className="mt-1.5 text-xs text-slate-400 font-mono">
            Dibuat {createdLabel}
          </p>
        )}
      </div>

      <StatusPicker
        value={task.status}
        onChange={(s) => onStatusChange(task.id, s)}
        disabled={updating}
      />
    </li>
  );
}