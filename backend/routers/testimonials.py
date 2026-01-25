from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import schemas, database, models, auth
import shutil
import os
import uuid

router = APIRouter(
    prefix="/testimonials",
    tags=["testimonials"],
)

@router.post("/", response_model=schemas.Testimonial)
def create_testimonial(
    name: str = Form(...),
    role: str = Form(...),
    content: str = Form(...),
    rating: int = Form(5),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_authorized_user)
):
    image_url = None
    if image:
        # Create static/testimonials directory if not exists
        os.makedirs("static/testimonials", exist_ok=True)
        
        # Generate unique filename
        file_extension = image.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = f"static/testimonials/{filename}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
            
        image_url = f"/static/testimonials/{filename}"
        
    new_testimonial = models.Testimonial(
        name=name,
        role=role,
        content=content,
        rating=rating,
        image_url=image_url
    )
    db.add(new_testimonial)
    db.commit()
    db.refresh(new_testimonial)
    return new_testimonial

@router.get("/", response_model=List[schemas.Testimonial])
def read_testimonials(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.Testimonial).offset(skip).limit(limit).all()

@router.delete("/{testimonial_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_testimonial(testimonial_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_authorized_user)):
    testimonial = db.query(models.Testimonial).filter(models.Testimonial.id == testimonial_id).first()
    if not testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    
    # Optional: Delete image file
    # if testimonial.image_url:
    #     ...

    db.delete(testimonial)
    db.commit()
    return None

@router.put("/{testimonial_id}", response_model=schemas.Testimonial)
def update_testimonial(
    testimonial_id: int,
    name: str = Form(...),
    role: str = Form(...),
    content: str = Form(...),
    rating: int = Form(5),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_authorized_user)
):
    db_testimonial = db.query(models.Testimonial).filter(models.Testimonial.id == testimonial_id).first()
    if not db_testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")

    db_testimonial.name = name
    db_testimonial.role = role
    db_testimonial.content = content
    db_testimonial.rating = rating

    if image:
        os.makedirs("static/testimonials", exist_ok=True)
        file_extension = image.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = f"static/testimonials/{filename}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
            
        db_testimonial.image_url = f"/static/testimonials/{filename}"

    db.commit()
    db.refresh(db_testimonial)
    return db_testimonial
