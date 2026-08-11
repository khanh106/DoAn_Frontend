import { InventoryPage } from './pages/processor/InventoryPage';
import { BatchManagementPage } from './pages/processor/BatchManagementPage';
import { ProcessManagementPage } from './pages/processor/ProcessManagementPage';
import { PlanManagementPage } from './pages/processor/PlanManagementPage';
import { QRCodeAndShippingPage } from './pages/processor/QRCodeAndShippingPage';
import { FarmerDashboardPage } from './pages/farmer/FarmerDashboardPage';
import { FarmerBatchesPage } from './pages/farmer/FarmerBatchesPage';
import { FruitProductManagementPage } from './pages/processor/FruitProductManagementPage';
import { FarmAreaManagementPage } from './pages/processor/FarmAreaManagementPage';
import { WorkerManagementPage } from './pages/processor/WorkerManagementPage';
import { CooperativeSettingsPage } from './pages/processor/CooperativeSettingsPage';
import { ProductionLogManagementPage } from './pages/cooperative/ProductionLogManagementPage';
import { FarmerLogsPage } from './pages/farmer/FarmerLogsPage';
import { FarmerProgressPage } from './pages/farmer/FarmerProgressPage';
import { FarmerHarvestPage } from './pages/farmer/FarmerHarvestPage';
import { FarmerGuidesPage } from './pages/farmer/FarmerGuidesPage';
import { ProfilePage } from './pages/common/ProfilePage';

import { BlockchainContractsPage } from './pages/admin/BlockchainContractsPage';
import { SystemLogsPage } from './pages/admin/SystemLogsPage';

import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/public/LandingPage';
// src/App.tsx (Đoạn cập nhật route ADMIN)
import { AccountManagementPage } from './pages/admin/AccountManagementPage';
import { RoleManagementPage } from './pages/admin/modals/RoleManagementPage';

import { TransactionMonitoringPage } from './pages/admin/TransactionMonitoringPage';
// Pages & Components
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { AccountPendingPage } from './pages/auth/AccountPendingPage';
import { AccountLockedPage } from './pages/auth/AccountLockedPage';

