from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import models, database, auth, schemas
from database import engine

models.Base.metadata.create_all(bind=engine)

from fastapi.staticfiles import StaticFiles

app = FastAPI(title="SMK Bakti Nusantara 666 API")

app.mount("/static", StaticFiles(directory="static"), name="static")

# CORS
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = auth.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}



from routers import news, staff, majors, gallery, partners, users, testimonials, agenda
app.include_router(news.router)
app.include_router(staff.router)
app.include_router(majors.router)
app.include_router(gallery.router)
app.include_router(partners.router)
app.include_router(users.router)
app.include_router(testimonials.router)
app.include_router(agenda.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to SMK Bakti Nusantara 666 API"}
