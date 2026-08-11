import { apiClient } from './apiClient';

export interface FruitTypeDto {
    id: string;
    name: string;
    code: string;
    description?: string;
    status: string;
}

export interface ProductDto {
    id: string;
    fruitTypeId?: string;
    groupName?: string;
    productType?: string;
    variety?: string;
    name: string;
    shortName?: string;
    description?: string;
    status?: string;
}

export interface FarmAreaDto {
    id: string;
    name: string;
    ownerName?: string;
    province?: string;
    district?: string;
    ward?: string;
    area?: number;
    soilType?: string;
    gps?: string;
    plantingCode?: string;
}

export interface MaterialItemDto {
    id: string;
    itemType: 'PESTICIDE' | 'FERTILIZER' | 'MATERIAL' | 'EQUIPMENT' | 'PRODUCT' | string;
    code: string;
    name: string;
    unit: string;
    price?: number;
    dosagePerHa?: number;
    concentration?: string;
    supplier?: string;
    npkRatio?: string;
    quantityInStock?: number;
    note?: string;
}

export interface StockItemDto {
    materialItemId: string;
    itemCode: string;
    itemName: string;
    itemType: string;
    unit: string;
    quantityInStock: number;
}

export interface InventoryLogDto {
    id: string;
    materialItemId: string;
    materialName?: string;
    transactionType: 'IMPORT' | 'EXPORT' | 'INBOUND' | 'OUTBOUND';
    quantity: number;
    note?: string;
    createdByName?: string;
    createdAt: string;
}

export interface CreateTransactionRequest {
    materialItemId: string;
    transactionType: 'IMPORT' | 'EXPORT';
    quantity: number;
    note?: string;
}

export interface UserWorkerDto {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    role: string;
    walletAddress?: string;
    status: string;
}
export interface BatchWorkerDto {
    userId: string;
    fullName: string;
    walletAddress?: string;
    isRepresentative: boolean;
    assignedDate: string;
    status: string;
}

export interface BatchDto {
    id: string;
    batchCode: string;
    fruitTypeId: string;
    fruitTypeName: string;
    productId: string;
    productName: string;
    farmAreaId: string;
    farmAreaName: string;
    plantingDate: string;
    expectedQuantity: number;
    representativeWorkerId?: string;
    representativeWorkerName?: string;
    currentStage: string;
    metadataURI?: string;
    dataHash?: string;
    blockchainBatchId?: string;
    processorId: string;
    processorName: string;
    createdAt: string;
    updatedAt?: string;
    workers: BatchWorkerDto[];
}

export interface CreateBatchRequest {
    batchCode: string;
    fruitTypeId: string;
    productId: string;
    farmAreaId: string;
    plantingDate: string;
    expectedQuantity: number;
    assignedWorkerIds: string[];
    representativeWorkerId: string;
}
export interface SearchWorkerResultDto {
    workerId: string;
    fullName: string;
    email: string;
    phone: string;
    walletAddress?: string;
    linkStatus: 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
}
export interface ProcessStepDto {
    id?: string;
    stage: string;
    stepName: string;
    orderIndex: number;
    description?: string;
}

export interface ProductionProcessDto {
    id: string;
    processorId?: string;
    name: string;
    description?: string;
    createdAt?: string;
    steps: ProcessStepDto[];
}
export interface CultivationLogDto {
    id: string;
    batchId: string;
    batchCode: string;
    userId: string;
    userFullName: string;
    activityType: string; // WATERING, FERTILIZING, PESTICIDE, HARVESTING, PRUNING, INSPECTION, OTHER
    description: string;
    logDate: string;
    metadataURI?: string;
    imageUrls: string[];
    createdAt: string;
}
export interface CreateCultivationLogForm {
    activityType: string;
    description: string;
    logDate: string;
    images?: File[];
}

