# 💰 FinTrack — Controle Financeiro Pessoal

Aplicação web completa para controle de finanças pessoais, com backend em **FastAPI + Python**, banco de dados **PostgreSQL (Supabase)**, autenticação via **JWT** e frontend em **HTML/CSS/JS puro**.

![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green?logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?logo=supabase)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Funcionalidades

- **Autenticação completa** — cadastro, login e logout com JWT
- **Dashboard interativo** — gráfico de pizza por categoria e barras de fluxo mensal
- **Lançamentos** — registre entradas e saídas com categoria, forma de pagamento e observação
- **Filtros avançados** — filtre por tipo, categoria e mês
- **Categorias** — 17 categorias pré-configuradas (alimentação, moradia, saúde, cartão, etc.)
- **Navegação por mês** — visualize qualquer período com os seletores de mês
- **API documentada** — acesse `/docs` para testar todos os endpoints interativamente

## 🛠️ Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Python 3.11 + FastAPI |
| Banco de dados | PostgreSQL via Supabase |
| ORM | SQLAlchemy 2.0 |
| Autenticação | JWT (python-jose + passlib bcrypt) |
| Frontend | HTML5 + CSS3 + JavaScript puro |
| Gráficos | Chart.js 4 |
| Deploy | Uvicorn (local) / Railway ou Render (produção) |

## 🚀 Como rodar localmente

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/fintrack.git
cd fintrack
```

### 2. Crie e ative um ambiente virtual

```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

### 3. Instale as dependências

```bash
pip install -r requirements.txt
pip install pydantic-settings  # se necessário
```

### 4. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais do Supabase:

```env
DATABASE_URL=postgresql://postgres:[SENHA]@db.[ID].supabase.co:5432/postgres
SECRET_KEY=gere_uma_chave_com_python_-c_"import_secrets;print(secrets.token_hex(32))"
```

### 5. Inicie o servidor

```bash
uvicorn backend.main:app --reload
```

Acesse: **http://localhost:8000**
Documentação da API: **http://localhost:8000/docs**

## 🗄️ Configurando o Supabase (banco de dados gratuito)

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita
2. Crie um novo projeto
3. Vá em **Settings > Database** e copie a **Connection string (URI)**
4. Cole no campo `DATABASE_URL` do seu `.env`
5. As tabelas são criadas automaticamente na primeira execução

## 📁 Estrutura do projeto

```
fintrack/
├── backend/
│   ├── core/
│   │   ├── config.py       # Settings com pydantic
│   │   ├── database.py     # Conexão SQLAlchemy
│   │   └── security.py     # JWT e autenticação
│   ├── models/
│   │   ├── user.py         # Modelo de usuário
│   │   └── transaction.py  # Modelos de categoria e transação
│   ├── routers/
│   │   ├── auth.py         # Registro e login
│   │   ├── categories.py   # CRUD de categorias
│   │   └── transactions.py # CRUD + dashboard summary
│   ├── schemas/
│   │   ├── user.py         # Schemas Pydantic de usuário
│   │   └── transaction.py  # Schemas de transação e categoria
│   └── main.py             # App FastAPI + roteamento
├── frontend/
│   ├── static/
│   │   ├── css/style.css   # Estilos da aplicação
│   │   └── js/app.js       # Lógica do frontend
│   └── templates/
│       └── index.html      # SPA principal
├── .env.example
├── requirements.txt
└── README.md
```

## 🌐 Deploy em produção

### Railway (recomendado)

1. Faça push do projeto para o GitHub
2. Acesse [railway.app](https://railway.app) e conecte o repositório
3. Adicione as variáveis de ambiente do `.env`
4. O Railway detecta o FastAPI automaticamente

### Render

1. Crie um novo **Web Service** no [render.com](https://render.com)
2. Conecte o repositório GitHub
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

## 📡 Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Criar conta |
| POST | `/api/auth/login` | Fazer login |
| GET | `/api/transactions/` | Listar transações (com filtros) |
| POST | `/api/transactions/` | Criar transação |
| PUT | `/api/transactions/{id}` | Editar transação |
| DELETE | `/api/transactions/{id}` | Excluir transação |
| GET | `/api/transactions/dashboard/summary` | Dados do dashboard |
| GET | `/api/categories/` | Listar categorias |
| POST | `/api/categories/` | Criar categoria |
| DELETE | `/api/categories/{id}` | Excluir categoria |

> Acesse `/docs` para testar todos os endpoints com interface interativa (Swagger UI).

## 🔮 Próximas funcionalidades (roadmap)

- [ ] Metas de economia por categoria
- [ ] Exportação para Excel/CSV
- [ ] Integração com Open Finance via Pluggy
- [ ] Gráfico de evolução patrimonial
- [ ] Notificações de orçamento excedido
- [ ] Versão mobile (PWA)

## 📄 Licença

MIT License — sinta-se à vontade para usar, modificar e distribuir.

---

Desenvolvido por **Tiago Bonetti** — [LinkedIn](https://linkedin.com/in/seu-perfil) · [GitHub](https://github.com/seu-usuario)
