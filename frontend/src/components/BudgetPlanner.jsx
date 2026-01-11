import React, { useState, useEffect } from 'react';
import { budgetPlansAPI } from '../api/client';

export default function BudgetPlanner() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [formData, setFormData] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        category: '',
        planned_amount: '',
        description: '',
    });

    useEffect(() => {
        fetchPlans();
    }, [selectedYear]);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await budgetPlansAPI.getAll({ year: selectedYear });
            setPlans(response.data);
        } catch (error) {
            console.error('Failed to fetch budget plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await budgetPlansAPI.create({
                ...formData,
                planned_amount: parseFloat(formData.planned_amount),
            });
            setShowForm(false);
            setFormData({
                year: selectedYear,
                month: new Date().getMonth() + 1,
                category: '',
                planned_amount: '',
                description: '',
            });
            fetchPlans();
        } catch (error) {
            console.error('Failed to create budget plan:', error);
            alert('저장에 실패했습니다.');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('이 재무 계획을 삭제하시겠습니까?')) return;
        try {
            await budgetPlansAPI.delete(id);
            fetchPlans();
        } catch (error) {
            console.error('Failed to delete plan:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW',
        }).format(amount);
    };

    const groupPlansByMonth = () => {
        const grouped = {};
        plans.forEach(plan => {
            if (!grouped[plan.month]) {
                grouped[plan.month] = [];
            }
            grouped[plan.month].push(plan);
        });
        return grouped;
    };

    const monthlyPlans = groupPlansByMonth();

    if (loading) {
        return <div className="spinner"></div>;
    }

    return (
        <div>
            <div className="flex-between mb-4">
                <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>재무 계획</h1>
                <div className="flex gap-2">
                    <select
                        className="form-select"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        style={{ width: 'auto' }}
                    >
                        {[2024, 2025, 2026, 2027].map(year => (
                            <option key={year} value={year}>{year}년</option>
                        ))}
                    </select>
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                        + 새 계획 추가
                    </button>
                </div>
            </div>

            {/* Monthly Plans Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                    <div key={month} className="card">
                        <h3 className="card-title">{month}월</h3>
                        {monthlyPlans[month] && monthlyPlans[month].length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                {monthlyPlans[month].map(plan => (
                                    <div key={plan.id} style={{ padding: 'var(--spacing-sm)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                                        <div className="flex-between">
                                            <div style={{ fontWeight: '600' }}>{plan.category}</div>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDelete(plan.id)}
                                                style={{ padding: '0.25rem 0.5rem' }}
                                            >
                                                삭제
                                            </button>
                                        </div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)', marginTop: 'var(--spacing-xs)' }}>
                                            {formatCurrency(plan.planned_amount)}
                                        </div>
                                        {plan.description && (
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: 'var(--spacing-xs)' }}>
                                                {plan.description}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div style={{ marginTop: 'var(--spacing-sm)', paddingTop: 'var(--spacing-sm)', borderTop: '1px solid var(--border)' }}>
                                    <div className="flex-between">
                                        <span style={{ fontWeight: '600' }}>총 예산</span>
                                        <span style={{ fontWeight: '700', fontSize: '1.125rem' }}>
                                            {formatCurrency(monthlyPlans[month].reduce((sum, p) => sum + p.planned_amount, 0))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                                계획이 없습니다.
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">새 재무 계획</h2>
                            <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div className="form-group">
                                    <label className="form-label">연도</label>
                                    <select
                                        className="form-select"
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                        required
                                    >
                                        {[2024, 2025, 2026, 2027].map(year => (
                                            <option key={year} value={year}>{year}년</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">월</label>
                                    <select
                                        className="form-select"
                                        value={formData.month}
                                        onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                                        required
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                                            <option key={month} value={month}>{month}월</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">카테고리</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="예: 식비, 교통비, 저축..."
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">계획 금액</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.planned_amount}
                                    onChange={(e) => setFormData({ ...formData, planned_amount: e.target.value })}
                                    placeholder="0"
                                    min="0"
                                    step="1000"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">설명</label>
                                <textarea
                                    className="form-textarea"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="계획에 대한 추가 설명..."
                                />
                            </div>

                            <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                    취소
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    저장
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
