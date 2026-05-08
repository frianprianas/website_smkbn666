from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

# Pastikan tabel sudah ada
models.Base.metadata.create_all(bind=engine)

def seed_sources():
    db = SessionLocal()
    try:
        # Cek jika sudah ada data
        if db.query(models.AINewsSource).count() > 0:
            print("Database sudah terisi sumber berita. Melewati seeding.")
            return

        sources = [
            {
                "name": "Detik Inet",
                "rss_url": "https://www.detik.com/terpopuler/inet/rss",
                "is_active": True
            },
            {
                "name": "Kompas Tekno",
                "rss_url": "https://tekno.kompas.com/rss/all.xml",
                "is_active": True
            },
            {
                "name": "CNN Indonesia Teknologi",
                "rss_url": "https://www.cnnindonesia.com/teknologi/rss",
                "is_active": True
            },
            {
                "name": "CNBC Indonesia Ekonomi",
                "rss_url": "https://www.cnbcindonesia.com/news/rss",
                "is_active": True
            },
            {
                "name": "Edutopia (World Education)",
                "rss_url": "https://www.edutopia.org/rss.xml",
                "is_active": True
            }
        ]

        for source_data in sources:
            source = models.AINewsSource(**source_data)
            db.add(source)
        
        db.commit()
        print("✅ 5 Sumber Berita Berhasil Ditambahkan ke Database!")
    except Exception as e:
        print(f"❌ Error saat seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_sources()
