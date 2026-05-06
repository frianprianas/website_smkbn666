from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import schemas, database, models, auth
import shutil
import os
import uuid

router = APIRouter(
    prefix="/majors",
    tags=["majors"],
)

@router.post("/", response_model=schemas.Major)
def create_major(
    name: str = Form(...),
    description: str = Form(...),
    logo: Optional[UploadFile] = File(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_permission_majors)
):
    db_major = db.query(models.Major).filter(models.Major.name == name).first()
    if db_major:
        raise HTTPException(status_code=400, detail="Major already exists")
    
    logo_url = None
    if logo:
        # Create static/images directory if not exists
        os.makedirs(os.path.join("static", "images"), exist_ok=True)
        
        # Generate unique filename
        file_extension = logo.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join("static", "images", filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(logo.file, buffer)
            
        logo_url = f"/static/images/{filename}"

    new_major = models.Major(name=name, description=description, logo_url=logo_url)
    db.add(new_major)
    db.commit()
    db.refresh(new_major)
    return new_major

@router.put("/{major_id}", response_model=schemas.Major)
def update_major(
    major_id: int,
    name: str = Form(...),
    description: str = Form(...),
    logo: Optional[UploadFile] = File(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_permission_majors)
):
    db_major = db.query(models.Major).filter(models.Major.id == major_id).first()
    if not db_major:
        raise HTTPException(status_code=404, detail="Major not found")

    # Check if name is taken by another major
    existing_major = db.query(models.Major).filter(models.Major.name == name, models.Major.id != major_id).first()
    if existing_major:
        raise HTTPException(status_code=400, detail="Major name already exists")

    db_major.name = name
    db_major.description = description

    if logo:
        os.makedirs(os.path.join("static", "images"), exist_ok=True)
        
        # Start: Optional - Delete old logo if exists
        # if db_major.logo_url:
        #     old_path = db_major.logo_url.lstrip("/")
        #     if os.path.exists(old_path):
        #         os.remove(old_path)
        # End: Optional

        # Generate unique filename
        file_extension = logo.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = f"static/images/{filename}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(logo.file, buffer)
            
        db_major.logo_url = f"/static/images/{filename}"
    
    db.commit()
    db.refresh(db_major)
    return db_major

@router.get("/", response_model=List[schemas.Major])
def read_majors(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.Major).offset(skip).limit(limit).all()

@router.delete("/{major_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_major(major_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_admin)):
    major = db.query(models.Major).filter(models.Major.id == major_id).first()
    if not major:
        raise HTTPException(status_code=404, detail="Major not found")
    db.delete(major)
    db.commit()
    return None
