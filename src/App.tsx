import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pages & Components
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { AccountPendingPage } from './pages/auth/AccountPendingPage';
import { AccountLockedPage } from './pages/auth/AccountLockedPage';

import { AdminAccountPage } from './pages/admin/AdminAccountPage';
import { CooperativeDashboardPage } from './pages/cooperative/CooperativeDashboardPage';
import { FarmerPage } from './pages/farmer/FarmerPage';
import { RetailerPage } from './pages/retailer/RetailerPage';
import { TraceabilityPage } from './pages/public/TraceabilityPage';
import { DesignSystemShowcase } from './pages/DesignSystemShowcase';

// Layouts
import { AdminLayout } from './layouts/AdminLayout';
import { FarmerLayout } from './layouts/FarmerLayout';
import { ProcessorLayout } from './layouts/ProcessorLayout';
import { RetailerLayout } from './layouts/RetailerLayout';

// Protection
import { ProtectedRoute } from './routes/ProtectedRoute';
import { useAuthStore } from './stores/authStore';

export const App: React.FC = () => {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/pending" element={<AccountPendingPage />} />
        <Route path="/auth/locked" element={<AccountLockedPage />} />

        {/* Public QR Traceability dành cho Người tiêu dùng quét QR */}
        <Route path="/trace" element={<TraceabilityPage />} />
        <Route path="/trace/:qrCode" element={<TraceabilityPage />} />

        {/* Design System Showcase (Dev test) */}
        <Route path="/showcase" element={<DesignSystemShowcase />} />

        {/* PROTECTED ROUTES - PORTAL 1: ADMIN */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
            <Route path="/admin/dashboard" element={<AdminAccountPage />} />
            <Route path="/admin/users" element={<AdminAccountPage />} />
            <Route path="/admin/*" element={<AdminAccountPage />} />
          </Route>
        </Route>

        {/* PROTECTED ROUTES - PORTAL 2: NÔNG DÂN */}
        <Route element={<ProtectedRoute allowedRoles={['FARMER']} />}>
          <Route element={<FarmerLayout />}>
            <Route path="/farmer" element={<Navigate to="/farmer/dashboard" replace />} />
            <Route path="/farmer/dashboard" element={<FarmerPage />} />
            <Route path="/farmer/batches" element={<FarmerPage />} />
            <Route path="/farmer/*" element={<FarmerPage />} />
          </Route>
        </Route>

        {/* PROTECTED ROUTES - PORTAL 3: HỢP TÁC XÃ / CHẾ BIẾN */}
        <Route element={<ProtectedRoute allowedRoles={['PROCESSOR', 'COOPERATIVE']} />}>
          <Route element={<ProcessorLayout />}>
            <Route path="/cooperative" element={<Navigate to="/cooperative/dashboard" replace />} />
            <Route path="/cooperative/dashboard" element={<CooperativeDashboardPage />} />
            <Route path="/processor/dashboard" element={<CooperativeDashboardPage />} />
            <Route path="/cooperative/*" element={<CooperativeDashboardPage />} />
            <Route path="/processor/*" element={<CooperativeDashboardPage />} />
          </Route>
        </Route>

        {/* PROTECTED ROUTES - PORTAL 4: SIÊU THỊ / CỬA HÀNG */}
        <Route element={<ProtectedRoute allowedRoles={['RETAILER']} />}>
          <Route element={<RetailerLayout />}>
            <Route path="/retailer" element={<Navigate to="/retailer/dashboard" replace />} />
            <Route path="/retailer/dashboard" element={<RetailerPage />} />
            <Route path="/retailer/*" element={<RetailerPage />} />
          </Route>
        </Route>

        {/* DEFAULT REDIRECT */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
