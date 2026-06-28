from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..models.budget import Budget
from ..models.transaction import Transaction, Category, TransactionType
from ..schemas.budget import BudgetCreate, BudgetOut, BudgetUpdate

router = APIRouter(prefix="/api/budgets", tags=["Orçamentos"])

def enrich_budget(budget, db, user_id):
    spent = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.category_id == budget.category_id,
        Transaction.type == TransactionType.expense,
        extract('month', Transaction.date) == budget.month,
        extract('year', Transaction.date) == budget.year,
    ).scalar() or 0.0

    percentage = round((spent / budget.amount) * 100, 1) if budget.amount > 0 else 0.0
    remaining = round(budget.amount - spent, 2)

    if percentage >= 100:
        status = "exceeded"
    elif percentage >= 80:
        status = "warning"
    else:
        status = "ok"

    return {
        "id": budget.id,
        "amount": budget.amount,
        "month": budget.month,
        "year": budget.year,
        "category_id": budget.category_id,
        "category": {
            "id": budget.category.id,
            "name": budget.category.name,
            "color": budget.category.color,
            "icon": budget.category.icon,
        },
        "spent": round(spent, 2),
        "percentage": percentage,
        "remaining": remaining,
        "status": status,
    }

@router.get("/")
def list_budgets(
    month: int, year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == month,
        Budget.year == year,
    ).all()
    return [enrich_budget(b, db, current_user.id) for b in budgets]

@router.post("/", status_code=201)
def create_budget(
    data: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category_id == data.category_id,
        Budget.month == data.month,
        Budget.year == data.year,
    ).first()
    if existing:
        raise HTTPException(400, "Já existe uma meta para esta categoria neste mês.")

    cat = db.query(Category).filter(
        Category.id == data.category_id,
        Category.user_id == current_user.id
    ).first()
    if not cat:
        raise HTTPException(404, "Categoria não encontrada.")

    budget = Budget(user_id=current_user.id, **data.model_dump())
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return enrich_budget(budget, db, current_user.id)

@router.put("/{budget_id}")
def update_budget(
    budget_id: int,
    data: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    if not budget:
        raise HTTPException(404, "Meta não encontrada.")
    if data.amount is not None:
        budget.amount = data.amount
    db.commit()
    db.refresh(budget)
    return enrich_budget(budget, db, current_user.id)

@router.delete("/{budget_id}", status_code=204)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    if not budget:
        raise HTTPException(404, "Meta não encontrada.")
    db.delete(budget)
    db.commit()