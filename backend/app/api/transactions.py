from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from .. import crud, schemas, models
from ..database import get_db

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("/", response_model=List[schemas.TransactionResponse])
def read_transactions(
    skip: int = 0,
    limit: int = Query(100, le=1000),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    category: Optional[str] = None,
    type: Optional[models.TransactionType] = None,
    db: Session = Depends(get_db)
):
    """거래 내역 목록 조회"""
    transactions = crud.get_transactions(
        db, skip=skip, limit=limit,
        start_date=start_date, end_date=end_date,
        category=category, type=type
    )
    return transactions


@router.get("/{transaction_id}", response_model=schemas.TransactionResponse)
def read_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """특정 거래 조회"""
    transaction = crud.get_transaction(db, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


@router.post("/", response_model=schemas.TransactionResponse, status_code=201)
def create_transaction(
    transaction: schemas.TransactionCreate,
    db: Session = Depends(get_db)
):
    """거래 생성"""
    return crud.create_transaction(db, transaction)


@router.put("/{transaction_id}", response_model=schemas.TransactionResponse)
def update_transaction(
    transaction_id: int,
    transaction: schemas.TransactionUpdate,
    db: Session = Depends(get_db)
):
    """거래 수정"""
    updated = crud.update_transaction(db, transaction_id, transaction)
    if not updated:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return updated


@router.delete("/{transaction_id}", status_code=204)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """거래 삭제"""
    success = crud.delete_transaction(db, transaction_id)
    if not success:
        raise HTTPException(status_code=404, detail="Transaction not found")


@router.get("/stats/monthly", response_model=schemas.MonthlyStats)
def get_monthly_stats(
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db)
):
    """월별 통계 조회"""
    return crud.get_monthly_stats(db, year, month)


@router.get("/stats/category", response_model=List[schemas.CategoryStats])
def get_category_stats(
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    type: models.TransactionType = Query(...),
    db: Session = Depends(get_db)
):
    """카테고리별 통계 조회"""
    return crud.get_category_stats(db, year, month, type)
