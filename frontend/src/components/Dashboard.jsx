import React, { useState, useEffect } from 'react';
import { transactionsAPI } from '../api/client';
import { format } from 'date-fns';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date());

    useEffect(() => {
        fetchStats();
    }, [selectedMonth]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const year = selectedMonth.getFullYear();
            const month = selectedMonth.getMonth() + 1;

            const [monthlyData, incomeCategories, expenseCategories] = await Promise.all([
                transactionsAPI.getMonthlyStats(year, month),
                transactionsAPI.getCategoryStats(year, month, 'income'),
                transactionsAPI.getCategoryStats(year, month, 'expense'),
            ]);

            setStats({
                monthly: monthlyData.data,
                incomeCategories: incomeCategories.data,
                expenseCategories: expenseCategories.data,
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="spinner"></div>;
    }

    if (!stats) {
        return <div className="card">데이터를 불러올 수 없습니다.</div>;
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW',
        }).format(amount);
    };

    return (
        <div>
            <div className="flex-between mb-4">
                <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>대시보드</h1>
                <div className="flex gap-2">
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                            const newDate = new Date(selectedMonth);
                            newDate.setMonth(newDate.getMonth() - 1);
                            setSelectedMonth(newDate);
                        }}
                    >
                        ← 이전 달
                    </button>
                    <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                        {format(selectedMonth, 'yyyy년 MM월')}
                    </div>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                            const newDate = new Date(selectedMonth);
                            newDate.setMonth(newDate.getMonth() + 1);
                            setSelectedMonth(newDate);
                        }}
                    >
                        다음 달 →
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="card-grid">
                <div className="stat-card income">
                    <div className="stat-label">총 수입</div>
                    <div className="stat-value">{formatCurrency(stats.monthly.total_income)}</div>
                    <div className="stat-change positive">+ {formatCurrency(stats.monthly.total_income)}</div>
                </div>

                <div className="stat-card expense">
                    <div className="stat-label">총 지출</div>
                    <div className="stat-value">{formatCurrency(stats.monthly.total_expense)}</div>
                    <div className="stat-change negative">- {formatCurrency(stats.monthly.total_expense)}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">순 금액</div>
                    <div className="stat-value" style={{ color: stats.monthly.net_amount >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {formatCurrency(stats.monthly.net_amount)}
                    </div>
                    <div className="stat-change">
                        {stats.monthly.transaction_count}건의 거래
                    </div>
                </div>
            </div>

            {/* Category Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginTop: 'var(--spacing-xl)' }}>
                {/* Income Categories */}
                <div className="card">
                    <h2 className="card-title">수입 카테고리</h2>
                    {stats.incomeCategories.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                            {stats.incomeCategories.map((cat, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: '500' }}>{cat.category}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                                            {cat.transaction_count}건
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: '600', color: 'var(--success)' }}>
                                            {formatCurrency(cat.total_amount)}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                                            {cat.percentage.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-tertiary)' }}>이번 달 수입 내역이 없습니다.</p>
                    )}
                </div>

                {/* Expense Categories */}
                <div className="card">
                    <h2 className="card-title">지출 카테고리</h2>
                    {stats.expenseCategories.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                            {stats.expenseCategories.map((cat, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: '500' }}>{cat.category}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                                            {cat.transaction_count}건
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: '600', color: 'var(--danger)' }}>
                                            {formatCurrency(cat.total_amount)}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                                            {cat.percentage.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-tertiary)' }}>이번 달 지출 내역이 없습니다.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
