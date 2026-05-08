import os
import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import schemas, database, models, auth

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

router = APIRouter(
    prefix="/comments",
    tags=["comments"],
)

async def scan_with_baknus_ai(text: str):
    prompt = f"""
    Bertindaklah sebagai Moderator AI yang ketat untuk website sekolah SMK Bakti Nusantara 666.
    Tugasmu adalah menyaring komentar siswa/guru.
    Deteksi apakah teks berikut mengandung kata kasar, hinaan, sara, atau tidak sopan dalam bahasa Indonesia, Inggris, Sunda, atau Jawa.
    
    Teks: "{text}"
    
    Hanya jawab dengan satu kata: "AMAN" jika sopan, atau "KASAR" jika tidak sopan.
    Jangan berikan penjelasan apapun.
    """
    try:
        response = model.generate_content(prompt)
        result = response.text.strip().upper()
        return "KASAR" in result
    except:
        return False # Jika API error, biarkan lolos atau handle sesuai kebijakan

@router.post("/", response_model=schemas.Comment)
async def create_comment(
    comment: schemas.CommentCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # 1. AI Scan (BaknusAI)
    is_rude = await scan_with_baknus_ai(comment.content)
    if is_rude:
        raise HTTPException(
            status_code=400, 
            detail="BaknusAI mendeteksi kata-kata yang kurang sopan. Mohon gunakan bahasa yang lebih santun."
        )

    # 2. Check if news exists
    news_item = db.query(models.News).filter(models.News.id == comment.news_id).first()
    if not news_item:
        raise HTTPException(status_code=404, detail="News not found")
    
    new_comment = models.Comment(
        content=comment.content,
        news_id=comment.news_id,
        user_id=current_user.id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

@router.get("/news/{news_id}", response_model=List[schemas.Comment])
def get_comments(
    news_id: int, 
    skip: int = 0, 
    limit: int = 25, 
    db: Session = Depends(database.get_db)
):
    comments = db.query(models.Comment)\
        .filter(models.Comment.news_id == news_id)\
        .order_by(models.Comment.date_posted.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    return comments

@router.put("/{comment_id}", response_model=schemas.Comment)
async def update_comment(
    comment_id: int,
    comment_update: schemas.CommentBase,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not db_comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Only owner can edit
    if db_comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this comment")
    
    # AI Scan again for the update
    is_rude = await scan_with_baknus_ai(comment_update.content)
    if is_rude:
        raise HTTPException(status_code=400, detail="BaknusAI: Update ditolak karena mengandung kata tidak sopan.")

    db_comment.content = comment_update.content
    db.commit()
    db.refresh(db_comment)
    return db_comment

@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Only author or admin can delete
    if current_user.role != "admin" and comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    
    db.delete(comment)
    db.commit()
    return None
