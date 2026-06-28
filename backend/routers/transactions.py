from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date
from typing import Optional
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..models.transaction import Transaction, Category, TransactionType
from ..schemas.transaction import TransactionCreate, TransactionOut, TransactionUpdate, DashboardSummary

router = APIRouter(prefix="/api/transactions", tags=["Transações"])

@router.get("/", response_model=list[TransactionOut])
def list_transactions(
    type: Optional[TransactionType] = None,
    category_id: Optional[int] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if type:
        q = q.filter(Transaction.type == type)
    if category_id:
        q = q.filter(Transaction.category_id == category_id)
    if month:
        q = q.filter(extract('month', Transaction.date) == month)
    if year:
        q = q.filter(extract('year', Transaction.date) == year)
    return q.order_by(Transaction.date.desc(), Transaction.created_at.desc()).all()

@router.post("/", response_model=TransactionOut, status_code=201)
def create_transaction(data: TransactionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cat = db.query(Category).filter(Category.id == data.category_id, Category.user_id == current_user.id).first()
    if not cat:
        raise HTTPException(404, "Categoria não encontrada.")
    tx = Transaction(user_id=current_user.id, **data.model_dump())
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx

@router.put("/{tx_id}", response_model=TransactionOut)
def update_transaction(tx_id: int, data: TransactionUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tx = db.query(Transaction).filter(Transaction.id == tx_id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(404, "Transação não encontrada.")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(tx, field, value)
    db.commit()
    db.refresh(tx)
    return tx

@router.delete("/{tx_id}", status_code=204)
def delete_transaction(tx_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tx = db.query(Transaction).filter(Transaction.id == tx_id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(404, "Transação não encontrada.")
    db.delete(tx)
    db.commit()

@router.get("/dashboard/summary", response_model=DashboardSummary)
def dashboard_summary(
    month: int = Query(default=date.today().month),
    year: int = Query(default=date.today().year),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    base_q = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        extract('month', Transaction.date) == month,
        extract('year', Transaction.date) == year,
    )

    total_income = base_q.filter(Transaction.type == TransactionType.income).with_entities(func.sum(Transaction.amount)).scalar() or 0
    total_expense = base_q.filter(Transaction.type == TransactionType.expense).with_entities(func.sum(Transaction.amount)).scalar() or 0

    income_by_cat = db.query(
        Category.name, Category.color, Category.icon,
        func.sum(Transaction.amount).label("total")
    ).join(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.income,
        extract('month', Transaction.date) == month,
        extract('year', Transaction.date) == year,
    ).group_by(Category.id).order_by(func.sum(Transaction.amount).desc()).all()

    expense_by_cat = db.query(
        Category.name, Category.color, Category.icon,
        func.sum(Transaction.amount).label("total")
    ).join(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.expense,
        extract('month', Transaction.date) == month,
        extract('year', Transaction.date) == year,
    ).group_by(Category.id).order_by(func.sum(Transaction.amount).desc()).all()

    monthly_flow = db.query(
        extract('year', Transaction.date).label("year"),
        extract('month', Transaction.date).label("month"),
        Transaction.type,
        func.sum(Transaction.amount).label("total")
    ).filter(
        Transaction.user_id == current_user.id,
        extract('year', Transaction.date) == year,
    ).group_by("year", "month", Transaction.type).order_by("month").all()

    return {
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "balance": round(total_income - total_expense, 2),
        "income_by_category": [{"name": r.name, "color": r.color, "icon": r.icon, "total": round(r.total, 2)} for r in income_by_cat],
        "expense_by_category": [{"name": r.name, "color": r.color, "icon": r.icon, "total": round(r.total, 2)} for r in expense_by_cat],
        "monthly_flow": [{"year": int(r.year), "month": int(r.month), "type": r.type, "total": round(r.total, 2)} for r in monthly_flow],
    }
