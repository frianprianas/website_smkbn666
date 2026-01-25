from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

def seed_testimonials():
    db = SessionLocal()
    
    # Check if we already have testimonials
    if db.query(models.Testimonial).count() > 0:
        print("Testimonials already exist.")
        return

    testimonials_data = [
        {
            "name": "Andi Saputra",
            "role": "Alumni RPL 2023",
            "content": "Sekolah ini memberikan fondasi teknis yang luar biasa. Saya langsung diterima kerja sebelum wisuda.",
            "rating": 5
        },
        {
            "name": "Siti Aminah",
            "role": "Alumni DKV 2022",
            "content": "Fasilitas lengkap dan guru yang supportif membuat saya bisa mengembangkan bakat desain saya maksimal.",
            "rating": 5
        },
        {
            "name": "Budi Santoso",
            "role": "Manager HRD PT. Tech",
            "content": "Lulusan SMK BN 666 selalu memiliki etos kerja dan hard skill yang siap pakai di industri.",
            "rating": 5
        }
    ]

    for data in testimonials_data:
        t = models.Testimonial(**data)
        db.add(t)
    
    db.commit()
    print("Seeded testimonials.")

if __name__ == "__main__":
    seed_testimonials()
