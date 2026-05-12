import os
import requests
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import uuid

# Configuration
GALLERY_DIR = "static/gallery"
os.makedirs(GALLERY_DIR, exist_ok=True)

# Curated list of STABLE and WORKING images
stable_images = [
    {
        "title": "Gedung Utama SMK Bakti Nusantara 666",
        "url": "https://smkbn666.sch.id/static/images/login-bg-1.jpg",
        "desc": "Pusat keunggulan pendidikan industri kreatif di Bandung Timur."
    },
    {
        "title": "Prestasi Gemilang Siswa",
        "url": "https://smkbn666.sch.id/static/images/login-bg-2.jpg",
        "desc": "Mencetak generasi unggul yang siap bersaing di dunia industri."
    },
    {
        "title": "Praktik Laboratorium Komputer",
        "url": "https://jakartahighlight.wordpress.com/wp-content/uploads/2021/07/smkbaktinusantara666.jpg",
        "desc": "Fasilitas laboratorium modern untuk menunjang kompetensi siswa."
    },
    {
        "title": "Kreativitas Seni & Band Sekolah",
        "url": "https://smkbn666.sch.id/static/images/band.jpg",
        "desc": "Wadah pengembangan minat dan bakat siswa di bidang seni."
    },
    {
        "title": "Kegiatan Sosialisasi di Aula",
        "url": "https://smkbn666.sch.id/static/images/login-bg-3.jpg",
        "desc": "Aula serbaguna sebagai pusat kegiatan dan pertemuan siswa."
    }
]

def reset_gallery():
    db = SessionLocal()
    try:
        print("Cleaning up old gallery records...")
        db.query(models.Gallery).delete()
        db.commit()
        
        for img in stable_images:
            print(f"Downloading & Importing: {img['title']}...")
            try:
                # Generate unique filename
                ext = img['url'].split('.')[-1].split('?')[0]
                if len(ext) > 4 or '/' in ext: ext = 'jpg'
                filename = f"prod_{uuid.uuid4().hex[:8]}.{ext}"
                filepath = os.path.join(GALLERY_DIR, filename)
                
                # Download
                response = requests.get(img['url'], timeout=15, headers={'User-Agent': 'Mozilla/5.0'})
                if response.status_code == 200:
                    with open(filepath, 'wb') as f:
                        f.write(response.content)
                    
                    # Add to DB
                    db_img = models.Gallery(
                        title=img['title'],
                        description=img['desc'],
                        image_url=f"/static/gallery/{filename}"
                    )
                    db.add(db_img)
                    print(f"Successfully added: {img['title']}")
                else:
                    print(f"Failed to download {img['url']}")
            except Exception as e:
                print(f"Error processing {img['title']}: {e}")
        
        db.commit()
        print("\nGallery Reset Successful!")
    finally:
        db.close()

if __name__ == "__main__":
    reset_gallery()
