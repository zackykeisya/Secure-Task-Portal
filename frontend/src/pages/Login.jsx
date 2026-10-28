import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sanitizeInput } from "../utils/sanitize";
import BrandMark from "../components/BrandMark";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const username = sanitizeInput(form.username);
      const user = await login(username, form.password);
      navigate(user.role === "admin" ? "/admin" : "/employee");
    } catch (err) {
      const status = err.response?.status;
      const msg =
        status === 429
          ? "Terlalu banyak percobaan. Coba lagi dalam 15 menit."
          : err.response?.data?.detail || "Login gagal. Periksa kembali kredensial Anda.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      {/* === Panel kiri: branding (desktop only) === */}
      <aside className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 text-white relative overflow-hidden">
        {/* subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-white/10 backdrop-blur border border-white/15 flex items-center justify-center">
            <span className="text-white text-xs font-bold tracking-tight">ST</span>
          </div>
          <span className="font-semibold tracking-tight">Secure Task Portal</span>
        </div>

        <div className="relative max-w-sm">
          <h2 className="text-3xl font-semibold leading-snug tracking-tight">
            Portal internal untuk
            <br />
            operasional harian.
          </h2>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            Catat, kelola, dan pantau tugas harian dengan aman. Akses terbatas
            untuk karyawan PT Mitsubishi Logistics Indonesia.
          </p>

          <ul className="mt-8 space-y-2.5 text-sm text-slate-300">
            <li className="flex items-center gap-2.5">
              <Dot />
              Password terenkripsi dengan Bcrypt
            </li>
            <li className="flex items-center gap-2.5">
              <Dot />
              Proteksi brute-force 5 percobaan / 15 menit
            </li>
            <li className="flex items-center gap-2.5">
              <Dot />
              Kontrol akses berbasis peran (RBAC)
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">
          © {new Date().getFullYear()} PT Mitsubishi Logistics Indonesia
        </p>
      </aside>

      {/* === Panel kanan: form === */}
      <main className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          {/* Branding mobile */}
          <div className="lg:hidden mb-8 flex items-center gap-2.5">
            <BrandMark />
            <span className="font-semibold text-slate-900 tracking-tight">
              Secure Task Portal
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              Masuk ke akun Anda
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gunakan kredensial yang diberikan admin.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {error && (
              <div
                role="alert"
                className="text-xs px-3 py-2.5 rounded-md bg-red-50 text-red-700 border border-red-100"
              >
                {error}
              </div>
            )}

            <Field label="Username">
              <input
                className="input"
                placeholder="mis. budi_santoso"
                autoComplete="username"
                autoFocus
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value })
                }
                required
              />
            </Field>

            <Field label="Password">
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                required
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2.5 rounded-md transition disabled:opacity-60 disabled:cursor-wait"
            >
              {loading ? "Memproses…" : "Masuk"}
            </button>
          </form>

          <p className="mt-8 text-xs text-slate-400 leading-relaxed">
            Dengan masuk, Anda menyetujui kebijakan penggunaan internal
            perusahaan. Aktivitas login dapat dicatat untuk keperluan audit.
          </p>
        </div>
      </main>
    </div>
  );
}

/* --- Helper kecil --- */
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-700 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function Dot() {
  return (
    <span
      className="w-1 h-1 rounded-full bg-emerald-400 shrink-0"
      aria-hidden="true"
    />
  );
}