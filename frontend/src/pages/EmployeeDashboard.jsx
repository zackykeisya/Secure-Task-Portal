import { useEffect, useMemo, useState } from "react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import TaskRow from "../components/TaskRow";
import { sanitizeInput } from "../utils/sanitize";

const TABS = [
  { key: "all", label: "Semua" },
  { key: "To-Do", label: "To-Do" },
  { key: "In Progress", label: "In Progress" },
  { key: "Done", label: "Done" },
];

export default function EmployeeDashboard() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "To-Do",
  });
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("all");

  const load = async () => {
    const { data } = await api.get("/tasks/");
    setTasks(data);
  };
  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    return {
      all: tasks.length,
      "To-Do": tasks.filter((t) => t.status === "To-Do").length,
      "In Progress": tasks.filter((t) => t.status === "In Progress").length,
      Done: tasks.filter((t) => t.status === "Done").length,
    };
  }, [tasks]);

  const visibleTasks = useMemo(
    () => (tab === "all" ? tasks : tasks.filter((t) => t.status === tab)),
    [tasks, tab]
  );

  const create = async (e) => {
    e.preventDefault();
    setError(null);
    const payload = {
      title: sanitizeInput(form.title),
      description: sanitizeInput(form.description),
      status: form.status,
    };
    if (!payload.title) {
      setError("Judul tidak boleh kosong.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/tasks/", payload);
      setForm({ title: "", description: "", status: "To-Do" });
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal menyimpan tugas.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await api.put(`/tasks/${id}`, { status });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t))
      );
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal mengubah status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Tugas Saya
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Catat dan kelola pekerjaan harian Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* === Form buat tugas === */}
          <section className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-xl sticky top-20">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">
                  Tugas Baru
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Akan muncul di daftar Anda.
                </p>
              </div>

              <form onSubmit={create} className="p-5 space-y-3">
                {error && (
                  <div
                    role="alert"
                    className="text-xs px-3 py-2 rounded-md bg-red-50 text-red-700"
                  >
                    {error}
                  </div>
                )}

                <Field label="Judul">
                  <input
                    className="input"
                    placeholder="mis. Cek manifest ekspor"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    required
                  />
                </Field>

                <Field label="Deskripsi (opsional)">
                  <textarea
                    className="input resize-none"
                    rows={4}
                    placeholder="Detail singkat pekerjaan…"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </Field>

                <button
                  disabled={submitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2 rounded-md transition disabled:opacity-60"
                >
                  {submitting ? "Menyimpan…" : "Tambah Tugas"}
                </button>
              </form>
            </div>
          </section>

          {/* === Daftar tugas === */}
          <section className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-xl">
              {/* Tabs */}
              <div className="px-5 pt-3 border-b border-slate-100">
                <div className="flex gap-1 -mb-px overflow-x-auto">
                  {TABS.map((t) => {
                    const active = tab === t.key;
                    return (
                      <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`whitespace-nowrap text-sm px-3 py-2.5 border-b-2 transition ${
                          active
                            ? "border-slate-900 text-slate-900 font-medium"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {t.label}
                        <span
                          className={`ml-1.5 text-xs tabular-nums ${
                            active ? "text-slate-500" : "text-slate-400"
                          }`}
                        >
                          {counts[t.key]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* List */}
              {visibleTasks.length === 0 ? (
                <div className="px-5 py-16 text-center">
                  <p className="text-sm text-slate-500">
                    {tab === "all"
                      ? "Belum ada tugas."
                      : `Tidak ada tugas dengan status "${tab}".`}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Tugas baru akan tampil di sini.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 px-5">
                  {visibleTasks.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      onStatusChange={updateStatus}
                      updating={updatingId === t.id}
                    />
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/* Sub-komponen kecil khusus halaman ini */
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-700 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}