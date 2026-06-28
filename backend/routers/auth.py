from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import verify_password, get_password_hash, create_access_token
from ..models.user import User
from ..models.transaction import Category, TransactionType
from ..schemas.user import UserCreate, UserOut, Token, LoginForm

router = APIRouter(prefix="/api/auth", tags=["Autenticação"])

DEFAULT_CATEGORIES = [
    {"name": "Alimentação", "color": "#eda100", "icon": "ti-tools-kitchen-2", "type": TransactionType.expense},
    {"name": "Moradia", "color": "#2a78d6", "icon": "ti-home", "type": TransactionType.expense},
    {"name": "Transporte", "color": "#4a3aa7", "icon": "ti-car", "type": TransactionType.expense},
    {"name": "Saúde", "color": "#e34948", "icon": "ti-heart", "type": TransactionType.expense},
    {"name": "Fatura cartão", "color": "#e87ba4", "icon": "ti-credit-card", "type": TransactionType.expense},
    {"name": "Internet", "color": "#1baf7a", "icon": "ti-wifi", "type": TransactionType.expense},
    {"name": "Água", "color": "#17a5c8", "icon": "ti-droplet", "type": TransactionType.expense},
    {"name": "Energia", "color": "#f59e0b", "icon": "ti-bolt", "type": TransactionType.expense},
    {"name": "Celular", "color": "#eb6834", "icon": "ti-device-mobile", "type": TransactionType.expense},
    {"name": "Lazer", "color": "#8b5cf6", "icon": "ti-confetti", "type": TransactionType.expense},
    {"name": "Educação", "color": "#10b981", "icon": "ti-book", "type": TransactionType.expense},
    {"name": "Vestuário", "color": "#f43f5e", "icon": "ti-shirt", "type": TransactionType.expense},
    {"name": "Outros gastos", "color": "#898781", "icon": "ti-dots", "type": TransactionType.expense},
    {"name": "Salário", "color": "#1baf7a", "icon": "ti-cash", "type": TransactionType.income},
    {"name": "Freelance", "color": "#2a78d6", "icon": "ti-briefcase", "type": TransactionType.income},
    {"name": "Investimentos", "color": "#4a3aa7", "icon": "ti-trending-up", "type": TransactionType.income},
    {"name": "Outros ganhos", "color": "#898781", "icon": "ti-plus", "type": TransactionType.income},
]

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
    user = User(
        name=data.name,
        email=data.email,
        hashed_password=get_password_hash(data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    for cat in DEFAULT_CATEGORIES:
        db.add(Category(user_id=user.id, **cat))
    db.commit()
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/login", response_model=Token)
def login(data: LoginForm, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=UserOut)
def me(db: Session = Depends(get_db), current_user: User = Depends(lambda: None)):
    from ..core.security import get_current_user
    return current_user
