from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os

from .core.database import Base, engine
from .models import user, transaction
from .routers import auth, categories, transactions, budgets, recurring

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FinTrack API",
    description="API de controle financeiro pessoal — entradas, saídas e análises por categoria.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(transactions.router)
app.include_router(budgets.router)
app.include_router(recurring.router)
frontend_path = os.path.join(os.path.dirname(__file__), "../frontend")
app.mount("/static", StaticFiles(directory=os.path.join(frontend_path, "static")), name="static")

@app.get("/", include_in_schema=False)
@app.get("/{full_path:path}", include_in_schema=False)
def serve_frontend(full_path: str = ""):
    index = os.path.join(frontend_path, "templates", "index.html")
    return FileResponse(index)
