import sqlite3 # Wait, they use Postgres
import os
from sqlalchemy import create_client, create_engine, text

# Use the env from docker-compose or default
DATABASE_URL = "postgresql://admin:password@localhost:5432/smkbn666"

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, title, image_url, video_url FROM news ORDER BY id DESC LIMIT 5"))
        for row in result:
            print(f"ID: {row[0]}, Title: {row[1]}, Image: {row[2]}, Video: {row[3]}")
except Exception as e:
    print(f"Error: {e}")
