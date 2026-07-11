from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# --- Roles ---
class RoleBase(BaseModel):
    name: str
    permissions: str

class RoleCreate(RoleBase):
    pass

class RoleOut(RoleBase):
    id: int
    class Config:
        orm_mode = True
        from_attributes = True

# --- Users ---
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role_id: Optional[int] = 3 # 3 = atleta por defecto

class UserUpdateRole(BaseModel):
    role_id: int

class UserUpdateStatus(BaseModel):
    is_active: Optional[bool] = None
    is_approved: Optional[bool] = None

class UserOut(UserBase):
    id: int
    is_active: bool
    is_approved: bool
    role: Optional[RoleOut]
    
    class Config:
        orm_mode = True
        from_attributes = True

# --- Athletes ---
class AthleteProfileBase(BaseModel):
    discipline: str
    date_of_birth: Optional[datetime] = None
    weight: Optional[str] = None
    height: Optional[str] = None

class AthleteProfileCreate(AthleteProfileBase):
    user_id: int
    coach_id: Optional[int] = None

class AthleteProfileOut(AthleteProfileBase):
    id: int
    user_id: int
    coach_id: Optional[int]
    
    class Config:
        orm_mode = True
        from_attributes = True

# --- Auth ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- Payments ---
class PaymentBase(BaseModel):
    amount: str
    currency: str = "CRC"
    payment_method: str

class PaymentCreate(PaymentBase):
    receipt_url: Optional[str] = None

class PaymentOut(PaymentBase):
    id: int
    user_id: int
    status: str
    receipt_url: Optional[str]
    created_at: datetime
    
    class Config:
        orm_mode = True
        from_attributes = True

# --- Products ---
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: str
    image_url: Optional[str] = None
    is_active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductOut(ProductBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- Events ---
class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: datetime
    location: Optional[str] = None
    location_url: Optional[str] = None
    image_url: Optional[str] = None
    discipline: Optional[str] = None

class EventCreate(EventBase):
    pass

class EventOut(EventBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- Event Registrations ---
class EventRegistrationBase(BaseModel):
    event_id: int

class EventRegistrationCreate(EventRegistrationBase):
    pass

class EventRegistrationOut(EventRegistrationBase):
    id: int
    user_id: int
    status: str
    created_at: datetime
    user: UserOut
    has_plan: Optional[bool] = False

    class Config:
        from_attributes = True

# --- Workouts ---
class WorkoutBase(BaseModel):
    title: str
    description: str
    scheduled_date: datetime
    discipline: str
    tss_score: Optional[int] = None
    event_id: Optional[int] = None

class WorkoutCreate(WorkoutBase):
    athlete_id: int

class WorkoutUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    discipline: Optional[str] = None
    is_completed: Optional[bool] = None
    completion_notes: Optional[str] = None
    tss_score: Optional[int] = None

class WorkoutOut(WorkoutBase):
    id: int
    coach_id: int
    athlete_id: int
    is_completed: bool
    completion_notes: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True
