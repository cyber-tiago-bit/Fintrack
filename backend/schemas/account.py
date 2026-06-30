from pydantic import BaseModel
from typing import Optional

class AccountCreate(BaseModel):
    name: str
    type: str
    balance: float = 0.0
    color: str = "#2563eb"
    icon: str = "ti-wallet"

class AccountOut(BaseModel):
    id: int
    name: str
    type: str
    balance: float
    color: str
    icon: str
    active: bool

    class Config:
        from_attributes = True

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    balance: Optional[float] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    active: Optional[bool] = None

class TransferCreate(BaseModel):
    from_account_id: int
    to_account_id: int
    amount: float
    description: str = "Transferencia entre contas"