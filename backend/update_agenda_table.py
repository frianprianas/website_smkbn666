from sqlalchemy import create_engine
from database import SQLALCHEMY_DATABASE_URL
import models

def create_table():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    models.Base.metadata.create_all(bind=engine)
    print("Successfully created/updated tables (including agendas)")

if __name__ == "__main__":
    create_table()