import { CooperativeDashboardPage } from './pages/cooperative/CooperativeDashboardPage';
import { FarmerPage } from './pages/farmer/FarmerPage';
import { RetailerDashboardPage } from './pages/retailer/RetailerDashboardPage';
import { ReceiveShipmentPage } from './pages/retailer/ReceiveShipmentPage';
import { RetailerQualityPage } from './pages/retailer/RetailerQualityPage';
import { RetailerQRCodesPage } from './pages/retailer/RetailerQRCodesPage';
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
        <Route path="/" element={<LandingPage />} />
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
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/accounts" element={<AccountManagementPage />} />
            <Route path="/admin/users" element={<AccountManagementPage />} />
            <Route path="/admin/roles" element={<RoleManagementPage />} />
            <Route path="/admin/blockchain-contracts" element={<BlockchainContractsPage />} />
            <Route path="/admin/system-logs" element={<SystemLogsPage />} />
            <Route path="/admin/blockchain-transactions" element={<TransactionMonitoringPage />} />
            <Route path="/admin/transactions" element={<TransactionMonitoringPage />} />
            <Route path="/admin/*" element={<AccountManagementPage />} />
            <Route path="/admin/profile" element={<ProfilePage />} />

          </Route>
        </Route>

        {/* PROTECTED ROUTES - PORTAL 2: NÔNG DÂN */}
        <Route element={<ProtectedRoute allowedRoles={['FARMER']} />}>
          <Route element={<FarmerLayout />}>
            <Route path="/farmer" element={<Navigate to="/farmer/dashboard" replace />} />
            <Route path="/farmer/dashboard" element={<FarmerDashboardPage />} />
            <Route path="/farmer/batches" element={<FarmerBatchesPage />} />
            <Route path="/farmer/logs" element={<FarmerLogsPage />} />
            <Route path="/farmer/progress" element={<FarmerProgressPage />} />
            <Route path="/farmer/harvest" element={<FarmerHarvestPage />} />
            <Route path="/farmer/guides" element={<FarmerGuidesPage />} />
            <Route path="/farmer/*" element={<FarmerDashboardPage />} />
            <Route path="/farmer/profile" element={<ProfilePage />} />

          </Route>
        </Route>

        {/* PROTECTED ROUTES - PORTAL 3: HỢP TÁC XÃ / CHẾ BIẾN */}
        <Route element={<ProtectedRoute allowedRoles={['PROCESSOR', 'COOPERATIVE']} />}>
          <Route element={<ProcessorLayout />}>
            <Route path="/cooperative" element={<Navigate to="/cooperative/dashboard" replace />} />
            <Route path="/processor" element={<Navigate to="/processor/dashboard" replace />} />
            <Route path="/cooperative/dashboard" element={<CooperativeDashboardPage />} />
            <Route path="/processor/dashboard" element={<CooperativeDashboardPage />} />

            {/* ROUTES */}
            <Route path="/cooperative/process" element={<ProcessManagementPage />} />
            <Route path="/processor/process" element={<ProcessManagementPage />} />

            <Route path="/processor/inventory" element={<InventoryPage />} />
            <Route path="/cooperative/inventory" element={<InventoryPage />} />

            <Route path="/cooperative/farms" element={<FarmAreaManagementPage />} />
            <Route path="/cooperative/farm-areas" element={<FarmAreaManagementPage />} />
            <Route path="/processor/farm-areas" element={<FarmAreaManagementPage />} />

            <Route path="/cooperative/batches" element={<BatchManagementPage />} />
            <Route path="/processor/batches" element={<BatchManagementPage />} />

            <Route path="/cooperative/plan" element={<PlanManagementPage />} />
            <Route path="/processor/plan" element={<PlanManagementPage />} />

            <Route path="/cooperative/logs" element={<ProductionLogManagementPage />} />
            <Route path="/processor/logs" element={<ProductionLogManagementPage />} />
            <Route path="/cooperative/batches" element={<BatchManagementPage />} />
            <Route path="/processor/batches" element={<BatchManagementPage />} />
            <Route path="/cooperative/profile" element={<ProfilePage />} />
            <Route path="/processor/profile" element={<ProfilePage />} />


            <Route path="/processor/fruit-products" element={<FruitProductManagementPage />} />
            {/* RUT VẬN CHUYỂN & MÃ QR */}
            <Route path="/cooperative/shipment" element={<QRCodeAndShippingPage />} />
            <Route path="/cooperative/shipping-and-qr" element={<QRCodeAndShippingPage />} />
            <Route path="/processor/shipment" element={<QRCodeAndShippingPage />} />
            <Route path="/processor/shipping-and-qr" element={<QRCodeAndShippingPage />} />

            <Route path="/processor/workers" element={<WorkerManagementPage />} />
            <Route path="/processor/shipping-and-qr" element={<QRCodeAndShippingPage />} />
            <Route path="/cooperative/settings" element={<CooperativeSettingsPage />} />
            <Route path="/processor/settings" element={<CooperativeSettingsPage />} />
            <Route path="/cooperative/*" element={<CooperativeDashboardPage />} />
            <Route path="/processor/*" element={<CooperativeDashboardPage />} />
            <Route path="/cooperative/workers" element={<WorkerManagementPage />} />
            <Route path="/processor/workers" element={<WorkerManagementPage />} />
          </Route>
        </Route>

        {/* PROTECTED ROUTES - PORTAL 4: SIÊU THỊ / CỬA HÀNG */}
        <Route element={<ProtectedRoute allowedRoles={['RETAILER']} />}>
          <Route element={<RetailerLayout />}>
            <Route path="/retailer" element={<Navigate to="/retailer/dashboard" replace />} />
            <Route path="/retailer/dashboard" element={<RetailerDashboardPage />} />
            <Route path="/retailer/shipments" element={<ReceiveShipmentPage />} />
            <Route path="/retailer/qr-codes" element={<RetailerQRCodesPage />} />
            <Route path="/retailer/qa" element={<RetailerQualityPage />} />
            <Route path="/retailer/*" element={<RetailerDashboardPage />} />
            <Route path="/retailer/profile" element={<ProfilePage />} />

          </Route>
        </Route>

        {/* DEFAULT REDIRECT */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes >
    </BrowserRouter >
  );
};

export default App;
