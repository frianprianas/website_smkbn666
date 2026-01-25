from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL

def add_column():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE majors ADD COLUMN logo_url VARCHAR"))
            conn.commit()
            print("Successfully added logo_url column to majors table")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    add_column()
