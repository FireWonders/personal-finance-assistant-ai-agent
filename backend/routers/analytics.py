from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models import Transaction, TransactionType
from ..schemas import SummaryResponse, CategorySummary, MonthlyTrend

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary", response_model=SummaryResponse)
def get_summary(
    start_date: Optional[datetime] = Query(None, description="시작 날짜"),
    end_date: Optional[datetime] = Query(None, description="종료 날짜"),
    db: Session = Depends(get_db)
):
    """재무 요약 정보 조회"""
    query = db.query(Transaction)
    
    # 날짜 필터
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    
    # 총 수입 계산
    total_income = query.filter(Transaction.type == TransactionType.INCOME).with_entities(
        func.coalesce(func.sum(Transaction.amount), 0)
    ).scalar()
    
    # 총 지출 계산
    total_expense = query.filter(Transaction.type == TransactionType.EXPENSE).with_entities(
        func.coalesce(func.sum(Transaction.amount), 0)
    ).scalar()
    
    # 총 거래 건수
    transaction_count = query.count()
    
    return {
        "total_income": float(total_income),
        "total_expense": float(total_expense),
        "net_amount": float(total_income - total_expense),
        "transaction_count": transaction_count
    }


@router.get("/by-category", response_model=List[CategorySummary])
def get_category_summary(
    type: Optional[TransactionType] = Query(None, description="거래 유형"),
    start_date: Optional[datetime] = Query(None, description="시작 날짜"),
    end_date: Optional[datetime] = Query(None, description="종료 날짜"),
    db: Session = Depends(get_db)
):
    """카테고리별 거래 요약"""
    query = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label("total_amount"),
        func.count(Transaction.id).label("transaction_count")
    )
    
    # 필터 적용
    if type:
        query = query.filter(Transaction.type == type)
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    
    # 그룹화 및 정렬
    results = query.group_by(Transaction.category).order_by(func.sum(Transaction.amount).desc()).all()
    
    return [
        {
            "category": category,
            "total_amount": float(total_amount),
            "transaction_count": count
        }
        for category, total_amount, count in results
    ]


@router.get("/monthly-trend", response_model=List[MonthlyTrend])
def get_monthly_trend(
    months: int = Query(12, ge=1, le=60, description="조회할 개월 수"),
    db: Session = Depends(get_db)
):
    """월별 수입/지출 추세"""
    # 연도와 월별로 그룹화
    query = db.query(
        func.strftime('%Y-%m', Transaction.date).label('month'),
        Transaction.type,
        func.sum(Transaction.amount).label('total')
    ).group_by('month', Transaction.type).order_by('month')
    
    results = query.all()
    
    # 월별로 데이터 정리
    monthly_data = {}
    for month, trans_type, total in results:
        if month not in monthly_data:
            monthly_data[month] = {"month": month, "income": 0.0, "expense": 0.0, "net": 0.0}
        
        if trans_type == TransactionType.INCOME:
            monthly_data[month]["income"] = float(total)
        elif trans_type == TransactionType.EXPENSE:
            monthly_data[month]["expense"] = float(total)
    
    # 순자산 계산
    for month_data in monthly_data.values():
        month_data["net"] = month_data["income"] - month_data["expense"]
    
    # 최근 N개월만 반환
    sorted_months = sorted(monthly_data.values(), key=lambda x: x["month"], reverse=True)
    return sorted_months[:months]
