from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from datetime import date, timedelta

def seed_agendas():
    db = SessionLocal()
    
    # Check if we already have agendas
    if db.query(models.Agenda).count() > 0:
        print("Agendas already exist.")
        return

    today = date.today()
    
    agendas_data = [
        {
            "title": "Rapat Koordinasi Guru",
            "description": "Pembahasan evaluasi belajar mengajar bulan ini.",
            "date": today + timedelta(days=2),
            "location": "Ruang Guru",
            "author_id": 1 
        },
        {
            "title": "Uji Kompetensi Keahlian",
            "description": "Pelaksanaan UKK untuk siswa kelas XII.",
            "date": today + timedelta(days=5),
            "location": "Laboratorium Komputer",
            "author_id": 1
        },
        {
            "title": "Pentas Seni Sekolah",
            "description": "Menampilkan bakat siswa-siswi.",
            "date": today + timedelta(days=12),
            "location": "Lapangan Utama",
            "author_id": 1
        }
    ]

    # Ensure admin exists
    admin = db.query(models.User).filter(models.User.id == 1).first()
    if not admin:
        print("Admin user not found (ID 1). Skipping seed.")
        return

    for data in agendas_data:
        t = models.Agenda(**data)
        db.add(t)
    
    db.commit()
    print("Seeded agendas.")

if __name__ == "__main__":
    seed_agendas()
