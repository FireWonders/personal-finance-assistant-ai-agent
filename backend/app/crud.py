from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import datetime
from . import models, schemas


# Transaction CRUD
def get_transactions(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    category: Optional[str] = None,
    type: Optional[models.TransactionType] = None
) -> List[models.Transaction]:
    """거래 내역 조회"""
    query = db.query(models.Transaction)
    
    if start_date:
        query = query.filter(models.Transaction.date >= start_date)
    if end_date:
        query = query.filter(models.Transaction.date <= end_date)
    if category:
        query = query.filter(models.Transaction.category == category)
    if type:
        query = query.filter(models.Transaction.type == type)
    
    return query.order_by(models.Transaction.date.desc()).offset(skip).limit(limit).all()


def get_transaction(db: Session, transaction_id: int) -> Optional[models.Transaction]:
    """특정 거래 조회"""
    return db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()


def create_transaction(db: Session, transaction: schemas.TransactionCreate) -> models.Transaction:
    """거래 생성"""
    db_transaction = models.Transaction(**transaction.model_dump())
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


def update_transaction(
    db: Session,
    transaction_id: int,
    transaction: schemas.TransactionUpdate
) -> Optional[models.Transaction]:
    """거래 수정"""
    db_transaction = get_transaction(db, transaction_id)
    if not db_transaction:
        return None
    
    update_data = transaction.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_transaction, key, value)
    
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


def delete_transaction(db: Session, transaction_id: int) -> bool:
    """거래 삭제"""
    db_transaction = get_transaction(db, transaction_id)
    if not db_transaction:
        return False
    
    db.delete(db_transaction)
    db.commit()
    return True


# Budget Plan CRUD
def get_budget_plans(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    year: Optional[int] = None,
    month: Optional[int] = None
) -> List[models.BudgetPlan]:
    """재무 계획 조회"""
    query = db.query(models.BudgetPlan)
    
    if year:
        query = query.filter(models.BudgetPlan.year == year)
    if month:
        query = query.filter(models.BudgetPlan.month == month)
    
    return query.order_by(models.BudgetPlan.year.desc(), models.BudgetPlan.month.desc()).offset(skip).limit(limit).all()


def get_budget_plan(db: Session, plan_id: int) -> Optional[models.BudgetPlan]:
    """특정 재무 계획 조회"""
    return db.query(models.BudgetPlan).filter(models.BudgetPlan.id == plan_id).first()


def create_budget_plan(db: Session, plan: schemas.BudgetPlanCreate) -> models.BudgetPlan:
    """재무 계획 생성"""
    db_plan = models.BudgetPlan(**plan.model_dump())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan


def update_budget_plan(
    db: Session,
    plan_id: int,
    plan: schemas.BudgetPlanUpdate
) -> Optional[models.BudgetPlan]:
    """재무 계획 수정"""
    db_plan = get_budget_plan(db, plan_id)
    if not db_plan:
        return None
    
    update_data = plan.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_plan, key, value)
    
    db.commit()
    db.refresh(db_plan)
    return db_plan


def delete_budget_plan(db: Session, plan_id: int) -> bool:
    """재무 계획 삭제"""
    db_plan = get_budget_plan(db, plan_id)
    if not db_plan:
        return False
    
    db.delete(db_plan)
    db.commit()
    return True


# Statistics
def get_monthly_stats(db: Session, year: int, month: int) -> schemas.MonthlyStats:
    """월별 통계 조회"""
    income = db.query(func.sum(models.Transaction.amount)).filter(
        extract('year', models.Transaction.date) == year,
        extract('month', models.Transaction.date) == month,
        models.Transaction.type == models.TransactionType.INCOME,
        models.Transaction.status == models.TransactionStatus.COMPLETED
    ).scalar() or 0.0
    
    expense = db.query(func.sum(models.Transaction.amount)).filter(
        extract('year', models.Transaction.date) == year,
        extract('month', models.Transaction.date) == month,
        models.Transaction.type == models.TransactionType.EXPENSE,
        models.Transaction.status == models.TransactionStatus.COMPLETED
    ).scalar() or 0.0
    
    count = db.query(func.count(models.Transaction.id)).filter(
        extract('year', models.Transaction.date) == year,
        extract('month', models.Transaction.date) == month,
        models.Transaction.status == models.TransactionStatus.COMPLETED
    ).scalar() or 0
    
    return schemas.MonthlyStats(
        year=year,
        month=month,
        total_income=income,
        total_expense=expense,
        net_amount=income - expense,
        transaction_count=count
    )


