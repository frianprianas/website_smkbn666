from database import engine
from sqlalchemy import text

def add_column():
    with engine.connect() as conn:
        try:
            # Try to add the column. If it exists, it might fail or we can catch it.
            # Postgres syntax
            conn.execute(text("ALTER TABLE users ADD COLUMN permissions VARCHAR"))
            conn.commit()
            print("Added permissions column.")
        except Exception as e:
            print(f"Column might already exist or error: {e}")

if __name__ == "__main__":
    add_column()
