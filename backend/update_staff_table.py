from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE staff ADD COLUMN nipy VARCHAR"))
        conn.execute(text("CREATE UNIQUE INDEX ix_staff_nipy ON staff (nipy)"))
        conn.commit()
        print("Successfully added nipy column to staff table")
    except Exception as e:
        print(f"Error adding nipy to staff: {e}")
