from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from ..models.transaction import TransactionType

class CategoryCreate(BaseModel):
    name: str
    color: str = "#898781"
    icon: str = "ti-tag"
    type: TransactionType

class CategoryOut(BaseModel):
    id: int
    name: str
    color: str
    icon: str
    type: TransactionType

    class Config:
        from_attributes = True

class TransactionCreate(BaseModel):
    description: str
    amount: float
    type: TransactionType
    date: date
    payment_method: str
    note: Optional[str] = None
    category_id: int

class TransactionOut(BaseModel):
    id: int
    description: str
    amount: float
    type: TransactionType
    date: date
    payment_method: str
    note: Optional[str]
    category_id: int
    category: CategoryOut
    created_at: datetime

    class Config:
        from_attributes = True

class TransactionUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[date] = None
    payment_method: Optional[str] = None
    note: Optional[str] = None
    category_id: Optional[int] = None

class DashboardSummary(BaseModel):
    total_income: float
    total_expense: float
    balance: float
    income_by_category: list
    expense_by_category: list
    monthly_flow: list
