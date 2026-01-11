from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .api import transactions, plans, excel, regular, simulation, tax

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Finance Manager API",
    description="1년 재무 계획 관리 API",
    version="1.0.0"
)

# CORS 설정 (프론트엔드와 통신을 위해)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React 개발 서버
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(transactions.router)
app.include_router(plans.router)
app.include_router(excel.router)
app.include_router(regular.router)
app.include_router(simulation.router)
app.include_router(tax.router)


@app.get("/")
def read_root():
    """루트 엔드포인트"""
    return {
        "message": "Welcome to Finance Manager API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    """헬스 체크"""
    return {"status": "healthy"}
