import requests
from sqlalchemy.orm import Session
import database, models
import os
from dotenv import load_dotenv

load_dotenv()

MAILCOW_API_URL = os.getenv("MAILCOW_API_URL", "http://mail.smk.baktinusantara666.sch.id")
MAILCOW_API_KEY = os.getenv("MAILCOW_API_KEY", "925B68-0FF6BB-36B760-F6C051-AAF343")

def sync_mailcow_data(db: Session):
    headers = {"X-API-Key": MAILCOW_API_KEY}
    try:
        print(f"Fetching all mailboxes from {MAILCOW_API_URL}...")
        resp = requests.get(f"{MAILCOW_API_URL}/api/v1/get/mailbox/all", headers=headers)
        if resp.status_code != 200:
            print(f"Error fetching mailboxes: {resp.status_code}")
            return {"error": f"Mailcow API error: {resp.status_code}"}
        
        data = resp.json()
        if not isinstance(data, list):
            print("Unexpected response format from Mailcow")
            return {"error": "Unexpected response format"}

        teachers_created = 0
        teachers_updated = 0
        staff_created = 0
        staff_updated = 0

        for mb in data:
            tags = [t.lower() for t in mb.get("tags", [])]
            name = mb.get("name")
            nipy = mb.get("local_part")
            
            if "guru" in tags:
                # Sync to Teacher table
                teacher = db.query(models.Teacher).filter(models.Teacher.nipy == nipy).first()
                if not teacher:
                    teacher = models.Teacher(
                        nipy=nipy,
                        name=name,
                        position="Guru",
                        description="Sinkronisasi dari Mailcow"
                    )
                    db.add(teacher)
                    teachers_created += 1
                else:
                    teacher.name = name
                    teachers_updated += 1
            
            if "tu" in tags:
                # Sync to Staff table
                staff = db.query(models.Staff).filter(models.Staff.nipy == nipy).first()
                if not staff:
                    staff = models.Staff(
                        nipy=nipy,
                        name=name,
                        position="Staff TU"
                    )
                    db.add(staff)
                    staff_created += 1
                else:
                    staff.name = name
                    staff_updated += 1

        db.commit()
        return {
            "teachers": {"created": teachers_created, "updated": teachers_updated},
            "staff": {"created": staff_created, "updated": staff_updated}
        }

def get_mailcow_counts():
    headers = {"X-API-Key": MAILCOW_API_KEY}
    try:
        resp = requests.get(f"{MAILCOW_API_URL}/api/v1/get/mailbox/all", headers=headers)
        if resp.status_code != 200:
            return {"error": f"Mailcow API error: {resp.status_code}"}
        
        data = resp.json()
        if not isinstance(data, list):
            return {"error": "Unexpected response format"}

        siswa_count = 0
        staff_count = 0

        for mb in data:
            tags = [t.lower() for t in mb.get("tags", [])]
            if "siswa" in tags:
                siswa_count += 1
            if "guru" in tags or "tu" in tags:
                staff_count += 1

        return {
            "siswa": siswa_count,
            "staff": staff_count
        }

    except Exception as e:
        print(f"Count error: {e}")
        return {"error": str(e)}

    except Exception as e:
        print(f"Sync error: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    db = database.SessionLocal()
    result = sync_mailcow_data(db)
    print("Sync Result:", result)
    db.close()
