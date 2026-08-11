
import { apiClient } from './apiClient';
import type { LoginRequest, RegisterRequest, AuthResponse, RefreshTokenRequest } from '../types/auth';
import type { CooperativeInfo } from '../components/cooperative/CooperativeInfoModal';

export const authService = {
    // GET /api/v1/users/cooperative-profile - Lấy dữ liệu HTX từ Backend
    async getCooperativeProfile(): Promise<CooperativeInfo | null> {
        try {
            const response = await apiClient.get<CooperativeInfo>('/v1/users/cooperative-profile');
            return response.data;
        } catch (error) {
            console.error('Lỗi lấy thông tin HTX từ Backend:', error);
            return null;
        }
    },

    // PUT /api/v1/users/cooperative-profile - Lưu dữ liệu HTX vào Backend
    async updateCooperativeProfile(data: CooperativeInfo): Promise<boolean> {
        const response = await apiClient.put<boolean>('/v1/users/cooperative-profile', data);
        return response.data;
    },

    // POST /api/v1/auth/login - Đăng nhập
    async login(payload: LoginRequest): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>('/v1/auth/login', payload);
        return response.data;
    },

    // POST /api/v1/auth/register - Đăng ký
    async register(payload: RegisterRequest): Promise<AuthResponse> {
        let roleNumber = 2;
        if (payload.roleRequested === 'PROCESSOR') roleNumber = 3;
        if (payload.roleRequested === 'RETAILER') roleNumber = 4;

        const requestData = {
            ...payload,
            roleRequested: typeof payload.roleRequested === 'string' ? roleNumber : payload.roleRequested,
        };

        const response = await apiClient.post<AuthResponse>('/v1/auth/register', requestData);
        return response.data;
    },

    // POST /api/v1/auth/refresh-token - Cấp lại Access Token
    async refreshToken(payload: RefreshTokenRequest): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>('/v1/auth/refresh-token', payload);
        return response.data;
    },
};

