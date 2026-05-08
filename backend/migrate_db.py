import sqlite3
import os
from sqlalchemy import create_engine, text

# Konfigurasi Database (Sesuaikan dengan .env jika perlu)
DB_URL = "sqlite:///./sql_app.db" # Default path jika menggunakan SQLite

def migrate():
    print("🔍 Memulai migrasi database...")
    
    # Path database jika di luar docker vs di dalam docker
    db_path = "./sql_app.db"
    if not os.path.exists(db_path):
        print("⚠️ File database tidak ditemukan di path default. Mencoba engine SQLAlchemy...")
    
    try:
        engine = create_engine(DB_URL)
        with engine.connect() as conn:
            # Cek apakah kolom category sudah ada
            result = conn.execute(text("PRAGMA table_info(news)"))
            columns = [row[1] for row in result]
            
            if "category" not in columns:
                print("➕ Menambahkan kolom 'category' ke tabel 'news'...")
                conn.execute(text("ALTER TABLE news ADD COLUMN category TEXT DEFAULT 'Berita Utama'"))
                conn.execute(text("COMMIT"))
                print("✅ Kolom 'category' berhasil ditambahkan.")
            else:
                print("ℹ️ Kolom 'category' sudah ada. Tidak perlu migrasi.")
                
    except Exception as e:
        print(f"❌ Error saat migrasi: {e}")

if __name__ == "__main__":
    migrate()
