import { useState } from 'react';
import { transactionsAPI } from '../services/api';
import { format } from 'date-fns';

function TransactionForm({ onSuccess }) {
    const [formData, setFormData] = useState({
        type: 'expense',
        category: '',
        amount: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        source: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const categories = {
        income: ['급여', '보너스', '투자수익', '기타수입'],
        expense: ['식비', '교통비', '주거비', '통신비', '의료비', '문화생활', '쇼핑', '기타지출']
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
        setSuccess(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            // 날짜를 ISO 8601 형식으로 변환
            const dateTime = new Date(formData.date).toISOString();

            const payload = {
                type: formData.type,
                category: formData.category,
                amount: parseFloat(formData.amount),
                description: formData.description || null,
                date: dateTime,
                source: formData.source || null
            };

            await transactionsAPI.create(payload);
            setSuccess(true);

            // 폼 초기화
            setFormData({
                type: 'expense',
                category: '',
                amount: '',
                description: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                source: ''
            });

            // 부모 컴포넌트에 알림
            if (onSuccess) {
                onSuccess();
            }

            // 3초 후 성공 메시지 제거
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || '거래 추가에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="transaction-form-container">
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h2 className="card-title">새 거래 추가</h2>

                {error && (
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(255, 86, 48, 0.1)',
                        border: '1px solid var(--accent-danger)',
                        borderRadius: '8px',
                        color: 'var(--accent-danger)',
                        marginBottom: '1rem'
                    }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(54, 179, 126, 0.1)',
                        border: '1px solid var(--accent-success)',
                        borderRadius: '8px',
                        color: 'var(--accent-success)',
                        marginBottom: '1rem'
                    }}>
                        거래가 성공적으로 추가되었습니다!
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">거래 유형 *</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="select"
                            required
                        >
                            <option value="expense">지출</option>
                            <option value="income">수입</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">카테고리 *</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="select"
                            required
                        >
                            <option value="">카테고리를 선택하세요</option>
                            {categories[formData.type].map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">금액 (₩) *</label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            className="input"
                            placeholder="10000"
                            min="0"
                            step="100"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">날짜 *</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="input"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">출처/금융기관</label>
                        <input
                            type="text"
                            name="source"
                            value={formData.source}
                            onChange={handleChange}
                            className="input"
                            placeholder="예: 신한은행, 급여, 카드"
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">메모</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="textarea"
                            rows="3"
                            placeholder="거래에 대한 추가 정보를 입력하세요"
                        />
                    </div>

                    <button
                        type="submit"
                        className={`btn ${formData.type === 'income' ? 'btn-success' : 'btn-primary'}`}
                        disabled={loading}
                        style={{ width: '100%', marginTop: '1rem' }}
                    >
                        {loading ? '처리 중...' : '거래 추가'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default TransactionForm;
