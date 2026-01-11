import React, { useState, useEffect } from 'react';
import { transactionsAPI } from '../api/client';
import { format } from 'date-fns';
import TransactionForm from './TransactionForm';

export default function TransactionList() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [filter, setFilter] = useState({ category: '', type: '' });

    useEffect(() => {
        fetchTransactions();
    }, [filter]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filter.category) params.category = filter.category;
            if (filter.type) params.type = filter.type;

            const response = await transactionsAPI.getAll(params);
            setTransactions(response.data);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('이 거래를 삭제하시겠습니까?')) return;

        try {
            await transactionsAPI.delete(id);
            fetchTransactions();
        } catch (error) {
            console.error('Failed to delete transaction:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    const handleEdit = (transaction) => {
        setEditingTransaction(transaction);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingTransaction(null);
        fetchTransactions();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW',
        }).format(amount);
    };

    if (loading) {
        return <div className="spinner"></div>;
    }

    return (
        <div>
            <div className="flex-between mb-4">
                <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>거래 내역</h1>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    + 새 거래 추가
                </button>
            </div>

            {/* Filters */}
            <div className="card mb-3">
                <div className="flex gap-3">
                    <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                        <label className="form-label">타입</label>
                        <select
                            className="form-select"
                            value={filter.type}
                            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                        >
                            <option value="">전체</option>
                            <option value="income">수입</option>
                            <option value="expense">지출</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                        <label className="form-label">카테고리</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="카테고리 검색..."
                            value={filter.category}
                            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="card">
                {transactions.length === 0 ? (
                    <p className="text-center" style={{ color: 'var(--text-tertiary)', padding: 'var(--spacing-xl)' }}>
                        거래 내역이 없습니다.
                    </p>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>날짜</th>
                                    <th>설명</th>
                                    <th>카테고리</th>
                                    <th>타입</th>
                                    <th>금액</th>
                                    <th>상태</th>
                                    <th>작업</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((transaction) => (
                                    <tr key={transaction.id}>
                                        <td>{format(new Date(transaction.date), 'yyyy-MM-dd HH:mm')}</td>
                                        <td>{transaction.description}</td>
                                        <td>{transaction.category || '-'}</td>
                                        <td>
                                            <span className={`badge badge-${transaction.type}`}>
                                                {transaction.type === 'income' ? '수입' : '지출'}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: '600', color: transaction.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${transaction.status}`}>
                                                {transaction.status === 'completed' ? '완료' : '취소'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex gap-1">
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => handleEdit(transaction)}
                                                >
                                                    수정
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDelete(transaction.id)}
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Transaction Form Modal */}
            {showForm && (
                <TransactionForm
                    transaction={editingTransaction}
                    onClose={handleFormClose}
                />
            )}
        </div>
    );
}
