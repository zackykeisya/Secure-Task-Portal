# backend/seed.py
import traceback
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.task import Task
from app.core.security import hash_password

def seed_database():
    print("🌱 Memulai proses seeding database...")
    
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    
    try:
        # Cek apakah user admin sudah ada
        admin_user = db.query(User).filter(User.username == "admin_mitsu").first()
        if not admin_user:
            admin_user = User(
                username="admin_mitsu",
                email="admin@mitsubishilogistics.co.id",
                hashed_password=hash_password("admin123"),
                role="admin"
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print("✅ User Admin berhasil dibuat")
        else:
            print("ℹ️ User Admin sudah ada.")

        # Cek apakah user employee sudah ada
        employee_user = db.query(User).filter(User.username == "budi_employee").first()
        if not employee_user:
            employee_user = User(
                username="budi_employee",
                email="budi@mitsubishilogistics.co.id",
                hashed_password=hash_password("employee123"),
                role="employee"
            )
            db.add(employee_user)
            db.commit()
            db.refresh(employee_user)
            print("✅ User Employee berhasil dibuat")
        else:
            print("ℹ️ User Employee sudah ada.")

        # Buat dummy tasks menggunakan string status langsung
        existing_task = db.query(Task).filter(Task.owner_id == employee_user.id).first()
        if not existing_task:
            task1 = Task(
                title="Laporan Bulanan Logistik Gudang A",
                description="Merekap data masuk dan keluar barang periode bulan ini.",
                status="In Progress",  # Menggunakan string langsung sesuai rancangan tabel
                owner_id=employee_user.id
            )
            task2 = Task(
                title="Audit Keamanan Perangkat Kerja",
                description="Memeriksa pembaruan sistem pada komputer operasional.",
                status="To-Do",        # Menggunakan string langsung
                owner_id=employee_user.id
            )
            db.add_all([task1, task2])
            db.commit()
            print("✅ Dummy tasks berhasil ditambahkan!")
        else:
            print("ℹ️ Task untuk employee sudah ada.")

        print("🎉 Seeding database selesai dengan sukses!")

    except Exception as e:
        db.rollback()
        print(f"❌ Terjadi kesalahan saat seeding:")
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()