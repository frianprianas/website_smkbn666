from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE news ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE"))
        conn.commit()
        print("Column is_pinned added successfully")
    except Exception as e:
        print(f"Error (might already exist): {e}")
