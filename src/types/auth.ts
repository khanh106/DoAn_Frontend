// src/types/auth.ts
import type { UserRole, UserStatus } from './index';

export interface UserDto {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: UserRole;
    walletAddress?: string | null;
    status: UserStatus;
}

export interface AuthResponse {
    user: UserDto;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    // RoleType enum từ Backend: 2 = FARMER, 3 = PROCESSOR, 4 = RETAILER
    roleRequested: 'FARMER' | 'PROCESSOR' | 'RETAILER' | number;
}

export interface RefreshTokenRequest {
    accessToken: string;
    refreshToken: string;
}