export const processorService = {
    // Lô Sản Xuất & Kế Hoạch (Batches)
    getBatches: async (): Promise<BatchDto[]> => {
        const response = await apiClient.get<BatchDto[]>('/v1/processor/batches');
        return response.data;
    },
    createBatch: async (data: CreateBatchRequest): Promise<BatchDto> => {
        const response = await apiClient.post<BatchDto>('/v1/processor/batches', data);
        return response.data;
    },
    getBatchById: async (id: string): Promise<BatchDto> => {
        const response = await apiClient.get<BatchDto>(`/v1/processor/batches/${id}`);
        return response.data;
    },

    // Kho (Inventory)
    getStock: async (): Promise<StockItemDto[]> => {
        const response = await apiClient.get<StockItemDto[]>('/v1/processor/inventory/stock');
        return response.data;
    },

    getLogs: async (materialItemId?: string): Promise<InventoryLogDto[]> => {
        const response = await apiClient.get<InventoryLogDto[]>('/v1/processor/inventory/logs', {
            params: { materialItemId },
        });
        return response.data;
    },

    createTransaction: async (data: CreateTransactionRequest): Promise<InventoryLogDto> => {
        const response = await apiClient.post<InventoryLogDto>('/v1/processor/inventory/transactions', data);
        return response.data;
    },

    // Vật tư (Materials)
    getMaterials: async (): Promise<MaterialItemDto[]> => {
        const response = await apiClient.get<MaterialItemDto[]>('/v1/processor/materials');
        return response.data;
    },

    createMaterial: async (data: Partial<MaterialItemDto>): Promise<MaterialItemDto> => {
        const response = await apiClient.post<MaterialItemDto>('/v1/processor/materials', data);
        return response.data;
    },

    updateMaterial: async (id: string, data: Partial<MaterialItemDto>): Promise<MaterialItemDto> => {
        const response = await apiClient.put<MaterialItemDto>(`/v1/processor/materials/${id}`, data);
        return response.data;
    },

    deleteMaterial: async (id: string): Promise<void> => {
        await apiClient.delete(`/v1/processor/materials/${id}`);
    },


    // Loại hoa quả (Fruit Types)
    getFruitTypes: async (): Promise<FruitTypeDto[]> => {
        const response = await apiClient.get<FruitTypeDto[]>('/v1/processor/fruit-types');
        return response.data;
    },

    createFruitType: async (data: { name: string; code: string; description?: string }): Promise<FruitTypeDto> => {
        const response = await apiClient.post<FruitTypeDto>('/v1/processor/fruit-types', data);
        return response.data;
    },

    // Sản phẩm (Products)
    getProducts: async (): Promise<ProductDto[]> => {
        const response = await apiClient.get<ProductDto[]>('/v1/processor/products');
        return response.data;
    },

    createProduct: async (data: Partial<ProductDto>): Promise<ProductDto> => {
        const response = await apiClient.post<ProductDto>('/v1/processor/products', data);
        return response.data;
    },

    // Vùng trồng (Farm Areas)
    getFarmAreas: async (params?: { province?: string; district?: string; ward?: string; plantingCode?: string }): Promise<FarmAreaDto[]> => {
        const response = await apiClient.get<FarmAreaDto[]>('/v1/processor/farm-areas', { params });
        return response.data;
    },

    createFarmArea: async (data: Partial<FarmAreaDto>): Promise<FarmAreaDto> => {
        const response = await apiClient.post<FarmAreaDto>('/v1/processor/farm-areas', data);
        return response.data;
    },

    updateFarmArea: async (id: string, data: Partial<FarmAreaDto>): Promise<FarmAreaDto> => {
        const response = await apiClient.put<FarmAreaDto>(`/v1/processor/farm-areas/${id}`, data);
        return response.data;
    },
    // Tìm kiếm công nhân & xem trạng thái liên kết
    searchWorkers: async (keyword?: string): Promise<SearchWorkerResultDto[]> => {
        const response = await apiClient.get<SearchWorkerResultDto[]>('/v1/processor/workers/search', {
            params: { keyword }
        });
        return response.data;
    },
    // Gửi lời mời liên kết tới công nhân
    sendWorkerInvitation: async (workerId: string): Promise<void> => {
        await apiClient.post('/v1/processor/workers/invite', { workerId });
    },
    // Quy trình sản xuất (Production Process - Backend API)
    getProcesses: async (): Promise<ProductionProcessDto[]> => {
        const response = await apiClient.get<ProductionProcessDto[]>('/v1/processor/processes');
        return response.data;
    },

    createProcess: async (data: Partial<ProductionProcessDto>): Promise<ProductionProcessDto> => {
        const response = await apiClient.post<ProductionProcessDto>('/v1/processor/processes', data);
        return response.data;
    },




    // Nhật ký sản xuất / canh tác (Cultivation Logs)
    getCultivationLogsByBatch: async (batchId: string): Promise<CultivationLogDto[]> => {
        const response = await apiClient.get<CultivationLogDto[]>(`/v1/farmer/batches/${batchId}/logs`);
        return response.data;
    },

    createCultivationLog: async (batchId: string, formData: FormData): Promise<CultivationLogDto> => {
        const response = await apiClient.post<CultivationLogDto>(`/v1/farmer/batches/${batchId}/logs`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Nhân công / Nông dân (Workers)
    getWorkers: async (): Promise<UserWorkerDto[]> => {
        const response = await apiClient.get<UserWorkerDto[]>('/v1/admin/users', {
            params: { role: 'FARMER' }
        });
        return response.data;
    }
};
