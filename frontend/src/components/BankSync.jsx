import { useState } from 'react';
import { analyticsAPI } from '../services/api';
import axios from 'axios';

function BankSync() {
    const [syncing, setSyncing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [accountId, setAccountId] = useState('');
    const [days, setDays] = useState(30);

    const handleSync = async () => {
        if (!accountId.trim()) {
            setError('계좌 ID를 입력해주세요.');
            return;
        }

        setSyncing(true);
        setError('');
        setResult(null);

        try {
            const response = await axios.post('/api/sync/bank-transactions', null, {
                params: {
                    account_id: accountId,
                    days: days
                }
            });

            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || '동기화에 실패했습니다.');
        } finally {
            setSyncing(false);
        }
    };

    const checkStatus = async () => {
        try {
            const response = await axios.get('/api/sync/status');
            alert(
                `API 연동 상태:\n` +
                `- 설정 여부: ${response.data.configured ? '✓' : '✗'}\n` +
                `- API URL: ${response.data.api_url}\n` +
                `- API Key: ${response.data.has_api_key ? '설정됨' : '미설정'}`
            );
        } catch (err) {
            alert('상태 확인 실패');
        }
    };

    return (
        <div className="bank-sync">
            <h2 className="page-title">🏦 은행 거래 내역 동기화</h2>

            {/* 상태 확인 */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 className="card-title">API 연동 상태</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    금융 API가 올바르게 설정되어 있는지 확인하세요.
                </p>
                <button onClick={checkStatus} className="btn btn-secondary">
                    🔍 상태 확인
                </button>
            </div>

            {/* 동기화 폼 */}
            <div className="card">
                <h3 className="card-title">거래 내역 가져오기</h3>

                <div className="input-group">
                    <label className="input-label">계좌 ID (fintech_use_num)</label>
                    <input
                        type="text"
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        className="input"
                        placeholder="계좌 핀테크 이용번호 입력"
                    />
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        금융결제원에서 발급받은 핀테크 이용번호를 입력하세요.
                    </small>
                </div>

                <div className="input-group">
                    <label className="input-label">조회 기간 (일)</label>
                    <input
                        type="number"
                        value={days}
                        onChange={(e) => setDays(parseInt(e.target.value) || 30)}
                        className="input"
                        min="1"
                        max="365"
                    />
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        최근 며칠간의 거래 내역을 가져올지 설정하세요. (기본: 30일)
                    </small>
                </div>

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

                {result && (
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(54, 179, 126, 0.1)',
                        border: '1px solid var(--accent-success)',
                        borderRadius: '8px',
                        color: 'var(--accent-success)',
                        marginBottom: '1rem'
                    }}>
                        <strong>✓ {result.message}</strong>
                        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                            <li>가져온 거래: {result.total_fetched}건</li>
                            <li>추가된 거래: {result.added}건</li>
                            <li>중복으로 건너뛴 거래: {result.skipped}건</li>
                        </ul>
                        {result.errors && result.errors.length > 0 && (
                            <div style={{ marginTop: '0.5rem', color: 'var(--accent-warning)' }}>
                                <strong>경고:</strong>
                                <ul style={{ paddingLeft: '1.5rem' }}>
                                    {result.errors.map((err, idx) => (
                                        <li key={idx}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={handleSync}
                    className="btn btn-primary"
                    disabled={syncing}
                    style={{ width: '100%' }}
                >
                    {syncing ? '🔄 동기화 중...' : '🔄 거래 내역 가져오기'}
                </button>
            </div>

            {/* 안내 */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3 className="card-title">📌 사용 안내</h3>
                <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.5rem' }}>
                    <li>금융결제원 API 서버가 실행 중이어야 합니다.</li>
                    <li>.env 파일에 API 키가 올바르게 설정되어 있어야 합니다.</li>
                    <li>중복된 거래는 자동으로 건너뜁니다.</li>
                    <li>거래 카테고리는 "자동수집"으로 설정되며, 나중에 수정할 수 있습니다.</li>
                </ul>
            </div>
        </div>
    );
}

export default BankSync;
