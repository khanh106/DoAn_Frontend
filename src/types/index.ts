
// Đồng nhất với RoleType.cs: ADMIN = 1, FARMER = 2, PROCESSOR = 3, RETAILER = 4
export type UserRole = 'ADMIN' | 'FARMER' | 'PROCESSOR' | 'RETAILER' | 'COOPERATIVE' | 'GUEST';

// Đồng nhất với UserStatus.cs: PENDING = 0, APPROVED = 1, REJECTED = 2, LOCKED = 3
export type UserStatus =
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | 'LOCKED'
    | 'DA_DUYET'
    | 'DANG_XU_LY'
    | 'DA_HUY'
    | 'CAN_BO_SUNG'
    | 'TAM_KHOA';

// Đồng nhất 10 Giai đoạn chuẩn theo BatchStage.cs trong Backend
export type BatchStage =
    | 'STAGE_PLANTING'       // 1: Xuống giống / Tạo lô
    | 'STAGE_HARVESTED'      // 2: Xác nhận thu hoạch
    | 'STAGE_RECEIVED'       // 3: Tiếp nhận nhà máy
    | 'STAGE_PROCESSED'      // 4: Sơ chế
    | 'STAGE_SORTED'         // 5: Phân loại
    | 'INSPECTION_PASSED'    // 6: Kiểm định đạt
    | 'PACKAGED'             // 7: Đóng gói
    | 'STAGE_SHIPPING'       // 8: Vận chuyển
    | 'RECEIVED_AT_RETAILER' // 9: Siêu thị tiếp nhận
    | 'READY_FOR_SALE';      // 10: Sẵn sàng bán

export type BatchStatus = BatchStage | 'CHO_DUYET' | 'DANG_CANH_TAC' | 'DA_THU_HOACH' | 'DANG_CHE_BIEN' | 'DA_DONG_GOI' | 'IN_TRANSIT';

// Đồng nhất với InspectionResult.cs: PENDING = 0, PASSED = 1, FAILED = 2
export type InspectionResultStatus = 'PENDING' | 'PASSED' | 'FAILED';

export interface User {
    id: string;
    username?: string;
    fullName?: string;
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    walletAddress?: string;
    status: UserStatus;
    createdAt?: string;
}

export interface FruitType {
    id: string;
    code: string;
    name: string;
    description?: string;
}

export interface Product {
    id: string;
    code: string;
    name: string;
    fruitTypeId: string;
    specification?: string;
}

export interface FarmArea {
    id: string;
    code: string;
    name: string;
    location: string;
    areaSize: number; // ha
    farmerId?: string;
}

export interface Batch {
    id: string;
    batchCode: string;
    productId?: string;
    productName: string;
    farmAreaId?: string;
    farmAreaName: string;
    quantity: number;
    unit: string;
    farmerName: string;
    startDate: string;
    status: BatchStatus;
    stage?: BatchStage;
    txHash?: string;
}

export interface CultivationLog {
    id: string;
    batchId: string;
    actionDate: string;
    workerName: string;
    activity: string;
    notes?: string;
    ipfsHash?: string;
}

export interface HarvestRecord {
    id: string;
    batchId: string;
    harvestDate: string;
    totalQuantity: number;
    unit: string;
    inspectorName: string;
    status: string;
}

export interface InspectionRecord {
    id: string;
    batchId: string;
    inspectionDate: string;
    inspector: string;
    result: InspectionResultStatus;
    certificateUrl?: string;
    notes?: string;
}

export interface PackagingRecord {
    id: string;
    batchId: string;
    qrCode: string;
    packageCount: number;
    packDate: string;
    expiryDate: string;
}

export interface Shipment {
    id: string;
    shipmentCode: string;
    senderName: string;
    receiverName: string;
    departureDate: string;
    arrivalDate?: string;
    status: 'IN_TRANSIT' | 'DELIVERED' | 'ACCEPTED';
    txHash?: string;
}
