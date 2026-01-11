import React, { useState, useEffect } from 'react';
import { regularTransactionsAPI, taxAPI } from '../api/client';
import { format } from 'date-fns';

export default function RegularTransactions() {
    const [regulars, setRegulars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [taxResult, setTaxResult] = useState(null); // 세금 계산 결과
    const [calculatingTax, setCalculatingTax] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: '',
        type: 'expense',
        frequency_type: 'monthly',
        day_of_month: '',
        start_date: new Date().toISOString().slice(0, 10),
    });

    useEffect(() => {
        fetchRegulars();
    }, []);

    const fetchRegulars = async () => {
        try {
            setLoading(true);
            const response = await regularTransactionsAPI.getAll();
            setRegulars(response.data);
        } catch (error) {
            console.error('Failed to fetch regular transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('이 정기 거래를 삭제하시겠습니까?')) return;
        try {
            await regularTransactionsAPI.delete(id);
            fetchRegulars();
        } catch (error) {
            console.error('Failed to delete:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            description: item.description,
            amount: item.amount,
            category: item.category || '',
            type: item.type,
            frequency_type: item.frequency_type || 'monthly',
            day_of_month: item.day_of_month || '',
            start_date: new Date(item.start_date).toISOString().slice(0, 10),
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                amount: parseFloat(formData.amount),
                day_of_month: formData.day_of_month ? parseInt(formData.day_of_month) : null,
                start_date: new Date(formData.start_date).toISOString(),
            };

            if (editingItem) {
                await regularTransactionsAPI.update(editingItem.id, payload);
            } else {
                await regularTransactionsAPI.create(payload);
            }
            setShowForm(false);
            setEditingItem(null);
            fetchRegulars();
        } catch (error) {
            console.error('Failed to save:', error);
            alert('저장에 실패했습니다.');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW',
        }).format(amount);
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div>
            <div className="flex-between mb-4">
                <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>정기 거래 관리</h1>
                <button className="btn btn-primary" onClick={() => {
                    setEditingItem(null);
                    setTaxResult(null);
                    setFormData({
                        description: '',
                        amount: '',
                        category: '',
                        type: 'expense',
                        frequency_type: 'monthly',
                        day_of_month: '',
                        start_date: new Date().toISOString().slice(0, 10),
                    });
                    setShowForm(true);
                }}>
                    + 새 정기 거래 추가
                </button>
            </div>

            <div className="card">
                <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>
                    매월 고정적으로 발생하는 수입(월급 등)과 지출(공과금, 구독료, 대출이자 등)을 등록하세요.
                    이 정보는 자산 시뮬레이션에 사용됩니다.
                </p>

                {regulars.length === 0 ? (
                    <p className="text-center" style={{ color: 'var(--text-tertiary)', padding: 'var(--spacing-xl)' }}>
                        등록된 정기 거래가 없습니다.
                    </p>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>설명</th>
                                    <th>금액</th>
                                    <th>타입</th>
                                    <th>주기</th>
                                    <th>실행일</th>
                                    <th>카테고리</th>
                                    <th>작업</th>
                                </tr>
                            </thead>
                            <tbody>
                                {regulars.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.description}</td>
                                        <td style={{ fontWeight: '600', color: item.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                                            {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${item.type}`}>
                                                {item.type === 'income' ? '수입' : '지출'}
                                            </span>
                                        </td>
                                        <td>
                                            {item.frequency_type === 'monthly' ? '매월' :
                                                item.frequency_type === 'yearly' ? '매년' : '매주'}
                                        </td>
                                        <td>
                                            {item.day_of_month ? `매월 ${item.day_of_month}일` : '-'}
                                        </td>
                                        <td>{item.category || '-'}</td>
                                        <td>
                                            <div className="flex gap-1">
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(item)}>수정</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>삭제</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingItem ? '정기 거래 수정' : '새 정기 거래 추가'}</h2>
                            <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">설명</label>
                                <input type="text" className="form-input" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">금액 (실수령액)</label>
                                <div className="flex gap-2">
                                    <input type="number" className="form-input" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                                    {formData.type === 'income' && (
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={async () => {
                                                if (!formData.amount) return;
                                                setCalculatingTax(true);
                                                try {
                                                    const res = await taxAPI.calculate({
                                                        amount: parseFloat(formData.amount),
                                                        type: 'salary',
                                                        dependents: 1
                                                    });
                                                    setTaxResult(res.data);
                                                    // 실수령액으로 자동 업데이트 여부 물어보기
                                                    if (confirm(`세전 ${formatCurrency(res.data.gross_amount)}원의 예상 실수령액은 ${formatCurrency(res.data.net_amount)}입니다.\n금액을 실수령액으로 변경하시겠습니까?`)) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            amount: res.data.net_amount,
                                                            description: `${prev.description} (세전: ${formatCurrency(res.data.gross_amount)})`
                                                        }));
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                    alert('계산 실패');
                                                } finally {
                                                    setCalculatingTax(false);
                                                }
                                            }}
                                            disabled={calculatingTax}
                                        >
                                            {calculatingTax ? '...' : '세금 계산'}
                                        </button>
                                    )}
                                </div>
                                {taxResult && formData.type === 'income' && (
                                    <div className="card mt-2 p-2" style={{ background: 'var(--bg-secondary)', fontSize: '0.875rem' }}>
                                        <div className="flex-between mb-1">
                                            <span>세전 금액</span>
                                            <span>{formatCurrency(taxResult.gross_amount)}</span>
                                        </div>
                                        <div className="flex-between mb-1" style={{ color: 'var(--danger)' }}>
                                            <span>총 공제액</span>
                                            <span>-{formatCurrency(taxResult.deductions.total_deduction)}</span>
                                        </div>
                                        <div style={{ paddingLeft: '0.5rem', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                                            <div>국민연금: {formatCurrency(taxResult.deductions.national_pension)}</div>
                                            <div>건강보험: {formatCurrency(taxResult.deductions.health_insurance)}</div>
                                            <div>소득세: {formatCurrency(taxResult.deductions.income_tax)}</div>
                                        </div>
                                        <div className="flex-between mt-2 pt-2" style={{ borderTop: '1px solid var(--border)', fontWeight: 'bold' }}>
                                            <span>예상 실수령액</span>
                                            <span style={{ color: 'var(--success)' }}>{formatCurrency(taxResult.net_amount)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div className="form-group">
                                    <label className="form-label">타입</label>
                                    <select className="form-select" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="income">수입</option>
                                        <option value="expense">지출</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">주기</label>
                                    <select className="form-select" value={formData.frequency_type} onChange={(e) => setFormData({ ...formData, frequency_type: e.target.value })}>
                                        <option value="monthly">매월</option>
                                        <option value="weekly">매주</option>
                                        <option value="yearly">매년</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">실행일 (매월 며칠)</label>
                                <input type="number" className="form-input" min="1" max="31" value={formData.day_of_month} onChange={(e) => setFormData({ ...formData, day_of_month: e.target.value })} placeholder="예: 25 (월급날)" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">시작일</label>
                                <input type="date" className="form-input" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">카테고리</label>
                                <input type="text" className="form-input" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
                            </div>
                            <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>취소</button>
                                <button type="submit" className="btn btn-primary">저장</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
