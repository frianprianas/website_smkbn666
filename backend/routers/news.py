from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import schemas, database, models, auth
import shutil
import os
import uuid

router = APIRouter(
    prefix="/news",
    tags=["news"],
)

@router.post("/", response_model=schemas.News)
def create_news(
    title: str = Form(...),
    content: str = Form(...),
    image: Optional[UploadFile] = File(None),
    video: Optional[UploadFile] = File(None),
    is_pinned: bool = Form(False),
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_permission_news)
):
    # Validation: Max 3 pinned items
    if is_pinned:
        pinned_count = db.query(models.News).filter(models.News.is_pinned == True).count()
        if pinned_count >= 3:
            raise HTTPException(status_code=400, detail="Cannot pin more than 3 news items. Pinned limit reached.")

    # Size limit check: 50MB
    MAX_SIZE = 50 * 1024 * 1024
    
    image_url = None
    if image:
        if image.size > MAX_SIZE:
            raise HTTPException(status_code=400, detail="Image file too large (Max 50MB)")
        os.makedirs(os.path.join("static", "images"), exist_ok=True)
        file_extension = os.path.splitext(image.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join("static", "images", unique_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_url = f"/static/images/{unique_filename}"

    video_url = None
    if video:
        if video.size > MAX_SIZE:
             raise HTTPException(status_code=400, detail="Video file too large (Max 50MB)")
        
        os.makedirs(os.path.join("static", "videos"), exist_ok=True)
        file_extension = os.path.splitext(video.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join("static", "videos", unique_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
        video_url = f"/static/videos/{unique_filename}"

    new_item = models.News(
        title=title, 
        content=content, 
        image_url=image_url, 
        video_url=video_url,
        is_pinned=is_pinned,
        author_id=current_user.id
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.get("/", response_model=List[schemas.News])
def read_news(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    news = db.query(models.News).order_by(models.News.is_pinned.desc(), models.News.date_posted.desc()).offset(skip).limit(limit).all()
    return news

@router.delete("/{news_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_news(news_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Only author or admin can delete
    news_item = db.query(models.News).filter(models.News.id == news_id).first()
    if not news_item:
        raise HTTPException(status_code=404, detail="News not found")
    
    if current_user.role != "admin" and news_item.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this news")
        
    db.delete(news_item)
    db.commit()
    return None
