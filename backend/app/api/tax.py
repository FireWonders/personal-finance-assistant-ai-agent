from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Literal, Dict, Optional

from ..core.tax_calculator import TaxCalculator, TaxResult

router = APIRouter(prefix="/api/tax", tags=["tax"])

class TaxRequest(BaseModel):
    amount: float
    type: Literal["salary", "financial"]
    dependents: int = 1  # 부양가족 수 (급여 계산 시 사용)

@router.post("/calculate", response_model=TaxResult)
def calculate_tax(request: TaxRequest):
    """세금 및 실수령액 계산"""
    if request.type == "salary":
        return TaxCalculator.calculate_salary_tax(request.amount, request.dependents)
    elif request.type == "financial":
        return TaxCalculator.calculate_financial_tax(request.amount)
    else:
        raise HTTPException(status_code=400, detail="Invalid calculation type")
