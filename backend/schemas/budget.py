from pydantic import BaseModel
from typing import Optional

class BudgetCreate(BaseModel):
    amount: float
    month: int
    year: int
    category_id: int

class BudgetOut(BaseModel):
    id: int
    amount: float
    month: int
    year: int
    category_id: int
    category: dict = {}
    spent: float = 0.0
    percentage: float = 0.0
    remaining: float = 0.0
    status: str = "ok"

    class Config:
        from_attributes = True

class BudgetUpdate(BaseModel):
    amount: Optional[float] = None