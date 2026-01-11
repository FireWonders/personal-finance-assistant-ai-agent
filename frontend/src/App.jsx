import React, { useState } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import BudgetPlanner from './components/BudgetPlanner';
import ExcelImport from './components/ExcelImport';
import RegularTransactions from './components/RegularTransactions';
import AssetSimulation from './components/AssetSimulation';

function App() {
    const [currentPage, setCurrentPage] = useState('dashboard');

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard />;
            case 'transactions':
                return <TransactionList />;
            case 'regular':
                return <RegularTransactions />;
            case 'budget':
                return <BudgetPlanner />;
            case 'simulation':
                return <AssetSimulation />;
            case 'excel':
                return <ExcelImport />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="app">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    💰 Finance Manager
                </div>

                <nav className="nav-menu">
                    <div
                        className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setCurrentPage('dashboard')}
                    >
                        📊 대시보드
                    </div>
                    <div
                        className={`nav-item ${currentPage === 'transactions' ? 'active' : ''}`}
                        onClick={() => setCurrentPage('transactions')}
                    >
                        💳 거래 내역
                    </div>
                    <div
                        className={`nav-item ${currentPage === 'regular' ? 'active' : ''}`}
                        onClick={() => setCurrentPage('regular')}
                    >
                        🔄 정기 거래
                    </div>
                    <div
                        className={`nav-item ${currentPage === 'budget' ? 'active' : ''}`}
                        onClick={() => setCurrentPage('budget')}
                    >
                        📈 재무 계획
                    </div>
                    <div
                        className={`nav-item ${currentPage === 'simulation' ? 'active' : ''}`}
                        onClick={() => setCurrentPage('simulation')}
                    >
                        🎯 자산 분석
                    </div>
                    <div
                        className={`nav-item ${currentPage === 'excel' ? 'active' : ''}`}
                        onClick={() => setCurrentPage('excel')}
                    >
                        📁 Excel 관리
                    </div>
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        <div>Finance Manager v1.1</div>
                        <div style={{ marginTop: '0.25rem' }}>© 2026 All rights reserved</div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {renderPage()}
            </main>
        </div>
    );
}

export default App;
