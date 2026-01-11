import React, { useState, useEffect } from 'react';
import { simulationAPI } from '../api/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';

export default function AssetSimulation() {
    const [goals, setGoals] = useState([]);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        target_amount: '',
        target_date: '',
        current_amount: '',
        description: '',
    });

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            setLoading(true);
            const response = await simulationAPI.getGoals();
            setGoals(response.data);
            if (response.data.length > 0 && !selectedGoal) {
                handleAnalyze(response.data[0]);
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Failed to fetch goals:', error);
            setLoading(false);
        }
    };

    const handleAnalyze = async (goal) => {
        try {
            setLoading(true);
            setSelectedGoal(goal);
            const response = await simulationAPI.analyze(goal.id);
            setResult(response.data);
        } catch (error) {
            console.error('Failed to analyze goal:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                target_amount: parseFloat(formData.target_amount),
                current_amount: parseFloat(formData.current_amount || 0),
                target_date: new Date(formData.target_date).toISOString(),
            };
            await simulationAPI.createGoal(payload);
            setShowForm(false);
            setFormData({
                title: '',
                target_amount: '',
                target_date: '',
                current_amount: '',
                description: '',
            });
            fetchGoals();
        } catch (error) {
            console.error('Failed to create goal:', error);
            alert('목표 생성 실패');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('목표를 삭제하시겠습니까?')) return;
        try {
            await simulationAPI.deleteGoal(id);
            setResult(null);
            setSelectedGoal(null);
            fetchGoals();
        } catch (error) {
            console.error('Failed to delete goal:', error);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(val);

    return (
        <div>
            <div className="flex-between mb-4">
                <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>자산 분석 및 시뮬레이션</h1>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ 새 목표 설정</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 'var(--spacing-lg)' }}>
                {/* Sidebar: Goals List */}
                <div>
                    <h2 className="card-title mb-3">목표 목록</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                        {goals.map(goal => (
                            <div
                                key={goal.id}
                                className={`card ${selectedGoal?.id === goal.id ? 'active' : ''}`}
                                style={{
                                    cursor: 'pointer',
                                    border: selectedGoal?.id === goal.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                                    padding: 'var(--spacing-md)'
                                }}
                                onClick={() => handleAnalyze(goal)}
                            >
                                <div className="flex-between">
                                    <strong>{goal.title}</strong>
                                    <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(goal.id); }}>×</button>
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                    목표: {formatCurrency(goal.target_amount)}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                                    기한: {format(new Date(goal.target_date), 'yyyy-MM-dd')}
                                </div>
                            </div>
                        ))}
                        {goals.length === 0 && <p style={{ color: 'var(--text-tertiary)' }}>설정된 목표가 없습니다.</p>}
                    </div>
                </div>

                {/* Main: Simulation Result */}
                <div>
                    {loading ? (
                        <div className="spinner"></div>
                    ) : result && selectedGoal ? (
                        <div className="card">
                            <h2 className="card-title">{selectedGoal.title} 분석 결과</h2>

                            <div className="flex gap-3 mb-4">
                                <div className="stat-card" style={{ flex: 1, padding: 'var(--spacing-md)' }}>
                                    <div className="stat-label">예상 달성 금액</div>
                                    <div className="stat-value" style={{ fontSize: '1.5rem' }}>{formatCurrency(result.final_amount)}</div>
                                </div>
                                <div className="stat-card" style={{ flex: 1, padding: 'var(--spacing-md)' }}>
                                    <div className="stat-label">목표 달성 여부</div>
                                    <div className="stat-value" style={{ fontSize: '1.5rem', color: result.is_achievable ? 'var(--success)' : 'var(--danger)' }}>
                                        {result.is_achievable ? '달성 가능 🎉' : '달성 불가 ⚠️'}
                                    </div>
                                </div>
                            </div>

                            {!result.is_achievable && (
                                <div className="card mb-4" style={{ background: 'hsla(0, 84%, 60%, 0.1)', borderColor: 'var(--danger)' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--danger)', marginBottom: '0.5rem' }}>💡 가이드</h3>
                                    <p>
                                        목표 금액까지 <strong>{formatCurrency(result.shortfall)}</strong>이 부족합니다.<br />
                                        목표를 달성하려면 매월 약 <strong>{formatCurrency(result.monthly_saving_needed)}</strong>을 추가로 저축하거나 수익을 늘려야 합니다.
                                    </p>
                                </div>
                            )}

                            <div style={{ height: '400px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={result.monthly_data}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis dataKey="date" stroke="var(--text-secondary)" />
                                        <YAxis stroke="var(--text-secondary)" tickFormatter={(val) => val / 10000 + '만'} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
                                            formatter={(val) => formatCurrency(val)}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="projected_amount" name="예상 자산" stroke="var(--primary)" strokeWidth={3} dot={false} />
                                        <ReferenceLine y={selectedGoal.target_amount} label="목표 금액" stroke="var(--success)" strokeDasharray="5 5" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ) : (
                        <div className="card flex-center" style={{ height: '300px', color: 'var(--text-tertiary)' }}>
                            좌측 목록에서 목표를 선택하거나 새 목표를 추가하세요.
                        </div>
                    )}
                </div>
            </div>

            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">새 자산 목표</h2>
                            <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">목표 이름</label>
                                <input type="text" className="form-input" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="예: 1억 모으기" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">목표 금액</label>
                                <input type="number" className="form-input" value={formData.target_amount} onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">현재 자산</label>
                                <input type="number" className="form-input" value={formData.current_amount} onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })} placeholder="현재 가진 자산 (선택)" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">목표 달성일</label>
                                <input type="date" className="form-input" value={formData.target_date} onChange={(e) => setFormData({ ...formData, target_date: e.target.value })} required />
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
