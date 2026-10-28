# Secure Task & Report Portal

Portal internal untuk mencatat dan mengelola tugas harian karyawan
**PT Mitsubishi Logistics Indonesia**. Fokus utama: keamanan (anti
brute-force, anti SQL injection, anti XSS) dan kontrol akses berbasis peran
(RBAC).

---

## Daftar Isi

- [Fitur](#fitur)
- [Tech Stack](#tech-stack)
- [Struktur Proyek](#struktur-proyek)
- [Prasyarat](#prasyarat)
- [Menjalankan Secara Lokal](#menjalankan-secara-lokal)
- [Akun Default (Dummy)](#akun-default-dummy)
- [Migrasi Database](#migrasi-database)
- [Endpoint API](#endpoint-api)
- [Keamanan](#keamanan)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Fitur

### Role: Admin
- Melihat **seluruh tugas** dari semua karyawan.
- Menghapus tugas siapa pun.
- **CRUD Pengguna**: Membuat, melihat, mengedit (username/email/role/password), dan menghapus akun karyawan/admin.

### Role: Employee
- Melihat, membuat, mengedit, dan menghapus **tugas miliknya sendiri**.
- Mengubah status tugas: `To-Do` → `In Progress` → `Done`.

---

## Tech Stack

### Backend
| Komponen | Teknologi |
|---|---|
| Framework | FastAPI |
| ORM | SQLAlchemy |
| Validasi | Pydantic v2 |
| Password | Passlib + Bcrypt |
| Autentikasi | PyJWT (HS256) |
| Rate limiting | SlowAPI |
| Database | PostgreSQL |

### Frontend
| Komponen | Teknologi |
|---|---|
| Build tool | Vite |
| Framework | React 18 |
| Routing | React Router 6 |
| HTTP client | Axios |
| Styling | Tailwind CSS 3 |
| Sanitasi | DOMPurify |

---

## Struktur Proyek

```
secure-task-portal/
├── backend/
│   ├── app/
│   │   ├── main.py                 # Entry point FastAPI
│   │   ├── core/                   # Config, security, deps, rate limiter
│   │   ├── db/                     # Engine & session
│   │   ├── models/                 # SQLAlchemy models (User, Task)
│   │   ├── schemas/                # Pydantic schemas
│   │   └── api/routes/             # auth, tasks, users
│   ├── requirements.txt
│   ├── seed.py                     # Script membuat akun & data dummy
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/                    # Axios instance + interceptor
│   │   ├── components/             # Navbar, ProtectedRoute, TaskRow, dll
│   │   ├── context/                # AuthContext
│   │   ├── pages/                  # Login, AdminDashboard, EmployeeDashboard
│   │   └── utils/                  # sanitize.js
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

## Prasyarat

- **Python** ≥ 3.11
- **Node.js** ≥ 20 & npm ≥ 10
- **PostgreSQL** ≥ 15 (lokal atau cloud seperti Neon/Supabase)
- **Git**

---

## Menjalankan Secara Lokal

### 1. Clone repository

```bash
git clone <repo-url> secure-task-portal
cd secure-task-portal
```

### 2. Setup database

Buat database kosong di PostgreSQL lokal atau cloud (Neon/Supabase).
Jika menggunakan Neon/Supabase, salin **Connection String** Anda.

### 3. Setup backend

```bash
cd backend

# Buat & aktifkan virtualenv
python -m venv venv
source venv/bin/activate        # Linux/macOS
# venv\Scripts\activate          # Windows

# Install dependencies
pip install -r requirements.txt

# Siapkan environment variables
cp .env.example .env
# Edit .env — isi DATABASE_URL dan SECRET_KEY
```

Generate `SECRET_KEY` yang aman:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Jalankan server:
```bash
uvicorn app.main:app --reload --port 8000
```

### 4. Seed Database (PENTING)
Buka **terminal baru** (tetap di dalam folder `backend` dengan virtualenv aktif), lalu jalankan script seed untuk membuat tabel, akun dummy, dan contoh tugas:

```bash
python seed.py
```

Jika berhasil, terminal akan menampilkan pesan sukses dan akun dummy siap digunakan.

### 5. Setup frontend

Buka terminal baru, lalu:

```bash
cd frontend
npm install
cp .env.example .env
```

Isi `.env`:
```env
VITE_API_URL=http://localhost:8000
```

Jalankan dev server:
```bash
npm run dev
```

Buka `http://localhost:5173`.

---

## Akun Default (Dummy)

Berkat script `seed.py`, Anda tidak perlu membuat akun secara manual. Gunakan kredensial berikut untuk login dan pengujian:

| Role | Username | Password | Email |
|---|---|---|---|
| **Admin** | `admin_mitsu1` | `admin123` | `admin@mitsubishilogistics.co.id` |
| **Employee** | `budi_employee` | `employee123` | `budi@mitsubishilogistics.co.id` |

> ⚠️ **Catatan Keamanan untuk Produksi:** Jika aplikasi ini akan dideploy ke publik, sangat disarankan untuk mengubah password default ini setelah login pertama.

---

## Migrasi Database

Proyek ini memakai `Base.metadata.create_all` untuk simplicity assessment.
Untuk produksi skala besar, disarankan menggunakan **Alembic**:

```bash
cd backend
source venv/bin/activate

# Inisialisasi (sekali saja)
alembic init migrations

# Edit migrations/env.py:
#   from app.db.database import Base
#   target_metadata = Base.metadata
#   (uncomment & ganti konfigurasi sqlalchemy.url)

# Generate migration dari model
alembic revision --autogenerate -m "initial schema"

# Apply
alembic upgrade head
```

---

## Endpoint API

Base URL: `http://localhost:8000`

### Autentikasi

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/api/auth/register` | – | Registrasi mandiri (role selalu `employee`) |
| POST | `/api/auth/login` | – | Login, dapat JWT. **Rate limit 5×/15 menit** |

### Tugas

Semua endpoint wajib header: `Authorization: Bearer <token>`.

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| GET | `/api/tasks/` | Admin & Employee | Admin: semua tugas · Employee: milik sendiri |
| POST | `/api/tasks/` | Admin & Employee | Buat tugas (owner = user login) |
| PUT | `/api/tasks/{id}` | Owner atau Admin | Update title/description/status |
| DELETE | `/api/tasks/{id}` | Owner atau Admin | Hapus tugas |

### Pengguna (Admin only)

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/users/` | Daftar semua pengguna |
| POST | `/api/users/` | Buat akun karyawan/admin |
| PUT | `/api/users/{id}` | Edit username/email/password/role |
| DELETE | `/api/users/{id}` | Hapus akun pengguna |

### Kode Error Umum

| Status | Arti |
|---|---|
| 400 | Validasi input gagal / duplikasi username atau email |
| 401 | Token tidak ada, kadaluarsa, atau password salah |
| 403 | Role tidak berwenang / bukan pemilik tugas |
| 404 | Resource tidak ditemukan |
| 429 | Rate limit login tercapai (tunggu 15 menit) |
| 500 | Error internal server |

---

## Keamanan

| Ancaman | Mitigasi | Lokasi |
|---|---|---|
| Brute-force login | SlowAPI 5 percobaan/15 menit per IP | `app/core/rate_limiter.py`, `app/api/routes/auth.py` |
| Password plaintext | Bcrypt hash | `app/core/security.py` |
| SQL Injection | SQLAlchemy ORM (parameterized query) | semua query |
| XSS | DOMPurify sanitize input & render | `frontend/src/utils/sanitize.js` |
| Broken access control | `require_admin` dependency + ownership check | `app/core/deps.py`, `routes/tasks.py` |
| Role escalation | Endpoint `/register` hardcode `role=employee` | `routes/auth.py` |
| Token tampering | JWT HS256 + secret dari env, expiry 60 menit | `app/core/security.py` |
| CORS abuse | Whitelist origin dari env | `app/main.py` |

### Praktik untuk Produksi
- [ ] Generate `SECRET_KEY` baru untuk environment produksi.
- [ ] Aktifkan `sslmode=require` di connection string DB (Neon/Supabase).
- [ ] Batasi `CORS_ORIGINS` ke domain frontend produksi saja.
- [ ] Ganti password admin default setelah first login.
- [ ] Aktifkan HTTPS (Render/Vercel sudah otomatis).

---

## Deployment

### 1. Database — Neon atau Supabase
1. Buat akun & project (region terdekat: Singapore).
2. Salin **connection string** (pastikan ada `?sslmode=require` dan hapus `&channel_binding=require` jika ada).

### 2. Backend — Render
1. Push repo ke GitHub.
2. Render → **New → Web Service** → pilih repo.
3. Konfigurasi:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. **Environment Variables:**
   ```
   DATABASE_URL=<dari Neon/Supabase>
   SECRET_KEY=<openssl rand -hex 32>
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   CORS_ORIGINS=https://<frontend-vercel>.vercel.app
   PYTHON_VERSION=3.12.8
   ```
   > **Catatan:** `PYTHON_VERSION` wajib di-set agar Render tidak menggunakan Python 3.14 yang menyebabkan error saat build `pydantic-core`.
5. Deploy → catat URL backend (mis. `https://secure-task-api.onrender.com`).
6. Setelah deploy pertama, jalankan seed admin via **Render Shell**:
   ```bash
   python seed.py
   ```

### 3. Frontend — Vercel
1. Vercel → **New Project** → import repo.
2. **Root Directory:** `frontend`
3. Framework preset: **Vite** (auto-detected).
4. **Environment Variables:**
   ```
   VITE_API_URL=https://secure-task-api.onrender.com
   ```
   > **Penting:** Pastikan tipe variabel adalah **Config**, bukan Secret, dan jangan ada garis miring `/` di akhir URL.
5. Deploy → buka URL, uji login.

### 4. Verifikasi Pasca-Deploy
- [ ] `GET https://<backend>/docs` → Swagger tampil.
- [ ] Login dari frontend berhasil.
- [ ] Rate limit: 6× login salah → respons 429.
- [ ] Employee tidak bisa akses `/admin` (redirect ke `/employee`).
- [ ] Employee A tidak bisa edit tugas Employee B (403).

---

## Troubleshooting

**`sqlalchemy.exc.OperationalError: could not connect to server`**
→ Cek `DATABASE_URL`. Untuk Neon/Supabase, pastikan ada `?sslmode=require`.

**Error `maturin` / `Read-only file system` saat build di Render**
→ Pastikan environment variable `PYTHON_VERSION` sudah di-set ke `3.12.8` (bukan 3.14).

**`bash: gunicorn: command not found` di Render**
→ Pastikan **Start Command** di Render di-set ke `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

**404 Not Found saat refresh halaman di Vercel**
→ Pastikan ada file `vercel.json` di dalam folder `frontend` dengan konfigurasi rewrites SPA.

**CORS error di browser**
→ Pastikan `CORS_ORIGINS` backend memuat URL frontend **persis** (termasuk `https://`, tanpa trailing slash, dan tanpa embel-embel `/login`).

---

## Lisensi & Kontak

Proyek assessment internal. Untuk pertanyaan teknis hubungi tim IT
PT Mitsubishi Logistics Indonesia.
