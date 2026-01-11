from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from dateutil.relativedelta import relativedelta
from typing import List

from .. import crud, schemas, models
from ..database import get_db

router = APIRouter(prefix="/api/simulation", tags=["simulation"])


@router.get("/goals", response_model=List[schemas.AssetGoalResponse])
def read_asset_goals(db: Session = Depends(get_db)):
    """자산 목표 목록 조회"""
    return crud.get_asset_goals(db)


@router.post("/goals", response_model=schemas.AssetGoalResponse, status_code=201)
def create_asset_goal(goal: schemas.AssetGoalCreate, db: Session = Depends(get_db)):
    """자산 목표 생성"""
    return crud.create_asset_goal(db, goal)


@router.delete("/goals/{goal_id}", status_code=204)
def delete_asset_goal(goal_id: int, db: Session = Depends(get_db)):
    """자산 목표 삭제"""
    success = crud.delete_asset_goal(db, goal_id)
    if not success:
        raise HTTPException(status_code=404, detail="Asset goal not found")


@router.get("/analyze/{goal_id}", response_model=schemas.SimulationResult)
def analyze_goal(goal_id: int, db: Session = Depends(get_db)):
    """자산 목표 달성 가능성 분석"""
    goal = crud.get_asset_goal(db, goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Asset goal not found")
    
    # 정기 거래 목록 가져오기
    regulars = crud.get_regular_transactions(db, limit=1000)
    
    # 시뮬레이션 설정
    current_date = datetime.now()
    target_date = goal.target_date
    current_amount = goal.current_amount
    
    # 목표 달성까지 남은 개월 수 계산
    diff = relativedelta(target_date, current_date)
    months_remaining = diff.years * 12 + diff.months
    if months_remaining < 1:
        months_remaining = 1
        
    monthly_data = []
    simulated_amount = current_amount
    
    # 월별 순수익(정기 수입 - 정기 지출) 계산
    monthly_income = sum(r.amount for r in regulars if r.type == models.TransactionType.INCOME)
    monthly_expense = sum(r.amount for r in regulars if r.type == models.TransactionType.EXPENSE)
    monthly_net = monthly_income - monthly_expense
    
    # 시뮬레이션 실행
    for i in range(months_remaining + 1):
        future_date = current_date + relativedelta(months=i)
        date_str = future_date.strftime("%Y-%m")
        
        monthly_data.append({
            "date": date_str,
            "projected_amount": simulated_amount,
            "target_line": goal.target_amount  # 그래프 비교용
        })
        
        simulated_amount += monthly_net
        
    # 결과 분석
    final_amount = monthly_data[-1]["projected_amount"]
    is_achievable = final_amount >= goal.target_amount
    shortfall = goal.target_amount - final_amount
    
    monthly_saving_needed = 0
    if shortfall > 0:
        monthly_saving_needed = shortfall / months_remaining
        
    return schemas.SimulationResult(
        monthly_data=monthly_data,
        final_amount=final_amount,
        is_achievable=is_achievable,
        shortfall=shortfall,
        monthly_saving_needed=monthly_saving_needed
    )
