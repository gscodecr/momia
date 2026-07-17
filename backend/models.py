from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # e.g., 'admin', 'coach', 'athlete'
    permissions = Column(String) # JSON string of permissions
    
    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    first_name = Column(String)
    last_name = Column(String)
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False) # Requires admin approval
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Datos Personales
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    birth_date = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    payment_preference = Column(String, nullable=True)
    subscription_type = Column(String, nullable=True)
    subscription_status = Column(String, default="Activo")
    next_payment_date = Column(DateTime, nullable=True)
    auto_pay = Column(Boolean, default=False)
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_phone = Column(String, nullable=True)
    
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="SET NULL"))
    role = relationship("Role", back_populates="users")

    # Si el usuario es entrenador, esta relación trae a los atletas que entrena
    athletes = relationship("AthleteProfile", back_populates="coach", foreign_keys='AthleteProfile.coach_id')
    
    # Si el usuario es atleta, su perfil de atleta (1 a 1)
    athlete_profile = relationship("AthleteProfile", back_populates="user", foreign_keys='AthleteProfile.user_id', uselist=False)

class AthleteProfile(Base):
    __tablename__ = "athlete_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    coach_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True) # Entrenador asignado
    
    discipline = Column(String, default="triatlon") # triatlon, ciclismo, etc
    date_of_birth = Column(DateTime)
    weight = Column(String)
    body_fat = Column(String)
    height = Column(String)
    ftp = Column(Integer, nullable=True)
    injuries = Column(String, nullable=True)
    heart_rate_zones = Column(String, nullable=True) # JSON string with {z1, z2, z3, z4, z5}

    user = relationship("User", back_populates="athlete_profile", foreign_keys=[user_id])
    coach = relationship("User", back_populates="athletes", foreign_keys=[coach_id])

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    amount = Column(String) # o Numeric(10,2) 
    description = Column(String, nullable=True)
    currency = Column(String, default="CRC")
    payment_method = Column(String) # 'SINPE', 'TRANSFER', 'TILOPAY'
    status = Column(String, default="PENDING") # PENDING, APPROVED, REJECTED
    receipt_url = Column(String, nullable=True) # URL o path de la foto del comprobante
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    price = Column(String)
    image_url = Column(String, nullable=True)
    discipline = Column(String, nullable=True)
    color = Column(String, nullable=True)
    size = Column(String, nullable=True)
    stock = Column(Integer, default=0)
    variants_json = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    date = Column(DateTime)
    location = Column(String, nullable=True)
    location_url = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    discipline = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    registrations = relationship("EventRegistration", back_populates="event")

class EventRegistration(Base):
    __tablename__ = "event_registrations"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    status = Column(String, default="REGISTERED") # REGISTERED, CANCELLED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    event = relationship("Event", back_populates="registrations")
    user = relationship("User")

class Workout(Base):
    __tablename__ = "workouts"
    
    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    athlete_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    event_id = Column(Integer, ForeignKey("events.id", ondelete="SET NULL"), nullable=True)
    title = Column(String)
    description = Column(String)
    scheduled_date = Column(DateTime)
    discipline = Column(String) # run, bike, swim, strength
    is_completed = Column(Boolean, default=False)
    completion_notes = Column(String, nullable=True)
    tss_score = Column(Integer, nullable=True) # Training Stress Score estimate
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    coach = relationship("User", foreign_keys=[coach_id])
    athlete = relationship("User", foreign_keys=[athlete_id])

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    payment_id = Column(Integer, ForeignKey("payments.id", ondelete="SET NULL"), nullable=True)
    items_json = Column(String) # JSON string array of items
    total_amount = Column(String)
    status = Column(String, default="PENDING") # PENDING, DELIVERED, CANCELLED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")
    payment = relationship("Payment")
