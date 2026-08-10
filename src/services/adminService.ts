import { apiClient } from './apiClient';

export interface UserStatsSection {
    totalUsers: number;
    farmersCount: number;
    processorsCount: number;
    retailersCount: number;
    activeCount: number;
    pendingCount: number;
    lockedCount: number;
}

export interface BatchStatsSection {
    totalBatches: number;
    inProductionCount: number;
    harvestedCount: number;
    packagedCount: number;
    readyForSaleCount: number;
}

export interface BlockchainStatsSection {
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
}

export interface DashboardStatsDto {
    userStats: UserStatsSection;
    batchStats: BatchStatsSection;
    blockchainStats: BlockchainStatsSection;
}

export interface BlockchainTransactionDto {
    id: string;
    batchId?: string;
    batchCode?: string;
    subBatchId?: string;
    subBatchCode?: string;
    walletAddress: string;
    transactionHash: string;
    contractAddress: string;
    functionName: string;
    blockNumber?: number;
    timestamp: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING' | string;
    errorMessage?: string;
}

export interface WhitelistRoleRequest {
    roleName: string;
    accountAddress: string;
}

export interface WhitelistRoleResultDto {
    roleName: string;
    accountAddress: string;
    action: string;
    transactionHash: string;
    executedAt: string;
}

// ============================================================
// 1. CÁC INTERFACES CHO NHẬT KÝ HỆ THỐNG (SYSTEM LOGS)
// ============================================================

export interface SystemLogDto {
    id: string;
    timestamp: string;
    category: 'BLOCKCHAIN' | 'AUTH_USER' | 'INVENTORY' | 'CULTIVATION' | 'SYSTEM' | string;
    action: string;
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | string;
    actorName?: string;
    actorEmail?: string;
    actorRole?: string;
    description: string;
    ipAddress?: string;
    traceId?: string;
    metadataJson?: string;
    status: string;
}

export interface SystemLogStatsDto {
    totalLogs: number;
    infoCount: number;
    warningCount: number;
    errorCount: number;
    successCount: number;
}

export interface SystemLogsPagedResponseDto {
    logs: SystemLogDto[];
    totalCount: number;
    page: number;
    pageSize: number;
    stats: SystemLogStatsDto;
}

export interface SystemLogFilterParams {
    category?: string;
    severity?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
}

// ============================================================
// 2. ĐỐI TƯỢNG ADMIN SERVICE TỔNG HỢP TOÀN BỘ API
// ============================================================

export const adminService = {
    /**
     * Lấy dữ liệu thống kê tổng quan Admin
     */
    getDashboardStats: async (): Promise<DashboardStatsDto> => {
        const response = await apiClient.get<DashboardStatsDto>('/v1/admin/dashboard/stats');
        return response.data;
    },

    /**
     * Lấy danh sách giao dịch Blockchain gần đây
     */
    getRecentTransactions: async (status?: string, functionName?: string, batchId?: string): Promise<BlockchainTransactionDto[]> => {
        const response = await apiClient.get<BlockchainTransactionDto[]>('/v1/admin/blockchain/transactions', {
            params: { status, functionName, batchId }
        });
        return response.data;
    },

    /**
     * Yêu cầu thực thi lại (Retry) giao dịch bị lỗi
     */
    retryTransaction: async (txId: string): Promise<void> => {
        await apiClient.post(`/v1/admin/blockchain/transactions/${txId}/retry`);
    },

    /**
     * Cấp quyền On-Chain cho địa chỉ ví
     */
    grantRole: async (data: WhitelistRoleRequest): Promise<WhitelistRoleResultDto> => {
        const response = await apiClient.post<WhitelistRoleResultDto>('/v1/admin/blockchain/whitelist/grant-role', data);
        return response.data;
    },

    /**
     * Thu hồi quyền On-Chain cho địa chỉ ví
     */
    revokeRole: async (data: WhitelistRoleRequest): Promise<WhitelistRoleResultDto> => {
        const response = await apiClient.post<WhitelistRoleResultDto>('/v1/admin/blockchain/whitelist/revoke-role', data);
        return response.data;
    },

    /**
     * Lấy nhật ký hoạt động hệ thống cho Admin
     */
    getSystemLogs: async (params?: SystemLogFilterParams): Promise<SystemLogsPagedResponseDto> => {
        const response = await apiClient.get<SystemLogsPagedResponseDto>('/v1/admin/system-logs', { params });
        return response.data;
    }
};
