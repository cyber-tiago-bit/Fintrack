# FinTrack — Controle Financeiro Pessoal

Aplicação web completa para controle de finanças pessoais, com backend em **FastAPI + Python**, banco de dados **PostgreSQL (Supabase)**, autenticação via **JWT** e frontend em **HTML/CSS/JS puro**.

![Python](https://img.shields.io/badge/Python-3.12+-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green?logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?logo=supabase)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Funcionalidades

- **Autenticação completa** — cadastro, login e logout com JWT
- **Dashboard interativo** — gráfico de pizza por categoria e barras de fluxo mensal
- **Lancamentos** — registre entradas e saidas com categoria, forma de pagamento e observacao
- **Exportacao CSV** — exporte seus lancamentos para Excel com um clique
- **Lancamentos recorrentes** — cadastre despesas fixas mensais, semanais ou anuais
- **Metas de orcamento** — defina limites por categoria com alertas visuais
- **Objetivos financeiros** — acompanhe metas de longo prazo com aportes e progresso
- **Contas e carteiras** — gerencie multiplas contas com saldo e transferencias
- **Assistente IA** — chat financeiro inteligente powered by Google Gemini (requer chave API)
- **API documentada** — acesse `/docs` para testar todos os endpoints interativamente

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Python 3.12 + FastAPI |
| Banco de dados | PostgreSQL via Supabase |
| ORM | SQLAlchemy 2.0 |
| Autenticacao | JWT (python-jose + passlib bcrypt) |
| IA | Google Gemini API |
| Frontend | HTML5 + CSS3 + JavaScript puro |
| Graficos | Chart.js 4 |
| Deploy | Uvicorn (local) / Railway ou Render (producao) |

## 🚀 Como rodar localmente

### 1. Clone o repositorio

```bash
git clone https://github.com/cyber-tiago-bit/Fintrack.git
cd Fintrack
```

### 2. Crie e ative um ambiente virtual

```bash
# Com Anaconda (recomendado):
conda create -n fintrack python=3.12 -y
conda activate fintrack

# Ou com venv:
python -m venv venv
venv\Scripts\activate  # Windows
```

### 3. Instale as dependencias

```bash
pip install -r requirements.txt
pip install pydantic-settings google-genai
```

### 4. Configure as variaveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais:

```env
DATABASE_URL=postgresql://postgres:[SENHA]@db.[ID].supabase.co:5432/postgres?sslmode=require
SECRET_KEY=sua_chave_secreta_aqui
GEMINI_API_KEY=sua_chave_gemini_aqui  # opcional
```

### 5. Inicie o servidor

```bash
uvicorn backend.main:app --reload
```

Acesse: **http://localhost:8000**
Documentacao da API: **http://localhost:8000/docs**

## 🤖 Ativando o Assistente IA

O FinTrack possui um assistente financeiro integrado powered by **Google Gemini**. Para ativar:

1. Acesse [aistudio.google.com](https://aistudio.google.com)
2. Crie uma conta e gere uma API Key gratuita
3. Adicione a chave no arquivo `.env`:
4. Reinicie o servidor

O assistente analisa seus gastos e responde perguntas como:
- "Como estao meus gastos esse mes?"
- "Em qual categoria gastei mais?"
- "Como posso economizar mais?"

## 🗄️ Configurando o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita
2. Crie um novo projeto com regiao **South America (Sao Paulo)**
3. Va em **Settings > Database > Connection string > URI**
4. Cole no campo `DATABASE_URL` do seu `.env`
5. As tabelas sao criadas automaticamente na primeira execucao

## 📁 Estrutura do projeto

fintrack/
├── backend/
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── security.py
│   ├── models/
│   │   ├── user.py
│   │   ├── transaction.py
│   │   ├── budget.py
│   │   ├── recurring.py
│   │   ├── goal.py
│   │   └── account.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── categories.py
│   │   ├── transactions.py
│   │   ├── budgets.py
│   │   ├── recurring.py
│   │   ├── goals.py
│   │   ├── accounts.py
│   │   └── ai.py
│   ├── schemas/
│   │   ├── user.py
│   │   ├── transaction.py
│   │   ├── budget.py
│   │   ├── recurring.py
│   │   ├── goal.py
│   │   └── account.py
│   └── main.py
├── frontend/
│   ├── static/
│   │   ├── css/style.css
│   │   └── js/app.js
│   └── templates/
│       └── index.html
├── .env.example
├── requirements.txt
└── README.md

## 📡 Endpoints da API

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/api/auth/register` | Criar conta |
| POST | `/api/auth/login` | Fazer login |
| GET | `/api/transactions/` | Listar transacoes |
| POST | `/api/transactions/` | Criar transacao |
| GET | `/api/transactions/dashboard/summary` | Dados do dashboard |
| GET | `/api/categories/` | Listar categorias |
| GET | `/api/budgets/` | Listar metas |
| POST | `/api/budgets/` | Criar meta |
| GET | `/api/recurring/` | Listar recorrentes |
| POST | `/api/recurring/` | Criar recorrente |
| GET | `/api/goals/` | Listar objetivos |
| POST | `/api/goals/{id}/depositar` | Depositar em objetivo |
| GET | `/api/accounts/` | Listar contas |
| POST | `/api/accounts/transferir` | Transferir entre contas |
| POST | `/api/ai/chat` | Chat com assistente IA |

##  Deploy em producao

### Railway (recomendado)
1. Faca push para o GitHub
2. Acesse [railway.app](https://railway.app) e conecte o repositorio
3. Adicione as variaveis de ambiente
4. Deploy automatico!

### Render
1. Crie um **Web Service** em [render.com](https://render.com)
2. Build command: `pip install -r requirements.txt && pip install pydantic-settings google-genai`
3. Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

## Roadmap

- [ ] Testes automatizados com pytest
- [ ] Deploy na nuvem
- [ ] Integracao com Open Finance via Pluggy
- [ ] PWA para funcionar como app no celular
- [ ] Relatorio anual completo
- [ ] Notificacoes por email

## 📄 Licenca

MIT License

---

Desenvolvido por **Tiago Bonetti** — GitHub](https://github.com/cyber-tiago-bit)
