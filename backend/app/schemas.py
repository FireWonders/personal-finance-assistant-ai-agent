from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from .models import TransactionType, TransactionStatus


# Transaction Schemas
class TransactionBase(BaseModel):
    """거래 기본 스키마"""
    date: datetime
    description: str
    amount: float
    category: Optional[str] = None
    type: TransactionType
    note: Optional[str] = None
    status: TransactionStatus = TransactionStatus.COMPLETED


class TransactionCreate(TransactionBase):
    """거래 생성 스키마"""
    pass


class TransactionUpdate(BaseModel):
    """거래 수정 스키마"""
    date: Optional[datetime] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    type: Optional[TransactionType] = None
    note: Optional[str] = None
    status: Optional[TransactionStatus] = None


class TransactionResponse(TransactionBase):
    """거래 응답 스키마"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Budget Plan Schemas
class BudgetPlanBase(BaseModel):
    """재무 계획 기본 스키마"""
    year: int = Field(..., ge=2000, le=2100)
    month: int = Field(..., ge=1, le=12)
    category: str
    planned_amount: float = Field(..., ge=0)
    description: Optional[str] = None


class BudgetPlanCreate(BudgetPlanBase):
    """재무 계획 생성 스키마"""
    pass


class BudgetPlanUpdate(BaseModel):
    """재무 계획 수정 스키마"""
    year: Optional[int] = Field(None, ge=2000, le=2100)
    month: Optional[int] = Field(None, ge=1, le=12)
    category: Optional[str] = None
    planned_amount: Optional[float] = Field(None, ge=0)
    description: Optional[str] = None


class BudgetPlanResponse(BudgetPlanBase):
    """재무 계획 응답 스키마"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Statistics Schemas
class MonthlyStats(BaseModel):
    """월별 통계 스키마"""
    year: int
    month: int
    total_income: float
    total_expense: float
    net_amount: float
    transaction_count: int


class CategoryStats(BaseModel):
    """카테고리별 통계 스키마"""
    category: str
    total_amount: float
    transaction_count: int
    percentage: float


# Regular Transaction Schemas
from .models import FrequencyType

class RegularTransactionBase(BaseModel):
    """정기 거래 기본 스키마"""
    description: str
    amount: float
    category: Optional[str] = None
    type: TransactionType
    frequency_type: FrequencyType = FrequencyType.MONTHLY
    day_of_month: Optional[int] = Field(None, ge=1, le=31)
    start_date: datetime
    end_date: Optional[datetime] = None


class RegularTransactionCreate(RegularTransactionBase):
    """정기 거래 생성 스키마"""
    pass


class RegularTransactionUpdate(BaseModel):
    """정기 거래 수정 스키마"""
    description: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    type: Optional[TransactionType] = None
    frequency_type: Optional[FrequencyType] = None
    day_of_month: Optional[int] = Field(None, ge=1, le=31)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class RegularTransactionResponse(RegularTransactionBase):
    """정기 거래 응답 스키마"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Asset Goal Schemas
class AssetGoalBase(BaseModel):
    """자산 목표 기본 스키마"""
    title: str
    target_amount: float
    target_date: datetime
    current_amount: float = 0.0
    description: Optional[str] = None


class AssetGoalCreate(AssetGoalBase):
    """자산 목표 생성 스키마"""
    pass


class AssetGoalUpdate(BaseModel):
    """자산 목표 수정 스키마"""
    title: Optional[str] = None
    target_amount: Optional[float] = None
    target_date: Optional[datetime] = None
    current_amount: Optional[float] = None
    description: Optional[str] = None


class AssetGoalResponse(AssetGoalBase):
    """자산 목표 응답 스키마"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Asset Simulation Schema
class SimulationResult(BaseModel):
    """자산 시뮬레이션 결과"""
    monthly_data: list[dict]  # [{date: '2026-01', projected_amount: 1000}, ...]
    final_amount: float
    is_achievable: bool
    shortfall: float  # 부족액 (초과 시 0 또는 음수)
    monthly_saving_needed: float  # 목표 달성을 위해 매월 필요한 추가 저축액
