from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract
from datetime import date
from pydantic import BaseModel
from google import genai
from ..core.database import get_db
from ..core.security import get_current_user
from ..core.config import settings
from ..models.user import User
from ..models.transaction import Transaction, TransactionType
from ..models.budget import Budget

router = APIRouter(prefix="/api/ai", tags=["Assistente IA"])

class ChatMessage(BaseModel):
    message: str
    month: int = date.today().month
    year: int = date.today().year

def get_financial_context(db, user_id, month, year):
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        extract('month', Transaction.date) == month,
        extract('year', Transaction.date) == year,
    ).all()

    income = sum(t.amount for t in transactions if t.type == TransactionType.income)
    expense = sum(t.amount for t in transactions if t.type == TransactionType.expense)

    by_category = {}
    for t in transactions:
        if t.type == TransactionType.expense:
            cat_name = t.category.name if t.category else "Outros"
            by_category[cat_name] = by_category.get(cat_name, 0) + t.amount

    budgets = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.month == month,
        Budget.year == year,
    ).all()

    budget_info = []
    for b in budgets:
        spent = by_category.get(b.category.name, 0) if b.category else 0
        pct = round((spent / b.amount) * 100, 1) if b.amount > 0 else 0
        budget_info.append(f"{b.category.name}: meta R${b.amount:.2f}, gasto R${spent:.2f} ({pct}%)")

    top_expenses = sorted(by_category.items(), key=lambda x: x[1], reverse=True)[:5]

    context = f"""
Dados financeiros do usuario para {month}/{year}:

RESUMO:
- Total de entradas: R$ {income:.2f}
- Total de saidas: R$ {expense:.2f}
- Saldo do mes: R$ {income - expense:.2f}

MAIORES GASTOS POR CATEGORIA:
{chr(10).join(f'- {cat}: R$ {val:.2f}' for cat, val in top_expenses)}

METAS DE ORCAMENTO:
{chr(10).join(f'- {b}' for b in budget_info) if budget_info else '- Nenhuma meta definida'}

TOTAL DE TRANSACOES: {len(transactions)}
"""
    return context

@router.post("/chat")
def chat(
    data: ChatMessage,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        context = get_financial_context(db, current_user.id, data.month, data.year)

        prompt = f"""Voce e um assistente financeiro pessoal chamado FinBot, integrado ao app FinTrack.
Voce deve analisar os dados financeiros do usuario e responder de forma clara, amigavel e em portugues brasileiro.
Seja direto, use numeros quando relevante e de conselhos praticos.

{context}

Pergunta do usuario: {data.message}

Responda de forma concisa e util, em no maximo 3 paragrafos."""

        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt
        )
        return {"response": response.text}
except Exception as e:
        import traceback
        print("ERRO IA:", traceback.format_exc())
        raise HTTPException(500, f"Erro ao consultar IA: {str(e)}")