from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import schemas, database, models, auth
import requests
import os

router = APIRouter(
    prefix="/wa-settings",
    tags=["wa-settings"],
)

GATEWAY_URL = os.getenv("WA_GATEWAY_URL", "http://whatsapp-gateway:3001")

# --- Authorized Numbers Management ---

@router.get("/numbers", response_model=List[schemas.WANumber])
def get_wa_numbers(db: Session = Depends(database.get_db)):
    return db.query(models.WANumber).all()

@router.post("/numbers", response_model=schemas.WANumber)
def add_wa_number(
    wa_number: schemas.WANumberCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage WA numbers")
    
    # Check if exists
    db_number = db.query(models.WANumber).filter(models.WANumber.phone_number == wa_number.phone_number).first()
    if db_number:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    new_number = models.WANumber(**wa_number.model_dump())
    db.add(new_number)
    db.commit()
    db.refresh(new_number)
    return new_number

@router.delete("/numbers/{number_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_wa_number(
    number_id: int, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage WA numbers")
    
    db_number = db.query(models.WANumber).filter(models.WANumber.id == number_id).first()
    if not db_number:
        raise HTTPException(status_code=404, detail="Number not found")
    
    db.delete(db_number)
    db.commit()
    return None

# --- WhatsApp Gateway Proxy ---

@router.get("/status")
def get_wa_status(current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can see WA status")
    
    try:
        response = requests.get(f"{GATEWAY_URL}/status", timeout=5)
        return response.json()
    except Exception as e:
        return {"status": "OFFLINE", "error": str(e)}
