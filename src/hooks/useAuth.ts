// src/hooks/useAuth.ts
import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
    const { user, token, setAuth, logout } = useAuthStore();
    const isAuthenticated = !!token;

    return {
        user,
        token,
        isAuthenticated,
        role: user?.role || 'GUEST',
        setAuth,
        logout,
    };
};
