from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt

from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import schemas, database, models

SECRET_KEY = "YOUR_SUPER_SECRET_KEY_CHANGE_THIS"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username, role=role)
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return current_user

def get_current_authorized_user(current_user: models.User = Depends(get_current_user)):
    if current_user.role not in ["admin", "kontributor", "contributor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

def check_permission(user: models.User, permission: str):
    if user.role == "admin":
        return True
    perms = (user.permissions or "").split(",")
    if permission in perms:
        return True
    return False

def get_permission_news(current_user: models.User = Depends(get_current_authorized_user)):
    if not check_permission(current_user, "news"):
        raise HTTPException(status_code=403, detail="Not authorized for News")
    return current_user

def get_permission_agenda(current_user: models.User = Depends(get_current_authorized_user)):
    if not check_permission(current_user, "agenda"):
        raise HTTPException(status_code=403, detail="Not authorized for Agenda")
    return current_user

def get_permission_majors(current_user: models.User = Depends(get_current_authorized_user)):
    if not check_permission(current_user, "majors"):
        raise HTTPException(status_code=403, detail="Not authorized for Majors")
    return current_user

def get_permission_gallery(current_user: models.User = Depends(get_current_authorized_user)):
    if not check_permission(current_user, "gallery"):
        raise HTTPException(status_code=403, detail="Not authorized for Gallery")
    return current_user

def get_permission_partners(current_user: models.User = Depends(get_current_authorized_user)):
    if not check_permission(current_user, "partners"):
        raise HTTPException(status_code=403, detail="Not authorized for Partners")
    return current_user

def get_permission_testimonials(current_user: models.User = Depends(get_current_authorized_user)):
    # Assuming testimonials permissions is also needed or maybe admin only? User didn't specify testimonials in list, but implied "except teachers/TU/contributors"
    # User said: "kecuali data guru,TU, kontributor"
    # So Testimonials is likely under a permission or admin. Let's add 'testimonials' as a permission option too to be safe, or default to admin/all contributors? 
    # Request said: "berita,agenda,jurusan,galeri,mitra". Testimonials was not explicitly in the list of permissions to choose.
    # But usually it goes with "content". I'll treat Testimonials as open to contributors (existing behavior) OR add it.
    # Let's stick to the list requested: News, Agenda, Majors, Gallery, Partners.
    # What about Testimonials? Maybe admin-only or default contributor access? 
    # Re-reading: "dapat memilih apakah menambahkan pengelolaan berita,agenda,jurusan,galeri,mitra"
    # It implies granular control for THOSE. Others are admin only (Guru, TU, Kontributor).
    # Testimonials wasn't mentioned. I will leave Testimonials as "get_current_authorized_user" (any contributor) for now to avoid breaking it, or restrict to Admin if safer.
    # Given the granularity, maybe Testimonials should be open to all contributors? Or maybe I should add it?
    # I'll add 'testimonials' as a permission just in case, or default to allow all authorized users.
    # Decision: Default Testimonials to any Authorized User (no specific permission flag required yet unless asked).
    return current_user
