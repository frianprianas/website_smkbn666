from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)

with engine.connect() as conn:
    try:
        # Since sqlite/postgres differences, and we are developing, dropping and recreating is easiest but data loss.
        # User wants "NIPY, Nama, Jabatan, Keterangan dan Foto".
        # I will attempt to add columns.
        # Check if table exists, if so alter.
        
        # 1. Add nipy
        try:
            conn.execute(text("ALTER TABLE teachers ADD COLUMN nipy VARCHAR"))
            conn.execute(text("CREATE UNIQUE INDEX ix_teachers_nipy ON teachers (nipy)"))
            print("Added nipy")
        except Exception as e:
            print(f"nipy error: {e}")

        # 2. Add position (Jabatan). If subject exists we can rename, but SQL standard Vary. Postgres: RENAME COLUMN.
        try: 
            conn.execute(text("ALTER TABLE teachers RENAME COLUMN subject TO position"))
            print("Renamed subject to position")
        except Exception as e:
            print(f"rename error (maybe already done or not supported easily): {e}")
            try:
                conn.execute(text("ALTER TABLE teachers ADD COLUMN position VARCHAR"))
                print("Added position")
            except Exception as e2:
                 print(f"add position error: {e2}")

        # 3. Add description
        try:
            conn.execute(text("ALTER TABLE teachers ADD COLUMN description TEXT"))
            print("Added description")
        except Exception as e:
            print(f"description error: {e}")
            
        conn.commit()
    except Exception as e:
        print(f"General error: {e}")
