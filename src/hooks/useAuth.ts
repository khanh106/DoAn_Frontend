// src/hooks/useAuth.ts
import { useAuthStore } from '../stores/authStore';
import type { UserRole } from '../types';

export const useAuth = () => {
    const {
        user,
        token,
        refreshToken,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        setAuth,
        checkAuth,
    } = useAuthStore();

    const role: UserRole = user?.role || 'GUEST';
    const isPending = user?.status === 'PENDING';
    const isLocked = user?.status === 'LOCKED';
    const isApproved = user?.status === 'APPROVED' || user?.status === 'DA_DUYET';

    const hasRole = (allowedRoles: UserRole[]) => {
        return allowedRoles.includes(role);
    };

    return {
        user,
        token,
        refreshToken,
        role,
        isAuthenticated,
        isLoading,
        isPending,
        isLocked,
        isApproved,
        hasRole,
        login,
        register,
        logout,
        setAuth,
        checkAuth,
    };
};
