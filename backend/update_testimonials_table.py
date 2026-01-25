from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL
import models

def create_table():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    models.Base.metadata.create_all(bind=engine)
    print("Successfully created/updated tables (including testimonials)")

if __name__ == "__main__":
    create_table()