def get_category_stats(
    db: Session,
    year: int,
    month: int,
    type: models.TransactionType
) -> List[schemas.CategoryStats]:
    """카테고리별 통계 조회"""
    results = db.query(
        models.Transaction.category,
        func.sum(models.Transaction.amount).label('total'),
        func.count(models.Transaction.id).label('count')
    ).filter(
        extract('year', models.Transaction.date) == year,
        extract('month', models.Transaction.date) == month,
        models.Transaction.type == type,
        models.Transaction.status == models.TransactionStatus.COMPLETED,
        models.Transaction.category.isnot(None)
    ).group_by(models.Transaction.category).all()
    
    total_amount = sum(r.total for r in results) or 1.0  # Avoid division by zero
    
    return [
        schemas.CategoryStats(
            category=r.category,
            total_amount=r.total,
            transaction_count=r.count,
            percentage=(r.total / total_amount) * 100
        )
        for r in results
    ]


# Regular Transaction CRUD
def get_regular_transactions(
    db: Session,
    skip: int = 0,
    limit: int = 100
) -> List[models.RegularTransaction]:
    """정기 거래 목록 조회"""
    return db.query(models.RegularTransaction).offset(skip).limit(limit).all()


def get_regular_transaction(db: Session, regular_id: int) -> Optional[models.RegularTransaction]:
    """특정 정기 거래 조회"""
    return db.query(models.RegularTransaction).filter(models.RegularTransaction.id == regular_id).first()


def create_regular_transaction(
    db: Session,
    regular: schemas.RegularTransactionCreate
) -> models.RegularTransaction:
    """정기 거래 생성"""
    db_regular = models.RegularTransaction(**regular.model_dump())
    db.add(db_regular)
    db.commit()
    db.refresh(db_regular)
    return db_regular


def update_regular_transaction(
    db: Session,
    regular_id: int,
    regular: schemas.RegularTransactionUpdate
) -> Optional[models.RegularTransaction]:
    """정기 거래 수정"""
    db_regular = get_regular_transaction(db, regular_id)
    if not db_regular:
        return None
    
    update_data = regular.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_regular, key, value)
    
    db.commit()
    db.refresh(db_regular)
    return db_regular


def delete_regular_transaction(db: Session, regular_id: int) -> bool:
    """정기 거래 삭제"""
    db_regular = get_regular_transaction(db, regular_id)
    if not db_regular:
        return False
    
    db.delete(db_regular)
    db.commit()
    return True


# Asset Goal CRUD
def get_asset_goals(
    db: Session,
    skip: int = 0,
    limit: int = 100
) -> List[models.AssetGoal]:
    """자산 목표 목록 조회"""
    return db.query(models.AssetGoal).offset(skip).limit(limit).all()


def get_asset_goal(db: Session, goal_id: int) -> Optional[models.AssetGoal]:
    """특정 자산 목표 조회"""
    return db.query(models.AssetGoal).filter(models.AssetGoal.id == goal_id).first()


def create_asset_goal(
    db: Session,
    goal: schemas.AssetGoalCreate
) -> models.AssetGoal:
    """자산 목표 생성"""
    db_goal = models.AssetGoal(**goal.model_dump())
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal


def update_asset_goal(
    db: Session,
    goal_id: int,
    goal: schemas.AssetGoalUpdate
) -> Optional[models.AssetGoal]:
    """자산 목표 수정"""
    db_goal = get_asset_goal(db, goal_id)
    if not db_goal:
        return None
    
    update_data = goal.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_goal, key, value)
    
    db.commit()
    db.refresh(db_goal)
    return db_goal


def delete_asset_goal(db: Session, goal_id: int) -> bool:
    """자산 목표 삭제"""
    db_goal = get_asset_goal(db, goal_id)
    if not db_goal:
        return False
    
    db.delete(db_goal)
    db.commit()
    return True
