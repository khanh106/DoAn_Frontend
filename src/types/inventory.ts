export type InventoryCategory = 'PRODUCT' | 'PESTICIDE' | 'FERTILIZER' | 'MATERIAL' | 'EQUIPMENT';

export interface InventoryItem {
    id: string;
    code: string;
    name: string;
    category: InventoryCategory;
    quantityInStock: number;
    unit: string;
    minQuantity?: number;
    location?: string;
    supplier?: string;
    unitPrice?: number;
    updatedAt: string;
}

export interface InventoryLog {
    id: string;
    itemId: string;
    itemName: string;
    itemCode: string;
    category: InventoryCategory;
    type: 'IMPORT' | 'EXPORT';
    quantity: number;
    unit: string;
    batchId?: string;    // Mã Lô sản xuất nếu xuất kho
    supplier?: string;   // Nhà cung cấp nếu nhập kho
    unitPrice?: number;
    totalAmount?: number;
    performer: string;
    actionDate: string;
    notes?: string;
}

export interface FarmAreaItem {
    id: string;
    code: string;
    name: string;
    farmerName: string;
    province: string;
    district: string;
    ward: string;
    soilType: string;
    areaSize: number; // ha
    gpsCoordinates: string;
    status: 'ACTIVE' | 'INACTIVE';
}

export interface CooperativeWorker {
    id: string;
    code: string;
    fullName: string;
    phone: string;
    role: string;
    custodialWallet: string;
    assignedBatchesCount: number;
    joinedDate: string;
}
