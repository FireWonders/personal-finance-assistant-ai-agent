from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional

from ..database import get_db
from ..models import Transaction, TransactionType
from ..services.finance_api import finance_api_service

router = APIRouter(prefix="/sync", tags=["Sync"])


@router.post("/bank-transactions")
async def sync_bank_transactions(
    account_id: str,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    금융 API에서 거래 내역을 가져와 데이터베이스에 저장
    
    Args:
        account_id: 계좌 ID (fintech_use_num)
        days: 조회할 과거 일수 (기본 30일)
    
    Returns:
        동기화 결과
    """
    try:
        # 날짜 범위 설정
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # 금융 API에서 거래 내역 가져오기
        transactions = finance_api_service.get_account_transactions(
            account_id=account_id,
            start_date=start_date,
            end_date=end_date
        )
        
        # 데이터베이스에 저장
        added_count = 0
        skipped_count = 0
        errors = []
        
        for trans_data in transactions:
            try:
                # 거래 날짜 파싱
                tran_date = datetime.strptime(trans_data.get("tran_date"), "%Y%m%d")
                
                # 거래 유형 결정 (입금/출금)
                tran_type = trans_data.get("tran_type")
                if tran_type == "1":  # 입금
                    transaction_type = TransactionType.INCOME
                elif tran_type == "2":  # 출금
                    transaction_type = TransactionType.EXPENSE
                else:
                    continue
                
                # 중복 체크 (같은 날짜, 같은 금액, 같은 설명)
                existing = db.query(Transaction).filter(
                    Transaction.date == tran_date,
                    Transaction.amount == float(trans_data.get("tran_amt", 0)),
                    Transaction.description == trans_data.get("print_content", "")
                ).first()
                
                if existing:
                    skipped_count += 1
                    continue
                
                # 새 거래 생성
                transaction = Transaction(
                    type=transaction_type,
                    category=trans_data.get("category", "자동수집"),  # 카테고리 자동 분류 필요
                    amount=float(trans_data.get("tran_amt", 0)),
                    description=trans_data.get("print_content", ""),
                    date=tran_date,
                    source=trans_data.get("branch_name", "은행")
                )
                
                db.add(transaction)
                added_count += 1
                
            except Exception as e:
                errors.append(f"거래 처리 실패: {str(e)}")
        
        # 커밋
        db.commit()
        
        return {
            "success": True,
            "message": "거래 내역 동기화 완료",
            "added": added_count,
            "skipped": skipped_count,
            "total_fetched": len(transactions),
            "errors": errors if errors else None
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"동기화 실패: {str(e)}")


@router.get("/status")
async def get_sync_status():
    """
    금융 API 연동 상태 확인
    
    Returns:
        API 설정 상태
    """
    return {
        "configured": finance_api_service.is_configured(),
        "api_url": finance_api_service.base_url,
        "has_api_key": bool(finance_api_service.api_key)
    }
