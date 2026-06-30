from sqlalchemy import Column, Integer, Float, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from ..core.database import Base

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    balance = Column(Float, default=0.0)
    color = Column(String(7), default="#2563eb")
    icon = Column(String(50), default="ti-wallet")
    active = Column(Boolean, default=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    user = relationship("User", backref="accounts")