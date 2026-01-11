import React, { useState } from 'react';
import { excelAPI } from '../api/client';

export default function ExcelImport() {
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            setMessage('');

            const response = await excelAPI.import(file);
            setMessage(`성공적으로 ${response.data.count}건의 거래를 가져왔습니다.`);
            setMessageType('success');

            // Clear file input
            e.target.value = '';

            // Reload page after 2 seconds
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error('Failed to import file:', error);
            setMessage('파일 가져오기에 실패했습니다: ' + (error.response?.data?.detail || error.message));
            setMessageType('error');
        } finally {
            setUploading(false);
        }
    };

    const handleExportTransactions = async () => {
        try {
            const response = await excelAPI.exportTransactions();

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `transactions_${new Date().toISOString().slice(0, 10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            setMessage('거래 내역을 성공적으로 다운로드했습니다.');
            setMessageType('success');
        } catch (error) {
            console.error('Failed to export transactions:', error);
            setMessage('다운로드에 실패했습니다.');
            setMessageType('error');
        }
    };

    const handleExportMonthlyReport = async () => {
        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1;

        try {
            const response = await excelAPI.exportMonthlyReport(year, month);

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `monthly_report_${year}_${month.toString().padStart(2, '0')}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            setMessage('월별 리포트를 성공적으로 다운로드했습니다.');
            setMessageType('success');
        } catch (error) {
            console.error('Failed to export report:', error);
            setMessage('다운로드에 실패했습니다.');
            setMessageType('error');
        }
    };

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: 'var(--spacing-lg)' }}>
                Excel 데이터 관리
            </h1>

            {message && (
                <div
                    className="card mb-3"
                    style={{
                        background: messageType === 'success' ? 'hsla(142, 76%, 56%, 0.1)' : 'hsla(0, 84%, 60%, 0.1)',
                        borderColor: messageType === 'success' ? 'var(--success)' : 'var(--danger)',
                        color: messageType === 'success' ? 'var(--success)' : 'var(--danger)',
                    }}
                >
                    {message}
                </div>
            )}

            <div className="card-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px' }}>
                {/* Import Section */}
                <div className="card">
                    <h2 className="card-title">데이터 가져오기</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                        카카오페이 CSV 또는 Excel 파일을 업로드하여 거래 내역을 자동으로 가져올 수 있습니다.
                    </p>

                    <div
                        style={{
                            border: '2px dashed var(--border)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--spacing-xl)',
                            textAlign: 'center',
                            background: 'var(--bg-tertiary)',
                            transition: 'all var(--transition-fast)',
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.borderColor = 'var(--primary)';
                        }}
                        onDragLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.borderColor = 'var(--border)';
                            const file = e.dataTransfer.files[0];
                            if (file) {
                                const fakeEvent = { target: { files: [file] } };
                                handleFileUpload(fakeEvent);
                            }
                        }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-sm)' }}>📁</div>
                        <p style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: 'var(--spacing-sm)' }}>
                            파일을 드래그하거나 클릭하여 업로드
                        </p>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginBottom: 'var(--spacing-md)' }}>
                            지원 형식: CSV, XLSX, XLS
                        </p>

                        <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                            {uploading ? '업로드 중...' : '파일 선택'}
                            <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileUpload}
                                disabled={uploading}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>
                </div>

                {/* Export Section */}
                <div className="card">
                    <h2 className="card-title">데이터 내보내기</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                        거래 내역과 월별 리포트를 Excel 파일로 다운로드할 수 있습니다.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={handleExportTransactions}
                            style={{ justifyContent: 'space-between', padding: 'var(--spacing-md)' }}
                        >
                            <div>
                                <div style={{ fontWeight: '600' }}>전체 거래 내역</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                                    모든 거래 내역을 Excel 파일로 다운로드
                                </div>
                            </div>
                            <span style={{ fontSize: '1.5rem' }}>📥</span>
                        </button>

                        <button
                            className="btn btn-secondary"
                            onClick={handleExportMonthlyReport}
                            style={{ justifyContent: 'space-between', padding: 'var(--spacing-md)' }}
                        >
                            <div>
                                <div style={{ fontWeight: '600' }}>이번 달 리포트</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                                    월별 요약 및 카테고리별 통계 다운로드
                                </div>
                            </div>
                            <span style={{ fontSize: '1.5rem' }}>📊</span>
                        </button>
                    </div>
                </div>

                {/* Help Section */}
                <div className="card" style={{ background: 'var(--bg-tertiary)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <span>💡</span> 사용 팁
                    </h3>
                    <ul style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', paddingLeft: 'var(--spacing-md)', lineHeight: '1.8' }}>
                        <li>카카오페이 앱에서 다운로드한 CSV 파일을 그대로 업로드할 수 있습니다.</li>
                        <li>파일 업로드 시 거래 내역이 자동으로 분류되어 저장됩니다.</li>
                        <li>중복된 거래도 함께 가져오므로, 업로드 전 확인하세요.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
