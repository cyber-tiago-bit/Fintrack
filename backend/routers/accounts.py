from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..models.account import Account
from ..schemas.account import AccountCreate, AccountOut, AccountUpdate, TransferCreate

router = APIRouter(prefix="/api/accounts", tags=["Contas"])

def account_to_dict(a):
    return {
        "id": a.id,
        "name": a.name,
        "type": a.type,
        "balance": round(a.balance, 2),
        "color": a.color,
        "icon": a.icon,
        "active": a.active,
    }

@router.get("/")
def list_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    accounts = db.query(Account).filter(
        Account.user_id == current_user.id,
        Account.active == True
    ).order_by(Account.name).all()
    return [account_to_dict(a) for a in accounts]

@router.post("/", status_code=201)
def create_account(
    data: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account = Account(user_id=current_user.id, **data.model_dump())
    db.add(account)
    db.commit()
    db.refresh(account)
    return account_to_dict(account)

@router.put("/{account_id}")
def update_account(
    account_id: int,
    data: AccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(404, "Conta nao encontrada.")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(account, field, value)
    db.commit()
    db.refresh(account)
    return account_to_dict(account)

@router.delete("/{account_id}", status_code=204)
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(404, "Conta nao encontrada.")
    account.active = False
    db.commit()

@router.post("/transferir", status_code=201)
def transferir(
    data: TransferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    origem = db.query(Account).filter(
        Account.id == data.from_account_id,
        Account.user_id == current_user.id
    ).first()
    destino = db.query(Account).filter(
        Account.id == data.to_account_id,
        Account.user_id == current_user.id
    ).first()
    if not origem or not destino:
        raise HTTPException(404, "Conta nao encontrada.")
    if origem.balance < data.amount:
        raise HTTPException(400, "Saldo insuficiente na conta de origem.")
    origem.balance -= data.amount
    destino.balance += data.amount
    db.commit()
    return {
        "message": "Transferencia realizada com sucesso!",
        "from": account_to_dict(origem),
        "to": account_to_dict(destino),
    }

@router.post("/{account_id}/ajustar")
def ajustar_saldo(
    account_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(404, "Conta nao encontrada.")
    account.balance += data.get("amount", 0)
    db.commit()
    db.refresh(account)
    return account_to_dict(account)