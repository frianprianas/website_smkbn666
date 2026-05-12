from sqlalchemy.orm import Session
from database import SessionLocal
import models

def seed_gallery():
    db = SessionLocal()
    try:
        # List of files we already pushed to Git
        gallery_items = [
            {
                "title": "Gedung Utama SMK Bakti Nusantara 666",
                "desc": "Fasad gedung utama sekolah sebagai pusat keunggulan.",
                "url": "/static/gallery/40b42bd5-bb76-4e1b-bb31-7241ae2dd672.jpg"
            },
            {
                "title": "Prestasi Gemilang Siswa",
                "desc": "Penyerahan piala prestasi dalam ajang perlombaan.",
                "url": "/static/gallery/459a9d0f-b77f-4159-b2a2-af01434e3101.jpg"
            },
            {
                "title": "Praktik Laboratorium Komputer",
                "desc": "Siswa sedang melakukan praktik pemrograman dan desain.",
                "url": "/static/gallery/b41bbb38-361d-4d94-ad44-7a24ffb5c418.jpg"
            },
            {
                "title": "Sosialisasi Siswa di Aula",
                "desc": "Kegiatan pertemuan rutin dan sosialisasi di aula sekolah.",
                "url": "/static/gallery/d4c58f16-9562-49a1-9a9b-ced7a144856b.jpeg"
            },
            {
                "title": "Kegiatan Luar Ruangan",
                "desc": "Aktivitas lapangan dan pengembangan karakter siswa.",
                "url": "/static/gallery/f51dc379-e755-48c1-9968-8dae214926f0.jpg"
            }
        ]

        for item in gallery_items:
            # Check if already exists to avoid duplicates
            exists = db.query(models.Gallery).filter(models.Gallery.image_url == item['url']).first()
            if not exists:
                db_img = models.Gallery(
                    title=item['title'],
                    description=item['desc'],
                    image_url=item['url']
                )
                db.add(db_img)
                print(f"Added to DB: {item['title']}")
            else:
                print(f"Skipped (already exists): {item['title']}")
        
        db.commit()
        print("\nDatabase sync finished!")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_gallery()
