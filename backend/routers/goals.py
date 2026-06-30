from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..models.goal import Goal
from ..schemas.goal import GoalCreate, GoalOut, GoalUpdate, GoalDeposit

router = APIRouter(prefix="/api/goals", tags=["Objetivos"])

def enrich_goal(g):
    percentage = round((g.current_amount / g.target_amount) * 100, 1) if g.target_amount > 0 else 0.0
    remaining = round(g.target_amount - g.current_amount, 2)
    return {
        "id": g.id,
        "name": g.name,
        "description": g.description,
        "target_amount": g.target_amount,
        "current_amount": round(g.current_amount, 2),
        "deadline": str(g.deadline) if g.deadline else None,
        "icon": g.icon,
        "color": g.color,
        "created_at": str(g.created_at),
        "percentage": min(percentage, 100.0),
        "remaining": max(remaining, 0.0),
    }

@router.get("/")
def list_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).order_by(Goal.created_at.desc()).all()
    return [enrich_goal(g) for g in goals]

@router.post("/", status_code=201)
def create_goal(
    data: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = Goal(user_id=current_user.id, **data.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return enrich_goal(goal)

@router.put("/{goal_id}")
def update_goal(
    goal_id: int,
    data: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(404, "Objetivo nao encontrado.")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(goal, field, value)
    db.commit()
    db.refresh(goal)
    return enrich_goal(goal)

@router.post("/{goal_id}/depositar")
def depositar(
    goal_id: int,
    data: GoalDeposit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(404, "Objetivo nao encontrado.")
    if data.amount <= 0:
        raise HTTPException(400, "Valor deve ser maior que zero.")
    goal.current_amount += data.amount
    db.commit()
    db.refresh(goal)
    return enrich_goal(goal)

@router.delete("/{goal_id}", status_code=204)
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(404, "Objetivo nao encontrado.")
    db.delete(goal)
    db.commit()