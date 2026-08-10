
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAccountPage } from './pages/admin/AdminAccountPage';
import { CooperativeDashboardPage } from './pages/cooperative/CooperativeDashboardPage';
import { RetailerPage } from './pages/retailer/RetailerPage';
import { FarmerPage } from './pages/farmer/FarmerPage';
import { TraceabilityPage } from './pages/public/TraceabilityPage';
import { DesignSystemShowcase } from './pages/DesignSystemShowcase';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang kiểm thử Design System Showcase */}
        <Route path="/showcase" element={<DesignSystemShowcase />} />

        {/* Portal 1: Admin */}
        <Route path="/admin/users" element={<AdminAccountPage />} />

        {/* Portal 2: Hợp Tác Xã */}
        <Route path="/cooperative/dashboard" element={<CooperativeDashboardPage />} />

        {/* Portal 3: Nông Dân */}
        <Route path="/farmer/dashboard" element={<FarmerPage />} />

        {/* Portal 4: Siêu Thị */}
        <Route path="/retailer/dashboard" element={<RetailerPage />} />

        {/* Trang công khai Truy xuất Nguồn gốc */}
        <Route path="/trace" element={<TraceabilityPage />} />

        {/* Default route redirect to Showcase */}
        <Route path="*" element={<Navigate to="/showcase" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
