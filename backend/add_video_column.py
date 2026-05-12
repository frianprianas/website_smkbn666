import database
from sqlalchemy import text

def add_column():
    db = database.SessionLocal()
    try:
        print("Adding video_url column to news table...")
        db.execute(text("ALTER TABLE news ADD COLUMN IF NOT EXISTS video_url VARCHAR"))
        db.commit()
        print("Column added successfully!")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    add_column()
