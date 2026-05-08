import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Muat environment variables
load_dotenv()

# Ambil DATABASE_URL dari .env (biasanya postgresql://user:pass@db/dbname)
DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    print(f"🔍 Memulai migrasi database pada: {DATABASE_URL.split('@')[-1] if DATABASE_URL else 'Unknown'}")
    
    if not DATABASE_URL:
        print("❌ Error: DATABASE_URL tidak ditemukan di .env!")
        return

    try:
        # Gunakan engine yang sesuai (Postgres/MySQL/SQLite)
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            # Cek kolom untuk Postgres
            print("🧐 Mengecek tabel 'news'...")
            
            # Query universal untuk cek kolom
            check_sql = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='news' AND column_name='category';
            """)
            
            result = conn.execute(check_sql).fetchone()
            
            if not result:
                print("➕ Menambahkan kolom 'category' ke tabel 'news'...")
                # Syntax Postgres/Standard SQL
                conn.execute(text("ALTER TABLE news ADD COLUMN category VARCHAR(255) DEFAULT 'Berita Utama';"))
                conn.execute(text("COMMIT;"))
                print("✅ Kolom 'category' berhasil ditambahkan ke PostgreSQL.")
            else:
                print("ℹ️ Kolom 'category' sudah ada. Tidak perlu migrasi.")
                
    except Exception as e:
        print(f"❌ Error saat migrasi: {e}")

if __name__ == "__main__":
    migrate()
