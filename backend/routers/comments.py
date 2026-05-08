from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import schemas, database, models, auth

router = APIRouter(
    prefix="/comments",
    tags=["comments"],
)

@router.post("/", response_model=schemas.Comment)
def create_comment(
    comment: schemas.CommentCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Check if news exists
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
def get_comments(news_id: int, db: Session = Depends(database.get_db)):
    comments = db.query(models.Comment).filter(models.Comment.news_id == news_id).order_by(models.Comment.date_posted.asc()).all()
    return comments

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
