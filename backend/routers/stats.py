from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import database, models
from sync_mailcow_data import get_mailcow_counts

router = APIRouter(
    prefix="/stats",
    tags=["stats"],
)

@router.get("/")
def get_stats(db: Session = Depends(database.get_db)):
    # Get dynamic counts from Mailcow
    mailcow_stats = get_mailcow_counts()
    
    # Get other counts from Database
    majors_count = db.query(models.Major).count()
    partners_count = db.query(models.Partner).count()
    
    # Fallback to defaults if Mailcow fails
    siswa = mailcow_stats.get("siswa", 1500) if "error" not in mailcow_stats else 1500
    staff = mailcow_stats.get("staff", 120) if "error" not in mailcow_stats else 120
    
    return [
        {"label": "Siswa Aktif", "value": siswa, "suffix": "+", "icon": "Users"},
        {"label": "Guru & Staff", "value": staff, "suffix": "+", "icon": "School"},
        {"label": "Program Keahlian", "value": majors_count or 5, "suffix": "", "icon": "BookOpen"},
        {"label": "Mitra Industri", "value": partners_count or 50, "suffix": "+", "icon": "Award"}
    ]
