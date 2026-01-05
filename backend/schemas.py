from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from .models import TransactionType


# Category 스키마
class CategoryBase(BaseModel):
    """카테고리 기본 스키마"""
    name: str = Field(..., description="카테고리 이름")
    type: TransactionType = Field(..., description="거래 유형 (수입/지출)")
    description: Optional[str] = Field(None, description="카테고리 설명")


class CategoryCreate(CategoryBase):
    """카테고리 생성 스키마"""
    pass


class CategoryResponse(CategoryBase):
    """카테고리 응답 스키마"""
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Transaction 스키마
class TransactionBase(BaseModel):
    """거래 기본 스키마"""
    type: TransactionType = Field(..., description="거래 유형 (수입/지출)")
    category: str = Field(..., description="카테고리")
    amount: float = Field(..., gt=0, description="금액 (0보다 커야 함)")
    description: Optional[str] = Field(None, description="설명")
    date: datetime = Field(..., description="거래 날짜")
    source: Optional[str] = Field(None, description="금융기관명 또는 수입/지출원")


class TransactionCreate(TransactionBase):
    """거래 생성 스키마"""
    pass


class TransactionUpdate(BaseModel):
    """거래 수정 스키마 (모든 필드 선택적)"""
    type: Optional[TransactionType] = None
    category: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    description: Optional[str] = None
    date: Optional[datetime] = None
    source: Optional[str] = None


class TransactionResponse(TransactionBase):
    """거래 응답 스키마"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# 통계/분석 스키마
class SummaryResponse(BaseModel):
    """재무 요약 응답 스키마"""
    total_income: float = Field(..., description="총 수입")
    total_expense: float = Field(..., description="총 지출")
    net_amount: float = Field(..., description="순자산 (수입 - 지출)")
    transaction_count: int = Field(..., description="총 거래 건수")


class CategorySummary(BaseModel):
    """카테고리별 요약"""
    category: str
    total_amount: float
    transaction_count: int


class MonthlyTrend(BaseModel):
    """월별 추세"""
    month: str  # YYYY-MM 형식
    income: float
    expense: float
    net: float
