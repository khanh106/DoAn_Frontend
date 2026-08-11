import { apiClient } from './apiClient';

export interface ShipmentHistoryDto {
    id: string;
    assetType: 'PARENT' | 'SUB' | string;
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

export interface RetailerActionResponseDto {
    shipmentId: string;
    assetType: string;
    batchId?: string;
    batchCode?: string;
    subBatchId?: string;
    subBatchCode?: string;
    currentStage: string;
    receiveMetadataURI?: string;
    receiveDataHash?: string;
    receiveTransactionHash?: string;
    receivedDate?: string;
    readyMetadataURI?: string;
    readyDataHash?: string;
    readyTransactionHash?: string;
    readyForSaleDate?: string;
    transactionHash?: string;
    updatedAt?: string;
}

export interface RetailerQualityRecord {
    shipmentId: string;
    batchCode: string;
    inspectorName: string;
    inspectionDate: string;
    sensoryGrade: 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'REJECTED';
    freshnessRating: number; // 1-5
    brixDegree?: number; // °Bx (Độ ngọt)
    defectRate: number; // % hư hỏng, dập nát
    temperatureOnArrival: number; // °C nhiệt độ vận chuyển
    netWeightKg: number; // Trọng lượng thực tế
    isPackageIntact: boolean;
    isQrValid: boolean;
    qaResult: 'PASSED' | 'QUARANTINE' | 'REJECTED';
    notes?: string;
    createdAt: string;
}

export interface ShelfItemConfig {
    shipmentId: string;
    unitPriceVnd: number; // Giá bán lẻ VNĐ/kg
    shelfLocation: string; // VD: "Kệ A-01", "Tủ mát B2"
    remainingWeightKg: number; // Tồn kho còn lại trên kệ (kg)
    notes?: string;
    updatedAt: string;
}

export interface RetailSaleItem {
    shipmentId: string;
    batchCode: string;
    productName: string;
    quantityKg: number;
    unitPriceVnd: number;
    totalAmountVnd: number;
    qrCode: string;
}

export interface RetailSaleTransaction {
    transactionId: string; // Mã hóa đơn, ví dụ: "POS-20260811-001"
    customerName?: string;
    items: RetailSaleItem[];
    totalAmountVnd: number;
    discountVnd: number;
    finalAmountVnd: number;
    paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'E_WALLET';
    status: 'COMPLETED' | 'CANCELLED';
    createdAt: string;
}

const QA_STORAGE_KEY = 'doanv2_retailer_qa_records';
const SHELF_CONFIG_STORAGE_KEY = 'doanv2_retailer_shelf_configs';
const RETAIL_SALES_STORAGE_KEY = 'doanv2_retailer_sales_transactions';

export const retailerService = {
    /**
     * GET /api/v1/retailer/shipments
     * Lấy danh sách vận đơn được phân công cho Siêu thị / Cửa hàng đang đăng nhập.
     */
    getMyShipments: async (): Promise<ShipmentHistoryDto[]> => {
        const response = await apiClient.get<ShipmentHistoryDto[]>('/v1/retailer/shipments');
        return response.data;
    },

    /**
     * POST /api/v1/retailer/shipments/{id}/receive
     * Siêu thị xác nhận tiếp nhận lô hàng (gọi Smart Contract receiveParent / receiveSub).
     */
    receiveShipment: async (shipmentId: string): Promise<RetailerActionResponseDto> => {
        const response = await apiClient.post<RetailerActionResponseDto>(`/v1/retailer/shipments/${shipmentId}/receive`);
        return response.data;
    },

    /**
     * POST /api/v1/retailer/shipments/{id}/ready-for-sale
     * Siêu thị đưa sản phẩm lên kệ bán hàng (gọi Smart Contract readyParent / readySub).
     */
    readyForSale: async (shipmentId: string): Promise<RetailerActionResponseDto> => {
        const response = await apiClient.post<RetailerActionResponseDto>(`/v1/retailer/shipments/${shipmentId}/ready-for-sale`);
        return response.data;
    },

    /**
     * Lưu biên bản kiểm định QA Siêu thị vào LocalStorage
     */
    saveQualityRecord: (record: RetailerQualityRecord): void => {
        try {
            const raw = localStorage.getItem(QA_STORAGE_KEY);
            const map: Record<string, RetailerQualityRecord> = raw ? JSON.parse(raw) : {};
            map[record.shipmentId] = record;
            localStorage.setItem(QA_STORAGE_KEY, JSON.stringify(map));
        } catch (e) {
            console.error('Lỗi khi lưu biên bản QA siêu thị:', e);
        }
    },

    /**
     * Lấy biên bản QA của 1 shipment
     */
    getQualityRecord: (shipmentId: string): RetailerQualityRecord | null => {
        try {
            const raw = localStorage.getItem(QA_STORAGE_KEY);
            if (!raw) return null;
            const map: Record<string, RetailerQualityRecord> = JSON.parse(raw);
            return map[shipmentId] || null;
        } catch (e) {
            console.error('Lỗi khi đọc biên bản QA:', e);
            return null;
        }
    },

    /**
     * Lấy tất cả biên bản QA đã lưu
     */
    getAllQualityRecords: (): Record<string, RetailerQualityRecord> => {
        try {
            const raw = localStorage.getItem(QA_STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    },

    /**
     * Lấy cấu hình kệ hàng của 1 shipment
     */
    getShelfConfig: (shipmentId: string): ShelfItemConfig | null => {
        try {
            const raw = localStorage.getItem(SHELF_CONFIG_STORAGE_KEY);
            if (!raw) return null;
            const map: Record<string, ShelfItemConfig> = JSON.parse(raw);
            return map[shipmentId] || null;
        } catch (e) {
            return null;
        }
    },

    /**
     * Lấy toàn bộ danh sách cấu hình kệ hàng
     */
    getAllShelfConfigs: (): Record<string, ShelfItemConfig> => {
        try {
            const raw = localStorage.getItem(SHELF_CONFIG_STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    },

    /**
     * Lưu/cập nhật cấu hình giá bán & kệ hàng
     */
    saveShelfConfig: (config: ShelfItemConfig): void => {
        try {
            const map = retailerService.getAllShelfConfigs();
            map[config.shipmentId] = config;
            localStorage.setItem(SHELF_CONFIG_STORAGE_KEY, JSON.stringify(map));
        } catch (e) {
            console.error('Lỗi khi lưu cấu hình kệ hàng:', e);
        }
    },

    /**
     * Tạo và lưu giao dịch bán lẻ POS
     */
    createRetailSaleTransaction: (transaction: RetailSaleTransaction): void => {
        try {
            const list = retailerService.getAllRetailSalesTransactions();
            list.unshift(transaction); // Đưa giao dịch mới lên đầu
            localStorage.setItem(RETAIL_SALES_STORAGE_KEY, JSON.stringify(list));

            // Trừ số lượng tồn kho tương ứng trên kệ hàng
            const configs = retailerService.getAllShelfConfigs();
            transaction.items.forEach(item => {
                const cfg = configs[item.shipmentId];
                if (cfg) {
                    cfg.remainingWeightKg = Math.max(0, (cfg.remainingWeightKg ?? 0) - item.quantityKg);
                    cfg.updatedAt = new Date().toISOString();
                    configs[item.shipmentId] = cfg;
                }
            });
            localStorage.setItem(SHELF_CONFIG_STORAGE_KEY, JSON.stringify(configs));
        } catch (e) {
            console.error('Lỗi khi tạo giao dịch bán lẻ:', e);
        }
    },

    /**
     * Lấy tất cả lịch sử bán lẻ
     */
    getAllRetailSalesTransactions: (): RetailSaleTransaction[] => {
        try {
            const raw = localStorage.getItem(RETAIL_SALES_STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    },

    /**
     * Kiểm tra tính hợp lệ của mã QR trên Blockchain (Public API)
     */
    verifyQrCode: async (code: string): Promise<any> => {
        const response = await apiClient.get(`/v1/public/trace/${encodeURIComponent(code.trim())}/qr/verify`);
        return response.data;
    },

    /**
     * Tra cứu chuỗi cung ứng công khai bằng mã QR hoặc mã lô
     */
    getPublicTrace: async (code: string): Promise<any> => {
        const response = await apiClient.get(`/v1/public/trace/${encodeURIComponent(code.trim())}`);
        return response.data;
    },

    /**
     * Sinh mã QR truy xuất nguồn gốc (Processor API)
     */
    generateQrCode: async (targetType: string, targetId: string): Promise<any> => {
        const response = await apiClient.post('/v1/processor/qrcodes/generate', {
            targetType,
            targetId
        });
        return response.data;
    }
};


