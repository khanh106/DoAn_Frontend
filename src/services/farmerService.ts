import { apiClient } from './apiClient';
import { compressImage } from '../utils/imageCompressor';

export interface AssignedBatch {
    batchId: string;
    batchCode: string;
    fruitTypeName: string;
    productName: string;
    farmAreaName: string;
    currentStage: string;
    plantingDate?: string;
    expectedQuantity?: number;
    isRepresentative: boolean;
    assignedDate?: string;
    workerStatus: string;
}
export interface ProcessorWorkerLinkDto {
    id: string;
    processorId: string;
    processorName: string;
    workerId: string;
    workerName: string;
    workerEmail: string;
    workerPhone: string;
    workerWalletAddress?: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    invitedAt: string;
    respondedAt?: string;
}

export interface CultivationLog {
    id: string;
    batchId: string;
    activityType: string;
    description: string;
    logDate: string;
    createdByUserId?: string;
    createdByName?: string;
    images?: string[];
    ipfsCids?: string[];
    createdAt?: string;
}

export interface HarvestRequest {
    harvestDate: string;
    quantity: number;
    unit: string;
    initialQuality: string;
    notes?: string;
}

export interface HarvestResponse {
    harvestId?: string;
    batchId: string;
    batchCode: string;
    representativeUserId?: string;
    representativeUserName?: string;
    harvestDate: string;
    quantity?: number;
    harvestedQuantity?: number;
    unit?: string;
    harvestedUnit?: string;
    initialQuality?: string;
    notes?: string;
    metadataURI?: string;
    dataHash?: string;
    currentStage?: string;
    stage?: string;
    transactionHash?: string;
    createdAt?: string;
}

export interface FarmerProcessStep {
    id: string;
    stage: string;
    stepName: string;
    orderIndex: number;
    description?: string;
}

export interface FarmerProductionProcess {
    id: string;
    processorId: string;
    processorName: string;
    processorPhone?: string;
    processorEmail?: string;
    name: string;
    description?: string;
    createdAt: string;
    steps: FarmerProcessStep[];
}

export const farmerService = {
    // 1. Lấy danh sách lô phân công cho nông dân
    getAssignedBatches: async (): Promise<AssignedBatch[]> => {
        const response = await apiClient.get<AssignedBatch[]>('/v1/farmer/batches/assigned');
        return response.data;
    },

    // 2. Nông dân xác nhận tiếp nhận lô phân công
    acceptBatch: async (batchId: string): Promise<any> => {
        const response = await apiClient.put(`/v1/farmer/batches/${batchId}/accept`);
        return response.data;
    },

    // 3. Ghi nhật ký canh tác (Tự động nén ảnh chụp và upload Multipart Form)
    createCultivationLog: async (batchId: string, formData: FormData): Promise<CultivationLog> => {
        const images = formData.getAll('Images');
        if (images.length > 0) {
            formData.delete('Images');
            for (const item of images) {
                if (item instanceof File) {
                    const compressed = await compressImage(item);
                    formData.append('Images', compressed);
                } else {
                    formData.append('Images', item);
                }
            }
        }

        const response = await apiClient.post<CultivationLog>(
            `/v1/farmer/batches/${batchId}/logs`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    // 4. Xem danh sách nhật ký canh tác của 1 lô
    getCultivationLogsByBatch: async (batchId: string): Promise<CultivationLog[]> => {
        const response = await apiClient.get<CultivationLog[]>(`/v1/farmer/batches/${batchId}/logs`);
        return response.data;
    },

    // 5. Xác nhận thu hoạch lô sản xuất (Dành cho Người đại diện - Gọi Smart Contract harvestBatch)
    harvestBatch: async (batchId: string, data: HarvestRequest): Promise<HarvestResponse> => {
        const response = await apiClient.post<HarvestResponse>(
            `/v1/farmer/batches/${batchId}/harvest`,
            data
        );
        return response.data;
    },

    // 6. Phản hồi lời mời liên kết HTX
    respondInvitation: async (invitationId: string, action: 'ACCEPT' | 'REJECT'): Promise<boolean> => {
        const response = await apiClient.put<boolean>(`/v1/farmer/invitations/${invitationId}/respond`, {
            action,
        });
        return response.data;
    },

    // 7. Lấy danh sách Hướng dẫn quy trình sản xuất của Hợp tác xã liên kết
    getProcessGuides: async (): Promise<FarmerProductionProcess[]> => {
        const response = await apiClient.get<FarmerProductionProcess[]>('/v1/farmer/processes');
        return response.data;
    },
    // Lấy danh sách lời mời liên kết từ HTX
    getInvitations: async (status?: string): Promise<ProcessorWorkerLinkDto[]> => {
        const response = await apiClient.get<ProcessorWorkerLinkDto[]>('/v1/farmer/invitations', {
            params: { status },
        });
        return response.data;
    },
};
