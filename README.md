# 재무 관리 웹 애플리케이션

개인 재무 현황을 관리하고 분석하기 위한 풀스택 웹 애플리케이션입니다. Python FastAPI 백엔드와 React 프론트엔드로 구성되어 있습니다.

## 🚀 주요 기능

- **재무 대시보드**: 수입/지출 현황을 한눈에 파악
- **거래 내역 관리**: 수입/지출 내역 추가, 조회, 삭제
- **데이터 시각화**: 월별 추세, 카테고리별 지출 차트
- **파일 관리**: CSV/Excel 파일로 데이터 일괄 업로드 및 다운로드
- **금융결제원 API 연동 준비**: 실제 금융 데이터 연동을 위한 구조 설계

## 🛠 기술 스택

### 백엔드
- **FastAPI**: 고성능 Python 웹 프레임워크
- **SQLAlchemy**: ORM (SQLite 기본, PostgreSQL 전환 가능)
- **Pandas**: 데이터 처리 및 CSV/Excel 변환
- **Pydantic**: 데이터 검증 및 스키마 정의

### 프론트엔드
- **React 18**: 사용자 인터페이스
- **Vite**: 빠른 개발 서버 및 빌드 도구
- **Recharts**: 데이터 시각화 차트 라이브러리
- **Axios**: HTTP 클라이언트
- **date-fns**: 날짜 처리

## 📦 설치 및 실행

### 1. 사전 준비
- Python 3.8 이상
- Node.js 16 이상
- npm 또는 yarn

### 2. 백엔드 설정

```bash
# 가상환경 생성 (선택사항)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 필요한 설정을 입력하세요

# 백엔드 서버 실행
uvicorn backend.main:app --reload
```

백엔드 서버가 `http://localhost:8000`에서 실행됩니다.
API 문서는 `http://localhost:8000/docs`에서 확인할 수 있습니다.

### 3. 프론트엔드 설정

```bash
# frontend 디렉토리로 이동
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드가 `http://localhost:5173`에서 실행됩니다.

## 📁 프로젝트 구조

```
Finance/
├── backend/               # Python FastAPI 백엔드
│   ├── main.py           # FastAPI 애플리케이션 진입점
│   ├── database.py       # 데이터베이스 설정
│   ├── models.py         # SQLAlchemy 모델
│   ├── schemas.py        # Pydantic 스키마
│   ├── routers/          # API 라우터
│   │   ├── transactions.py
│   │   ├── analytics.py
│   │   └── files.py
│   └── services/         # 비즈니스 로직
│       └── finance_api.py
├── frontend/             # React 프론트엔드
│   ├── src/
│   │   ├── components/   # React 컴포넌트
│   │   │   ├── Dashboard.jsx
│   │   │   ├── TransactionForm.jsx
│   │   │   ├── TransactionList.jsx
│   │   │   └── FileManager.jsx
│   │   ├── services/     # API 클라이언트
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── requirements.txt      # Python 의존성
├── .env.example         # 환경 변수 템플릿
├── .gitignore
├── README.md
└── dev_log.md           # 개발 로그
```

## 🔐 보안 및 개인정보 보호

- `.env` 파일에 API 키와 민감한 정보 저장
- 데이터베이스 파일(`.db`)과 업로드 파일(`uploads/`)은 Git에 포함되지 않음
- `.gitignore`로 개인정보 파일 제외

## 📊 API 엔드포인트

### 거래 내역
- `POST /api/transactions/` - 거래 추가
- `GET /api/transactions/` - 거래 목록 조회 (필터링 가능)
- `GET /api/transactions/{id}` - 거래 상세 조회
- `PUT /api/transactions/{id}` - 거래 수정
- `DELETE /api/transactions/{id}` - 거래 삭제

### 분석
- `GET /api/analytics/summary` - 재무 요약
- `GET /api/analytics/by-category` - 카테고리별 요약
- `GET /api/analytics/monthly-trend` - 월별 추세

### 파일
- `POST /api/files/upload-csv` - CSV 업로드
- `POST /api/files/upload-excel` - Excel 업로드
- `GET /api/files/download-csv` - CSV 다운로드

## 💡 CSV/Excel 파일 포맷

파일 업로드 시 다음 컬럼이 필요합니다:

| 컬럼 | 설명 | 필수 | 예시 |
|------|------|------|------|
| type | 거래 유형 | O | income, expense |
| category | 카테고리 | O | 식비, 급여 |
| amount | 금액 | O | 15000 |
| date | 날짜 | O | 2026-01-05 |
| description | 설명 | X | 점심식사 |
| source | 출처 | X | 신한카드 |

## 🔮 향후 개선 사항

- [ ] 금융결제원 API 실제 연동
- [ ] 사용자 인증 및 다중 사용자 지원
- [ ] 예산 설정 및 알림 기능
- [ ] 월별/연간 보고서 생성
- [ ] 모바일 반응형 개선

## 📝 라이센스

이 프로젝트는 개인 재무 관리 목적으로 제작되었습니다.

## 👤 개발자

개발 과정 및 의도는 `dev_log.md`에 기록되어 있습니다.
