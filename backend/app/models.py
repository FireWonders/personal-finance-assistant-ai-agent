from sqlalchemy import Column, Integer, String, Float, DateTime, Enum
from sqlalchemy.sql import func
import enum
from .database import Base


class TransactionType(str, enum.Enum):
    """거래 타입"""
    INCOME = "income"
    EXPENSE = "expense"


class TransactionStatus(str, enum.Enum):
    """거래 상태"""
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Transaction(Base):
    """거래 내역 모델"""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, nullable=False, index=True)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=True, index=True)
    type = Column(Enum(TransactionType), nullable=False)
    note = Column(String, nullable=True)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.COMPLETED)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class BudgetPlan(Base):
    """재무 계획 모델"""
    __tablename__ = "budget_plans"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, nullable=False, index=True)
    month = Column(Integer, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)
    planned_amount = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class FrequencyType(str, enum.Enum):
    """정기 거래 주기"""
    MONTHLY = "monthly"
    YEARLY = "yearly"
    WEEKLY = "weekly"


class RegularTransaction(Base):
    """정기 거래 모델"""
    __tablename__ = "regular_transactions"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=True)
    type = Column(Enum(TransactionType), nullable=False)
    frequency_type = Column(Enum(FrequencyType), default=FrequencyType.MONTHLY)
    day_of_month = Column(Integer, nullable=True)  # 매월 며칠에 실행할지
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class AssetGoal(Base):
    """자산 목표 모델"""
    __tablename__ = "asset_goals"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    target_date = Column(DateTime, nullable=False)
    current_amount = Column(Float, default=0.0)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
