from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import schemas, database, models, auth
import shutil
import os
import uuid

router = APIRouter(
    prefix="/gallery",
    tags=["gallery"],
)

@router.post("/", response_model=schemas.Gallery)
def create_gallery_item(
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    image: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_permission_gallery)
):
    # Ensure static/gallery directory exists
    os.makedirs("static/gallery", exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(image.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = f"static/gallery/{unique_filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
        
    image_url = f"/static/gallery/{unique_filename}"
    
    new_item = models.Gallery(title=title, description=description, image_url=image_url)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.get("/", response_model=List[schemas.Gallery])
def read_gallery(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    gallery = db.query(models.Gallery).offset(skip).limit(limit).all()
    return gallery

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gallery_item(item_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_authorized_user)):
    item = db.query(models.Gallery).filter(models.Gallery.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Gallery item not found")
        
    # Optional: Delete file from filesystem
    # ...

    db.delete(item)
    db.commit()
    return None
