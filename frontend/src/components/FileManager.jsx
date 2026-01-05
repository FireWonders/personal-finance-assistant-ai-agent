import { useState } from 'react';
import { filesAPI } from '../services/api';

function FileManager({ onUploadSuccess }) {
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleFileUpload = async (e, fileType) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setMessage({ type: '', text: '' });

        try {
            let response;
            if (fileType === 'csv') {
                response = await filesAPI.uploadCSV(file);
            } else {
                response = await filesAPI.uploadExcel(file);
            }

            setMessage({
                type: 'success',
                text: `${response.data.transactions_created}건의 거래가 성공적으로 추가되었습니다.` +
                    (response.data.errors ? `\n\n오류: ${response.data.errors.join(', ')}` : '')
            });

            if (onUploadSuccess) {
                onUploadSuccess();
            }

            // 파일 입력 초기화
            e.target.value = '';
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.detail || '파일 업로드에 실패했습니다.'
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async () => {
        try {
            setMessage({ type: '', text: '' });
            const response = await filesAPI.downloadCSV();

            // Blob을 다운로드
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            setMessage({
                type: 'success',
                text: 'CSV 파일이 성공적으로 다운로드되었습니다.'
            });
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'CSV 다운로드에 실패했습니다.'
            });
        }
    };

    return (
        <div className="file-manager">
            <h2 className="page-title">파일 관리</h2>

            {message.text && (
                <div style={{
                    padding: '1rem',
                    background: message.type === 'success' ? 'rgba(54, 179, 126, 0.1)' : 'rgba(255, 86, 48, 0.1)',
                    border: `1px solid ${message.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)'}`,
                    borderRadius: '8px',
                    color: message.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)',
                    marginBottom: '1.5rem',
                    whiteSpace: 'pre-line'
                }}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-2">
                {/* CSV 업로드 */}
                <div className="card">
                    <h3 className="card-title">📄 CSV 파일 업로드</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        CSV 파일을 업로드하여 거래 내역을 일괄 추가할 수 있습니다.
                    </p>

                    <div style={{
                        padding: '1rem',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)'
                    }}>
                        <strong>필수 컬럼:</strong> type, category, amount, date<br />
                        <strong>선택 컬럼:</strong> description, source<br />
                        <strong>type 값:</strong> income (수입) 또는 expense (지출)
                    </div>

                    <label className="btn btn-primary" style={{ cursor: 'pointer', justifyContent: 'center' }}>
                        {uploading ? '업로드 중...' : 'CSV 파일 선택'}
                        <input
                            type="file"
                            accept=".csv"
                            onChange={(e) => handleFileUpload(e, 'csv')}
                            disabled={uploading}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>

                {/* Excel 업로드 */}
                <div className="card">
                    <h3 className="card-title">📊 Excel 파일 업로드</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Excel 파일(.xlsx, .xls)을 업로드하여 거래 내역을 일괄 추가할 수 있습니다.
                    </p>

                    <div style={{
                        padding: '1rem',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)'
                    }}>
                        <strong>필수 컬럼:</strong> type, category, amount, date<br />
                        <strong>선택 컬럼:</strong> description, source<br />
                        <strong>type 값:</strong> income (수입) 또는 expense (지출)
                    </div>

                    <label className="btn btn-primary" style={{ cursor: 'pointer', justifyContent: 'center' }}>
                        {uploading ? '업로드 중...' : 'Excel 파일 선택'}
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={(e) => handleFileUpload(e, 'excel')}
                            disabled={uploading}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>
            </div>

            {/* CSV 다운로드 */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3 className="card-title">💾 데이터 내보내기</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    현재 저장된 모든 거래 내역을 CSV 파일로 다운로드할 수 있습니다.
                </p>
                <button onClick={handleDownload} className="btn btn-secondary">
                    📥 CSV 다운로드
                </button>
            </div>

            {/* 샘플 포맷 */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3 className="card-title">📝 샘플 데이터 포맷</h3>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>type</th>
                                <th>category</th>
                                <th>amount</th>
                                <th>date</th>
                                <th>description</th>
                                <th>source</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>expense</td>
                                <td>식비</td>
                                <td>15000</td>
                                <td>2026-01-05</td>
                                <td>점심식사</td>
                                <td>신한카드</td>
                            </tr>
                            <tr>
                                <td>income</td>
                                <td>급여</td>
                                <td>3000000</td>
                                <td>2026-01-01</td>
                                <td>월급</td>
                                <td>회사</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default FileManager;
