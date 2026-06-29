from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..models.recurring import RecurringTransaction
from ..models.transaction import Transaction, Category, TransactionType
from ..schemas.recurring import RecurringCreate, RecurringOut, RecurringUpdate

router = APIRouter(prefix="/api/recurring", tags=["Recorrentes"])

def get_category(db, category_id, user_id):
    cat = db.query(Category).filter(Category.id == category_id, Category.user_id == user_id).first()
    if not cat:
        raise HTTPException(404, "Categoria não encontrada.")
    return cat

def recurring_to_dict(r):
    return {
        "id": r.id,
        "description": r.description,
        "amount": r.amount,
        "type": r.type,
        "frequency": r.frequency,
        "start_date": str(r.start_date),
        "active": r.active,
        "payment_method": r.payment_method,
        "note": r.note,
        "category_id": r.category_id,
        "category": {
            "id": r.category.id,
            "name": r.category.name,
            "color": r.category.color,
            "icon": r.category.icon,
        }
    }

@router.get("/")
def list_recurring(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items = db.query(RecurringTransaction).filter(
        RecurringTransaction.user_id == current_user.id
    ).order_by(RecurringTransaction.description).all()
    return [recurring_to_dict(r) for r in items]

@router.post("/", status_code=201)
def create_recurring(
    data: RecurringCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    get_category(db, data.category_id, current_user.id)
    r = RecurringTransaction(user_id=current_user.id, **data.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return recurring_to_dict(r)

@router.patch("/{recurring_id}")
def update_recurring(
    recurring_id: int,
    data: RecurringUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    r = db.query(RecurringTransaction).filter(
        RecurringTransaction.id == recurring_id,
        RecurringTransaction.user_id == current_user.id
    ).first()
    if not r:
        raise HTTPException(404, "Recorrente não encontrado.")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(r, field, value)
    db.commit()
    db.refresh(r)
    return recurring_to_dict(r)

@router.delete("/{recurring_id}", status_code=204)
def delete_recurring(
    recurring_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    r = db.query(RecurringTransaction).filter(
        RecurringTransaction.id == recurring_id,
        RecurringTransaction.user_id == current_user.id
    ).first()
    if not r:
        raise HTTPException(404, "Recorrente não encontrado.")
    db.delete(r)
    db.commit()

@router.post("/{recurring_id}/gerar", status_code=201)
def gerar_lancamento(
    recurring_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    r = db.query(RecurringTransaction).filter(
        RecurringTransaction.id == recurring_id,
        RecurringTransaction.user_id == current_user.id
    ).first()
    if not r:
        raise HTTPException(404, "Recorrente não encontrado.")
    tx = Transaction(
        description=r.description,
        amount=r.amount,
        type=r.type,
        date=date.today(),
        payment_method=r.payment_method,
        note=r.note,
        category_id=r.category_id,
        user_id=current_user.id,
    )
    db.add(tx)
    db.commit()
    return {"message": "Lancamento gerado com sucesso!"}