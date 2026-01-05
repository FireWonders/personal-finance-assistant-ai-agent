from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from datetime import datetime
import enum

from .database import Base


class TransactionType(str, enum.Enum):
    """거래 유형 열거형"""
    INCOME = "income"  # 수입
    EXPENSE = "expense"  # 지출


class Category(Base):
    """카테고리 테이블"""
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    type = Column(SQLEnum(TransactionType), nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Transaction(Base):
    """거래 내역 테이블"""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(SQLEnum(TransactionType), nullable=False, index=True)
    category = Column(String, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    date = Column(DateTime, nullable=False, index=True)
    source = Column(String, nullable=True)  # 금융기관명 또는 수입/지출원
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Transaction(id={self.id}, type={self.type}, amount={self.amount}, date={self.date})>"
