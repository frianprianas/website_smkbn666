from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import schemas, database, models, auth

router = APIRouter(
    prefix="/ai-bot",
    tags=["ai-bot"],
)

@router.get("/sources", response_model=List[schemas.AINewsSource])
def get_sources(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_admin)):
    return db.query(models.AINewsSource).all()

@router.post("/sources", response_model=schemas.AINewsSource)
def create_source(source: schemas.AINewsSourceCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_admin)):
    # Check limit of 5
    count = db.query(models.AINewsSource).count()
    if count >= 5:
        raise HTTPException(status_code=400, detail="Maximum 5 news sources allowed")
    
    new_source = models.AINewsSource(**source.dict())
    db.add(new_source)
    db.commit()
    db.refresh(new_source)
    return new_source

@router.put("/sources/{source_id}", response_model=schemas.AINewsSource)
def update_source(source_id: int, source: schemas.AINewsSourceCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_admin)):
    db_source = db.query(models.AINewsSource).filter(models.AINewsSource.id == source_id).first()
    if not db_source:
        raise HTTPException(status_code=404, detail="Source not found")
    
    for key, value in source.dict().items():
        setattr(db_source, key, value)
    
    db.commit()
    db.refresh(db_source)
    return db_source

@router.delete("/sources/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_source(source_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_admin)):
    db_source = db.query(models.AINewsSource).filter(models.AINewsSource.id == source_id).first()
    if not db_source:
        raise HTTPException(status_code=404, detail="Source not found")
    
    db.delete(db_source)
    db.commit()
    return None
