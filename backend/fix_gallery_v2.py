import os
import requests
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import uuid

# Configuration
GALLERY_DIR = "static/gallery"
os.makedirs(GALLERY_DIR, exist_ok=True)

# New stable images to fix broken ones
new_images = [
    {
        "title": "Praktik Siswa di Laboratorium Komputer",
        "url": "https://jakartahighlight.wordpress.com/wp-content/uploads/2021/07/smkbaktinusantara666.jpg",
        "desc": "Suasana produktif siswa saat melakukan praktik di laboratorium komputer modern."
    },
    {
        "title": "Kreativitas Seni & Band Sekolah",
        "url": "https://smkbn666.sch.id/static/images/band.jpg",
        "desc": "Penampilan ekstrakurikuler musik sebagai wadah kreativitas siswa."
    },
    {
        "title": "Kegiatan Sosialisasi di Aula",
        "url": "https://smkbn666.sch.id/static/images/login-bg-3.jpg",
        "desc": "Momen pembelajaran dan sosialisasi skala besar di aula sekolah."
    }
]

def fix_gallery():
    db = SessionLocal()
    try:
        # 1. Clean up broken records (optional, but good for cleanliness)
        # We can identify broken ones by their corrupted size (388 bytes) or specific titles
        # but let's just add the new ones.
        
        for img in new_images:
            print(f"Downloading: {img['title']}...")
            try:
                # Generate unique filename
                ext = img['url'].split('.')[-1].split('?')[0]
                if len(ext) > 4 or '/' in ext: ext = 'jpg'
                filename = f"fixed_{uuid.uuid4().hex[:8]}.{ext}"
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
                    print(f"Successfully fixed and imported: {img['title']}")
                else:
                    print(f"Failed to download {img['url']}: Status {response.status_code}")
            except Exception as e:
                print(f"Error processing {img['title']}: {e}")
        
        db.commit()
        print("\nGallery fix finished!")
    finally:
        db.close()

if __name__ == "__main__":
    fix_gallery()
