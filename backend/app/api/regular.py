from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/regular", tags=["regular_transactions"])


@router.get("/", response_model=List[schemas.RegularTransactionResponse])
def read_regular_transactions(
    skip: int = 0,
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db)
):
    """정기 거래 목록 조회"""
    return crud.get_regular_transactions(db, skip=skip, limit=limit)


@router.get("/{regular_id}", response_model=schemas.RegularTransactionResponse)
def read_regular_transaction(regular_id: int, db: Session = Depends(get_db)):
    """특정 정기 거래 조회"""
    regular = crud.get_regular_transaction(db, regular_id)
    if not regular:
        raise HTTPException(status_code=404, detail="Regular transaction not found")
    return regular


@router.post("/", response_model=schemas.RegularTransactionResponse, status_code=201)
def create_regular_transaction(
    regular: schemas.RegularTransactionCreate,
    db: Session = Depends(get_db)
):
    """정기 거래 생성"""
    return crud.create_regular_transaction(db, regular)


@router.put("/{regular_id}", response_model=schemas.RegularTransactionResponse)
def update_regular_transaction(
    regular_id: int,
    regular: schemas.RegularTransactionUpdate,
    db: Session = Depends(get_db)
):
    """정기 거래 수정"""
    updated = crud.update_regular_transaction(db, regular_id, regular)
    if not updated:
        raise HTTPException(status_code=404, detail="Regular transaction not found")
    return updated


@router.delete("/{regular_id}", status_code=204)
def delete_regular_transaction(regular_id: int, db: Session = Depends(get_db)):
    """정기 거래 삭제"""
    success = crud.delete_regular_transaction(db, regular_id)
    if not success:
        raise HTTPException(status_code=404, detail="Regular transaction not found")
