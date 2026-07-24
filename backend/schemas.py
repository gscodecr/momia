from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from datetime import datetime

# --- Roles ---
class RoleBase(BaseModel):
    name: str
    permissions: Optional[str] = None

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

class UserUpdateProfile(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[str] = None
    gender: Optional[str] = None
    payment_preference: Optional[str] = None
    subscription_type: Optional[str] = None
    subscription_status: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    ftp: Optional[int] = None
    injuries: Optional[str] = None
    heart_rate_zones: Optional[str] = None
    discipline: Optional[str] = None
    weight: Optional[str] = None
    body_fat: Optional[str] = None
    avatar_url: Optional[str] = None

class UserOut(UserBase):
    id: int
    is_active: bool
    is_approved: bool
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[str] = None
    gender: Optional[str] = None
    payment_preference: Optional[str] = None
    subscription_type: Optional[str] = None
    subscription_status: Optional[str] = None
    next_payment_date: Optional[datetime] = None
    auto_pay: Optional[bool] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    role: Optional[RoleOut]
    athlete_profile: Optional['AthleteProfileOut'] = None
    
    class Config:
        orm_mode = True
        from_attributes = True

# --- Athletes ---
class AthleteProfileBase(BaseModel):
    discipline: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    weight: Optional[str] = None
    body_fat: Optional[str] = None
    height: Optional[str] = None
    ftp: Optional[int] = None
    injuries: Optional[str] = None
    heart_rate_zones: Optional[str] = None # We store JSON as string, handle parsing in frontend

class CoachSimpleOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    
    class Config:
        orm_mode = True
        from_attributes = True

class AthleteProfileOut(AthleteProfileBase):
    id: int
    user_id: int
    coach_id: Optional[int] = None
    coach: Optional[CoachSimpleOut] = None
    
    class Config:
        orm_mode = True
        from_attributes = True

class AssignCoachRequest(BaseModel):
    coach_id: Optional[int] = None

class AthleteProfileCreate(AthleteProfileBase):
    user_id: int
    coach_id: Optional[int] = None



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

class PaymentUserOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    avatar_url: Optional[str] = None
    
    class Config:
        orm_mode = True
        from_attributes = True

class PaymentOut(PaymentBase):
    id: int
    user_id: int
    status: str
    receipt_url: Optional[str]
    created_at: datetime
    user: Optional[PaymentUserOut] = None
    
    class Config:
        orm_mode = True
        from_attributes = True

class CartItem(BaseModel):
    product_id: int
    quantity: int
    selectedColor: Optional[str] = None
    selectedSize: Optional[str] = None

class StoreCheckout(BaseModel):
    items: List[CartItem]
    amount: str
    description: str

# --- Products ---
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: str
    image_url: Optional[str] = None
    discipline: Optional[str] = None
    color: Optional[str] = None
    size: Optional[str] = None
    stock: int = 0
    variants_json: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductOut(ProductBase):
    id: int
    is_active: bool = True
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
        orm_mode = True
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

# --- Orders ---
class OrderBase(BaseModel):
    user_id: int
    payment_id: Optional[int] = None
    items_json: str
    total_amount: str
    status: str

class OrderOut(OrderBase):
    id: int
    created_at: datetime
    user: Optional[UserOut] = None
    payment: Optional[PaymentOut] = None

    class Config:
        from_attributes = True

# --- Network Momia ---
class NetworkItemBase(BaseModel):
    title: str
    description: str
    contact_name: str
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    category: Optional[str] = None

class NetworkItemCreate(NetworkItemBase):
    pass

class NetworkItemResponse(NetworkItemBase):
    id: int
    user_id: int
    photo_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
