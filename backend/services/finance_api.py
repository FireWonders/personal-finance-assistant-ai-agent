import os
import requests
from typing import List, Dict, Optional
from datetime import datetime


class FinanceAPIService:
    """
    금융결제원 오픈 API 연동 서비스
    
    실제 API 키를 받으면 이 클래스를 통해 금융 데이터를 가져올 수 있습니다.
    현재는 구조만 설계되어 있으며, 실제 API 명세에 맞게 수정이 필요합니다.
    """
    
    def __init__(self):
        self.api_key = os.getenv("FINANCE_API_KEY", "")
        self.base_url = os.getenv("FINANCE_API_BASE_URL", "https://api.example.com")
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def is_configured(self) -> bool:
        """API 키가 설정되어 있는지 확인"""
        return bool(self.api_key and self.api_key != "")
    
    def _get_access_token(self) -> str:
        """
        OAuth 토큰 발급
        
        Returns:
            Access token
        """
        # 실제 환경에서는 OAuth 플로우를 통해 토큰을 발급받아야 합니다
        # 여기서는 API 키를 그대로 사용
        return self.api_key
    
    def get_account_transactions(
        self,
        account_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict]:
        """
        계좌 거래 내역 조회 (localhost:8080/banking API 사용)
        
        Args:
            account_id: 계좌 ID (fintech_use_num)
            start_date: 조회 시작 날짜
            end_date: 조회 종료 날짜
        
        Returns:
            거래 내역 리스트
        """
        if not self.is_configured():
            raise ValueError("금융 API 키가 설정되지 않았습니다")
        
        # OAuth 토큰 발급
        token = self._get_access_token()
        
        # 거래내역 조회
        endpoint = f"{self.base_url}/v2.0/account/transaction_list/fin_num"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        params = {
            "bank_tran_id": f"T{datetime.now().strftime('%Y%m%d%H%M%S')}",  # 거래고유번호
            "fintech_use_num": account_id,
            "inquiry_type": "A",  # A: All (전체)
            "from_date": start_date.strftime("%Y%m%d"),
            "to_date": end_date.strftime("%Y%m%d"),
            "sort_order": "D"  # D: 내림차순
        }
        
        try:
            response = requests.get(endpoint, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
            
            # API 응답에서 거래내역 추출
            if data.get("rsp_code") == "A0000":  # 성공
                return data.get("res_list", [])
            else:
                raise ValueError(f"API 오류: {data.get('rsp_message', 'Unknown error')}")
                
        except requests.exceptions.RequestException as e:
            raise ValueError(f"API 호출 실패: {str(e)}")
    
    def get_account_balance(self, account_id: str) -> Optional[float]:
        """
        계좌 잔액 조회
        
        Args:
            account_id: 계좌 ID
        
        Returns:
            계좌 잔액
        """
        if not self.is_configured():
            raise ValueError("금융결제원 API 키가 설정되지 않았습니다")
        
        # 실제 API 호출 로직 (예시)
        # endpoint = f"{self.base_url}/accounts/{account_id}/balance"
        # response = requests.get(endpoint, headers=self.headers)
        # response.raise_for_status()
        # return response.json().get("balance")
        
        # 현재는 None 반환 (실제 API 연동 시 수정 필요)
        return None
    
    def get_accounts(self) -> List[Dict]:
        """
        연동된 계좌 목록 조회
        
        Returns:
            계좌 목록
        """
        if not self.is_configured():
            raise ValueError("금융결제원 API 키가 설정되지 않았습니다")
        
        # 실제 API 호출 로직 (예시)
        # endpoint = f"{self.base_url}/accounts"
        # response = requests.get(endpoint, headers=self.headers)
        # response.raise_for_status()
        # return response.json()
        
        # 현재는 빈 리스트 반환 (실제 API 연동 시 수정 필요)
        return []


# 싱글톤 인스턴스
finance_api_service = FinanceAPIService()
