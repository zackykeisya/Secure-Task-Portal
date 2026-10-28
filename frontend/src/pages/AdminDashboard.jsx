import { useEffect, useMemo, useState } from "react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import TaskRow from "../components/TaskRow";
import Avatar from "../components/Avatar";
import { sanitizeInput } from "../utils/sanitize";

export default function AdminDashboard() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "employee",
  });
  const [msg, setMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const [t, u] = await Promise.all([api.get("/tasks/"), api.get("/users/")]);
    setTasks(t.data);
    setUsers(u.data);
  };

  useEffect(() => {
    load();
  }, []);

  const userMap = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u.username])),
    [users]
  );

  const stats = useMemo(
    () => ({
      totalUsers: users.length,
      employees: users.filter((u) => u.role === "employee").length,
      totalTasks: tasks.length,
      done: tasks.filter((t) => t.status === "Done").length,
    }),
    [users, tasks]
  );

  const deleteTask = async (id) => {
    if (!confirm("Hapus tugas ini?")) return;
    await api.delete(`/tasks/${id}`);
    load();
  };

  const createUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    try {
      await api.post("/users/", {
        username: sanitizeInput(form.username),
        email: sanitizeInput(form.email),
        password: form.password, // password tidak disanitasi
        role: form.role,
      });
      setMsg({ type: "success", text: "Akun berhasil dibuat." });
      setForm({ username: "", email: "", password: "", role: "employee" });
      load();
    } catch (err) {
      setMsg({
        type: "error",
        text: err.response?.data?.detail || "Gagal membuat akun.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // === FITUR BARU: Edit & Hapus User ===
  const updateUser = async (user) => {
    const newUsername = prompt("Ubah Username:", user.username);
    if (newUsername === null) return; 
    const newRole = prompt("Ubah Role (admin/employee):", user.role);
    if (newRole === null) return;

    try {
      await api.put(`/users/${user.id}`, {
        username: sanitizeInput(newUsername),
        role: newRole
      });
      load();
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal update user");
    }
  };

  const deleteUser = async (id) => {
    if (!confirm("Yakin ingin menghapus user ini? Semua tugas miliknya juga akan terhapus.")) return;
    try {
      await api.delete(`/users/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal menghapus user");
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Dashboard Admin
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola akun karyawan dan pantau seluruh tugas yang beredar.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label="Total User" value={stats.totalUsers} accent="indigo" />
          <StatCard label="Karyawan" value={stats.employees} />
          <StatCard label="Total Tugas" value={stats.totalTasks} />
          <StatCard
            label="Selesai"
            value={stats.done}
            hint={`dari ${stats.totalTasks} tugas`}
            accent="emerald"
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* === Kolom kiri: Buat akun + daftar user === */}
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">Buat Akun Baru</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Akun karyawan atau admin baru.
                </p>
              </div>

              <form onSubmit={createUser} className="p-5 space-y-3">
                {msg && (
                  <div
                    role="status"
                    className={`text-xs px-3 py-2 rounded-md ${
                      msg.type === "success"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {msg.text}
                  </div>
                )}

                <Field label="Username">
                  <input
                    className="input"
                    placeholder="mis. budi_santoso"
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    required
                  />
                </Field>

                <Field label="Email">
                  <input
                    type="email"
                    className="input"
                    placeholder="nama@mlid.co.id"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                  />
                </Field>

                <Field label="Password">
                  <input
                    type="password"
                    className="input"
                    placeholder="Minimal 8 karakter"
                    minLength={8}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required
                  />
                </Field>

                <Field label="Role">
                  <select
                    className="input"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </Field>

                <button
                  disabled={submitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2 rounded-md transition disabled:opacity-60"
                >
                  {submitting ? "Menyimpan…" : "Buat Akun"}
                </button>
              </form>
            </div>

            {/* Daftar user */}
            <div className="bg-white border border-slate-200 rounded-xl">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Pengguna</h2>
                <span className="text-xs text-slate-500">
                  {users.length} total
                </span>
              </div>
              <ul className="divide-y divide-slate-100 max-h-80 overflow-auto">
                {users.map((u) => (
                  <li
                    key={u.id}
                    className="px-5 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition"
                  >
                    <Avatar name={u.username} role={u.role} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {u.username}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {u.email}
                      </p>
                    </div>
                    
                    {/* Tombol Aksi CRUD */}
                    <div className="flex items-center gap-2">
                       <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ring-1 ring-inset ${
                          u.role === "admin"
                            ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
                            : "bg-slate-50 text-slate-600 ring-slate-200"
                        }`}
                      >
                        {u.role}
                      </span>
                      <button onClick={() => updateUser(u)} className="text-xs text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => deleteUser(u.id)} className="text-xs text-red-600 hover:underline">Hapus</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* === Kolom kanan: Semua tugas === */}
          <section className="lg:col-span-3">
            <div className="bg-white border border-slate-200 rounded-xl">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Semua Tugas
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dari seluruh karyawan
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  {tasks.length} total
                </span>
              </div>

              {tasks.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm text-slate-500">Belum ada tugas.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Tugas baru dari karyawan akan muncul di sini.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 px-5 max-h-[560px] overflow-auto">
                  {tasks.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      ownerName={userMap[t.owner_id]}
                      onDelete={deleteTask}
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