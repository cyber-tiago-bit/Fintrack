from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class GoalCreate(BaseModel):
    name: str
    description: Optional[str] = None
    target_amount: float
    deadline: Optional[date] = None
    icon: str = "ti-star"
    color: str = "#2563eb"

class GoalOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    target_amount: float
    current_amount: float
    deadline: Optional[date]
    icon: str
    color: str
    created_at: datetime
    percentage: float = 0.0
    remaining: float = 0.0

    class Config:
        from_attributes = True

class GoalUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    target_amount: Optional[float] = None
    deadline: Optional[date] = None
    icon: Optional[str] = None
    color: Optional[str] = None

class GoalDeposit(BaseModel):
    amount: float