from sqlalchemy import Column, Integer, Float, String, Date, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base
from .transaction import TransactionType

class RecurringTransaction(Base):
    __tablename__ = "recurring_transactions"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String(200), nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    frequency = Column(String(20), nullable=False)  # monthly, weekly, yearly
    start_date = Column(Date, nullable=False)
    active = Column(Boolean, default=True)
    payment_method = Column(String(50), nullable=False)
    note = Column(String(500), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    user = relationship("User", backref="recurring_transactions")
    category = relationship("Category", backref="recurring_transactions")