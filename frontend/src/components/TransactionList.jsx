import { useState, useEffect } from 'react';
import { transactionsAPI } from '../services/api';
import { format } from 'date-fns';

function TransactionList() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        type: '',
        category: '',
        start_date: '',
        end_date: ''
    });

    useEffect(() => {
        fetchTransactions();
    }, [filters]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filters.type) params.type = filters.type;
            if (filters.category) params.category = filters.category;
            if (filters.start_date) params.start_date = new Date(filters.start_date).toISOString();
            if (filters.end_date) params.end_date = new Date(filters.end_date).toISOString();

            const response = await transactionsAPI.getAll(params);
            setTransactions(response.data);
        } catch (error) {
            console.error('거래 내역 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('이 거래를 삭제하시겠습니까?')) return;

        try {
            await transactionsAPI.delete(id);
            fetchTransactions();
        } catch (error) {
            console.error('거래 삭제 실패:', error);
            alert('거래 삭제에 실패했습니다.');
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(value);
    };

    const formatDate = (dateString) => {
        return format(new Date(dateString), 'yyyy-MM-dd HH:mm');
    };

    // 카테고리 리스트 (중복 제거)
    const categories = [...new Set(transactions.map(t => t.category))];

    return (
        <div className="transaction-list">
            <h2 className="page-title">거래 내역</h2>

            {/* 필터 */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 className="card-title">필터</h3>
                <div className="grid grid-4">
                    <div className="input-group">
                        <label className="input-label">거래 유형</label>
                        <select name="type" value={filters.type} onChange={handleFilterChange} className="select">
                            <option value="">전체</option>
                            <option value="income">수입</option>
                            <option value="expense">지출</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">카테고리</label>
                        <select name="category" value={filters.category} onChange={handleFilterChange} className="select">
                            <option value="">전체</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">시작 날짜</label>
                        <input
                            type="date"
                            name="start_date"
                            value={filters.start_date}
                            onChange={handleFilterChange}
                            className="input"
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">종료 날짜</label>
                        <input
                            type="date"
                            name="end_date"
                            value={filters.end_date}
                            onChange={handleFilterChange}
                            className="input"
                        />
                    </div>
                </div>
            </div>

            {/* 거래 목록 */}
            <div className="card">
                {loading ? (
                    <div className="spinner"></div>
                ) : transactions.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                        거래 내역이 없습니다.
                    </p>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>날짜</th>
                                    <th>유형</th>
                                    <th>카테고리</th>
                                    <th>금액</th>
                                    <th>출처</th>
                                    <th>메모</th>
                                    <th>작업</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(transaction => (
                                    <tr key={transaction.id}>
                                        <td>{formatDate(transaction.date)}</td>
                                        <td>
                                            <span className={`badge badge-${transaction.type}`}>
                                                {transaction.type === 'income' ? '수입' : '지출'}
                                            </span>
                                        </td>
                                        <td>{transaction.category}</td>
                                        <td style={{
                                            fontWeight: 600,
                                            color: transaction.type === 'income' ? 'var(--accent-success)' : 'var(--accent-danger)'
                                        }}>
                                            {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                                        </td>
                                        <td>{transaction.source || '-'}</td>
                                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {transaction.description || '-'}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleDelete(transaction.id)}
                                                className="btn btn-danger"
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                            >
                                                삭제
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    총 {transactions.length}건의 거래
                </div>
            </div>
        </div>
    );
}

export default TransactionList;
