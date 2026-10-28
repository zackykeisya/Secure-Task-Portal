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
  
  // State untuk Form Tambah User
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "employee" });
  const [msg, setMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // State untuk Modal Edit User
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ username: "", email: "", password: "", role: "employee" });
  const [editMsg, setEditMsg] = useState(null);

  // State untuk Modal Hapus User
  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // === CREATE USER ===
  const createUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    try {
      await api.post("/users/", {
        username: sanitizeInput(form.username),
        email: sanitizeInput(form.email),
        password: form.password,
        role: form.role,
      });
      setMsg({ type: "success", text: "Akun berhasil dibuat." });
      setForm({ username: "", email: "", password: "", role: "employee" });
      load();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.detail || "Gagal membuat akun." });
    } finally {
      setSubmitting(false);
    }
  };

  // === UPDATE USER ===
  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({ username: user.username, email: user.email, password: "", role: user.role });
    setEditMsg(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditMsg(null);
    const payload = {
      username: sanitizeInput(editForm.username),
      email: sanitizeInput(editForm.email),
      role: editForm.role,
    };
    
    if (editForm.password) {
      payload.password = editForm.password; 
    }

    try {
      await api.put(`/users/${editingUser.id}`, payload);
      setEditingUser(null);
      load();
    } catch (err) {
      setEditMsg({ type: "error", text: err.response?.data?.detail || "Gagal update user." });
    }
  };

  // === DELETE USER (Modal Konfirmasi) ===
  const openDeleteModal = (user) => {
    setDeletingUser(user);
  };

  const handleDeleteSubmit = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/users/${deletingUser.id}`);
      setDeletingUser(null); // Tutup modal jika sukses
      load();
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal menghapus user");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Dashboard Admin</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola akun karyawan dan pantau seluruh tugas yang beredar.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label="Total User" value={stats.totalUsers} accent="indigo" />
          <StatCard label="Karyawan" value={stats.employees} />
          <StatCard label="Total Tugas" value={stats.totalTasks} />
          <StatCard label="Selesai" value={stats.done} hint={`dari ${stats.totalTasks} tugas`} accent="emerald" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <section className="lg:col-span-2 space-y-6">
            {/* Form Tambah User */}
            <div className="bg-white border border-slate-200 rounded-xl">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">Buat Akun Baru</h2>
              </div>
              <form onSubmit={createUser} className="p-5 space-y-3">
                {msg && <div className={`text-xs px-3 py-2 rounded-md ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>}
                <Field label="Username"><input className="input" placeholder="mis. budi_santoso" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></Field>
                <Field label="Email"><input type="email" className="input" placeholder="nama@mlid.co.id" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
                <Field label="Password"><input type="password" className="input" placeholder="Minimal 8 karakter" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></Field>
                <Field label="Role">
                  <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </Field>
                <button disabled={submitting} className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2 rounded-md transition disabled:opacity-60">
                  {submitting ? "Menyimpan…" : "Buat Akun"}
                </button>
              </form>
            </div>

            {/* List User */}
            <div className="bg-white border border-slate-200 rounded-xl">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Pengguna</h2>
                <span className="text-xs text-slate-500">{users.length} total</span>
              </div>
              <ul className="divide-y divide-slate-100 max-h-80 overflow-auto">
                {users.map((u) => (
                  <li key={u.id} className="px-5 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition">
                    <Avatar name={u.username} role={u.role} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{u.username}</p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ring-1 ring-inset ${u.role === "admin" ? "bg-indigo-50 text-indigo-700 ring-indigo-200" : "bg-slate-50 text-slate-600 ring-slate-200"}`}>
                        {u.role}
                      </span>
                      <button onClick={() => openEditModal(u)} className="text-xs text-blue-600 hover:underline">Edit</button>
                      {/* Tombol Hapus memanggil openDeleteModal */}
                      <button onClick={() => openDeleteModal(u)} className="text-xs text-red-600 hover:underline">Hapus</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="lg:col-span-3">
            <div className="bg-white border border-slate-200 rounded-xl">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">Semua Tugas</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Dari seluruh karyawan</p>
                </div>
                <span className="text-xs text-slate-500">{tasks.length} total</span>
              </div>
              {tasks.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm text-slate-500">Belum ada tugas.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 px-5 max-h-[560px] overflow-auto">
                  {tasks.map((t) => (
                    <TaskRow key={t.id} task={t} ownerName={userMap[t.owner_id]} onDelete={deleteTask} />
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* === MODAL EDIT USER === */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-semibold text-slate-900">Edit Pengguna</h2>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-3">
              {editMsg && <div className="text-xs px-3 py-2 rounded-md bg-red-50 text-red-700">{editMsg.text}</div>}
              
              <Field label="Username">
                <input className="input" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} required />
              </Field>
              <Field label="Email">
                <input type="email" className="input" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
              </Field>
              <Field label="Password Baru (Opsional)">
                <input type="password" className="input" placeholder="Kosongkan jika tidak ingin mengubah" minLength={8} value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
              </Field>
              <Field label="Role">
                <select className="input" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </Field>

              <div className="pt-2 flex gap-2 justify-end">
                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition">Batal</button>
                <button type="submit" className="px-4 py-2 text-sm bg-slate-900 hover:bg-slate-800 text-white rounded-md transition">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === MODAL HAPUS USER (KONFIRMASI) === */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 text-center mb-1">Hapus Pengguna?</h2>
              <p className="text-sm text-slate-500 text-center mb-6">
                Anda yakin ingin menghapus <span className="font-medium text-slate-900">{deletingUser.username}</span>? Tindakan ini tidak dapat dibatalkan dan semua tugas miliknya akan terhapus.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeletingUser(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteSubmit}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition disabled:opacity-50"
                >
                  {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-700 mb-1">{label}</span>
      {children}
    </label>
  );
}