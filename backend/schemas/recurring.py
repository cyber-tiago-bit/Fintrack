from pydantic import BaseModel
from datetime import date
from typing import Optional
from ..models.transaction import TransactionType

class RecurringCreate(BaseModel):
    description: str
    amount: float
    type: TransactionType
    frequency: str
    start_date: date
    payment_method: str
    note: Optional[str] = None
    category_id: int

class RecurringOut(BaseModel):
    id: int
    description: str
    amount: float
    type: TransactionType
    frequency: str
    start_date: date
    active: bool
    payment_method: str
    note: Optional[str]
    category_id: int
    category: dict = {}

    class Config:
        from_attributes = True

class RecurringUpdate(BaseModel):
    active: Optional[bool] = None
    amount: Optional[float] = None
    description: Optional[str] = None