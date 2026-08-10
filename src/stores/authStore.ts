
import { create } from 'zustand';
import type { User, UserRole, UserStatus } from '../types';
import { authService } from '../services/authService';
import type { LoginRequest, RegisterRequest } from '../types/auth';

interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    login: (data: LoginRequest) => Promise<User>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
    setAuth: (user: User, token: string, refreshToken: string) => void;
    checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token'),
    refreshToken: localStorage.getItem('refreshToken'),
    isAuthenticated: !!localStorage.getItem('token'),
    isLoading: false,

    setAuth: (user: User, token: string, refreshToken: string) => {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, token, refreshToken, isAuthenticated: true });
    },

    login: async (credentials: LoginRequest) => {
        set({ isLoading: true });
        try {
            const authResp = await authService.login(credentials);
            const user: User = {
                id: authResp.user.id,
                name: authResp.user.fullName,
                fullName: authResp.user.fullName,
                email: authResp.user.email,
                phone: authResp.user.phone,
                role: authResp.user.role as UserRole,
                status: authResp.user.status as UserStatus,
                walletAddress: authResp.user.walletAddress || undefined,
            };

            if (authResp.accessToken) {
                get().setAuth(user, authResp.accessToken, authResp.refreshToken);
            } else {
                set({ user });
            }

            return user;
        } finally {
            set({ isLoading: false });
        }
    },

    register: async (data: RegisterRequest) => {
        set({ isLoading: true });
        try {
            await authService.register(data);
        } finally {
            set({ isLoading: false });
        }
    },

    logout: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
    },

    checkAuth: () => {
        const token = localStorage.getItem('token');
        const userJson = localStorage.getItem('user');
        if (token && userJson) {
            try {
                const user = JSON.parse(userJson);
                set({ user, token, isAuthenticated: true });
            } catch {
                get().logout();
            }
        } else {
            set({ user: null, token: null, isAuthenticated: false });
        }
    },
}));
