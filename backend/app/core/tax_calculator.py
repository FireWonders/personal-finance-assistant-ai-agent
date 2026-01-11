from pydantic import BaseModel
from typing import Optional, Dict

class TaxResult(BaseModel):
    gross_amount: float
    net_amount: float
    deductions: Dict[str, float]  # { "national_pension": 1000, ... }
    details: Dict[str, str]  # { "income_tax_rate": "15%" }

class TaxCalculator:
    @staticmethod
    def calculate_salary_tax(gross_monthly_amount: float, dependents: int = 1) -> TaxResult:
        """
        2024년 기준 근로소득 간이세액표 및 4대보험 요율 적용
        
        4대보험 요율 (근로자 부담분 기준):
        - 국민연금: 4.5% (상한액 존재: 월 617만원 소득 기준 약 27만원)
        - 건강보험: 3.545%
        - 장기요양: 건강보험료의 12.95% (약 0.459%)
        - 고용보험: 0.9%
        """
        
        # 1. 국민연금 (4.5%, 상한액 월 소득 617만원 적용 -> 최대 277,650원)
        pension_income = min(gross_monthly_amount, 6170000)
        national_pension = int(pension_income * 0.045 / 10) * 10  # 10원 단위 절사

        # 2. 건강보험 (3.545%)
        health_insurance = int(gross_monthly_amount * 0.03545 / 10) * 10
        
        # 3. 장기요양보험 (건강보험료의 12.95%)
        long_term_care = int(health_insurance * 0.1295 / 10) * 10
        
        # 4. 고용보험 (0.9%)
        employment_insurance = int(gross_monthly_amount * 0.009 / 10) * 10
        
        total_insurance = national_pension + health_insurance + long_term_care + employment_insurance
        
        # 5. 근로소득세 (간이세액표 약식 적용 - 누진공제 방식 활용)
        # 2024년 과세표준 구간 (연소득 기준 대략적 환산)
        # 월 급여에서 비과세 식대(20만원) 등 제외해야 하나, 단순화를 위해 총급여 기준 계산
        # 근로소득공제 테이블 (약식)
        annual_salary = gross_monthly_amount * 12
        
        if annual_salary <= 5000000:
            deduction_rate = 0.70
            deduction = annual_salary * 0.70
        elif annual_salary <= 15000000:
            deduction = 3500000 + (annual_salary - 5000000) * 0.40
        elif annual_salary <= 45000000:
            deduction = 7500000 + (annual_salary - 15000000) * 0.15
        elif annual_salary <= 100000000:
            deduction = 12000000 + (annual_salary - 45000000) * 0.05
        else:
            deduction = 14750000 + (annual_salary - 100000000) * 0.02
        
        tax_base_annual = annual_salary - deduction - (1500000 * dependents) # 기본공제 인적공제만 적용
        if tax_base_annual < 0: tax_base_annual = 0
        
        # 기본 세율 (2024년)
        if tax_base_annual <= 14000000:
            tax = tax_base_annual * 0.06
        elif tax_base_annual <= 50000000:
            tax = 840000 + (tax_base_annual - 14000000) * 0.15
        elif tax_base_annual <= 88000000:
            tax = 6240000 + (tax_base_annual - 50000000) * 0.24
        elif tax_base_annual <= 150000000:
            tax = 15360000 + (tax_base_annual - 88000000) * 0.35
        elif tax_base_annual <= 300000000:
            tax = 37060000 + (tax_base_annual - 150000000) * 0.38
        elif tax_base_annual <= 500000000:
            tax = 94060000 + (tax_base_annual - 300000000) * 0.40
        elif tax_base_annual <= 1000000000:
            tax = 174060000 + (tax_base_annual - 500000000) * 0.42
        else:
            tax = 384060000 + (tax_base_annual - 1000000000) * 0.45
            
        income_tax = int(tax / 12 / 10) * 10
        local_income_tax = int(income_tax * 0.1 / 10) * 10
        
        total_tax = income_tax + local_income_tax
        total_deduction = total_insurance + total_tax
        net_amount = gross_monthly_amount - total_deduction
        
        return TaxResult(
            gross_amount=gross_monthly_amount,
            net_amount=net_amount,
            deductions={
                "national_pension": national_pension,
                "health_insurance": health_insurance,
                "long_term_care": long_term_care,
                "employment_insurance": employment_insurance,
                "income_tax": income_tax,
                "local_income_tax": local_income_tax,
                "total_deduction": total_deduction
            },
            details={
                "note": "본 계산은 간이세액표 및 4대보험 요율을 적용한 예상치이며, 실제와 차이가 있을 수 있습니다."
            }
        )

    @staticmethod
    def calculate_financial_tax(income: float) -> TaxResult:
        """금융소득세 계산 (이자, 배당소득 15.4%)"""
        income_tax = int(income * 0.14 / 10) * 10
        local_income_tax = int(income_tax * 0.1 / 10) * 10
        total_deduction = income_tax + local_income_tax
        net_amount = income - total_deduction
        
        return TaxResult(
            gross_amount=income,
            net_amount=net_amount,
            deductions={
                "income_tax": income_tax,
                "local_income_tax": local_income_tax,
                "total_deduction": total_deduction
            },
            details={
                "rate": "15.4% (소득세 14% + 지방세 1.4%)"
            }
        )
