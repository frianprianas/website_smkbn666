from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="contributor") # 'admin' or 'contributor'
    permissions = Column(String, nullable=True) # comma separated: "news,agenda,majors,gallery,partners"
    
class News(Base):
    __tablename__ = "news"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text)
    date_posted = Column(DateTime, default=datetime.utcnow)
    image_url = Column(String, nullable=True)
    is_pinned = Column(Boolean, default=False)
    author_id = Column(Integer, ForeignKey("users.id"))
    
    author = relationship("User")

class Teacher(Base):
    __tablename__ = "teachers"
    id = Column(Integer, primary_key=True, index=True)
    nipy = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    position = Column(String) # Jabatan
    description = Column(Text, nullable=True) # Keterangan
    photo_url = Column(String, nullable=True)

class Staff(Base):
    __tablename__ = "staff"
    id = Column(Integer, primary_key=True, index=True)
    nipy = Column(String, unique=True, index=True, nullable=True)
    name = Column(String, index=True)
    position = Column(String)

class Major(Base):
    __tablename__ = "majors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, unique=True)
    description = Column(Text)
    logo_url = Column(String, nullable=True)

class Gallery(Base):
    __tablename__ = "gallery"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    image_url = Column(String)

class Partner(Base):
    __tablename__ = "partners"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    logo_url = Column(String)

class Testimonial(Base):
    __tablename__ = "testimonials"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    role = Column(String)
    content = Column(Text)
    image_url = Column(String, nullable=True)
    rating = Column(Integer, default=5)

class Agenda(Base):
    __tablename__ = "agendas"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    date = Column(Date)
    location = Column(String, nullable=True)
    author_id = Column(Integer, ForeignKey("users.id"))

    author = relationship("User")

class WANumber(Base):
    __tablename__ = "wa_numbers"
    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, unique=True, index=True) # Format: 628xxx
    name = Column(String)
    is_active = Column(Boolean, default=True)
