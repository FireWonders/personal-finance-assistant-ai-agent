import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [categoryData, setCategoryData] = useState([]);
    const [monthlyTrend, setMonthlyTrend] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [summaryRes, categoryRes, trendRes] = await Promise.all([
                analyticsAPI.getSummary(),
                analyticsAPI.getCategorySummary(),
                analyticsAPI.getMonthlyTrend({ months: 6 })
            ]);

            setSummary(summaryRes.data);
            setCategoryData(categoryRes.data);
            setMonthlyTrend(trendRes.data.reverse()); // 오래된 순서로 정렬
        } catch (error) {
            console.error('대시보드 데이터 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(value);
    };

    const COLORS = ['#4c9aff', '#00c9a7', '#36b37e', '#ffab00', '#ff5630', '#6554c0'];

    if (loading) {
        return <div className="spinner"></div>;
    }

    return (
        <div className="dashboard">
            <h2 className="page-title">재무 대시보드</h2>

            {/* 재무 요약 카드 */}
            {summary && (
                <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
                    <div className="stat-card">
                        <div className="stat-label">총 수입</div>
                        <div className="stat-value stat-income">
                            {formatCurrency(summary.total_income)}
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">총 지출</div>
                        <div className="stat-value stat-expense">
                            {formatCurrency(summary.total_expense)}
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">순자산</div>
                        <div className="stat-value stat-net">
                            {formatCurrency(summary.net_amount)}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-2">
                {/* 월별 추세 */}
                {monthlyTrend.length > 0 && (
                    <div className="card">
                        <h3 className="card-title">월별 수입/지출 추세</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis
                                    dataKey="month"
                                    stroke="#9aa0a6"
                                    style={{ fontSize: '0.875rem' }}
                                />
                                <YAxis
                                    stroke="#9aa0a6"
                                    style={{ fontSize: '0.875rem' }}
                                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: '#1e2433',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: '#e8eaed'
                                    }}
                                    formatter={(value) => formatCurrency(value)}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="income"
                                    stroke="#36b37e"
                                    strokeWidth={2}
                                    name="수입"
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="expense"
                                    stroke="#ff5630"
                                    strokeWidth={2}
                                    name="지출"
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* 카테고리별 지출 */}
                {categoryData.length > 0 && (
                    <div className="card">
                        <h3 className="card-title">카테고리별 지출</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    dataKey="total_amount"
                                    nameKey="category"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={(entry) => `${entry.category}`}
                                    labelLine={{ stroke: '#9aa0a6' }}
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: '#1e2433',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: '#e8eaed'
                                    }}
                                    formatter={(value) => formatCurrency(value)}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* 카테고리 상세 테이블 */}
            {categoryData.length > 0 && (
                <div className="card" style={{ marginTop: '2rem' }}>
                    <h3 className="card-title">카테고리별 상세</h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>카테고리</th>
                                    <th>총 금액</th>
                                    <th>거래 건수</th>
                                    <th>평균 금액</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categoryData.map((cat, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <span style={{
                                                display: 'inline-block',
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '50%',
                                                background: COLORS[idx % COLORS.length],
                                                marginRight: '0.5rem'
                                            }}></span>
                                            {cat.category}
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{formatCurrency(cat.total_amount)}</td>
                                        <td>{cat.transaction_count}건</td>
                                        <td>{formatCurrency(cat.total_amount / cat.transaction_count)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
