from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import schemas, database, models, auth

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.get("/", response_model=List[schemas.User])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    role: Optional[str] = None,
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_active_admin)
):
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role == role)
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=schemas.User)
def create_user(
    username: str = Form(...),
    password: str = Form(...),
    role: str = Form(...),
    permissions: Optional[str] = Form(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_admin)
):
    db_user = db.query(models.User).filter(models.User.username == username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = auth.get_password_hash(password)
    new_user = models.User(username=username, hashed_password=hashed_password, role=role, permissions=permissions)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    username: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
    role: Optional[str] = Form(None),
    permissions: Optional[str] = Form(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_admin)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if username is not None:
        # Check uniqueness if username changing
        if username != user.username:
             existing = db.query(models.User).filter(models.User.username == username).first()
             if existing:
                 raise HTTPException(status_code=400, detail="Username already taken")
        user.username = username
    
    if password is not None and password != "":
        user.hashed_password = auth.get_password_hash(password)
        
    if role is not None:
        user.role = role
        
    if permissions is not None:
        user.permissions = permissions
        
    db.commit()
    db.refresh(user)
    return user
