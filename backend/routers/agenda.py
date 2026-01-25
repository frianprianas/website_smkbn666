from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import schemas, database, models, auth
from datetime import date

router = APIRouter(
    prefix="/agenda",
    tags=["agenda"],
)

@router.post("/", response_model=schemas.Agenda)
def create_agenda(
    agenda: schemas.AgendaCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_permission_agenda)
):
    new_agenda = models.Agenda(**agenda.dict(), author_id=current_user.id)
    db.add(new_agenda)
    db.commit()
    db.refresh(new_agenda)
    return new_agenda

@router.get("/", response_model=List[schemas.Agenda])
def read_agendas(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    # Order by date descending by default
    return db.query(models.Agenda).order_by(models.Agenda.date.desc()).offset(skip).limit(limit).all()

@router.delete("/{agenda_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_agenda(agenda_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_permission_agenda)):
    agenda = db.query(models.Agenda).filter(models.Agenda.id == agenda_id).first()
    if not agenda:
        raise HTTPException(status_code=404, detail="Agenda not found")
    
    db.delete(agenda)
    db.commit()
    return None

@router.put("/{agenda_id}", response_model=schemas.Agenda)
def update_agenda(
    agenda_id: int,
    agenda_update: schemas.AgendaCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_permission_agenda)
):
    db_agenda = db.query(models.Agenda).filter(models.Agenda.id == agenda_id).first()
    if not db_agenda:
        raise HTTPException(status_code=404, detail="Agenda not found")

    for key, value in agenda_update.dict().items():
        setattr(db_agenda, key, value)

    db.commit()
    db.refresh(db_agenda)
    return db_agenda
