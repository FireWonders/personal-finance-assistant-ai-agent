from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/plans", tags=["budget_plans"])


@router.get("/", response_model=List[schemas.BudgetPlanResponse])
def read_plans(
    skip: int = 0,
    limit: int = Query(100, le=1000),
    year: Optional[int] = Query(None, ge=2000, le=2100),
    month: Optional[int] = Query(None, ge=1, le=12),
    db: Session = Depends(get_db)
):
    """재무 계획 목록 조회"""
    plans = crud.get_budget_plans(db, skip=skip, limit=limit, year=year, month=month)
    return plans


@router.get("/{plan_id}", response_model=schemas.BudgetPlanResponse)
def read_plan(plan_id: int, db: Session = Depends(get_db)):
    """특정 재무 계획 조회"""
    plan = crud.get_budget_plan(db, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Budget plan not found")
    return plan


@router.post("/", response_model=schemas.BudgetPlanResponse, status_code=201)
def create_plan(
    plan: schemas.BudgetPlanCreate,
    db: Session = Depends(get_db)
):
    """재무 계획 생성"""
    return crud.create_budget_plan(db, plan)


@router.put("/{plan_id}", response_model=schemas.BudgetPlanResponse)
def update_plan(
    plan_id: int,
    plan: schemas.BudgetPlanUpdate,
    db: Session = Depends(get_db)
):
    """재무 계획 수정"""
    updated = crud.update_budget_plan(db, plan_id, plan)
    if not updated:
        raise HTTPException(status_code=404, detail="Budget plan not found")
    return updated


@router.delete("/{plan_id}", status_code=204)
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    """재무 계획 삭제"""
    success = crud.delete_budget_plan(db, plan_id)
    if not success:
        raise HTTPException(status_code=404, detail="Budget plan not found")
