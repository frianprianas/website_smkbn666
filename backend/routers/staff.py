from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import schemas, database, models, auth
import shutil
import os
import uuid

router = APIRouter(
    prefix="/staff",
    tags=["staff"],
)

from sync_mailcow_data import sync_mailcow_data

@router.post("/sync")
def sync_with_mailcow(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_admin)):
    result = sync_mailcow_data(db)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

# Unique Structural Positions
UNIQUE_POSITIONS = [
    "Kepala Sekolah",
    "Wakasek Bid Kurikulum",
    "Wakasek Bid Kesiswaan",
    "Wakasek Bid Sarpras",
    "Wakasek Bid Hubin",
    "Kepala Komli RPL",
    "Kepala Komli DKV",
    "Kepala Komli Animasi",
    "Kepala Komli AKT",
    "Kepala Komli Pemasaran",
    "Kepala Urusan TU",
    "Koordinator Keagamaan"
]

@router.post("/teachers/", response_model=schemas.Teacher)
def create_teacher(
    nipy: str = Form(...),
    name: str = Form(...),
    position: str = Form(...),
    description: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_admin)
):
    # Check UNIQUE position constraint
    if position in UNIQUE_POSITIONS:
        existing = db.query(models.Teacher).filter(models.Teacher.position == position).first()
        if existing:
            raise HTTPException(
                status_code=400, 
                detail=f"Jabatan '{position}' sudah diisi oleh {existing.name}. Jabatan ini hanya boleh diisi oleh 1 orang."
            )

    # Check NIPY uniqueness
    if db.query(models.Teacher).filter(models.Teacher.nipy == nipy).first():
        raise HTTPException(status_code=400, detail="NIPY already exists")

    photo_url = None
    if photo:
        os.makedirs(os.path.join("static", "teachers"), exist_ok=True)
        
        # Generate unique filename
        file_extension = os.path.splitext(photo.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join("static", "teachers", unique_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        photo_url = f"/static/teachers/{unique_filename}"

    new_teacher = models.Teacher(
        nipy=nipy,
        name=name,
        position=position,
        description=description,
        photo_url=photo_url
    )
    db.add(new_teacher)
    db.commit()
    db.refresh(new_teacher)
    return new_teacher

@router.get("/teachers/", response_model=List[schemas.Teacher])
def read_teachers(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.Teacher).offset(skip).limit(limit).all()

@router.delete("/teachers/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_teacher(teacher_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_admin)):
    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    db.delete(teacher)
    db.commit()
    return None

# Staff endpoints reuse specific logic or just generic CRUD.
# Since user asked about "Kepala Urusan TU" in teacher positions, I put it there.
# For generic staff:
@router.post("/staff/", response_model=schemas.Staff)
def create_staff(
    name: str = Form(...),
    position: str = Form(...),
    nipy: Optional[str] = Form(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_admin)
):
    # For now, generic Staff has no strict unique constraint requests, only Teachers.
    new_staff = models.Staff(name=name, position=position, nipy=nipy)
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)
    return new_staff

@router.get("/staff/", response_model=List[schemas.Staff])
def read_staff(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.Staff).offset(skip).limit(limit).all()

@router.delete("/staff/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_staff(staff_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_admin)):
    staff = db.query(models.Staff).filter(models.Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    db.delete(staff)
    db.commit()
    return None
