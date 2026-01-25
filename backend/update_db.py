from sqlalchemy import create_engine
from database import SQLALCHEMY_DATABASE_URL
import models

engine = create_engine(SQLALCHEMY_DATABASE_URL)

# This will create tables that don't exist yet
models.Base.metadata.create_all(bind=engine)
print("Database tables updated successfully.")
