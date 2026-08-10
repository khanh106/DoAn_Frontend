
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
    allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const { user, isAuthenticated, token } = useAuthStore();

    // 1. Nếu chưa đăng nhập -> Chuyển hướng tới trang Đăng nhập
    if (!isAuthenticated || !token || !user) {
        return <Navigate to="/login" replace />;
    }

    // 2. Kiểm tra trạng thái tài khoản
    if (user.status === 'PENDING') {
        return <Navigate to="/auth/pending" replace />;
    }

    if (user.status === 'LOCKED' || user.status === 'TAM_KHOA') {
        return <Navigate to="/auth/locked" replace />;
    }

    // 3. Kiểm tra vai trò (Role-based access control)
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Điều hướng về Portal hợp lệ tương ứng với Role của User
        switch (user.role) {
            case 'ADMIN':
                return <Navigate to="/admin/users" replace />;
            case 'FARMER':
                return <Navigate to="/farmer/dashboard" replace />;
            case 'PROCESSOR':
            case 'COOPERATIVE':
                return <Navigate to="/cooperative/dashboard" replace />;
            case 'RETAILER':
                return <Navigate to="/retailer/dashboard" replace />;
            default:
                return <Navigate to="/trace" replace />;
        }
    }

    return <Outlet />;
};
