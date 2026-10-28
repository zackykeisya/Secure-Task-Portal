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
- [Akun Default](#akun-default)
- [Migrasi Database](#migrasi-database)
- [Endpoint API](#endpoint-api)
- [Keamanan](#keamanan)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Fitur

### Role: Admin
- Melihat **seluruh tugas** dari semua karyawan
- Menghapus tugas siapa pun
- Membuat akun karyawan/admin baru
- Melihat daftar seluruh pengguna

### Role: Employee
- Melihat, membuat, mengedit, dan menghapus **tugas miliknya sendiri**
- Mengubah status tugas: `To-Do` → `In Progress` → `Done`

---

## Tech Stack

### Backend
| Komponen | Teknologi |
|---|---|
| Framework | FastAPI 0.115 |
| ORM | SQLAlchemy 2.0 |
| Validasi | Pydantic v2 |
| Password | Passlib + Bcrypt (12 rounds) |
| Autentikasi | PyJWT (HS256) |
| Rate limiting | SlowAPI |
| Database | PostgreSQL |

### Frontend
| Komponen | Teknologi |
|---|---|
| Build tool | Vite 5 |
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

Cek versi:
```bash
python --version && node --version && psql --version
```

---

## Menjalankan Secara Lokal

### 1. Clone repository

```bash
git clone <repo-url> secure-task-portal
cd secure-task-portal
```

### 2. Setup database

**Opsi A — PostgreSQL lokal:**

```bash
sudo -u postgres psql
# di psql:
CREATE DATABASE secure_task_db;
CREATE USER portal_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE secure_task_db TO portal_user;
\q
```

**Opsi B — Neon / Supabase:** buat project, salin connection string
(format: `postgresql://user:pass@host/db?sslmode=require`).

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

Isi `.env`:

```env
DATABASE_URL=postgresql://portal_user:your_strong_password@localhost:5432/secure_task_db
SECRET_KEY=<hasil-generate-di-atas>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173
```

Jalankan server:

```bash
uvicorn app.main:app --reload --port 8000
```

API tersedia di:
- `http://localhost:8000` — health check
- `http://localhost:8000/docs` — Swagger UI
- `http://localhost:8000/redoc` — ReDoc

### 4. Setup frontend

Di terminal baru:

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

## Akun Default

Tabel akan dibuat otomatis saat `uvicorn` pertama kali dijalankan
(`Base.metadata.create_all`). Namun **belum ada akun admin** — buat satu
secara manual:

```bash
cd backend
source venv/bin/activate

python - <<'PY'
from app.db.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password

db = SessionLocal()
if not db.query(User).filter(User.role == UserRole.ADMIN).first():
    db.add(User(
        username="admin",
        email="admin@mlid.co.id",
        hashed_password=hash_password("Admin#12345"),
        role=UserRole.ADMIN,
    ))
    db.commit()
    print("✓ Admin dibuat: admin / Admin#12345")
else:
    print("• Admin sudah ada.")
PY
```

> ⚠️ **Ganti password default sebelum deploy ke produksi.**

Karyawan baru dibuat melalui **Admin Dashboard** di UI, atau endpoint
`POST /api/users/`.

---

## Migrasi Database

Proyek ini memakai `Base.metadata.create_all` untuk simplicity assessment.
Untuk produksi, gunakan **Alembic**:

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

# Rollback satu step
alembic downgrade -1
```

Setelah migrasi aktif, hapus baris `Base.metadata.create_all(bind=engine)`
di `backend/app/main.py`.

---

## Endpoint API

Base URL: `http://localhost:8000`

### Autentikasi

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/api/auth/register` | – | Registrasi mandiri (role selalu `employee`) |
| POST | `/api/auth/login` | – | Login, dapat JWT. **Rate limit 5×/15 menit** |

Contoh cURL login:

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin#12345"}'
```

Response:

```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@mlid.co.id",
    "role": "admin"
  }
}
```

### Tugas

Semua endpoint wajib header: `Authorization: Bearer <token>`.

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| GET | `/api/tasks/` | Admin & Employee | Admin: semua tugas · Employee: milik sendiri |
| POST | `/api/tasks/` | Admin & Employee | Buat tugas (owner = user login) |
| PUT | `/api/tasks/{id}` | Owner atau Admin | Update title/description/status |
| DELETE | `/api/tasks/{id}` | Owner atau Admin | Hapus tugas |

Contoh:

```bash
# List tugas
curl http://localhost:8000/api/tasks/ \
  -H "Authorization: Bearer <TOKEN>"

# Buat tugas
curl -X POST http://localhost:8000/api/tasks/ \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Cek manifest","description":"Ekspor 40ft","status":"To-Do"}'

# Update status
curl -X PUT http://localhost:8000/api/tasks/1 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status":"In Progress"}'
```

### Pengguna (Admin only)

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/users/` | Daftar semua pengguna |
| POST | `/api/users/` | Buat akun karyawan/admin |

Body `POST /api/users/`:

```json
{
  "username": "budi_santoso",
  "email": "budi@mlid.co.id",
  "password": "Karyawan#1",
  "role": "employee"
}
```

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
| Password plaintext | Bcrypt hash, 12 rounds | `app/core/security.py` |
| SQL Injection | SQLAlchemy ORM (parameterized query) | semua query |
| XSS | DOMPurify sanitize input & render | `frontend/src/utils/sanitize.js` |
| Broken access control | `require_admin` dependency + ownership check | `app/core/deps.py`, `routes/tasks.py` |
| Role escalation | Endpoint `/register` hardcode `role=employee` | `routes/auth.py` |
| Token tampering | JWT HS256 + secret dari env, expiry 60 menit | `app/core/security.py` |
| CORS abuse | Whitelist origin dari env | `app/main.py` |

### Praktik untuk Produksi

- [ ] Generate `SECRET_KEY` baru untuk environment produksi
- [ ] Aktifkan `sslmode=require` di connection string DB
- [ ] Set `ACCESS_TOKEN_EXPIRE_MINUTES` ≤ 60
- [ ] Batasi `CORS_ORIGINS` ke domain frontend produksi saja
- [ ] Aktifkan HTTPS di reverse proxy (Render/Vercel sudah otomatis)
- [ ] Ganti password admin default setelah first login
- [ ] Pertimbangkan refresh token + rotation untuk sesi panjang
- [ ] Tambahkan audit log untuk login & perubahan role

---

## Deployment

### 1. Database — Neon atau Supabase

1. Buat akun & project (region terdekat: Singapore).
2. Salin **connection string** — format:
   `postgresql://user:pass@host/db?sslmode=require`.
3. Simpan sebagai env var backend nanti.

### 2. Backend — Render

1. Push repo ke GitHub.
2. Render → **New → Web Service** → pilih repo.
3. Konfigurasi:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment:** Python 3.11
4. **Environment Variables:**

   ```
   DATABASE_URL=<dari Neon/Supabase>
   SECRET_KEY=<openssl rand -hex 32>
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   CORS_ORIGINS=https://<frontend>.vercel.app
   ```
5. Deploy → catat URL backend (mis. `https://secure-task-api.onrender.com`).

Setelah deploy pertama, jalankan seed admin via **Render Shell** (copy-paste
blok python di bagian [Akun Default](#akun-default)).

### 3. Frontend — Vercel

1. Vercel → **New Project** → import repo.
2. **Root Directory:** `frontend`
3. Framework preset: **Vite** (auto-detected).
4. **Environment Variables:**

   ```
   VITE_API_URL=https://secure-task-api.onrender.com
   ```
5. Deploy → buka URL, uji login.

### 4. Verifikasi Pasca-Deploy

- [ ] `GET https://<backend>/` → `{"status":"ok"}`
- [ ] `GET https://<backend>/docs` → Swagger tampil
- [ ] Login dari frontend berhasil
- [ ] Rate limit: 6× login salah → respons 429
- [ ] Employee tidak bisa akses `/admin` (redirect ke `/employee`)
- [ ] Employee A tidak bisa edit tugas Employee B (403)

---

## Troubleshooting

**`sqlalchemy.exc.OperationalError: could not connect to server`**
→ Cek `DATABASE_URL`. Untuk Neon/Supabase, pastikan ada `?sslmode=require`.

**`InvalidTokenError` saat login**
→ `SECRET_KEY` berubah di antara issue & verify. Pastikan konsisten, hapus
`localStorage` di browser, login ulang.

**Rate limit memblokir terlalu cepat saat development**
→ SlowAPI key per-IP. Reset dengan restart `uvicorn`, atau naikkan limit
sementara di `routes/auth.py` untuk environment `dev`.

**CORS error di browser**
→ Pastikan `CORS_ORIGINS` backend memuat URL frontend **persis**
(termasuk `http://` vs `https://`, tanpa trailing slash).

**`npm run dev` error "Cannot find module 'tailwindcss'`**
→ Jalankan `npm install` ulang dari root `frontend/`.

**Frontend tampil blank setelah deploy Vercel**
→ Cek Console browser: biasanya `VITE_API_URL` salah atau belum di-set.
Env `VITE_*` di Vercel wajib **redeploy** setelah diubah.

---

## Lisensi & Kontak

Proyek assessment internal. Untuk pertanyaan teknis hubungi tim IT
PT Mitsubishi Logistics Indonesia.