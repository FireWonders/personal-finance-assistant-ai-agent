from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import pandas as pd
import io
from datetime import datetime
from typing import List

from ..database import get_db
from ..models import Transaction, TransactionType
from ..schemas import TransactionResponse

router = APIRouter(prefix="/files", tags=["Files"])


@router.post("/upload-csv", response_model=dict)
async def upload_csv(
    file: UploadFile = File(..., description="CSV 파일"),
    db: Session = Depends(get_db)
):
    """CSV 파일 업로드 및 데이터베이스 저장"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="CSV 파일만 업로드 가능합니다")
    
    try:
        # CSV 파일 읽기
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # 필수 컬럼 확인
        required_columns = ['type', 'category', 'amount', 'date']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"필수 컬럼이 누락되었습니다: {', '.join(missing_columns)}"
            )
        
        # 데이터 변환 및 저장
        transactions_created = 0
        errors = []
        
        for idx, row in df.iterrows():
            try:
                # 날짜 파싱
                date = pd.to_datetime(row['date'])
                
                # Transaction 객체 생성
                transaction = Transaction(
                    type=TransactionType(row['type'].lower()),
                    category=row['category'],
                    amount=float(row['amount']),
                    description=row.get('description', None),
                    date=date,
                    source=row.get('source', None)
                )
                db.add(transaction)
                transactions_created += 1
            except Exception as e:
                errors.append(f"행 {idx + 2}: {str(e)}")
        
        # 커밋
        db.commit()
        
        return {
            "message": "CSV 파일 업로드 완료",
            "transactions_created": transactions_created,
            "errors": errors if errors else None
        }
    
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="빈 CSV 파일입니다")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"파일 처리 중 오류: {str(e)}")


@router.get("/download-csv")
def download_csv(
    start_date: datetime = None,
    end_date: datetime = None,
    db: Session = Depends(get_db)
):
    """거래 내역을 CSV 파일로 다운로드"""
    query = db.query(Transaction)
    
    # 날짜 필터
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    
    transactions = query.order_by(Transaction.date.desc()).all()
    
    # DataFrame 생성
    data = []
    for t in transactions:
        data.append({
            'id': t.id,
            'type': t.type.value,
            'category': t.category,
            'amount': t.amount,
            'description': t.description or '',
            'date': t.date.strftime('%Y-%m-%d %H:%M:%S'),
            'source': t.source or ''
        })
    
    df = pd.DataFrame(data)
    
    # CSV로 변환
    stream = io.StringIO()
    df.to_csv(stream, index=False, encoding='utf-8-sig')  # BOM 추가 (Excel 호환성)
    stream.seek(0)
    
    # StreamingResponse 반환
    return StreamingResponse(
        io.BytesIO(stream.getvalue().encode('utf-8-sig')),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=transactions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    )


@router.post("/upload-excel", response_model=dict)
async def upload_excel(
    file: UploadFile = File(..., description="Excel 파일"),
    db: Session = Depends(get_db)
):
    """Excel 파일 업로드 및 데이터베이스 저장"""
    if not (file.filename.endswith('.xlsx') or file.filename.endswith('.xls')):
        raise HTTPException(status_code=400, detail="Excel 파일만 업로드 가능합니다")
    
    try:
        # Excel 파일 읽기
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        # 필수 컬럼 확인
        required_columns = ['type', 'category', 'amount', 'date']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"필수 컬럼이 누락되었습니다: {', '.join(missing_columns)}"
            )
        
        # 데이터 변환 및 저장
        transactions_created = 0
        errors = []
        
        for idx, row in df.iterrows():
            try:
                # 날짜 파싱
                date = pd.to_datetime(row['date'])
                
                # Transaction 객체 생성
                transaction = Transaction(
                    type=TransactionType(row['type'].lower()),
                    category=row['category'],
                    amount=float(row['amount']),
                    description=row.get('description', None),
                    date=date,
                    source=row.get('source', None)
                )
                db.add(transaction)
                transactions_created += 1
            except Exception as e:
                errors.append(f"행 {idx + 2}: {str(e)}")
        
        # 커밋
        db.commit()
        
        return {
            "message": "Excel 파일 업로드 완료",
            "transactions_created": transactions_created,
            "errors": errors if errors else None
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"파일 처리 중 오류: {str(e)}")
