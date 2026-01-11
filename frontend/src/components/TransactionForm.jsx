import React, { useState, useEffect } from 'react';
import { transactionsAPI } from '../api/client';

export default function TransactionForm({ transaction, onClose }) {
    const [formData, setFormData] = useState({
        date: '',
        description: '',
        amount: '',
        category: '',
        type: 'expense',
        note: '',
        status: 'completed',
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (transaction) {
            setFormData({
                date: transaction.date ? new Date(transaction.date).toISOString().slice(0, 16) : '',
                description: transaction.description || '',
                amount: transaction.amount || '',
                category: transaction.category || '',
                type: transaction.type || 'expense',
                note: transaction.note || '',
                status: transaction.status || 'completed',
            });
        } else {
            // Default to current date/time
            setFormData(prev => ({
                ...prev,
                date: new Date().toISOString().slice(0, 16),
            }));
        }
    }, [transaction]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                amount: parseFloat(formData.amount),
                date: new Date(formData.date).toISOString(),
            };

            if (transaction) {
                await transactionsAPI.update(transaction.id, payload);
            } else {
                await transactionsAPI.create(payload);
            }

            onClose();
        } catch (error) {
            console.error('Failed to save transaction:', error);
            alert('저장에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {transaction ? '거래 수정' : '새 거래 추가'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">날짜 및 시간</label>
                        <input
                            type="datetime-local"
                            name="date"
                            className="form-input"
                            value={formData.date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">설명</label>
                        <input
                            type="text"
                            name="description"
                            className="form-input"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="거래 설명..."
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                        <div className="form-group">
                            <label className="form-label">금액</label>
                            <input
                                type="number"
                                name="amount"
                                className="form-input"
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder="0"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">타입</label>
                            <select
                                name="type"
                                className="form-select"
                                value={formData.type}
                                onChange={handleChange}
                                required
                            >
                                <option value="income">수입</option>
                                <option value="expense">지출</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                        <div className="form-group">
                            <label className="form-label">카테고리</label>
                            <input
                                type="text"
                                name="category"
                                className="form-input"
                                value={formData.category}
                                onChange={handleChange}
                                placeholder="예: 식비, 교통비..."
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">상태</label>
                            <select
                                name="status"
                                className="form-select"
                                value={formData.status}
                                onChange={handleChange}
                                required
                            >
                                <option value="completed">완료</option>
                                <option value="cancelled">취소</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">메모</label>
                        <textarea
                            name="note"
                            className="form-textarea"
                            value={formData.note}
                            onChange={handleChange}
                            placeholder="추가 메모..."
                        />
                    </div>

                    <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            취소
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? '저장 중...' : '저장'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
