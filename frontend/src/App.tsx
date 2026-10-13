import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import OverviewPage from './pages/OverviewPage';
import TransactionsPage from './pages/TransactionsPage';
import FraudAlertsPage from './pages/FraudAlertsPage';
import AMLMonitoringPage from './pages/AMLMonitoringPage';
import AccountNetworkPage from './pages/AccountNetworkPage';
import InvestigationCasesPage from './pages/InvestigationCasesPage';

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden" style={{ background: '#faf8f9', color: '#20080e' }}>
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar sidebarCollapsed={sidebarCollapsed} />
          <main className="flex-1 overflow-y-auto" style={{ background: 'linear-gradient(180deg, #faf7f8 0%, #f3ebed 100%)' }}>
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/fraud-alerts" element={<FraudAlertsPage />} />
              <Route path="/aml" element={<AMLMonitoringPage />} />
              <Route path="/network" element={<AccountNetworkPage />} />
              <Route path="/cases" element={<InvestigationCasesPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
