import sys
import os

# Add the current directory and 'backend' to sys.path
sys.path.append(os.getcwd())
sys.path.append(os.getcwd())

from backend.database import SessionLocal, engine
from backend import models, auth
from sqlalchemy import text

# Create tables
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # Check if admin exists
    admin = db.query(models.User).filter(models.User.username == "admin").first()
    if not admin:
        print("Creating admin user...")
        hashed_password = auth.get_password_hash("admin123")
        admin_user = models.User(username="admin", hashed_password=hashed_password, role="admin")
        db.add(admin_user)
        db.commit()
        print("Admin user created: admin / admin123")
    else:
        print("Admin user already exists.")
        # Update password just in case
        admin.hashed_password = auth.get_password_hash("admin123")
        db.commit()
        print("Admin password reset to: admin123")

except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
