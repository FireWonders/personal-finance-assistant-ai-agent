from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import pandas as pd
import io
from datetime import datetime
from typing import List

from .. import crud, schemas, models
from ..database import get_db

router = APIRouter(prefix="/api/excel", tags=["excel"])


def parse_kakaopay_csv(file_content: bytes) -> List[schemas.TransactionCreate]:
    """카카오페이 CSV 파일 파싱"""
    # CSV 파일 읽기
    df = pd.read_csv(io.BytesIO(file_content), encoding='utf-8')
    
    transactions = []
    for _, row in df.iterrows():
        try:
            # 날짜 파싱
            date_str = row['날짜']
            date = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
            
            # 금액 파싱 ('+448,300원' -> 448300)
            amount_str = str(row['금액']).replace('+', '').replace('-', '').replace(',', '').replace('원', '').strip()
            amount = float(amount_str)
            
            # 수입/지출 구분 (+ -> income, - -> expense)
            is_income = '+' in str(row['금액'])
            trans_type = models.TransactionType.INCOME if is_income else models.TransactionType.EXPENSE
            
            # 상태 (취소 -> cancelled, 그 외 -> completed)
            status_str = str(row.get('상태', '')).strip()
            status = models.TransactionStatus.CANCELLED if status_str == '취소' else models.TransactionStatus.COMPLETED
            
            # 사용처
            description = str(row['사용처']).strip()
            
            # 카테고리 자동 분류 (간단한 규칙 기반)
            category = categorize_transaction(description)
            
            transaction = schemas.TransactionCreate(
                date=date,
                description=description,
                amount=amount,
                category=category,
                type=trans_type,
                status=status,
                note=f"Imported from KakaoPay CSV"
            )
            transactions.append(transaction)
        except Exception as e:
            print(f"Error parsing row: {row}, error: {e}")
            continue
    
    return transactions


def categorize_transaction(description: str) -> str:
    """거래 설명으로 카테고리 자동 분류"""
    description_lower = description.lower()
    
    # 간단한 규칙 기반 분류
    if any(keyword in description_lower for keyword in ['마트', '편의점', '스팟']):
        return '식비/생필품'
    elif any(keyword in description_lower for keyword in ['치킨', '맥도날드', 'bhc', '음식']):
        return '외식'
    elif any(keyword in description_lower for keyword in ['카드', '은행', '이자']):
        return '금융'
    elif any(keyword in description_lower for keyword in ['주유', '석유', '도로공사']):
        return '교통'
    elif any(keyword in description_lower for keyword in ['steam', '게임', 'game']):
        return '엔터테인먼트'
    elif any(keyword in description_lower for keyword in ['저금통', '모으기']):
        return '저축'
    elif '주식' in description or any(keyword in description for keyword in ['삼성', '현대', '브로드컴']):
        return '투자'
    else:
        return '기타'


@router.post("/import")
async def import_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Excel/CSV 파일 임포트"""
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
    
    try:
        content = await file.read()
        
        # CSV 파일인 경우 카카오페이 포맷으로 파싱
        if file.filename.endswith('.csv'):
            transactions = parse_kakaopay_csv(content)
        else:
            # Excel 파일 처리
            df = pd.read_excel(io.BytesIO(content))
            # 카카오페이 포맷 확인
            if '날짜' in df.columns and '사용처' in df.columns and '금액' in df.columns:
                # CSV와 동일한 처리
                transactions = parse_kakaopay_csv(content)
            else:
                raise HTTPException(status_code=400, detail="Unsupported Excel format")
        
        # 데이터베이스에 저장
        created_count = 0
        for trans in transactions:
            crud.create_transaction(db, trans)
            created_count += 1
        
        return {
            "message": f"Successfully imported {created_count} transactions",
            "count": created_count
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import file: {str(e)}")


@router.get("/export/transactions")
def export_transactions(
    start_date: datetime = None,
    end_date: datetime = None,
    db: Session = Depends(get_db)
):
    """거래 내역 Excel 다운로드"""
    transactions = crud.get_transactions(
        db, skip=0, limit=10000,
        start_date=start_date, end_date=end_date
    )
    
    # DataFrame 생성
    data = []
    for trans in transactions:
        data.append({
            '날짜': trans.date.strftime('%Y-%m-%d %H:%M:%S'),
            '설명': trans.description,
            '금액': trans.amount,
            '카테고리': trans.category or '',
            '타입': '수입' if trans.type == models.TransactionType.INCOME else '지출',
            '상태': '완료' if trans.status == models.TransactionStatus.COMPLETED else '취소',
            '메모': trans.note or ''
        })
    
    df = pd.DataFrame(data)
    
    # Excel 파일 생성
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='거래내역')
    output.seek(0)
    
    # 파일명 생성
    filename = f"transactions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/monthly-report")
def export_monthly_report(
    year: int,
    month: int,
    db: Session = Depends(get_db)
):
    """월별 리포트 Excel 다운로드"""
    # 월별 통계
    stats = crud.get_monthly_stats(db, year, month)
    
    # 카테고리별 통계
    income_stats = crud.get_category_stats(db, year, month, models.TransactionType.INCOME)
    expense_stats = crud.get_category_stats(db, year, month, models.TransactionType.EXPENSE)
    
    # Excel 파일 생성
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        # 요약 시트
        summary_data = {
            '항목': ['총 수입', '총 지출', '순 금액', '거래 건수'],
            '금액': [stats.total_income, stats.total_expense, stats.net_amount, stats.transaction_count]
        }
        pd.DataFrame(summary_data).to_excel(writer, index=False, sheet_name='요약')
        
        # 수입 카테고리 시트
        if income_stats:
            income_data = {
                '카테고리': [s.category for s in income_stats],
                '금액': [s.total_amount for s in income_stats],
                '비율(%)': [round(s.percentage, 2) for s in income_stats]
            }
            pd.DataFrame(income_data).to_excel(writer, index=False, sheet_name='수입 카테고리')
        
        # 지출 카테고리 시트
        if expense_stats:
            expense_data = {
                '카테고리': [s.category for s in expense_stats],
                '금액': [s.total_amount for s in expense_stats],
                '비율(%)': [round(s.percentage, 2) for s in expense_stats]
            }
            pd.DataFrame(expense_data).to_excel(writer, index=False, sheet_name='지출 카테고리')
    
    output.seek(0)
    
    filename = f"monthly_report_{year}_{month:02d}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
