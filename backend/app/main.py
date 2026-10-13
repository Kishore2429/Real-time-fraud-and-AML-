import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import create_db_and_tables
from .routers import health, transactions, aml, accounts, cases, dashboard

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(
    title=os.getenv("APP_NAME", "SYNESIS 26 Fraud & AML Risk Orchestration"),
    description="Synthetic-data prototype for transaction risk scoring, AML pattern flags, account relationships, and case management.",
    version="0.1.0",
    lifespan=lifespan,
)
origins = [x.strip() for x in os.getenv("FRONTEND_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/")
def root():
    return {"project": app.title, "status": "running", "docs": "/docs", "dashboard": "/api/dashboard"}

app.include_router(health.router)
app.include_router(transactions.router)
app.include_router(aml.router)
app.include_router(accounts.router)
app.include_router(cases.router)
app.include_router(dashboard.router)
