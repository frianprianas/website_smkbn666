import os
import uuid
import time
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from PIL import Image
from icrawler.builtin import BingImageCrawler
import shutil

# Configuration
GALLERY_DIR = "static/gallery"
TEMP_DIR = "static/temp_bot"
os.makedirs(GALLERY_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

def validate_and_filter(file_path):
    """
    Validates the image and checks if it's likely a logo.
    Returns (True, "OK") if it's a good activity photo.
    """
    try:
        # Check file size (min 25KB for quality)
        if os.path.getsize(file_path) < 25000:
            return False, "File size too small"

        with Image.open(file_path) as img:
            img.verify() # Basic corruption check
            
        # Re-open for dimension check (verify() closes the file)
        with Image.open(file_path) as img:
            width, height = img.size
            
            # Filter out low resolution
            if width < 500 or height < 400:
                return False, f"Low resolution: {width}x{height}"
            
            # Filter out logos/icons
            # Logos are usually square-ish and small. 
            # If aspect ratio is close to 1:1 and it's not huge, it's likely a logo/profile pic.
            ratio = max(width, height) / min(width, height)
            if ratio < 1.1 and width < 800:
                return False, "Likely a logo/icon (square aspect ratio)"
            
            return True, "OK"
    except Exception as e:
        return False, str(e)

def run_gallery_bot(max_num=5):
    print("Starting Baknus Gallery Bot (Automated)...")
    db = SessionLocal()
    
    try:
        # Multiple queries for better variety
        queries = [
            'kegiatan SMK Bakti Nusantara 666',
            'siswa SMK Bakti Nusantara 666',
            'fasilitas SMK Bakti Nusantara 666',
            'SMK BN 666 Cileunyi'
        ]
        
        crawler = BingImageCrawler(storage={'root_dir': TEMP_DIR})
        for q in queries:
            print(f"Searching for: {q}")
            crawler.crawl(keyword=q, max_num=5) # 5 from each query
        
        # 2. Process Downloaded Files
        imported_count = 0
        for filename in os.listdir(TEMP_DIR):
            if imported_count >= max_num: break
            
            temp_path = os.path.join(TEMP_DIR, filename)
            if not os.path.isfile(temp_path): continue
            
            is_ok, reason = validate_and_filter(temp_path)
            if is_ok:
                # Success! Move to final gallery
                ext = filename.split('.')[-1]
                new_filename = f"auto_{uuid.uuid4().hex[:8]}.{ext}"
                final_path = os.path.join(GALLERY_DIR, new_filename)
                
                shutil.copy2(temp_path, final_path)
                
                # Add to DB
                new_gallery = models.Gallery(
                    title=f"Aktivitas BN666 - {time.strftime('%B %Y')}",
                    description=f"Otomatis diimpor oleh BaknusAI pada {time.strftime('%Y-%m-%d')}",
                    image_url=f"/static/gallery/{new_filename}"
                )
                db.add(new_gallery)
                imported_count += 1
                print(f"Imported successfully: {new_filename}")
            else:
                print(f"Skipped {filename}: {reason}")
                
        db.commit()
        print(f"\nBot finished! New images added: {imported_count}")
        
        # 3. Cleanup Temp
        for filename in os.listdir(TEMP_DIR):
            file_path = os.path.join(TEMP_DIR, filename)
            try:
                if os.path.isfile(file_path):
                    os.unlink(file_path)
            except Exception as e:
                print(f"Failed to delete {file_path}. Reason: {e}")

    finally:
        db.close()

if __name__ == "__main__":
    run_gallery_bot()
