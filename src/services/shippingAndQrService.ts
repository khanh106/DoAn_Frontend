import { apiClient } from './apiClient';

// --- DTOs VẬN CHUYỂN (SHIPMENT) ---
export interface ShipmentInputDto {
    pickupLocation: string;
    destination: string;
    retailerId: string;
    carrierInfo: string;
    shippingCode: string;
    shippingDate: string;
    expectedDate?: string;
    weight: number;
}

export interface ShipmentHistoryDto {
    id: string;
    assetType: string;
    batchId?: string;
    batchCode?: string;
    subBatchId?: string;
    subBatchCode?: string;
    retailerId: string;
    retailerName: string;
    pickupLocation: string;
    destination: string;
    carrierInfo: string;
    shippingCode: string;
    shippingDate: string;
    expectedDate?: string;
    receivedDate?: string;
    readyForSaleDate?: string;
    weight: number;
    shipTransactionHash?: string;
    receiveTransactionHash?: string;
    readyTransactionHash?: string;
    createdAt: string;
}

export interface ShipmentResponseDto extends ShipmentHistoryDto {
    shipmentId: string;
    metadataURI?: string;
    dataHash?: string;
    currentStage: string;
}

export interface RetailerActionResponseDto {
    shipmentId: string;
    assetType: string;
    batchId?: string;
    batchCode?: string;
    subBatchId?: string;
    subBatchCode?: string;
    currentStage: string;
    receivedDate?: string;
    readyForSaleDate?: string;
    transactionHash?: string;
}

// --- DTOs KIỂM ĐỊNH (INSPECTION) ---
export interface InspectionHistoryDto {
    id: string;
    assetType: string;
    batchId?: string;
    batchCode?: string;
    subBatchId?: string;
    subBatchCode?: string;
    documentName: string;
    documentNumber: string;
    inspectionUnit: string;
    inspectionDate: string;
    result: 'PASSED' | 'FAILED' | string;
    fileURI: string;
    note?: string;
    createdAt: string;
}

export interface InspectionResponseDto extends InspectionHistoryDto {
    inspectionId: string;
    currentStage: string;
    transactionHash?: string;
}

// --- DTOs MÃ QR (QR CODE) ---
export type QRTargetType = 'BATCH' | 'SUBBATCH' | 'BOX' | 'COMMERCIAL';

export interface GenerateQRCodeRequest {
    targetType: QRTargetType;
    targetId: string;
}

export interface GenerateQRCodeResponseDto {
    qrCodeId: string;
    targetType: QRTargetType;
    targetId: string;
    targetCode: string;
    qrValue: string;
    imageBase64: string;
    imageContentType: string;
    status: string;
    createdAt: string;
}

export interface QRCodeInfoDto {
    id: string;
    targetType: QRTargetType;
    targetId: string;
    qrValue: string;
    status: string;
    createdAt: string;
}

// --- API SERVICE IMPLEMENTATION ---
export const shippingAndQrService = {
    // 🚚 1. Vận chuyển (Processor API)
    shipParentBatch: async (batchId: string, input: ShipmentInputDto): Promise<ShipmentResponseDto> => {
        const response = await apiClient.post<ShipmentResponseDto>(`/v1/processor/shipments/parent/${batchId}`, input);
        return response.data;
    },

    shipSubBatch: async (subBatchId: string, input: ShipmentInputDto): Promise<ShipmentResponseDto> => {
        const response = await apiClient.post<ShipmentResponseDto>(`/v1/processor/shipments/sub/${subBatchId}`, input);
        return response.data;
    },

    getShipmentsByBatch: async (batchId: string): Promise<ShipmentHistoryDto[]> => {
        const response = await apiClient.get<ShipmentHistoryDto[]>(`/v1/processor/shipments/parent/${batchId}/shipments`);
        return response.data;
    },

    getAllShipmentsByProcessor: async (): Promise<ShipmentHistoryDto[]> => {
        const response = await apiClient.get<ShipmentHistoryDto[]>('/v1/processor/shipments/all');
        return response.data;
    },

    getShipmentsBySubBatch: async (subBatchId: string): Promise<ShipmentHistoryDto[]> => {
        const response = await apiClient.get<ShipmentHistoryDto[]>(`/v1/processor/shipments/sub/${subBatchId}/shipments`);
        return response.data;
    },

    // 🏪 2. Điểm bán / Siêu thị (Retailer API)
    getMyRetailerShipments: async (): Promise<ShipmentHistoryDto[]> => {
        const response = await apiClient.get<ShipmentHistoryDto[]>('/v1/retailer/shipments');
        return response.data;
    },

    receiveShipment: async (shipmentId: string): Promise<RetailerActionResponseDto> => {
        const response = await apiClient.post<RetailerActionResponseDto>(`/v1/retailer/shipments/${shipmentId}/receive`);
        return response.data;
    },

    markReadyForSale: async (shipmentId: string): Promise<RetailerActionResponseDto> => {
        const response = await apiClient.post<RetailerActionResponseDto>(`/v1/retailer/shipments/${shipmentId}/ready-for-sale`);
        return response.data;
    },

    // 🛡️ 3. Kiểm định chất lượng (Inspection API)
    inspectParentBatch: async (batchId: string, formData: FormData): Promise<InspectionResponseDto> => {
        const response = await apiClient.post<InspectionResponseDto>(`/v1/processor/inspections/parent/${batchId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    inspectSubBatch: async (subBatchId: string, formData: FormData): Promise<InspectionResponseDto> => {
        const response = await apiClient.post<InspectionResponseDto>(`/v1/processor/inspections/sub/${subBatchId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    getInspectionsByBatch: async (batchId: string): Promise<InspectionHistoryDto[]> => {
        const response = await apiClient.get<InspectionHistoryDto[]>(`/v1/processor/inspections/parent/${batchId}/inspections`);
        return response.data;
    },

    getInspectionsBySubBatch: async (subBatchId: string): Promise<InspectionHistoryDto[]> => {
        const response = await apiClient.get<InspectionHistoryDto[]>(`/v1/processor/inspections/sub/${subBatchId}/inspections`);
        return response.data;
    },

    // 🔲 4. Sinh & Quản lý Mã QR Code (QRCode API)
    generateQRCode: async (req: GenerateQRCodeRequest): Promise<GenerateQRCodeResponseDto> => {
        const response = await apiClient.post<GenerateQRCodeResponseDto>('/v1/processor/qrcodes/generate', req);
        return response.data;
    },

    getQRCodesByTarget: async (targetType: QRTargetType, targetId: string): Promise<QRCodeInfoDto[]> => {
        const response = await apiClient.get<QRCodeInfoDto[]>(`/v1/processor/qrcodes/${targetType}/${targetId}`);
        return response.data;
    },
};
