// File: src/services/traceabilityService.ts
import { apiClient } from './apiClient';

export interface TargetInfoDto {
    id: string;
    type: string;            // 'SUBBATCH' | 'BATCH'
    code: string;            // 'SUB-001' | 'BATCH-2026-001'
    productName: string;
    fruitType: string;
    currentStage: string;
    qrCodeUrl?: string;
}

export interface ParentBatchDto {
    batchId: string;
    batchCode: string;
    plantingDate: string;
}

export interface FarmAreaDto {
    name: string;
    province: string;
    gps: string;
    plantingCode?: string;
}

export interface WorkerDto {
    userId: string;
    fullName: string;
    isRepresentative: boolean;
}

export interface CultivationLogDto {
    date: string;
    activity: string;
    worker: string;
    images?: string[];
}

export interface HarvestDto {
    harvestDate: string;
    quantity: number;
    unit: string;
    representativeWorker: string;
}

export interface ProcessingDto {
    processType: string;
    description: string;
    startDate: string;
    endDate?: string;
}

export interface InspectionDto {
    documentName: string;
    documentNumber: string;
    unit: string;
    inspectionDate: string;
    result: string;
    certificateFileUrl: string;
    note?: string;
}

export interface PackagingDto {
    packDate: string;
    specification: string;
    color?: string;
    smell?: string;
    standard?: string;
    imageUrl?: string;
}

export interface ShipmentDto {
    carrier: string;
    shippingCode: string;
    shippingDate: string;
    expectedDate?: string;
    receivedDate?: string;
    readyForSaleDate?: string;
    retailerName: string;
    pickupLocation: string;
    destination: string;
}

export interface BlockchainHistoryDto {
    stage: string;
    functionName: string;
    txHash: string;
    blockNumber?: number;
    timestamp: string;
    actorWallet: string;
    status: string;
}

export interface PublicTraceResponseDto {
    targetInfo: TargetInfoDto;
    parentBatch?: ParentBatchDto;
    farmArea?: FarmAreaDto;
    workers: WorkerDto[];
    cultivationLogs: CultivationLogDto[];
    harvest?: HarvestDto;
    processing?: ProcessingDto;
    inspection?: InspectionDto;
    packaging?: PackagingDto;
    shipment?: ShipmentDto;
    blockchainHistory: BlockchainHistoryDto[];
}

export interface QrVerifyResponseDto {
    valid: boolean;
    targetType?: string;
    targetId?: string;
    productName?: string;
    message?: string;
}

export const traceabilityService = {
    /**
     * Lấy toàn bộ dữ liệu chuỗi cung ứng thật qua API Backend GET /v1/public/trace/{code}
     */
    async getTraceabilityInfo(code: string): Promise<PublicTraceResponseDto> {
        const response = await apiClient.get<PublicTraceResponseDto>(
            `/v1/public/trace/${encodeURIComponent(code.trim())}`
        );
        return response.data;
    },

    /**
     * Lấy riêng lịch sử Blockchain On-Chain GET /v1/public/trace/{code}/blockchain
     */
    async getBlockchainOnly(code: string): Promise<BlockchainHistoryDto[]> {
        const response = await apiClient.get<BlockchainHistoryDto[]>(
            `/v1/public/trace/${encodeURIComponent(code.trim())}/blockchain`
        );
        return response.data;
    },

    /**
     * Xác thực mã QR Code GET /v1/public/trace/{code}/qr/verify
     */
    async verifyQrCode(code: string): Promise<QrVerifyResponseDto> {
        const response = await apiClient.get<QrVerifyResponseDto>(
            `/v1/public/trace/${encodeURIComponent(code.trim())}/qr/verify`
        );
        return response.data;
    }
};
