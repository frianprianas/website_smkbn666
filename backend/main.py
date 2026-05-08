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
    "https://smkbn666.sch.id",
    "http://smkbn666.sch.id",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    # --- WA GATEWAY BYPASS (Must be first) ---
    WA_GATEWAY_SECRET = auth.os.getenv("WA_GATEWAY_SECRET", "super_secret_wa_token")
    if form_data.username == "wa_gateway" and form_data.password == WA_GATEWAY_SECRET:
        access_token_expires = auth.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
        # Get or create a system user for WA
        system_user = db.query(models.User).filter(models.User.username == "wa_system").first()
        if not system_user:
            system_user = models.User(username="wa_system", role="admin", hashed_password="")
            db.add(system_user)
            db.commit()
            db.refresh(system_user)
        
        access_token = auth.create_access_token(
            data={"sub": system_user.username, "role": system_user.role}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    # -----------------------------------------

    # --- AI NEWS BOT BYPASS ---
    AI_BOT_SECRET = auth.os.getenv("AI_BOT_SECRET", "super_secret_ai_token")
    if form_data.username == "ai_bot" and form_data.password == AI_BOT_SECRET:
        access_token_expires = auth.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
        system_bot = db.query(models.User).filter(models.User.username == "ai_bot_system").first()
        if not system_bot:
            system_bot = models.User(username="ai_bot_system", role="admin", hashed_password="")
            db.add(system_bot)
            db.commit()
            db.refresh(system_bot)
        
        access_token = auth.create_access_token(
            data={"sub": system_bot.username, "role": system_bot.role}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    # --------------------------

    mailcow_user = auth.authenticate_mailcow(form_data.username, form_data.password)
    
    if mailcow_user:
        user = db.query(models.User).filter(models.User.username == mailcow_user['username']).first()
        if not user:
            user = models.User(username=mailcow_user['username'], role=mailcow_user['role'], hashed_password="")
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            user.role = mailcow_user['role']
            db.commit()
    else:
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



from routers import news, staff, majors, gallery, partners, users, testimonials, agenda, stats, wa_settings, ai_bot
app.include_router(news.router, prefix="/api")
app.include_router(staff.router, prefix="/api")
app.include_router(majors.router, prefix="/api")
app.include_router(gallery.router, prefix="/api")
app.include_router(partners.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(testimonials.router, prefix="/api")
app.include_router(agenda.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(wa_settings.router, prefix="/api")
app.include_router(ai_bot.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to SMK Bakti Nusantara 666 API"}
