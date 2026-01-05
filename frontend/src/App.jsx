import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import FileManager from './components/FileManager';
import BankSync from './components/BankSync';
import './App.css';

function App() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [refreshKey, setRefreshKey] = useState(0);

    const handleTransactionAdded = () => {
        setRefreshKey(prev => prev + 1);
    };

    const tabs = [
        { id: 'dashboard', label: '대시보드', icon: '📊' },
        { id: 'transactions', label: '거래 내역', icon: '📝' },
        { id: 'add', label: '거래 추가', icon: '➕' },
        { id: 'sync', label: '은행 동기화', icon: '🏦' },
        { id: 'files', label: '파일 관리', icon: '📁' },
    ];

    return (
        <div className="app">
            <header className="app-header">
                <div className="container">
                    <h1 className="app-title">
                        <span className="title-icon">💰</span>
                        재무 관리 시스템
                    </h1>
                    <p className="app-subtitle">당신의 재무 상태를 한눈에</p>
                </div>
            </header>

            <nav className="app-nav">
                <div className="container">
                    <div className="nav-tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span className="tab-icon">{tab.icon}</span>
                                <span className="tab-label">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            <main className="app-main">
                <div className="container">
                    {activeTab === 'dashboard' && <Dashboard key={refreshKey} />}
                    {activeTab === 'transactions' && <TransactionList key={refreshKey} />}
                    {activeTab === 'add' && <TransactionForm onSuccess={handleTransactionAdded} />}
                    {activeTab === 'sync' && <BankSync />}
                    {activeTab === 'files' && <FileManager onUploadSuccess={handleTransactionAdded} />}
                </div>
            </main>

            <footer className="app-footer">
                <div className="container">
                    <p>© 2026 Finance Manager. 개인 재무 관리 시스템.</p>
                </div>
            </footer>
        </div>
    );
}

export default App;
