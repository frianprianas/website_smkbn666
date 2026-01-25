from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import schemas, database, models, auth
import shutil
import os
import uuid

router = APIRouter(
    prefix="/partners",
    tags=["partners"],
)

@router.post("/", response_model=schemas.Partner)
def create_partner(
    name: str = Form(...),
    logo: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_permission_partners)
):
    os.makedirs("static/partners", exist_ok=True)
    file_extension = os.path.splitext(logo.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = f"static/partners/{unique_filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(logo.file, buffer)
        
    logo_url = f"/static/partners/{unique_filename}"
    
    new_partner = models.Partner(name=name, logo_url=logo_url)
    db.add(new_partner)
    db.commit()
    db.refresh(new_partner)
    return new_partner

@router.get("/", response_model=List[schemas.Partner])
def read_partners(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.Partner).offset(skip).limit(limit).all()

@router.delete("/{partner_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_partner(partner_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_authorized_user)):
    partner = db.query(models.Partner).filter(models.Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    db.delete(partner)
    db.commit()
    return None
