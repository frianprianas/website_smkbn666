from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List

class UserBase(BaseModel):
    username: str
    permissions: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: str = "contributor"

class User(UserBase):
    id: int
    role: str
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    permissions: Optional[str] = None

class NewsBase(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = None
    is_pinned: bool = False

class NewsCreate(NewsBase):
    pass

class News(NewsBase):
    id: int
    date_posted: datetime
    author_id: int
    class Config:
        from_attributes = True

class TeacherBase(BaseModel):
    nipy: str
    name: str
    position: str
    description: Optional[str] = None
    photo_url: Optional[str] = None

class TeacherCreate(TeacherBase):
    pass

class Teacher(TeacherBase):
    id: int
    class Config:
        from_attributes = True

class StaffBase(BaseModel):
    name: str
    position: str

class StaffCreate(StaffBase):
    pass

class Staff(StaffBase):
    id: int
    class Config:
        from_attributes = True

class MajorBase(BaseModel):
    name: str
    description: str
    logo_url: Optional[str] = None

class MajorCreate(MajorBase):
    pass

class Major(MajorBase):
    id: int
    class Config:
        from_attributes = True

class GalleryBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class GalleryCreate(GalleryBase):
    pass

class Gallery(GalleryBase):
    id: int
    image_url: str
    class Config:
        from_attributes = True

class PartnerBase(BaseModel):
    name: str

class PartnerCreate(PartnerBase):
    pass

class Partner(PartnerBase):
    id: int
    logo_url: str
    class Config:
        from_attributes = True

class TestimonialBase(BaseModel):
    name: str
    role: str
    content: str
    rating: Optional[int] = 5

class TestimonialCreate(TestimonialBase):
    pass

class Testimonial(TestimonialBase):
    id: int
    image_url: Optional[str] = None
    class Config:
        from_attributes = True

class AgendaBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: date
    location: Optional[str] = None

class AgendaCreate(AgendaBase):
    pass

class Agenda(AgendaBase):
    id: int
    author_id: int
    class Config:
        from_attributes = True
